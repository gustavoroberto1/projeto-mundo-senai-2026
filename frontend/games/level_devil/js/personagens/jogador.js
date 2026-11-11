// =====================================================================
//  JOGADOR (o gato) - movimento, dash, agachar, morte e animação
// =====================================================================

// ---------------------------------------------------------------------
//  ANIMAÇÕES
//  Cada animação é uma lista de desenhos (PNG) que se alternam.
//  Pra mudar a ordem ou trocar um desenho, mexa só nesta parte:
//    parado           -> no chão, sem andar
//    andando          -> no chão, andando (os desenhos se repetem em ciclo)
//    pulando          -> no ar
//    agachado         -> agachado, sem andar (ou no ar)
//    agachadoAndando  -> agachado e andando
//    morto            -> animação de morte
//  Os arquivos ficam na pasta img/gato/.
// ---------------------------------------------------------------------
function carregarImagens(caminhos) {
  const lista = [];
  for (let i = 0; i < caminhos.length; i++) {
    const imagem = new Image();
    imagem.src = caminhos[i];
    lista.push(imagem);
  }
  return lista;
}

const ANIMACOES_JOGADOR = {
  parado:          carregarImagens(['img/gato/gato4.png']),
  andando:         carregarImagens(['img/gato/gato3.png', 'img/gato/gato2.png', 'img/gato/gato4.png', 'img/gato/gato2.png']),
  pulando:         carregarImagens(['img/gato/gato1.png']),
  agachado:        carregarImagens(['img/gato/agachado.png']),
  agachadoAndando: carregarImagens(['img/gato/agachado.png']),
  morto:           carregarImagens(['img/gato/morto.png']),
  ataquePreparo:   carregarImagens(['img/gato/ataque1.png']),   // puxando a espada
  ataqueGolpe:     carregarImagens(['img/gato/ataque2.png'])    // golpeando
};


function criarJogador() {
  const agachado = (fase.agachado === true);                // fase "agachada": já nasce agachado
  const altura = agachado ? ALTURA_AGACHADO : ALTURA_JOGADOR;

  jogador = {
    x: fase.inicio.x,
    y: fase.inicio.y + (ALTURA_JOGADOR - altura),           // os pés nascem no mesmo lugar
    largura: LARGURA_JOGADOR,
    altura: altura,
    vx: 0,           // velocidade horizontal
    vy: 0,           // velocidade vertical (negativa = subindo)
    noChao: false,
    agachado: agachado,
    morto: false,            // true durante a animação de morte
    tempoMorte: 0,           // há quantos frames ele está morrendo
    virado: 1,               // pra onde o gato olha: 1 = direita, -1 = esquerda
    animacao: 'parado',      // qual animação está tocando
    tempoAnimacao: 0,        // há quantos frames essa animação está tocando
    estavaNoChao: false,     // (usado pra detectar o momento do pouso)
    impacto: 0,              // velocidade com que ele bateu no chão
    pouso: 0,                // frames que faltam do "amassadinho" do pouso
    dashTempo: 0,            // frames que faltam do impulso do dash (0 = não está em dash)
    dashRecarga: 0,          // frames até poder usar o dash de novo
    dashDirecao: 1,          // pra que lado o dash vai (1 = direita, -1 = esquerda)
    dashTeclaAnterior: false // a tecla do dash estava apertada no frame passado? (pra pegar só o momento do aperto)
  };
}

// ---------------------------------------------------------------------
//  AGACHAR
// ---------------------------------------------------------------------

// O jogador quer estar agachado agora? (vale em TODAS as fases)
function jogadorQuerAgachar() {
  if (fase.agachado) return true;           // (opcional) fase que obriga o gato a ficar agachado
  return teclas[TECLA_AGACHAR] === true;    // segurando Shift
}

