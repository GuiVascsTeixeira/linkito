const form = document.getElementById('form');
const abaLogin = document.getElementById('aba-login');
const abaCadastro = document.getElementById('aba-cadastro');
const campoNome = document.getElementById('campo-nome');
const dicaSenha = document.getElementById('dica-senha');
const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const erro = document.getElementById('erro');
const botao = document.getElementById('enviar');

let modo = 'login';

// quem já tem crachá vai direto pro painel
if (localStorage.getItem('token')) {
  location.href = 'painel.html';
}

function trocarModo(novoModo) {
  modo = novoModo;
  const ehLogin = modo === 'login';

  campoNome.classList.toggle('hidden', ehLogin);
  dicaSenha.classList.toggle('hidden', ehLogin);
  inputSenha.autocomplete = ehLogin ? 'current-password' : 'new-password';
  botao.textContent = ehLogin ? 'Entrar' : 'Criar conta';

  abaLogin.classList.toggle('bg-white', ehLogin);
  abaLogin.classList.toggle('shadow', ehLogin);
  abaLogin.classList.toggle('text-slate-500', !ehLogin);
  abaCadastro.classList.toggle('bg-white', !ehLogin);
  abaCadastro.classList.toggle('shadow', !ehLogin);
  abaCadastro.classList.toggle('text-slate-500', ehLogin);

  erro.classList.add('hidden');
}

abaLogin.addEventListener('click', () => trocarModo('login'));
abaCadastro.addEventListener('click', () => trocarModo('cadastro'));

async function chamar(rota, dados) {
  const resposta = await fetch(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.erro || 'Algo deu errado, tente de novo');
  }
  return corpo;
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erro.classList.add('hidden');
  botao.disabled = true;

  try {
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    if (modo === 'cadastro') {
      await chamar('/auth/cadastro', { nome: inputNome.value, email, senha });
    }

    const login = await chamar('/auth/login', { email, senha });
    localStorage.setItem('token', login.token);
    localStorage.setItem('usuario', JSON.stringify(login.usuario));
    location.href = 'painel.html';
  } catch (err) {
    erro.textContent = err.message;
    erro.classList.remove('hidden');
  } finally {
    botao.disabled = false;
  }
});