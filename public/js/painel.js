if (!pegarToken()) {
  location.href = 'index.html';
}

const nomeUsuario = document.getElementById('nome-usuario');
const botaoSair = document.getElementById('sair');
const form = document.getElementById('form');
const inputUrl = document.getElementById('url');
const botaoEncurtar = document.getElementById('encurtar');
const erro = document.getElementById('erro');
const lista = document.getElementById('lista');
const vazio = document.getElementById('vazio');

try {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  nomeUsuario.textContent = usuario.nome || '';
} catch {
  // sem nome na tela, sem problema
}

botaoSair.addEventListener('click', sair);

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.classList.remove('hidden');
}

function linkCurto(codigo) {
  return `${location.origin}/${codigo}`;
}

function criarBotao(texto, classes) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = classes;
  botao.textContent = texto;
  return botao;
}

function criarItem(link) {
  const item = document.createElement('li');
  item.className = 'bg-white rounded-xl shadow p-4 space-y-2';

  const topo = document.createElement('div');
  topo.className = 'flex items-center justify-between gap-3';

  const curto = document.createElement('a');
  curto.href = linkCurto(link.codigo_curto);
  curto.target = '_blank';
  curto.rel = 'noopener';
  curto.className = 'font-semibold text-indigo-600 break-all';
  curto.textContent = linkCurto(link.codigo_curto);

  const cliques = document.createElement('span');
  cliques.className = 'text-sm text-slate-500 whitespace-nowrap';
  cliques.textContent = `${link.total_cliques} ${link.total_cliques === 1 ? 'clique' : 'cliques'}`;

  topo.append(curto, cliques);

  const original = document.createElement('p');
  original.className = 'text-sm text-slate-500 break-all';
  original.textContent = link.url_original;

  const acoes = document.createElement('div');
  acoes.className = 'flex gap-4 text-sm';

  const copiar = criarBotao('Copiar', 'text-indigo-600 font-medium hover:underline');
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(linkCurto(link.codigo_curto));
      copiar.textContent = 'Copiado!';
      setTimeout(() => { copiar.textContent = 'Copiar'; }, 1500);
    } catch {
      mostrarErro('Não consegui copiar, selecione o link e copie à mão');
    }
  });

  const stats = document.createElement('a');
  stats.href = `stats.html?id=${link.id}`;
  stats.className = 'text-indigo-600 font-medium hover:underline';
  stats.textContent = 'Estatísticas';

  const apagar = criarBotao('Apagar', 'text-red-600 font-medium hover:underline');
  apagar.addEventListener('click', async () => {
    if (!confirm('Apagar este link e todos os cliques dele?')) return;
    try {
      await api(`/links/${link.id}`, { method: 'DELETE' });
      carregar();
    } catch (err) {
      mostrarErro(err.message);
    }
  });

  acoes.append(copiar, stats, apagar);
  item.append(topo, original, acoes);
  return item;
}

async function carregar() {
  try {
    const links = await api('/links');
    lista.replaceChildren(...links.map(criarItem));
    vazio.classList.toggle('hidden', links.length > 0);
  } catch (err) {
    mostrarErro(err.message);
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  erro.classList.add('hidden');
  botaoEncurtar.disabled = true;

  try {
    await api('/links', {
      method: 'POST',
      body: JSON.stringify({ url: inputUrl.value.trim() }),
    });
    inputUrl.value = '';
    await carregar();
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    botaoEncurtar.disabled = false;
  }
});

carregar();