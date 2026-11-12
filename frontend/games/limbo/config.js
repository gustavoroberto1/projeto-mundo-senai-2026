// CONFIGURAÇÕES GERAIS DO CANVAS E DO JOGO
const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");
const LARGURA = canvas.width;
const ALTURA = canvas.height;

const GRAVIDADE = 0.6;
const VELOCIDADE = 4.6;
const FORCA_PULO = -12;
const ESCALA = 2;

let depurar = false;

const fundo = new Image();
fundo.src = "fundo.png";
