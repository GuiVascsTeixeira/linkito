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