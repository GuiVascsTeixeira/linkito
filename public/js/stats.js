if (!pegarToken()) {
  location.href = 'index.html';
}

const id = new URLSearchParams(location.search).get('id');
if (!id) {
  location.href = 'painel.html';
}

const erro = document.getElementById('erro');
const resumo = document.getElementById('resumo');
const semDados = document.getElementById('sem-dados');
const graficos = document.getElementById('graficos');

document.getElementById('sair').addEventListener('click', sair);

const CORES = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// o servidor só manda os dias que tiveram clique; aqui completamos com zero
function ultimos30Dias(porDia) {
  const contagem = new Map(porDia.map((item) => [item.dia, item.cliques]));
  const dias = [];

  for (let i = 29; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    dias.push(formatarData(data));
  }

  return {
    rotulos: dias.map((d) => `${d.slice(8)}/${d.slice(5, 7)}`),
    valores: dias.map((d) => contagem.get(d) || 0),
  };
}

async function carregar() {
  try {
    const dados = await api(`/links/${encodeURIComponent(id)}/stats`);

    const endereco = `${location.origin}/${dados.link.codigo_curto}`;
    const linkCurto = document.getElementById('link-curto');
    linkCurto.href = endereco;
    linkCurto.textContent = endereco;
    document.getElementById('url-original').textContent = dados.link.url_original;
    document.getElementById('total').textContent = dados.total_cliques;
    resumo.classList.remove('hidden');

    if (dados.total_cliques === 0) {
      semDados.classList.remove('hidden');
      return;
    }
    graficos.classList.remove('hidden');

    const { rotulos, valores } = ultimos30Dias(dados.por_dia);

    new Chart(document.getElementById('grafico-dias'), {
      type: 'bar',
      data: {
        labels: rotulos,
        datasets: [{ label: 'Cliques', data: valores, backgroundColor: CORES[0] }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });

    new Chart(document.getElementById('grafico-dispositivos'), {
      type: 'doughnut',
      data: {
        labels: dados.por_dispositivo.map((item) => item.dispositivo),
        datasets: [{
          data: dados.por_dispositivo.map((item) => item.cliques),
          backgroundColor: CORES,
        }],
      },
    });

    new Chart(document.getElementById('grafico-navegadores'), {
      type: 'bar',
      data: {
        labels: dados.por_navegador.map((item) => item.navegador),
        datasets: [{
          label: 'Cliques',
          data: dados.por_navegador.map((item) => item.cliques),
          backgroundColor: CORES[1],
        }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  } catch (err) {
    erro.textContent = err.message;
    erro.classList.remove('hidden');
  }
}

carregar();