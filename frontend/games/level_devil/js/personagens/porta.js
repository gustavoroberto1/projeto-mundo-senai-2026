// =====================================================================
//  PORTA (a saída da fase, em amarelo)
// =====================================================================

// Completa a porta com os valores padrão (chamada quando a fase carrega)
function prepararPorta(porta) {
  definirPadrao(porta, 'largura', 30);
  definirPadrao(porta, 'altura', 50);
  definirPadrao(porta, 'foge', []);
  porta.xInicial = porta.x;
  porta.yInicial = porta.y;
  porta.fugas = 0; // quantas vezes a porta já mudou de lugar
}

// Chamada quando o jogador morre: a porta volta pro lugar de origem
function resetarPorta() {
  fase.porta.x = fase.porta.xInicial;
  fase.porta.y = fase.porta.yInicial;
  fase.porta.fugas = 0;
}

function verificarPorta() {
  const porta = fase.porta;

  // A porta foge se o jogador chegar a menos de 90px dela
  const centroJogador = jogador.x + jogador.largura / 2;
  const centroPorta = porta.x + porta.largura / 2;
  const distanciaEntreCentros = Math.abs(centroJogador - centroPorta);

  if (porta.fugas < porta.foge.length && distanciaEntreCentros < 90) {
    const novoLugar = porta.foge[porta.fugas];
    porta.x = novoLugar.x;
    porta.y = novoLugar.y;
    porta.fugas++;
  }

  if (colidiu(jogador, obterHitboxPorta(porta))) {
    passarDeFase();
  }
}

function obterHitboxPorta(porta) {
  const largura = 50;
  const altura = 100;
  return {
    x: porta.x + porta.largura / 2 - largura / 2,
    y: porta.y + porta.altura - altura,
    largura: largura,
    altura: altura
  };
}

function desenharPorta(porta) {
  // Alterna entre dois quadros para animar o portal sem spritesheet.
  const imagemPortal1 = obterImagem('img/porta/portal_frame_1.png');
  const imagemPortal2 = obterImagem('img/porta/portal_frame_2.png');

  const quadroAnimacao = Math.floor(performance.now() / 250);
  const imagemPortalAtual = quadroAnimacao % 2 === 0 ? imagemPortal1 : imagemPortal2;

  const hitbox = obterHitboxPorta(porta);

  if (imagemPronta(imagemPortalAtual)) {
    ctx.drawImage(imagemPortalAtual, hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
  } else {
    desenharRetangulo(porta, '#ffd60a');
  }

  desenharHitbox(hitbox, '#ffd60a');
}
