// =====================================================================
//  COMBATE: aqui a espada e os inimigos se encontram
//
//  Regra: um golpe de espada que encosta num inimigo mata ele na hora
//  (os inimigos têm 1 de vida) e toca a animação de morte (inimigos/morte.js). Vale pros três tipos:
//    - corredor: é arremessado girando.
//    - voador:   cai girando, e os tiros que ainda estavam voando somem.
//    - suicida:  vira uma nuvem de fumaça. Se ele já estava na contagem da explosão, a contagem
//                também some (matar antes de explodir = sem explosão).
//  Quando um inimigo some, abre vaga na tela e o próximo da fila entra
//  (isso é feito pelo atualizarInimigos, no inimigos/_registro.js).
//
//  Os TIROS dos inimigos (voador) também são atingidos pela espada: o golpe que
//  encosta num tiro faz ele sumir, e assim ele não acerta o gato.
//
//  Golpe PRA BAIXO acertando inimigo com o gato no ar = quique (pulo extra).
//  (acertar só um tiro não dá quique)
//
//  Quem mata o GATO continua sendo o inimigos/_registro.js (inimigoMatouJogador).
//  A ordem de tudo isso no frame está no nucleo/principal.js.
// =====================================================================

// Roda a cada frame, depois de atualizar a espada e os inimigos
function resolverEspadaContraInimigos() {
  resolverProjeteisRebatidos();
  resolverExplosoesSuicidas();

  const espadaAtiva = obterHitboxEspada() !== null;

  // de trás pra frente porque removerInimigo tira o inimigo da lista
  for (let i = fase.inimigos.length - 1; i >= 0; i--) {
    const inimigo = fase.inimigos[i];
    if (!espadaAtiva || inimigo.ignorarEspada) continue; // ex: bomba que já explodiu

    // 1) os tiros desse inimigo (sempre ANTES de verificar o inimigo, pro caso de ele sumir junto)
    destruirProjeteisAtingidos(inimigo);

    // 2) o inimigo em si
    if (!espadaAcerta(inimigo)) continue;

    matarInimigo(inimigo);                   // sai da lista na hora e toca a animação de morte (inimigos/morte.js)
    if (espada.direcao === 'baixo') {
      quicarNoInimigo();
    }
  }
}

function resolverProjeteisRebatidos() {
  for (let i = fase.inimigos.length - 1; i >= 0; i--) {
    const dono = fase.inimigos[i];
    if (!dono.projeteis) continue;

    for (let p = dono.projeteis.length - 1; p >= 0; p--) {
      const projetil = dono.projeteis[p];
      if (!projetil.rebatido) continue;

      for (let alvo = fase.inimigos.length - 1; alvo >= 0; alvo--) {
        const inimigo = fase.inimigos[alvo];
        if (!projetilAcertaInimigo(projetil, inimigo)) continue;

        dono.projeteis.splice(p, 1);
        matarInimigo(inimigo);
        break;
      }
    }
  }
}

