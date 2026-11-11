// =====================================================================
//  INIMIGO SUICIDA (a BOMBA)
//
//  Como ela se comporta:
//    1) PARADA: fica quietinha, de pavio comprido, até o gato chegar a
//       raioDeteccao px dela (medido de centro a centro).
//    2) PERSEGUINDO: acordou! Vai atrás do gato, mas NÃO atravessa plataformas
//       nem paredes (ela escorrega nelas e fica presa se o caminho estiver fechado).
//    3) PAVIO ACESO: só quando ENCOSTA no gato o pavio começa a queimar.
//       Ela fica parada por tempoExplosao frames e então explode.
//       (de longe ela nunca explode)
//    4) EXPLOSÃO: área quadrada de 2 blocos de raio. O jogador e os inimigos próximos morrem.
//       Se o gato bater nela com a espada antes disso, ela some sem explodir.
//
//  Parâmetros (todos opcionais; os padrões estão no config.js, seção "Inimigo bomba"):
//    velocidade, raioDeteccao, tempoExplosao, tamanhoBloco, duracaoVisualExplosao
//
//  Desenhos: img/inimigos/bomba/ (pavio1..4.png e explosao.png)
// =====================================================================

const BOMBA_IMAGENS = {
  parada:      'img/inimigos/bomba/pavio1.png',   // pavio comprido (dormindo)
  perseguindo: 'img/inimigos/bomba/pavio2.png',   // pavio médio (acordou)
  pavioAceso1: 'img/inimigos/bomba/pavio3.png',   // pavio curto (começou a queimar)
  pavioAceso2: 'img/inimigos/bomba/pavio4.png',   // só o toquinho (quase explodindo)
  explosao:    'img/inimigos/bomba/explosao.png'
};

// Medidas do desenho (em px da própria imagem). O "corpo" é a bola preta; a caixa
// de colisão do inimigo cobre o corpo, e o pavio/faísca saem pra fora dela.
const BOMBA_SPRITE = {
  largura: 107, altura: 98,
  corpoX: 4, corpoY: 32.7, corpoLargura: 58.7, corpoAltura: 61.4,
  explosaoLargura: 242, explosaoAltura: 268
};

// Já começa a carregar os desenhos (assim não piscam quando a bomba aparece)
for (const caminho in BOMBA_IMAGENS) obterImagem(BOMBA_IMAGENS[caminho]);

// Move o inimigo passo a passo (primeiro no X, depois no Y) e NÃO deixa ele entrar
// em plataformas, paredes ou armadilhas sólidas. Também não sai da tela.
function moverInimigoComColisao(inimigo, passoX, passoY) {
  const solidos = listarSolidos();

  inimigo.x += passoX;
  inimigo.x = Math.max(0, Math.min(LARGURA_TELA - inimigo.largura, inimigo.x));
  for (let i = 0; i < solidos.length; i++) {
    const s = solidos[i];
    if (!colidiu(inimigo, s)) continue;
    inimigo.x = passoX > 0 ? s.x - inimigo.largura : s.x + s.largura;
  }

  inimigo.y += passoY;
  inimigo.y = Math.max(0, Math.min(ALTURA_TELA - inimigo.altura, inimigo.y));
  for (let i = 0; i < solidos.length; i++) {
    const s = solidos[i];
    if (!colidiu(inimigo, s)) continue;
    inimigo.y = passoY > 0 ? s.y - inimigo.altura : s.y + s.altura;
  }
}

