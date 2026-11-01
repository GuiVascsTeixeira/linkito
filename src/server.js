require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Linkito rodando em http://localhost:${PORT}`));