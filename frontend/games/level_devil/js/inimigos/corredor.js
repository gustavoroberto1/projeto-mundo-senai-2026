// =====================================================================
//  INIMIGO CORREDOR
//  Corre pela plataforma e inverte em paredes, bordas e abismos.
//  Parâmetros: velocidade e direcao inicial (-1 para esquerda, 1 para direita).
//
//  Animações (desenhos em img/inimigos/corredor/):
//    parado + andando  -> se alternam enquanto ele corre (com um quiquinho por passo)
//    ataque1 -> ataque2 -> quando o gato chega perto, ele levanta e balança o taco
//  O balanço do taco é só VISUAL: quem mata o gato continua sendo o corpo (mata()).
// =====================================================================
const CORREDOR_IMAGENS = {
  parado:  obterImagem('img/inimigos/corredor/parado.png'),
  andando: obterImagem('img/inimigos/corredor/andando.png'),
  preparo: obterImagem('img/inimigos/corredor/ataque1.png'),   // levantando o taco
  golpe:   obterImagem('img/inimigos/corredor/ataque2.png')    // golpeando
};

// Pra que lado cada desenho original está virado (1 = direita, -1 = esquerda, 0 = de frente).
// Se você redesenhar alguma imagem virada pro outro lado, troque aqui.
const CORREDOR_LADO_DO_DESENHO = { parado: 0, andando: -1, preparo: 1, golpe: -1 };

function nomeDesenhoCorredor(inimigo) {
  if (inimigo.ataque === 'preparo') return 'preparo';
  if (inimigo.ataque === 'golpe') return 'golpe';
  return Math.floor(inimigo.tempoAnimacao / CORREDOR_FRAMES_POR_PASSO) % 2 === 0
    ? 'andando'
    : 'parado';
}

function retanguloDesenhoCorredor(inimigo, imagem) {
  const altura = Math.max(inimigo.altura, Math.min(CORREDOR_ALTURA_SPRITE, TIPOS_INIMIGO.corredor.espacoAcima(inimigo)));
  const largura = altura * imagem.naturalWidth / imagem.naturalHeight;
  return {
    x: inimigo.x + (inimigo.largura - largura) / 2,
    y: inimigo.y + inimigo.altura - altura,
    largura: largura,
    altura: altura
  };
}

function zerarAnimacaoCorredor(inimigo) {
  inimigo.tempoAnimacao = 0;      // frames andando (só anda quando a fase está rodando)
  inimigo.ataque = 'nenhum';      // 'nenhum' | 'preparo' | 'golpe'
  inimigo.tempoAtaque = 0;
  inimigo.recargaAtaque = 0;
  inimigo.virado = inimigo.direcao;
}

