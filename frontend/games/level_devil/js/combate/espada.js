// =====================================================================
//  ESPADA (clique esquerdo do mouse)
//
//  Este arquivo cuida SÓ da espada: começar o golpe, contar o tempo,
//  calcular a caixa de colisão (hitbox) e desenhar.
//  Quem decide o que a espada acerta é o combate.js.
//
//  Direção do golpe:
//    - sem nada apertado ........ pro lado (pra onde o gato olha)
//    - W ou seta pra cima ....... pra cima
//    - S ou seta pra baixo ...... pra baixo (acertou inimigo no ar = quique!)
//
//  Os tempos e tamanhos estão no config.js (seção "Espada").
// =====================================================================

const espada = {
  tempo: 0,          // 0 = não está batendo; 1, 2, 3... = frame do golpe
  recarga: 0,        // frames até poder bater de novo
  direcao: 'lado'    // 'lado', 'cima' ou 'baixo'
};

// ---------------------------------------------------------------------
//  1) COMEÇAR O GOLPE
// ---------------------------------------------------------------------
function iniciarAtaqueEspada() {
  if (!jogando || !jogador || jogador.morto) return;
  if (transicao.ativa) return;   // <-- nova
  if (espada.recarga > 0 || espada.tempo > 0) return;

  if (teclas['w'] || teclas['arrowup']) {
    espada.direcao = 'cima';
  } else if (teclas['s'] || teclas['arrowdown']) {
    espada.direcao = 'baixo';
  } else {
    espada.direcao = 'lado';
  }

  espada.tempo = 1;
  espada.recarga = ESPADA_INTERVALO;
}

canvas.addEventListener('mousedown', function (evento) {
  if (evento.button === 0) iniciarAtaqueEspada();     // 0 = botão esquerdo
});

// Chamada quando o gato nasce de novo ou a fase recarrega: cancela golpe em andamento
function resetarEspada() {
  espada.tempo = 0;
  espada.recarga = 0;
  espada.direcao = 'lado';
}

// ---------------------------------------------------------------------
//  2) ATUALIZAR (roda a cada frame)
// ---------------------------------------------------------------------
function atualizarAtaqueEspada() {
  if (espada.recarga > 0) {
    espada.recarga--;
  }

  if (espada.tempo > 0) {
    espada.tempo++;
    if (espada.tempo > ESPADA_DURACAO) {
      espada.tempo = 0;
    }
  }
}

// ---------------------------------------------------------------------
//  3) HITBOX: o retângulo onde a espada machuca (ou null se ela não está machucando agora)
// ---------------------------------------------------------------------
function obterHitboxEspada() {
  if (!jogador || espada.tempo < ESPADA_HITBOX_INICIO || espada.tempo > ESPADA_HITBOX_FIM) {
    return null;
  }

  const centroX = jogador.x + jogador.largura / 2;

  if (espada.direcao === 'cima') {
    return {
      x: centroX - ESPADA_LARGURA_VERTICAL / 2,
      y: jogador.y - ESPADA_ALCANCE_VERTICAL,
      largura: ESPADA_LARGURA_VERTICAL,
      altura: ESPADA_ALCANCE_VERTICAL
    };
  }

  if (espada.direcao === 'baixo') {
    return {
      x: centroX - ESPADA_LARGURA_VERTICAL / 2,
      y: jogador.y + jogador.altura,
      largura: ESPADA_LARGURA_VERTICAL,
      altura: ESPADA_ALCANCE_VERTICAL
    };
  }

  // pro lado: sai do corpo do gato, na direção que ele está virado.
  // A caixa fica centrada na MESMA altura onde a espada é desenhada (assim o que você vê é o que acerta).
  const yLado = alturaCentroEspada() - ESPADA_ALTURA_LADO / 2;
  if (jogador.virado === 1) {
    return { x: jogador.x + jogador.largura, y: yLado, largura: ESPADA_ALCANCE_LADO, altura: ESPADA_ALTURA_LADO };
  }
  return { x: jogador.x - ESPADA_ALCANCE_LADO, y: yLado, largura: ESPADA_ALCANCE_LADO, altura: ESPADA_ALTURA_LADO };
}

// Altura (y) do meio do golpe: onde a espada é desenhada e de onde o golpe pro lado sai
function alturaCentroEspada() {
  return jogador.y + jogador.altura * ESPADA_ALTURA_CENTRO;
}

// A espada está encostando nesse alvo agora? (alvo = qualquer coisa com x, y, largura, altura)
function espadaAcerta(alvo) {
  const hitbox = obterHitboxEspada();
  if (hitbox === null || !alvo) return false;
  return colidiu(hitbox, alvo);
}

// ---------------------------------------------------------------------
//  4) DESENHO
//  A espada foi desenhada pra uma distância "base" (do meio do gato até a ponta).
//  O desenho é esticado na proporção do alcance configurado, então ele sempre
//  mostra até onde o golpe realmente acerta.
// ---------------------------------------------------------------------
const IMAGEM_ARCO_ESPADA = obterImagem('img/gato/espada_arco.png');   // o arco dourado do golpe

