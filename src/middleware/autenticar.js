const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const cabecalho = req.get('authorization') || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar' });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = dados.sub;
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada' });
  }
}

module.exports = autenticar;