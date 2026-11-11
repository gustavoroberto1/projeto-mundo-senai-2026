// Referências aos elementos do index.html usados pelo jogo.
// O canvas é a área de desenho; ctx é o contexto 2D (o "pincel") usado nele.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Telas e controles da interface, localizados pelo respectivo id no HTML.
const telaMenu = document.getElementById('menu');
const telaFim = document.getElementById('fim');
const campoApelido = document.getElementById('nick');
const textoErro = document.getElementById('erro');
const botaoJogar = document.getElementById('btnJogar');
const botaoNovoJogador = document.getElementById('btnNovo');
const botaoReiniciar = document.getElementById('btnReiniciar');