// Agacha ou levanta, diminuindo/aumentando a altura da caixa de colisão.
// Os pés ficam no mesmo lugar. Debaixo de um teto baixo ele continua agachado.
function atualizarAgachamento(solidos) {
  const quer = jogadorQuerAgachar();
  const diferenca = ALTURA_JOGADOR - ALTURA_AGACHADO;

  if (quer && !jogador.agachado && jogador.noChao) {
    jogador.agachado = true;
    jogador.altura = ALTURA_AGACHADO;
    jogador.y = jogador.y + diferenca;
  }

  if (!quer && jogador.agachado) {
    // como ele ficaria em pé? tem espaço em cima?
    const emPe = { x: jogador.x, y: jogador.y - diferenca, largura: jogador.largura, altura: ALTURA_JOGADOR };
    let temEspaco = true;
    for (let i = 0; i < solidos.length; i++) {
      if (colidiu(emPe, solidos[i])) temEspaco = false;
    }
    if (temEspaco) {
      jogador.agachado = false;
      jogador.altura = ALTURA_JOGADOR;
      jogador.y = emPe.y;
    }
  }
}

// ---------------------------------------------------------------------
//  DASH (tecla Q): um impulso rápido pro lado, com um pulinho
//  Os números estão no config.js (seção "Gato: dash").
// ---------------------------------------------------------------------
// "direcao" é -1, 0 ou 1 (teclas apertadas) e "velocidade" é a velocidade de andar do gato.
// Esta função decide o jogador.vx do frame: dash em andamento ou andar normal.
function atualizarDash(direcao, velocidade) {
  if (jogador.dashRecarga > 0) {
    jogador.dashRecarga--;
  }

  // Pega só o MOMENTO em que a tecla é apertada (segurar não repete o dash)
  const teclaApertada = teclas[TECLA_DASH] === true;
  if (teclaApertada && !jogador.dashTeclaAnterior && jogador.dashRecarga === 0) {
    jogador.dashTempo = DASH_DURACAO;
    jogador.dashRecarga = DASH_RECARGA;

    // Vai pro lado que o jogador está apertando, ou pra onde o gato está olhando
    jogador.dashDirecao = (direcao !== 0) ? Math.sign(direcao) : jogador.virado;

    // Pulinho do dash
    jogador.vy = -Math.max(fase.pulo * DASH_FATOR_PULO, DASH_PULO_MINIMO);
    jogador.noChao = false;
  }
  jogador.dashTeclaAnterior = teclaApertada;

  if (jogador.dashTempo > 0) {
    jogador.vx = jogador.dashDirecao * Math.max(DASH_VELOCIDADE_MINIMA, velocidade * DASH_FATOR_VELOCIDADE);
    jogador.dashTempo--;
  } else {
    jogador.vx = direcao * velocidade;
  }
}

