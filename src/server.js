require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const linksRotas = require('./routes/links');
const authRotas = require('./routes/auth');
const { detectarNavegador, detectarDispositivo } = require('./utils/agente');

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
app.use('/auth', authRotas);

app.get('/:codigo', async (req, res) => {
  try {
    const [linhas] = await db.query(
      'SELECT id, url_original FROM links WHERE codigo_curto = ?',
      [req.params.codigo]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Link não encontrado' });
    }

    const { id, url_original } = linhas[0];

    // 1º: manda o visitante embora. 2º: anota a visita, sem esperar.
    res.redirect(302, url_original);

    const agente = req.get('user-agent') || '';
    db.query(
      'INSERT INTO cliques (link_id, navegador, dispositivo) VALUES (?, ?, ?)',
      [id, detectarNavegador(agente), detectarDispositivo(agente)]
    ).catch((erro) => console.error('Falha ao registrar clique:', erro));
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao redirecionar' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Linkito rodando em http://localhost:${PORT}`));