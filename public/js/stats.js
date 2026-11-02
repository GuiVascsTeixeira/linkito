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
        datasets: [{
          label: 'Cliques',
          data: valores,
          backgroundColor: CORES[0]
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
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
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
      },
    });

  } catch (err) {
    erro.textContent = err.message;
    erro.classList.remove('hidden');

  } finally {
    carregando.classList.add('hidden');
  }
}