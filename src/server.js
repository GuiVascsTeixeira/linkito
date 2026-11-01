require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const linksRotas = require('./routes/links');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/saude', async (req, res) => {
  try {
    const [linhas] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
    res.json({ status: 'ok', usuarios: linhas[0].total });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ status: 'erro', mensagem: 'Falha ao conectar ao banco' });
  }
});
app.use('/links', linksRotas);
app.get('/:codigo', async (req, res) => {
  try {
    const [linhas] = await db.query(
      'SELECT url_original FROM links WHERE codigo_curto = ?',
      [req.params.codigo]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Link não encontrado' });
    }

    res.redirect(302, linhas[0].url_original);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao redirecionar' });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Linkito rodando em http://localhost:${PORT}`));