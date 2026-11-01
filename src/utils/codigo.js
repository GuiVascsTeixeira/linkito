const crypto = require('crypto');

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function gerarCodigo(tamanho = 7) {
  let codigo = '';
  for (let i = 0; i < tamanho; i++) {
    codigo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return codigo;
}

module.exports = gerarCodigo;