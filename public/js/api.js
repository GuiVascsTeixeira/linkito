function pegarToken() {
  return localStorage.getItem('token');
}

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  location.href = 'index.html';
}

async function api(rota, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(rota, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pegarToken()}`,
        ...(opcoes.headers || {}),
      },
    });
  } catch {
    throw new Error('Não consegui falar com o servidor. Tente de novo em instantes.');
  }

  if (resposta.status === 401) {
    sair();
    throw new Error('Sessão expirada');
  }
  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.erro || 'Algo deu errado, tente de novo');
  }
  return corpo;
}