// Verifica se o projétil rebateu e cruzou o inimigo entre dois frames.
// A checagem do caminho evita que projéteis rápidos atravessem alvos pequenos.
function projetilAcertaInimigo(projetil, inimigo) {
  const tipo = TIPOS_INIMIGO[inimigo.tipo];
  const hitbox = tipo && tipo.hitboxProjetil ? tipo.hitboxProjetil(inimigo) : inimigo;
  if (colidiu(projetil, hitbox)) return true;
  if (!Number.isFinite(projetil.xAnterior) || !Number.isFinite(projetil.yAnterior)) return false;

  const inicioX = projetil.xAnterior + projetil.largura / 2;
  const inicioY = projetil.yAnterior + projetil.altura / 2;
  const deslocamentoX = projetil.x + projetil.largura / 2 - inicioX;
  const deslocamentoY = projetil.y + projetil.altura / 2 - inicioY;
  const minX = hitbox.x - projetil.largura / 2;
  const maxX = hitbox.x + hitbox.largura + projetil.largura / 2;
  const minY = hitbox.y - projetil.altura / 2;
  const maxY = hitbox.y + hitbox.altura + projetil.altura / 2;

  let entrada = 0;
  let saida = 1;
  const eixos = [
    { inicio: inicioX, deslocamento: deslocamentoX, minimo: minX, maximo: maxX },
    { inicio: inicioY, deslocamento: deslocamentoY, minimo: minY, maximo: maxY }
  ];

  for (let i = 0; i < eixos.length; i++) {
    const eixo = eixos[i];
    if (eixo.deslocamento === 0) {
      if (eixo.inicio < eixo.minimo || eixo.inicio > eixo.maximo) return false;
      continue;
    }

    let inicioIntervalo = (eixo.minimo - eixo.inicio) / eixo.deslocamento;
    let fimIntervalo = (eixo.maximo - eixo.inicio) / eixo.deslocamento;
    if (inicioIntervalo > fimIntervalo) {
      const troca = inicioIntervalo;
      inicioIntervalo = fimIntervalo;
      fimIntervalo = troca;
    }
    entrada = Math.max(entrada, inicioIntervalo);
    saida = Math.min(saida, fimIntervalo);
    if (entrada > saida) return false;
  }

  return saida >= 0 && entrada <= 1;
}

// Aplica uma vez o dano de cada explosão a outros inimigos que estejam na área.
function resolverExplosoesSuicidas() {
  const explosoes = [];

  for (let i = fase.inimigos.length - 1; i >= 0; i--) {
    const suicida = fase.inimigos[i];
    if (suicida.tipo !== 'suicida' || !suicida.explodiu || suicida.explosaoInimigosResolvida) continue;

    suicida.explosaoInimigosResolvida = true;
    const raio = suicida.tamanhoBloco * 2;
    explosoes.push({
      suicida: suicida,
      area: {
        x: suicida.x + suicida.largura / 2 - raio,
        y: suicida.y + suicida.altura / 2 - raio,
        largura: raio * 2,
        altura: raio * 2
      }
    });
  }

  for (let alvo = fase.inimigos.length - 1; alvo >= 0; alvo--) {
    const inimigo = fase.inimigos[alvo];
    for (let i = 0; i < explosoes.length; i++) {
      if (inimigo !== explosoes[i].suicida && colidiu(explosoes[i].area, inimigo)) {
        matarInimigo(inimigo);
        break;
      }
    }
  }
}

// Remove os tiros do inimigo que a espada está encostando.
// Serve pra qualquer tipo de inimigo que guarde seus tiros em inimigo.projeteis.
function destruirProjeteisAtingidos(inimigo) {
  if (!inimigo.projeteis) return;

  for (let p = inimigo.projeteis.length - 1; p >= 0; p--) {
    const projetil = inimigo.projeteis[p];
    if (!espadaAcerta(projetil)) continue;

    if (inimigo.tipo === 'voador') {
      if (!projetil.rebatido) rebaterProjetil(projetil);
      continue;
    }

    inimigo.projeteis.splice(p, 1);
  }
}

function rebaterProjetil(projetil) {
  const velocidade = Math.max(7, Math.hypot(projetil.vx, projetil.vy) * 1.6);
  projetil.rebatido = true;
  projetil.trilha = [];
  projetil.xAnterior = projetil.x;
  projetil.yAnterior = projetil.y;

  if (espada.direcao === 'cima') {
    projetil.vx = 0;
    projetil.vy = -velocidade;
  } else if (espada.direcao === 'baixo') {
    projetil.vx = 0;
    projetil.vy = velocidade;
  } else {
    projetil.vx = velocidade * jogador.virado;
    projetil.vy = 0;
  }

  ajustarHitboxProjetil(projetil);
}

// Golpe pra baixo acertou um inimigo: se o gato está no ar, ele ganha um pulo extra (quique)
function quicarNoInimigo() {
  if (ESPADA_FATOR_POGO <= 0 || jogador.noChao) return;
  jogador.vy = -fase.pulo * ESPADA_FATOR_POGO;
  jogador.noChao = false;
}