registrarInimigo('suicida', {
  preparar(inimigo) {
    definirPadrao(inimigo, 'largura', INIMIGO_TAMANHOS.suicida.largura);
    definirPadrao(inimigo, 'altura', INIMIGO_TAMANHOS.suicida.altura);
    definirPadrao(inimigo, 'velocidade', VELOCIDADE_SUICIDA);
    definirPadrao(inimigo, 'raioDeteccao', BOMBA_RAIO_ATIVACAO);
    definirPadrao(inimigo, 'tempoExplosao', BOMBA_TEMPO_PAVIO);
    definirPadrao(inimigo, 'tamanhoBloco', TAMANHO_BLOCO);
    definirPadrao(inimigo, 'duracaoVisualExplosao', BOMBA_DURACAO_EXPLOSAO);
    inimigo.xInicial = inimigo.x;
    inimigo.yInicial = inimigo.y;
    this.zerarEstado(inimigo);
  },

  zerarEstado(inimigo) {
    inimigo.ativo = false;             // já acordou (o gato chegou perto)?
    inimigo.explodindo = false;        // encostou no gato e o pavio está queimando?
    inimigo.explodiu = false;          // já explodiu?
    inimigo.contagemExplosao = 0;      // frames de pavio queimado
    inimigo.areaResolvida = false;     // o dano da explosão já foi aplicado?
    inimigo.explosaoInimigosResolvida = false;
    inimigo.tempoVisualExplosao = 0;   // frames que faltam do desenho da explosão
    inimigo.ignorarEspada = false;     // true = a espada não acerta mais (depois que explodiu)
  },

  atualizar(inimigo) {
    if (inimigo.explodiu) return;      // a explosão só anima e some (veja "animar")

    // Pavio aceso: ela fica parada, esperando o fim da contagem.
    if (inimigo.explodindo) {
      inimigo.contagemExplosao++;
      if (inimigo.contagemExplosao >= inimigo.tempoExplosao) this.explodir(inimigo);
      return;
    }

    const dx = jogador.x + jogador.largura / 2 - (inimigo.x + inimigo.largura / 2);
    const dy = jogador.y + jogador.altura / 2 - (inimigo.y + inimigo.altura / 2);
    const distancia = Math.sqrt(dx * dx + dy * dy);

    // Acorda quando o gato chega perto o bastante (distância de centro a centro).
    if (!inimigo.ativo && distancia <= inimigo.raioDeteccao) inimigo.ativo = true;
    if (!inimigo.ativo) return;

    // SÓ ENCOSTANDO no gato o pavio começa a queimar.
    if (colidiu(jogador, inimigo)) {
      inimigo.explodindo = true;
      inimigo.contagemExplosao = 0;
      if (inimigo.tempoExplosao <= 0) this.explodir(inimigo);
      return;
    }

    // Persegue o gato, sem atravessar paredes.
    if (distancia > 0) {
      moverInimigoComColisao(
        inimigo,
        dx / distancia * inimigo.velocidade,
        dy / distancia * inimigo.velocidade
      );
    }
  },

  explodir(inimigo) {
    inimigo.explodiu = true;
    inimigo.ignorarEspada = true;
    inimigo.tempoVisualExplosao = inimigo.duracaoVisualExplosao;
  },

  // Roda todo frame, até com o gato morrendo: só cuida do desenho da explosão
  // e some com a bomba quando ele acaba (ela é usada uma vez só).
  animar(inimigo) {
    if (!inimigo.explodiu) return;
    if (inimigo.tempoVisualExplosao > 0) inimigo.tempoVisualExplosao--;
    if (inimigo.tempoVisualExplosao <= 0) removerInimigo(inimigo);
  },

  mata(inimigo) {
    if (!inimigo.explodiu || inimigo.areaResolvida) return false;
    inimigo.areaResolvida = true;      // o dano é aplicado uma vez só

    // A área quadrada se estende dois blocos a partir do centro da explosão.
    const raio = inimigo.tamanhoBloco * 2;
    const area = {
      x: inimigo.x + inimigo.largura / 2 - raio,
      y: inimigo.y + inimigo.altura / 2 - raio,
      largura: raio * 2,
      altura: raio * 2
    };
    return colidiu(jogador, area);
  },

  desenhar(inimigo) {
    if (inimigo.explodiu) {
      this.desenharExplosao(inimigo);
      return;
    }

    // Qual desenho usar: dormindo, perseguindo ou com o pavio queimando
    let caminho = inimigo.ativo ? BOMBA_IMAGENS.perseguindo : BOMBA_IMAGENS.parada;
    let escala = 1;
    if (inimigo.explodindo) {
      const progresso = inimigo.contagemExplosao / Math.max(1, inimigo.tempoExplosao);
      caminho = progresso < 0.5 ? BOMBA_IMAGENS.pavioAceso1 : BOMBA_IMAGENS.pavioAceso2;
      escala = 1 + 0.12 * Math.abs(Math.sin(inimigo.contagemExplosao * 0.5));   // ela "pulsa" de nervoso
    }

    const imagem = obterImagem(caminho);
    if (imagemPronta(imagem)) {
      // O corpo da bola fica em cima da caixa de colisão; pavio e faísca saem pra fora.
      const k = inimigo.largura / BOMBA_SPRITE.corpoLargura * escala;
      const centroX = inimigo.x + inimigo.largura / 2;
      const pes = inimigo.y + inimigo.altura;
      ctx.drawImage(
        imagem,
        centroX - (BOMBA_SPRITE.corpoX + BOMBA_SPRITE.corpoLargura / 2) * k,
        pes - (BOMBA_SPRITE.corpoY + BOMBA_SPRITE.corpoAltura) * k,
        BOMBA_SPRITE.largura * k,
        BOMBA_SPRITE.altura * k
      );
    } else {
      desenharRetangulo(inimigo, inimigo.explodindo ? '#ffcc00' : (inimigo.ativo ? '#e74c3c' : '#27ae60'));
    }

    if (MOSTRAR_HITBOX) {
      if (!inimigo.ativo) {              // o círculo em que ela acorda
        ctx.beginPath();
        ctx.arc(inimigo.x + inimigo.largura / 2, inimigo.y + inimigo.altura / 2, inimigo.raioDeteccao, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.35)';
        ctx.stroke();
      }
    }
  },

  desenharExplosao(inimigo) {
    if (inimigo.tempoVisualExplosao <= 0) return;

    const raio = inimigo.tamanhoBloco * 2;                       // o mesmo da área que machuca
    const passou = 1 - inimigo.tempoVisualExplosao / inimigo.duracaoVisualExplosao;   // 0 -> 1
    const imagem = obterImagem(BOMBA_IMAGENS.explosao);
    const centroX = inimigo.x + inimigo.largura / 2;
    const centroY = inimigo.y + inimigo.altura / 2;

    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - passou) * 2.5);           // some no final
    if (imagemPronta(imagem)) {
      const largura = raio * 2 * (0.75 + 0.25 * Math.min(1, passou * 3));   // cresce rapidinho
      const altura = largura * BOMBA_SPRITE.explosaoAltura / BOMBA_SPRITE.explosaoLargura;
      ctx.drawImage(imagem, centroX - largura / 2, centroY - altura / 2, largura, altura);
    } else {
      ctx.fillStyle = 'rgba(255, 204, 0, 0.45)';
      ctx.fillRect(centroX - raio, centroY - raio, raio * 2, raio * 2);
    }
    ctx.restore();
  },

  resetar(inimigo) {
    inimigo.x = inimigo.xInicial;
    inimigo.y = inimigo.yInicial;
    this.zerarEstado(inimigo);
  }
});
