// =====================================================================
// INIMIGO VOADOR — pássaro vermelho pixel art
// =====================================================================

const PROJETIL_MODELO = { largura: 20, altura: 12 };

function ajustarHitboxProjetil(projetil) {
  const centroX = projetil.x + projetil.largura / 2;
  const centroY = projetil.y + projetil.altura / 2;
  const centroAnteriorX = Number.isFinite(projetil.xAnterior)
    ? projetil.xAnterior + projetil.largura / 2
    : null;
  const centroAnteriorY = Number.isFinite(projetil.yAnterior)
    ? projetil.yAnterior + projetil.altura / 2
    : null;
  const velocidade = Math.hypot(projetil.vx, projetil.vy) || 1;
  const cosseno = Math.abs(projetil.vx / velocidade);
  const seno = Math.abs(projetil.vy / velocidade);

  projetil.largura = PROJETIL_MODELO.largura * cosseno + PROJETIL_MODELO.altura * seno;
  projetil.altura = PROJETIL_MODELO.largura * seno + PROJETIL_MODELO.altura * cosseno;
  projetil.x = centroX - projetil.largura / 2;
  projetil.y = centroY - projetil.altura / 2;

  if (centroAnteriorX !== null) {
    projetil.xAnterior = centroAnteriorX - projetil.largura / 2;
    projetil.yAnterior = centroAnteriorY - projetil.altura / 2;
  }
}

