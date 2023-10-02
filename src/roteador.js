const express = require('express');
const rotas = express();
const { listarContas, criarContaBancaria, atualizarUsuario, excluirUsuario, depositarValor, sacarValor, transferirValor, saldo, extrato } = require('./controladores/funcionalidades');

rotas.get('/contas', listarContas);
rotas.post('/contas', criarContaBancaria);
rotas.put('/contas/:numeroConta/usuario', atualizarUsuario);
rotas.delete('/contas/:numeroConta', excluirUsuario);
rotas.post('/transacoes/depositar', depositarValor);
rotas.post('/transacoes/sacar', sacarValor);
rotas.post('/transacoes/transferir', transferirValor);
rotas.get('/contas/saldo', saldo);
rotas.get('/contas/extrato', extrato);


module.exports = rotas; 