const DESENHO_BASE_ALCANCE_LADO = 70;       // 12 (meio do gato até a borda) + 58 (alcance antigo)
const DESENHO_BASE_ALCANCE_VERTICAL = 73;   // 15 (meio do gato até a borda) + 58 (alcance antigo)

function desenharAtaqueEspada() {
  if (!jogador || jogador.morto) return;

  // (modo debug) mostra a hitbox em branco
  desenharHitbox(obterHitboxEspada(), '#ffffff');

  if (espada.tempo < ESPADA_DESENHO_INICIO || espada.tempo > ESPADA_DESENHO_FIM) return;

  const centroX = jogador.x + jogador.largura / 2;
  const centroY = alturaCentroEspada();

  // desenho novo (se a imagem não carregou, cai no desenho antigo logo abaixo)
  if (imagemPronta(IMAGEM_ARCO_ESPADA)) {
    desenharArcoDaEspada(centroX, centroY);
    return;
  }

  ctx.save();
  ctx.translate(centroX, centroY);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (espada.direcao === 'cima' || espada.direcao === 'baixo') {
    const escala = (jogador.altura / 2 + ESPADA_ALCANCE_VERTICAL) / DESENHO_BASE_ALCANCE_VERTICAL;
    ctx.scale(escala, escala);
    desenharEspadaVertical(espada.direcao === 'cima');
  } else {
    const escala = (jogador.largura / 2 + ESPADA_ALCANCE_LADO) / DESENHO_BASE_ALCANCE_LADO;
    ctx.scale(jogador.virado * escala, escala);   // espelha conforme o lado pra onde o gato olha
    desenharEspadaLateral();
  }

  ctx.restore();
}

// O arco dourado do golpe: nasce no gato e é esticado até o alcance REAL da espada
// (então o que você vê é até onde o golpe acerta).
function desenharArcoDaEspada(centroX, centroY) {
  const progresso = (espada.tempo - ESPADA_DESENHO_INICIO) / (ESPADA_DESENHO_FIM - ESPADA_DESENHO_INICIO);   // 0 -> 1
  const vertical = espada.direcao === 'cima' || espada.direcao === 'baixo';
  const comprimento = vertical ? jogador.altura / 2 + ESPADA_ALCANCE_VERTICAL : jogador.largura / 2 + ESPADA_ALCANCE_LADO;
  const espessura = vertical ? ESPADA_LARGURA_VERTICAL : ESPADA_ALTURA_LADO;
  const crescer = 0.7 + 0.3 * Math.min(1, progresso * 3);       // abre rapidinho

  ctx.save();
  ctx.globalAlpha = Math.min(1, (1 - progresso) * 2.5);          // some no final
  ctx.translate(centroX, centroY);
  if (espada.direcao === 'cima') {
    ctx.rotate(-Math.PI / 2);
  } else if (espada.direcao === 'baixo') {
    ctx.rotate(Math.PI / 2);
  } else {
    ctx.scale(jogador.virado, 1);                                // espelha conforme o lado pra onde o gato olha
  }
  ctx.drawImage(IMAGEM_ARCO_ESPADA, 0, -espessura * 0.7, comprimento * crescer, espessura * crescer);
  ctx.restore();
}

// Espada apontando pra baixo (ou pra cima, se "paraCima" for true). Origem = meio do gato.
function desenharEspadaVertical(paraCima) {
  ctx.scale(1, paraCima ? -1 : 1);

  // risco branco curvado à frente da ponta
  ctx.strokeStyle = '#e9f6ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-20, 34);
  ctx.quadraticCurveTo(0, 58, 20, 34);
  ctx.stroke();

  // lâmina
  ctx.fillStyle = '#e8edf2';
  ctx.strokeStyle = '#303846';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 5);
  ctx.lineTo(-3, 43);
  ctx.lineTo(0, 51);
  ctx.lineTo(3, 43);
  ctx.lineTo(4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // empunhadura
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(-4, 0, 8, 9);
  ctx.fillStyle = '#5b3827';
  ctx.fillRect(-8, -2, 16, 4);
}

// Espada apontando pra direita (o chamador espelha se o gato olha pra esquerda). Origem = meio do gato.
function desenharEspadaLateral() {
  // risco branco curvado à frente da ponta
  ctx.strokeStyle = '#e9f6ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(30, -22);
  ctx.quadraticCurveTo(58, 0, 30, 22);
  ctx.stroke();

  // lâmina
  ctx.fillStyle = '#e8edf2';
  ctx.strokeStyle = '#303846';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(42, -2);
  ctx.lineTo(48, 0);
  ctx.lineTo(42, 2);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // empunhadura
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(-3, -7, 5, 14);
  ctx.fillStyle = '#5b3827';
  ctx.fillRect(-13, -3, 11, 6);
}