registrarInimigo('voador', {
  preparar(inimigo) {
    definirPadrao(inimigo, 'largura', INIMIGO_TAMANHOS.voador.largura);
    definirPadrao(inimigo, 'altura', INIMIGO_TAMANHOS.voador.altura);
    definirPadrao(inimigo, 'velocidade', VELOCIDADE_VOADOR);
    definirPadrao(inimigo, 'distanciaPatrulha', 100);
    definirPadrao(inimigo, 'intervaloDisparo', INTERVALO_DISPARO_VOADOR);
    definirPadrao(inimigo, 'velocidadeProjetil', 4);
    definirPadrao(inimigo, 'direcaoDisparo', fase.direcaoDisparoInimigos || 'jogador');

    inimigo.xInicial = inimigo.x;
    inimigo.yInicial = inimigo.y;

    inimigo.limiteEsquerdo = inimigo.limiteEsquerdo === undefined
      ? Math.max(0, inimigo.x - inimigo.distanciaPatrulha)
      : inimigo.limiteEsquerdo;

    inimigo.limiteDireito = inimigo.limiteDireito === undefined
      ? Math.min(LARGURA_TELA - inimigo.largura, inimigo.x + inimigo.distanciaPatrulha)
      : inimigo.limiteDireito;

    inimigo.direcao = inimigo.direcao === -1 ? -1 : 1;
    inimigo.direcaoInicial = inimigo.direcao;
    inimigo.contadorDisparo = 0;
    inimigo.quadroAnimacao = 0;
    inimigo.projeteis = [];
  },

  atualizar(inimigo) {
    // Movimento do pássaro.
    inimigo.x += inimigo.velocidade * inimigo.direcao;

    if (
      inimigo.x <= inimigo.limiteEsquerdo ||
      inimigo.x >= inimigo.limiteDireito
    ) {
      inimigo.x = Math.max(
        inimigo.limiteEsquerdo,
        Math.min(inimigo.x, inimigo.limiteDireito)
      );

      inimigo.direcao *= -1;
    }

    // Animação e disparos.
    inimigo.quadroAnimacao++;
    inimigo.contadorDisparo++;

    if (inimigo.contadorDisparo >= inimigo.intervaloDisparo) {
      inimigo.contadorDisparo = 0;
      this.disparar(inimigo);
    }

    // Atualiza os projéteis e verifica colisões com paredes.
    const solidos = listarSolidos();

    for (let i = inimigo.projeteis.length - 1; i >= 0; i--) {
      const p = inimigo.projeteis[i];

      p.xAnterior = p.x;
      p.yAnterior = p.y;

      if (!p.trilha) p.trilha = [];
      p.trilha.unshift({
        x: p.x + p.largura / 2,
        y: p.y + p.altura / 2
      });
      if (p.trilha.length > 10) p.trilha.pop();

      // Pequenos passos evitam atravessar obstáculos finos.
      const passos = Math.max(
        1,
        Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy)))
      );

      let atingiuSolido = false;

      for (let passo = 0; passo < passos; passo++) {
        p.x += p.vx / passos;
        p.y += p.vy / passos;

        // Remove o projétil ao sair da tela.
        if (
          p.x < 0 ||
          p.x + p.largura > LARGURA_TELA ||
          p.y < 0 ||
          p.y + p.altura > ALTURA_TELA
        ) {
          atingiuSolido = true;
          break;
        }

        // Remove ao encostar em uma parede ou plataforma.
        for (let s = 0; s < solidos.length; s++) {
          if (colidiu(p, solidos[s])) {
            atingiuSolido = true;
            break;
          }
        }

        if (atingiuSolido) break;
      }

      if (atingiuSolido) {
        inimigo.projeteis.splice(i, 1);
      }
    }
  },

  disparar(inimigo) {
    const origemX = inimigo.x + inimigo.largura / 2 - 4;
    const origemY = inimigo.y + inimigo.altura / 2 - 4;

    // Disparo em leque.
    if (inimigo.direcaoDisparo === 'lequeBaixo') {
      const quantidade = 7;
      const anguloInicial = Math.PI / 7;
      const passoAngular =
        (Math.PI - anguloInicial * 2) / (quantidade - 1);

      for (let i = 0; i < quantidade; i++) {
        const angulo = anguloInicial + passoAngular * i;

        inimigo.projeteis.push({
          x: origemX,
          y: origemY,
          largura: 8,
          altura: 8,
          vx: Math.cos(angulo) * inimigo.velocidadeProjetil,
          vy: Math.sin(angulo) * inimigo.velocidadeProjetil,
          trilha: [],
          rebatido: false
        });
        ajustarHitboxProjetil(inimigo.projeteis[inimigo.projeteis.length - 1]);
      }

      return;
    }

    const projetil = {
      x: origemX,
      y: origemY,
      largura: 8,
      altura: 8,
      vx: 0,
      vy: 0,
      trilha: [],
      rebatido: false
    };

    // Disparo para a frente e para baixo.
    if (inimigo.direcaoDisparo === 'frenteBaixo') {
      projetil.vx =
        inimigo.velocidadeProjetil * inimigo.direcao;

      projetil.vy = inimigo.velocidadeProjetil * 0.5;
    } else {
      // Disparo direcionado ao jogador.
      const dx =
        jogador.x + jogador.largura / 2 -
        (projetil.x + projetil.largura / 2);

      const dy =
        jogador.y + jogador.altura / 2 -
        (projetil.y + projetil.altura / 2);

      const distancia = Math.sqrt(dx * dx + dy * dy) || 1;

      projetil.vx =
        (dx / distancia) * inimigo.velocidadeProjetil;

      projetil.vy =
        (dy / distancia) * inimigo.velocidadeProjetil;
    }

    ajustarHitboxProjetil(projetil);
    inimigo.projeteis.push(projetil);
  },

  mata(inimigo) {
    // Os projéteis também causam dano ao jogador.
    for (let i = inimigo.projeteis.length - 1; i >= 0; i--) {
      if (!inimigo.projeteis[i].rebatido && colidiu(jogador, inimigo.projeteis[i])) {
        inimigo.projeteis.splice(i, 1);
        return true;
      }
    }

    return colidiu(jogador, inimigo);
  },

  desenhar(inimigo) {
    desenharPassaroVermelho(inimigo);

    // Desenha os projéteis como flechas com um rastro de vento.
    for (let i = 0; i < inimigo.projeteis.length; i++) {
      desenharProjetilVoador(inimigo.projeteis[i]);
    }

  },

  resetar(inimigo) {
    inimigo.x = inimigo.xInicial;
    inimigo.y = inimigo.yInicial;
    inimigo.direcao = inimigo.direcaoInicial;
    inimigo.contadorDisparo = 0;
    inimigo.quadroAnimacao = 0;
    inimigo.projeteis = [];
  }
});