registrarInimigo('corredor', {
  preparar(inimigo) {
    definirPadrao(inimigo, 'largura', INIMIGO_TAMANHOS.corredor.largura);
    definirPadrao(inimigo, 'altura', INIMIGO_TAMANHOS.corredor.altura);
    definirPadrao(inimigo, 'velocidade', VELOCIDADE_CORREDOR);
    definirPadrao(inimigo, 'direcao', 1);
    inimigo.xInicial = inimigo.x;
    inimigo.yInicial = inimigo.y;
    inimigo.direcao = inimigo.direcao < 0 ? -1 : 1;
    inimigo.direcaoInicial = inimigo.direcao;
    inimigo.noChao = true;
    inimigo.vy = 0;
    zerarAnimacaoCorredor(inimigo);
  },

  // Decide se o corredor deve balançar o taco (gato perto, na frente e na mesma altura)
  atualizarAtaque(inimigo) {
    if (inimigo.recargaAtaque > 0) inimigo.recargaAtaque--;

    if (inimigo.ataque === 'nenhum') {
      const dx = (jogador.x + jogador.largura / 2) - (inimigo.x + inimigo.largura / 2);
      const dy = (jogador.y + jogador.altura) - (inimigo.y + inimigo.altura);   // diferença entre os pés
      const perto = Math.abs(dx) <= CORREDOR_ATAQUE_ALCANCE_X && Math.abs(dy) <= CORREDOR_ATAQUE_ALCANCE_Y;
      if (perto && inimigo.recargaAtaque === 0 && !jogador.morto) {
        inimigo.ataque = 'preparo';
        inimigo.tempoAtaque = CORREDOR_ATAQUE_PREPARO;
        inimigo.virado = dx < 0 ? -1 : 1;           // olha pro gato enquanto ataca
      }
      return;
    }

    inimigo.tempoAtaque--;
    if (inimigo.tempoAtaque > 0) return;
    if (inimigo.ataque === 'preparo') {
      inimigo.ataque = 'golpe';
      inimigo.tempoAtaque = CORREDOR_ATAQUE_GOLPE;
    } else {
      inimigo.ataque = 'nenhum';
      inimigo.recargaAtaque = CORREDOR_ATAQUE_RECARGA;
    }
  },

  // Tudo em que o corredor pode pisar / bater. O que está ESCONDIDO (chão invisível que o gato
  // ainda não pisou) não conta: pro corredor aquilo é buraco, senão ele andava no ar e parava em paredes que não existem.
  solidosVisiveis() {
    const todos = listarSolidos();
    const lista = [];
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].visivel !== false) lista.push(todos[i]);
    }
    return lista;
  },

  // Uma parede pode SURGIR em cima do corredor (fases com 'parede'). Aí ele é empurrado pro lado
  // mais perto (e vira de costas pra parede). Se não der pra empurrar, ele some, em vez de ficar preso lá dentro.
  // Devolve false se o corredor foi removido.
  sairDeDentro(inimigo, solidos) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      let preso = null;
      for (let i = 0; i < solidos.length; i++) {
        if (colidiu(inimigo, solidos[i])) { preso = solidos[i]; break; }
      }
      if (!preso) return true;

      const aEsquerda = preso.x - inimigo.largura;
      const aDireita = preso.x + preso.largura;
      const opcoes = [aEsquerda, aDireita].sort(function (p, q) {
        return Math.abs(p - inimigo.x) - Math.abs(q - inimigo.x);
      });

      let saiu = false;
      for (let i = 0; i < opcoes.length && !saiu; i++) {
        const teste = { x: opcoes[i], y: inimigo.y, largura: inimigo.largura, altura: inimigo.altura };
        if (teste.x < 0 || teste.x + teste.largura > LARGURA_TELA) continue;
        let livre = true;
        for (let j = 0; j < solidos.length; j++) {
          if (colidiu(teste, solidos[j])) { livre = false; break; }
        }
        if (!livre) continue;
        inimigo.x = teste.x;
        inimigo.direcao = opcoes[i] === aEsquerda ? -1 : 1;
        saiu = true;
      }

      if (!saiu) {
        inimigo.deveRemover = true;
        return false;
      }
    }
    return true;
  },

  // Tem chão debaixo dos pés agora? Se não (o chão que some sumiu, por exemplo), ele cai
  // e pousa no que encontrar. Se cair pra fora da tela, é removido. Devolve true enquanto estiver no ar.
  cair(inimigo, solidos) {
    const pes = inimigo.y + inimigo.altura;
    let apoiado = false;
    for (let i = 0; i < solidos.length; i++) {
      const s = solidos[i];
      const mesmoX = inimigo.x < s.x + s.largura && inimigo.x + inimigo.largura > s.x;
      if (mesmoX && s.y >= pes - 1 && s.y <= pes + 1) { apoiado = true; break; }
    }
    if (apoiado) {
      inimigo.vy = 0;
      return false;
    }

    inimigo.vy = Math.min(inimigo.vy + CORREDOR_GRAVIDADE, CORREDOR_QUEDA_MAXIMA);
    const novosPes = pes + inimigo.vy;
    let pouso = null;
    for (let i = 0; i < solidos.length; i++) {
      const s = solidos[i];
      const mesmoX = inimigo.x < s.x + s.largura && inimigo.x + inimigo.largura > s.x;
      if (mesmoX && s.y >= pes - 1 && s.y <= novosPes && (pouso === null || s.y < pouso.y)) pouso = s;
    }
    if (pouso) {
      inimigo.y = pouso.y - inimigo.altura;
      inimigo.vy = 0;
    } else {
      inimigo.y += inimigo.vy;
      if (inimigo.y > ALTURA_TELA) inimigo.deveRemover = true;
    }
    return true;
  },

  hitboxProjetil(inimigo) {
    const nome = nomeDesenhoCorredor(inimigo);
    const imagem = CORREDOR_IMAGENS[nome];
    if (!imagemPronta(imagem)) return inimigo;

    return retanguloDesenhoCorredor(inimigo, imagem);
  },

  atualizar(inimigo) {
    this.atualizarAtaque(inimigo);
    inimigo.tempoAnimacao++;
    if (inimigo.ataque === 'nenhum') inimigo.virado = inimigo.direcao;   // andando: olha pra onde corre

    const solidos = this.solidosVisiveis();
    if (!this.sairDeDentro(inimigo, solidos)) return;   // preso numa parede que surgiu: sai ou some
    if (this.cair(inimigo, solidos)) return;            // sem chão: cai (e não patrulha no ar)

    const anteriorX = inimigo.x;
    inimigo.x += inimigo.velocidade * inimigo.direcao;

    // Os limites laterais da tela também contam como paredes.
    if (inimigo.x < 0 || inimigo.x + inimigo.largura > LARGURA_TELA) {
      inimigo.x = anteriorX;
      inimigo.direcao *= -1;
      return;
    }

    for (let i = 0; i < solidos.length; i++) {
      if (colidiu(inimigo, solidos[i])) {
        inimigo.x = anteriorX;
        inimigo.direcao *= -1;
        return;
      }
    }

    // Verifica se existe chão logo adiante antes de continuar a patrulha.
    const xFrente = inimigo.direcao > 0
      ? inimigo.x + inimigo.largura + 1
      : inimigo.x - 1;
    let temChao = false;
    for (let i = 0; i < solidos.length; i++) {
      const solido = solidos[i];
      const alturaPertoDosPes = solido.y >= inimigo.y + inimigo.altura - 2 &&
        solido.y <= inimigo.y + inimigo.altura + 8;
      if (alturaPertoDosPes && xFrente >= solido.x && xFrente <= solido.x + solido.largura) {
        temChao = true;
        break;
      }
    }

    if (!temChao) {
      inimigo.x = anteriorX;
      inimigo.direcao *= -1;
    }
  },

  // Quantos px há dos pés dele até o teto mais próximo logo acima (ou a altura toda do sprite se não tem teto)
  espacoAcima(inimigo) {
    const pes = inimigo.y + inimigo.altura;
    let teto = pes - CORREDOR_ALTURA_SPRITE;
    const solidos = listarSolidos();
    for (let i = 0; i < solidos.length; i++) {
      const s = solidos[i];
      if (s.visivel === false) continue;
      const mesmoX = inimigo.x < s.x + s.largura && inimigo.x + inimigo.largura > s.x;
      const base = s.y + s.altura;
      if (mesmoX && base <= pes && base > teto) teto = base;
    }
    return pes - teto;
  },

  mata(inimigo) {
    return colidiu(jogador, inimigo);
  },

  desenhar(inimigo) {
    const nome = nomeDesenhoCorredor(inimigo);
    const imagem = CORREDOR_IMAGENS[nome];
    if (!imagemPronta(imagem)) {
      desenharRetangulo(inimigo, '#d35400');      // plano B: a imagem não carregou
      return;
    }

    const desenho = retanguloDesenhoCorredor(inimigo, imagem);
    const ladoOriginal = CORREDOR_LADO_DO_DESENHO[nome];
    const espelhar = ladoOriginal !== 0 && inimigo.virado !== ladoOriginal;

    // quiquinho a cada passo (só quando está andando)
    const sobe = inimigo.ataque === 'nenhum'
      ? Math.abs(Math.sin(inimigo.tempoAnimacao / CORREDOR_FRAMES_POR_PASSO * Math.PI)) * 2
      : 0;

    ctx.save();
    ctx.imageSmoothingEnabled = false;            // mantém o pixel art nítido
    ctx.translate(inimigo.x + inimigo.largura / 2, inimigo.y + inimigo.altura - sobe);   // pés do corredor
    ctx.scale(espelhar ? -1 : 1, 1);
    ctx.drawImage(imagem, -desenho.largura / 2, -desenho.altura, desenho.largura, desenho.altura);
    ctx.restore();
  },

  resetar(inimigo) {
    inimigo.x = inimigo.xInicial;
    inimigo.y = inimigo.yInicial;
    inimigo.direcao = inimigo.direcaoInicial < 0 ? -1 : 1;
    inimigo.vy = 0;
    inimigo.deveRemover = false;
    zerarAnimacaoCorredor(inimigo);
  }
});