// ---------------------------------------------------------------------
//  MOVIMENTO
// ---------------------------------------------------------------------
function moverJogador() {
  const solidos = listarSolidos();

  atualizarAgachamento(solidos);

  // ----- 1) Ler as teclas -----
  let direcao = 0;      // -1 = esquerda, 0 = parado, 1 = direita
  if (teclas['arrowright'] || teclas['d']) direcao = direcao + 1;
  if (teclas['arrowleft'] || teclas['a']) direcao = direcao - 1;
  if (fase.invertida) direcao = -direcao;
  let velocidade = fase.velocidade;
  if (jogador.agachado) {
    velocidade = velocidade * FATOR_VELOCIDADE_AGACHADO;
  }

  atualizarDash(direcao, velocidade);   // define jogador.vx (andando normal ou em dash)

  const apertouPulo = teclas[' '];
  if (apertouPulo && jogador.noChao) {
    jogador.vy = -fase.pulo;
    jogador.noChao = false;
  }

  // ----- 2) Mover na horizontal e tratar batidas de lado -----
  jogador.x = jogador.x + jogador.vx;
  for (let i = 0; i < solidos.length; i++) {
    const s = solidos[i];
    if (colidiu(jogador, s)) {
      if (jogador.vx > 0) {
        jogador.x = s.x - jogador.largura;     // bateu andando pra direita
      } else {
        jogador.x = s.x + s.largura;           // bateu andando pra esquerda
      }
    }
  }

  // Não deixa sair da tela pelos lados
  if (jogador.x < 0) jogador.x = 0;
  if (jogador.x > LARGURA_TELA - jogador.largura) jogador.x = LARGURA_TELA - jogador.largura;

  // ----- 3) Gravidade e movimento na vertical -----
  jogador.vy = jogador.vy + fase.gravidade;
  jogador.y = jogador.y + jogador.vy;
  jogador.noChao = false;

  for (let i = 0; i < solidos.length; i++) {
    const s = solidos[i];
    if (colidiu(jogador, s)) {
      if (jogador.vy > 0) {
        // Estava caindo: pousou em cima
        jogador.impacto = jogador.vy;          // (guarda a força da batida pra animação)
        jogador.y = s.y - jogador.altura;
        jogador.noChao = true;
        jogadorPisouEm(s);                     // avisa a armadilha (chão que some, chão invisível...)
      } else {
        // Estava subindo: bateu a cabeça embaixo
        jogador.y = s.y + s.altura;
      }
      jogador.vy = 0;
    }
  }

  atualizarAnimacaoJogador();
}

// ---------------------------------------------------------------------
//  MORTE (roda a cada frame enquanto o gato está morrendo)
// ---------------------------------------------------------------------
function atualizarMorte() {
  jogador.tempoMorte++;

  // o gato dá um pulinho e cai com a gravidade
  jogador.vy = jogador.vy + fase.gravidade;
  jogador.y = jogador.y + jogador.vy;

  // pousa em cima das plataformas (se cair num buraco, continua caindo)
  if (jogador.vy > 0) {
    const solidos = listarSolidos();
    const pesAntes = (jogador.y - jogador.vy) + jogador.altura;   // onde estavam os pés no frame anterior
    for (let i = 0; i < solidos.length; i++) {
      const s = solidos[i];
      if (colidiu(jogador, s) && pesAntes <= s.y + 0.5) {
        jogador.y = s.y - jogador.altura;
        jogador.vy = 0;
      }
    }
  }

  if (jogador.tempoMorte >= DURACAO_MORTE) {
    renascer();
  }
}

// ---------------------------------------------------------------------
//  ANIMAÇÃO
// ---------------------------------------------------------------------

// Escolhe qual animação tocar e faz o tempo dela andar (roda a cada frame)
function atualizarAnimacaoJogador() {
  // pra que lado ele está virado (só muda quando ele anda)
  if (jogador.vx > 0) jogador.virado = 1;
  if (jogador.vx < 0) jogador.virado = -1;

  let nova = 'parado';
  if (!jogador.noChao) {
    nova = 'pulando';
  } else if (jogador.vx !== 0) {
    nova = 'andando';
  }
  if (jogador.agachado) {
    nova = (jogador.noChao && jogador.vx !== 0) ? 'agachadoAndando' : 'agachado';
  }
  // batendo com a espada: o gato muda de pose (puxa a espada -> golpeia). Agachado mantém o desenho agachado.
  if (espada.tempo > 0 && !jogador.agachado) {
    nova = espada.tempo < ESPADA_HITBOX_INICIO ? 'ataquePreparo' : 'ataqueGolpe';
  }
  if (nova !== jogador.animacao) {
    jogador.animacao = nova;        // trocou de animação: recomeça do primeiro desenho
    jogador.tempoAnimacao = 0;
  } else {
    jogador.tempoAnimacao++;
  }

  // "amassadinho" quando ele cai no chão com força
  const acabouDePousar = jogador.noChao && !jogador.estavaNoChao && jogador.impacto > 3;
  if (acabouDePousar) {
    jogador.pouso = TEMPO_POUSO;
  } else if (jogador.pouso > 0) {
    jogador.pouso--;
  }
  jogador.estavaNoChao = jogador.noChao;
}