function desenharProjetilVoador(projetil) {
  const centroX = projetil.x + projetil.largura / 2;
  const centroY = projetil.y + projetil.altura / 2;
  const velocidade = Math.hypot(projetil.vx, projetil.vy) || 1;
  const direcaoX = projetil.vx / velocidade;
  const direcaoY = projetil.vy / velocidade;
  const corVento = projetil.rebatido ? '#69f5ff' : '#ff9f1c';
  const corBrilho = projetil.rebatido ? '#e5ffff' : '#fff1a8';

  // O rastro fica atrás da flecha e desaparece suavemente conforme envelhece.
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < projetil.trilha.length; i++) {
    const anterior = projetil.trilha[i];
    const proximo = i === 0
      ? { x: centroX, y: centroY }
      : projetil.trilha[i - 1];
    const progresso = 1 - i / projetil.trilha.length;

    ctx.globalAlpha = progresso * 0.42;
    ctx.strokeStyle = corVento;
    ctx.lineWidth = 1 + progresso * 3;
    ctx.beginPath();
    ctx.moveTo(anterior.x, anterior.y);
    ctx.lineTo(proximo.x, proximo.y);
    ctx.stroke();

    // Filetes laterais dão a impressão de ar cortado pela flecha.
    if (i < 6) {
      const deslocamento = Math.sin(i * 1.15) * (2 + i * 0.35);
      ctx.globalAlpha = progresso * 0.28;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(
        anterior.x - direcaoX * 5 - direcaoY * deslocamento,
        anterior.y - direcaoY * 5 + direcaoX * deslocamento
      );
      ctx.lineTo(
        proximo.x - direcaoX * 5 - direcaoY * deslocamento,
        proximo.y - direcaoY * 5 + direcaoX * deslocamento
      );
      ctx.stroke();
    }
  }
  ctx.restore();

  // Flecha orientada pelo vetor de movimento.
  ctx.save();
  ctx.translate(centroX, centroY);
  ctx.rotate(Math.atan2(projetil.vy, projetil.vx));
  ctx.shadowColor = corVento;
  ctx.shadowBlur = projetil.rebatido ? 12 : 8;

  ctx.fillStyle = '#24151b';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(1, -3);
  ctx.lineTo(-4, -6);
  ctx.lineTo(-3, -2);
  ctx.lineTo(-10, -2);
  ctx.lineTo(-10, 2);
  ctx.lineTo(-3, 2);
  ctx.lineTo(-4, 6);
  ctx.lineTo(1, 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = corVento;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(1, -1.5);
  ctx.lineTo(-3, -4);
  ctx.lineTo(-2, -1);
  ctx.lineTo(-8, -1);
  ctx.lineTo(-8, 1);
  ctx.lineTo(-2, 1);
  ctx.lineTo(-3, 4);
  ctx.lineTo(1, 1.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = corBrilho;
  ctx.fillRect(-6, -1, 9, 1);
  ctx.fillRect(4, -1, 2, 2);
  ctx.restore();

  desenharHitbox(projetil, projetil.rebatido ? '#69f5ff' : '#ff9f1c');
}


// =====================================================================
// DESENHO DO PÁSSARO VERMELHO EM PIXEL ART
// =====================================================================

function desenharPassaroVermelho(inimigo) {
  const x = inimigo.x;
  const y = inimigo.y;
  const w = inimigo.largura;
  const h = inimigo.altura;

  const escala = Math.max(1, Math.min(w / 16, h / 13));

  // Desenha um bloco pixelado.
  const px = (col, row, largura, altura, cor) => {
    ctx.fillStyle = cor;

    ctx.fillRect(
      Math.round(x + col * escala),
      Math.round(y + row * escala),
      Math.ceil(largura * escala),
      Math.ceil(altura * escala)
    );
  };

  // Alterna entre dois quadros da animação.
  const quadro = Math.floor(inimigo.quadroAnimacao / 8) % 2;

  ctx.save();

  // --------------------------------------------------
  // Cauda preta.
  // --------------------------------------------------

  px(0, 6, 3, 2, '#100d10');
  px(1, 5, 2, 2, '#242027');

  px(0, 9, 3, 2, '#100d10');
  px(1, 8, 2, 2, '#242027');


  // --------------------------------------------------
  // Topete.
  // --------------------------------------------------

  if (quadro === 0) {
    px(5, 0, 4, 2, '#100d10');
    px(6, 1, 4, 3, '#100d10');

    px(6, 1, 3, 3, '#ed1024');

    px(9, 2, 3, 3, '#100d10');
    px(9, 3, 3, 2, '#ed1024');
  } else {
    px(5, 1, 4, 2, '#100d10');
    px(6, 2, 4, 3, '#100d10');

    px(6, 2, 3, 3, '#ed1024');

    px(9, 1, 3, 3, '#100d10');
    px(9, 2, 3, 2, '#ed1024');
  }


  // --------------------------------------------------
  // Corpo vermelho com contorno preto.
  // --------------------------------------------------

  px(3, 3, 10, 8, '#100d10');
  px(2, 4, 12, 6, '#100d10');

  px(3, 3, 10, 7, '#b9001b');
  px(4, 3, 8, 7, '#e50922');

  px(3, 4, 10, 6, '#e50922');
  px(4, 4, 8, 5, '#f20d28');

  px(3, 8, 9, 3, '#b9001b');


  // --------------------------------------------------
  // Asa animada.
  // --------------------------------------------------

  if (quadro === 0) {
    // Asa levantada.
    px(4, 5, 5, 2, '#970018');
    px(5, 4, 4, 2, '#c90020');
    px(4, 6, 4, 2, '#a9001b');
  } else {
    // Asa abaixada.
    px(4, 6, 5, 2, '#970018');
    px(5, 7, 4, 2, '#c90020');
    px(4, 8, 4, 1, '#a9001b');
  }


  // --------------------------------------------------
  // Barriga bege.
  // --------------------------------------------------

  px(4, 9, 7, 2, '#100d10');
  px(5, 9, 6, 2, '#f0d4ae');
  px(4, 10, 7, 1, '#f0d4ae');


  // --------------------------------------------------
  // Sobrancelhas carrancudas.
  // --------------------------------------------------

  px(8, 4, 6, 2, '#100d10');
  px(8, 4, 5, 1, '#100d10');
  px(9, 5, 5, 1, '#100d10');


  // --------------------------------------------------
  // Olhos brancos com pupilas pretas.
  // --------------------------------------------------

  px(8, 6, 3, 3, '#100d10');
  px(11, 6, 3, 3, '#100d10');

  px(8, 6, 2, 2, '#ffffff');
  px(11, 6, 2, 2, '#ffffff');

  px(9, 6, 1, 2, '#100d10');
  px(12, 6, 1, 2, '#100d10');


  // --------------------------------------------------
  // Bico amarelo que abre e fecha.
  // --------------------------------------------------

  if (quadro === 0) {
    // Bico fechado.
    px(10, 8, 5, 2, '#100d10');

    px(11, 8, 4, 1, '#ffb000');
    px(10, 9, 5, 1, '#ffb000');
  } else {
    // Bico aberto.
    px(10, 8, 5, 3, '#100d10');

    px(11, 8, 4, 1, '#ffb000');
    px(10, 9, 5, 1, '#ffb000');

    px(11, 10, 3, 1, '#e93443');
  }

  ctx.restore();
}