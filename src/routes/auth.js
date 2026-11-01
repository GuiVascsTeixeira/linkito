const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function emailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body || {};

  if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
    return res.status(400).json({ erro: 'Informe seu nome' });
  }
  if (!emailValido(email)) {
    return res.status(400).json({ erro: 'Informe um e-mail válido' });
  }
  if (typeof senha !== 'string' || senha.length < 8) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const [resultado] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email.toLowerCase(), senhaHash]
    );
    res.status(201).json({ id: resultado.insertId, nome: nome.trim(), email: email.toLowerCase() });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};

  if (!emailValido(email) || typeof senha !== 'string') {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  try {
    const [linhas] = await db.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );
    const usuario = linhas[0];

    // mesma mensagem nos dois casos, para não revelar quais e-mails existem
    const senhaCorreta = usuario && (await bcrypt.compare(senha, usuario.senha_hash));
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign({ sub: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRA_EM || '7d',
    });

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;