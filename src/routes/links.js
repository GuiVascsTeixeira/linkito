const express = require('express');
const db = require('../db');
const gerarCodigo = require('../utils/codigo');

const router = express.Router();
const USUARIO_TESTE = 1; // temporário: será o usuário logado quando fizermos o login

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
        [USUARIO_TESTE, url, codigo]
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

module.exports = router;