// ---------------------------------------------------------------------
//  DESENHO
// ---------------------------------------------------------------------
function desenharJogador() {
  if (jogador.morto) {
    desenharGatoMorto();
  } else {
    desenharGatoVivo();
  }

  desenharHitbox(jogador, '#00ff00');
}

// Desenha o gato vivo. Os pés ficam no "chão" da caixa de colisão, o desenho é
// espelhado quando ele anda pra esquerda e ganha uns efeitos:
//   parado: respira | andando: quica a cada passo | no ar: estica | pouso: amassa
function desenharGatoVivo() {
  const quadros = ANIMACOES_JOGADOR[jogador.animacao];
  const indice = Math.floor(jogador.tempoAnimacao / FRAMES_POR_QUADRO) % quadros.length;
  const imagem = quadros[indice];

  if (!imagemPronta(imagem)) {
    // a imagem não carregou (caminho errado?): desenha o quadradinho azul
    desenharRetangulo(jogador, '#4cc9f0');
    return;
  }

  const altura = jogador.agachado ? ALTURA_SPRITE_AGACHADO : ALTURA_SPRITE_JOGADOR;
  const largura = altura * imagem.naturalWidth / imagem.naturalHeight;
  const t = jogador.tempoAnimacao;

  let escalaX = 1;
  let escalaY = 1;
  let sobe = 0;                   // quantos pixels o desenho sobe

  if (jogador.animacao === 'parado' || jogador.animacao === 'agachado') {
    escalaY = 1 + Math.sin(t * 0.08) * 0.02;                  // respirando
  }
  if (jogador.animacao === 'andando' || jogador.animacao === 'agachadoAndando') {
    const forca = jogador.agachado ? 1 : 2;
    sobe = Math.abs(Math.sin(t / FRAMES_POR_QUADRO * Math.PI)) * forca;   // um quiquinho por passo
  }
  if (!jogador.noChao) {
    const esticar = Math.min(Math.abs(jogador.vy) / 11, 1) * 0.12;      // estica quando está rápido no ar
    escalaY = 1 + esticar;
    escalaX = 1 - esticar * 0.8;
  }
  if (jogador.pouso > 0) {
    const f = jogador.pouso / TEMPO_POUSO;                    // amassa ao pousar
    escalaX = 1 + 0.25 * f;
    escalaY = 1 - 0.25 * f;
  }

  const centroX = jogador.x + jogador.largura / 2;
  const pes = jogador.y + jogador.altura;

  ctx.save();
  ctx.translate(centroX, pes - sobe);                         // move o "pincel" pros pés do gato
  ctx.scale(jogador.virado * escalaX, escalaY);               // virado = -1 espelha o desenho
  ctx.drawImage(imagem, -largura / 2, -altura, largura, altura);
  ctx.restore();
}

// Desenha o gato morto (deitado, com olhinhos de X). Some devagar no final.
function desenharGatoMorto() {
  const imagem = ANIMACOES_JOGADOR.morto[0];

  if (!imagemPronta(imagem)) {
    desenharRetangulo(jogador, '#e63946');
    return;
  }

  const altura = ALTURA_SPRITE_MORTO;
  const largura = altura * imagem.naturalWidth / imagem.naturalHeight;
  const restante = DURACAO_MORTE - jogador.tempoMorte;

  ctx.save();
  if (restante < 15) ctx.globalAlpha = Math.max(restante, 0) / 15;     // fade-out nos últimos frames
  ctx.translate(jogador.x + jogador.largura / 2, jogador.y + jogador.altura);
  ctx.scale(jogador.virado, 1);
  ctx.drawImage(imagem, -largura / 2, -altura + altura * MORTO_AFUNDA, largura, altura);
  ctx.restore();
}
