const express = require('express');
const db = require('../db');
const gerarCodigo = require('../utils/codigo');
const autenticar = require('../middleware/autenticar');

const router = express.Router();
router.use(autenticar); // todas as rotas daqui exigem login

function urlValida(texto) {
  try {
    const url = new URL(texto);
    const protocoloOk = url.protocol === 'http:' || url.protocol === 'https:';
    return protocoloOk && texto.length <= 2048;
  } catch {
    return false;
  }
}

router.post('/', async (req, res) => {
  const { url } = req.body || {};

  if (!url || !urlValida(url)) {
    return res.status(400).json({
      erro: 'Informe uma URL válida começando com http:// ou https://',
    });
  }

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo();
    try {
      await db.query(
        'INSERT INTO links (usuario_id, url_original, codigo_curto) VALUES (?, ?, ?)',
        [req.usuarioId, url, codigo]
      );
      return res.status(201).json({
        codigo,
        link_curto: `${req.protocol}://${req.get('host')}/${codigo}`,
        url_original: url,
      });
    } catch (erro) {
      if (erro.code !== 'ER_DUP_ENTRY') {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao criar o link' });
      }
      // código repetido: o laço sorteia outro
    }
  }

  res.status(500).json({ erro: 'Não foi possível gerar um código único, tente de novo' });
});

router.get('/', async (req, res) => {
  try {
    const [links] = await db.query(
      `SELECT l.id, l.codigo_curto, l.url_original, l.criado_em,
              COUNT(c.id) AS total_cliques
       FROM links l
       LEFT JOIN cliques c ON c.link_id = l.id
       WHERE l.usuario_id = ?
       GROUP BY l.id
       ORDER BY l.criado_em DESC`,
      [req.usuarioId]
    );
    res.json(links);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar os links' });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    // 1º: o link existe e é seu?
    const [links] = await db.query(
      'SELECT id, codigo_curto, url_original, criado_em FROM links WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuarioId]
    );
    if (links.length === 0) {
      return res.status(404).json({ erro: 'Link não encontrado' });
    }
    const linkId = links[0].id;

    // 2º: faz as perguntas ao caderno de visitas, todas de uma vez
    const [[total], [porDia], [porDispositivo], [porNavegador]] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM cliques WHERE link_id = ?', [linkId]),
      db.query(
        `SELECT DATE_FORMAT(data_hora, '%Y-%m-%d') AS dia, COUNT(*) AS cliques
         FROM cliques
         WHERE link_id = ? AND data_hora >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY dia
         ORDER BY dia`,
        [linkId]
      ),
      db.query(
        `SELECT dispositivo, COUNT(*) AS cliques
         FROM cliques WHERE link_id = ?
         GROUP BY dispositivo ORDER BY cliques DESC`,
        [linkId]
      ),
      db.query(
        `SELECT navegador, COUNT(*) AS cliques
         FROM cliques WHERE link_id = ?
         GROUP BY navegador ORDER BY cliques DESC`,
        [linkId]
      ),
    ]);

    res.json({
      link: links[0],
      total_cliques: total[0].total,
      por_dia: porDia,
      por_dispositivo: porDispositivo,
      por_navegador: porNavegador,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar as estatísticas' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // o "AND usuario_id = ?" impede apagar o link de outra pessoa
    const [resultado] = await db.query(
      'DELETE FROM links WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuarioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Link não encontrado' });
    }
    res.status(204).end();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao apagar o link' });
  }
});

module.exports = router;