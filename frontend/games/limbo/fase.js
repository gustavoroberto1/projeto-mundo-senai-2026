// =====================================================
// FASES
//   Cada fase é um objeto com tudo que muda de uma para outra.
//   Tudo é um retângulo: x, y (canto de cima), w (largura), h (altura)
//   O chão fica sempre em y = 380 (vários arquivos contam com isso).
//
//   plataformas = o que tem colisão. Pode ter "estilo" (visual do bloco):
//                 "caixote", "tabua", "pedra", "massa", "laje", "viga"
//   objetos     = só decoração/abrigos, sempre com "tipo".
// =====================================================

// As cores do cenário. Aperte 1 a 7 no jogo para trocar.
const PALETAS = [
  { ceuCima: "#5f6163", ceuBaixo: "#bdbfc0", arvore: "#2a2a2a", luz: "#ffffff" },  // 1 cinza
  { ceuCima: "#1f3a36", ceuBaixo: "#6f9c92", arvore: "#0c1f1b", luz: "#bffff0" },  // 2 verde
  { ceuCima: "#3a1f12", ceuBaixo: "#c27a3c", arvore: "#1e0c05", luz: "#ffd9a0" },  // 3 âmbar
  { ceuCima: "#1b1a3a", ceuBaixo: "#5c5aa8", arvore: "#0a081e", luz: "#d6d0ff" },  // 4 roxo
  { ceuCima: "#0c1d3a", ceuBaixo: "#3a6fb0", arvore: "#050a19", luz: "#c8e4ff" },  // 5 azul
  { ceuCima: "#2b2a2e", ceuBaixo: "#8a8478", arvore: "#121114", luz: "#f2e6cf" },  // 6 cinzas
  { ceuCima: "#1a1618", ceuBaixo: "#b5683f", arvore: "#0d0a0b", luz: "#ffd2a8" },  // 7 pôr do sol em ruínas
  { ceuCima: "#0f0818", ceuBaixo: "#6a3318", arvore: "#07040a", luz: "#ffb347" },  // 8 halloween
  { ceuCima: "#0d0712", ceuBaixo: "#3a1c3e", arvore: "#07040a", luz: "#ffb86b" },  // 8 casa mal-assombrada
];
let paleta = PALETAS[0];
// Beirada: tábua fina e atravessável (a fase 3 é feita delas).
// Dá para pular por baixo e pousar em cima. O pulo sobe uns 120, então
// mantenha 80 de diferença de altura entre uma beirada e a próxima.
function beirada(x, y, w) {
  return { x, y, w, h: 14, tipo: "assoalho" };
}

// Trecho de caverna: um teto (desce a partir do chão da floresta, y = 380) e um piso.
// Os dois levam "rocha" para o caverna.js desenhar as saliências nas bordas.
// A folga (piso - teto) manda: 46 = só agachado; 140 ou mais = dá para pular.
function trecho(x, w, tetoY, pisoY) {
  return [
    { x, y: 380,   w, h: tetoY - 380, rocha: "teto" },
    { x, y: pisoY, w, h: 300,         rocha: "piso", semGrama: true },
  ];
}


const FASES = [
  // ---------------------------------------------------
  // FASE 1: floresta
  // ---------------------------------------------------
  {
    nome: "Floresta",
    cenario: "floresta",
    paleta: 0,
    fim: 3100,

    plataformas: [
      // --- trecho 1: introdução ---
      { x: 0,    y: 380, w: 600, h: 100 },                       // chão 1
      { x: 380,  y: 340, w: 40,  h: 40,  estilo: "caixote" },    // caixa para o primeiro pulo

      // --- trecho 2: buraco + plataforma no ar ---
      { x: 700,  y: 380, w: 500, h: 100 },                       // chão 2 (buraco de 100 antes)
      { x: 880,  y: 300, w: 120, h: 20,  estilo: "tabua" },      // plataforma no ar

      // --- trecho 3: espinhos no chão ---
      { x: 1300, y: 380, w: 400, h: 100 },                       // chão 3

      // --- trecho 4: escadinha ---
      { x: 1800, y: 380, w: 500, h: 100 },                       // chão 4
      { x: 1900, y: 340, w: 60,  h: 40,  estilo: "pedra" },      // degrau 1
      { x: 1960, y: 300, w: 60,  h: 80,  estilo: "pedra" },      // degrau 2
      { x: 2020, y: 260, w: 60,  h: 120, estilo: "pedra" },      // degrau 3

      // --- trecho 5: caixa, espinhos, túnel baixo e a luz ---
      { x: 2410, y: 380, w: 690, h: 100 },                       // chão 5 (buraco de 110 antes)
      { x: 2480, y: 340, w: 40,  h: 40,  estilo: "caixote" },    // caixa
      { x: 2700, y: 150, w: 160, h: 186, estilo: "massa" },      // túnel baixo: só passa agachado
    ],

    espinhos: [
      { x: 1060, y: 360, w: 60, h: 20 },
      { x: 1440, y: 360, w: 60, h: 20 },
      { x: 2140, y: 360, w: 60, h: 20 },
      { x: 2560, y: 360, w: 60, h: 20 },
      { x: 2900, y: 360, w: 60, h: 20 },
    ],

    luz: { x: 3040, y: 290, w: 10, h: 90 },

    // y padrão = 380 (o chão). Correntes usam y: 0 (penduradas no teto).
    objetos: [
      { tipo: "placa",     x: 170 },
      { tipo: "pedra",     x: 290, s: 1 },
      { tipo: "moita",     x: 330 },
      { tipo: "toco",      x: 520 },
      { tipo: "muro",      x: 545 },
      { tipo: "cerca",     x: 740 },
      { tipo: "tronco",    x: 900 },
      { tipo: "cogumelos", x: 960 },
      { tipo: "rochedo",   x: 1160 },
      { tipo: "pedra",     x: 1170, s: 0.7 },
      { tipo: "lanterna",  x: 1250 },
      { tipo: "galhos",    x: 1315 },
      { tipo: "moita",     x: 1385 },
      { tipo: "corrente",  x: 1530, y: 0, comp: 120 },
      { tipo: "tronco",    x: 1620 },
      { tipo: "lapide",    x: 1688 },
      { tipo: "muro",      x: 1848 },
      { tipo: "lanterna",  x: 2000 },
      { tipo: "toco",      x: 2110 },
      { tipo: "rochedo",   x: 2250 },
      { tipo: "corrente",  x: 2355, y: 0, comp: 150 },
      { tipo: "moita",     x: 2462 },
      { tipo: "cogumelos", x: 2540 },
      { tipo: "galhos",    x: 2650 },
      { tipo: "rochedo",   x: 3000 },
      { tipo: "pedra",     x: 3070, s: 0.8 },
    ],
  },

  // ---------------------------------------------------
  // FASE 2: cidade abandonada
  // ---------------------------------------------------
  {
    nome: "Cidade",
    cenario: "cidade",
    paleta: 6,
    fim: 4700,

    plataformas: [
      // --- trecho 1: rua de entrada ---
      { x: 0,    y: 380, w: 760, h: 100 },

      // --- trecho 2: carro como degrau, cones depois ---
      { x: 860,  y: 380, w: 540, h: 100 },                       // buraco de 100 antes
      { x: 1000, y: 340, w: 100, h: 40,  invisivel: true },      // carro (objeto "carro" em x: 1050)

      // --- trecho 3: o ônibus ---
      { x: 1510, y: 380, w: 990, h: 100 },                       // buraco de 110 antes
      { x: 1750, y: 340, w: 40,  h: 40,  estilo: "caixote" },    // caixote para subir no teto
      { x: 1820, y: 276, w: 420, h: 14 },                        // teto do ônibus (objeto "onibus" em x: 1820)
      { x: 1900, y: 366, w: 34,  h: 14 },                        // bancos (x = ônibus + 80, + 220, + 330)
      { x: 2040, y: 366, w: 34,  h: 14 },
      { x: 2150, y: 366, w: 34,  h: 14 },

      // --- trecho 4: vala ---
      { x: 2610, y: 410, w: 300, h: 100 },                       // 30 mais baixa (buraco de 110 antes)

      // --- trecho 5: laje levantada e laje desabada ---
      { x: 2910, y: 380, w: 790, h: 100 },
      { x: 3040, y: 350, w: 110, h: 30,  estilo: "laje" },       // laje levantada
      { x: 3400, y: 150, w: 160, h: 186 },                       // prédio: só passa agachado (objeto "predio" em x: 3400)

      // --- trecho 6: reta final ---
      { x: 3800, y: 380, w: 900, h: 100 },                       // buraco de 100 antes
      { x: 4000, y: 290, w: 140, h: 20,  estilo: "viga" },       // viga no ar
      { x: 4400, y: 340, w: 40,  h: 40,  estilo: "caixote" },    // caixote
    ],

    espinhos: [   // na cidade são desenhados como cones de trânsito
      { x: 1140, y: 360, w: 60, h: 20 },    // depois do carro
      { x: 1630, y: 360, w: 60, h: 20 },    // antes do ônibus
      { x: 2000, y: 256, w: 60, h: 20 },    // em cima do teto do ônibus
      { x: 2740, y: 390, w: 60, h: 20 },    // dentro da vala
      { x: 3200, y: 360, w: 60, h: 20 },    // antes do prédio
      { x: 4170, y: 360, w: 60, h: 20 },    // depois da viga
      { x: 4500, y: 360, w: 60, h: 20 },    // depois do caixote
    ],

    luz: { x: 4640, y: 290, w: 10, h: 90 },

    // y padrão = 380 (o chão). Objetos na vala usam y: 410.
    objetos: [
      // trecho 1
      { tipo: "poste",          x: 130 },
      { tipo: "lixeira",        x: 240 },
      { tipo: "lixeiraTombada", x: 330 },
      { tipo: "pneus",          x: 430 },
      { tipo: "muro",           x: 570 },                 // abrigo
      { tipo: "escombros",      x: 700 },
      // trecho 2
      { tipo: "fio",            x: 880, y: 0, comp: 220 },
      { tipo: "poste",          x: 960 },
      { tipo: "carro",          x: 1050 },                // x = centro (plataforma 1000..1100)
      { tipo: "carrinho",       x: 1240 },
      { tipo: "rochedo",        x: 1320 },                // abrigo (bloco de concreto)
      // trecho 3
      { tipo: "semaforo",       x: 1560 },
      { tipo: "escombros",      x: 1720 },
      { tipo: "onibus",         x: 1820, w: 420 },         // x = ponta esquerda do ônibus
      { tipo: "lixeira",        x: 2300 },
      { tipo: "poste",          x: 2360 },
      { tipo: "muro",           x: 2420 },                // abrigo
      // vala
      { tipo: "escombros",      x: 2660, y: 410 },
      { tipo: "pneus",          x: 2860, y: 410 },
      // trecho 5
      { tipo: "poste",          x: 2970 },
      { tipo: "fio",            x: 3000, y: 0, comp: 200 },
      { tipo: "carrinho",       x: 3340 },
      { tipo: "predio",         x: 3400, w: 160 },         // x = ponta esquerda, igual à plataforma
      { tipo: "ponto",          x: 3600 },
      { tipo: "lixeiraTombada", x: 3665 },
      // trecho 6
      { tipo: "poste",          x: 3860 },
      { tipo: "escombros",      x: 3930 },
      { tipo: "lixeira",        x: 4290 },
      { tipo: "rochedo",        x: 4340 },                // abrigo
      { tipo: "semaforo",       x: 4470 },
      { tipo: "pneus",          x: 4590 },
    ],
  },

    // ---------------------------------------------------
  // FASE 3: casa mal-assombrada (uma torre para ESCALAR)
  //   Só se sobe: do térreo (y = 380) até o sótão (y = -1540).
  //   Cada beirada fica 80 acima da anterior, com vãos de 40 a 60 entre elas.
  //   Os armários (id "armario1"...) ainda não fazem nada: as funções deles vêm depois.
  // ---------------------------------------------------
    // ---------------------------------------------------
  // FASE 3: casa mal-assombrada (uma torre para ESCALAR)
  //   Só se sobe: do térreo (y = 380) até o sótão (y = -1540).
  //   Cada beirada fica 80 acima da anterior, com vãos de 40 a 60 entre elas.
  //   Os armários (id "armario1"...) ainda não fazem nada: as funções deles vêm depois.
  // ---------------------------------------------------
  {
    nome: "Casa Mal-Assombrada",
    cenario: "casa",
    paleta: 7,
    fim: 800,            // a fase tem a largura da tela: a câmera não anda para os lados
    vertical: true,
    topo: -1760,         // até onde a câmera sobe
    monstro: false,       // sem o olho nesta fase     
    rush: true,          // o monstro novo    // sem o olho nesta fase

    plataformas: [
      // --- térreo ---
      { x: 0,   y: 380, w: 800, h: 100, tipo: "assoalho" },
      { x: 180, y: 344, w: 60,  h: 36,  tipo: "comoda" },      // móvel sólido: treino de pulo
      { x: 560, y: 340, w: 50,  h: 40,  tipo: "bau" },         // baú sólido: degrau até a beirada 1

      // --- 1º andar ---
      beirada(360,  300, 180),    //  1
      beirada(120,  220, 180),    //  2
      beirada(360,  140, 180),    //  3  (espinhos no meio)
      beirada(600,   60, 180),    //  4
      beirada(360,  -20, 180),    //  5
      beirada(40,  -100, 280),    //  6  PATAMAR 1

      // --- 2º andar ---
      beirada(380, -180, 180),    //  7  (espinhos)
      beirada(620, -260, 170),    //  8
      beirada(380, -340, 180),    //  9
      beirada(140, -420, 180),    // 10
      beirada(380, -500, 180),    // 11  (espinhos)
      beirada(620, -580, 180),    // 12  PATAMAR 2

      // --- 3º andar ---
      beirada(380, -660, 180),    // 13  (espinhos)
      beirada(140, -740, 180),    // 14
      beirada(360, -820, 160),    // 15
      beirada(420, -900, 180),    // 16  (espinhos)
      beirada(620, -980, 170),    // 17
      beirada(160, -1060, 400),   // 18  PATAMAR 3

      // --- sótão ---
      beirada(600, -1140, 190),   // 19
      beirada(360, -1220, 180),   // 20  (espinhos)
      beirada(120, -1300, 180),   // 21
      beirada(360, -1380, 180),   // 22  (espinhos)
      beirada(600, -1460, 180),   // 23
      beirada(300, -1540, 240),   // 24  o fim da fase

      // parede da direita (a da esquerda é o próprio limite da tela)
      { x: 800, y: -1800, w: 60, h: 2300 },
    ],

    espinhos: [   // cada um fica em cima da beirada: y = topo da beirada - 20
      { x: 440, y: 120,   w: 40, h: 20 },   //  3
      { x: 450, y: -200,  w: 40, h: 20 },   //  7
      { x: 450, y: -520,  w: 40, h: 20 },   // 11
      { x: 450, y: -680,  w: 40, h: 20 },   // 13
      { x: 480, y: -920,  w: 40, h: 20 },   // 16
      { x: 420, y: -1240, w: 40, h: 20 },   // 20
      { x: 450, y: -1400, w: 40, h: 20 },   // 22
     { x: 400, y: 154, w: 40, h: 20, invertido: true },   // embaixo da beirada 3
    ],

    luz: { x: 470, y: -1630, w: 10, h: 90 },   // em cima da beirada 24

    // y padrão = 380 (o chão). Nos outros lugares, y = topo da beirada onde o objeto fica.
    // quadro: y é o centro do quadro. lustre: y é onde a corrente prende.
    objetos: [
      // térreo
      { tipo: "abobora",    x: 110 },
      { tipo: "candelabro", x: 300 },
      { tipo: "quadro",     x: 480, y: 250 },
      { tipo: "armario",    x: 690, id: "armario1", w: 52, h: 62 },

      // 1º andar
      { tipo: "abobora",    x: 430, y: 300 },
      { tipo: "candelabro", x: 150, y: 220 },
      { tipo: "morcego",    x: 700, y: 140 },
      { tipo: "quadro",     x: 200, y: 120 },
      { tipo: "abobora",    x: 740, y: 60 },
      { tipo: "candelabro", x: 520, y: -20 },
      { tipo: "armario",    x: 90,  y: -100, id: "armario2", w: 52, h: 62 },
      { tipo: "candelabro", x: 250, y: -100 },

      // 2º andar
      { tipo: "abobora",    x: 530, y: -180 },
      { tipo: "candelabro", x: 760, y: -260 },
      { tipo: "quadro",     x: 200, y: -330 },
      { tipo: "morcego",    x: 450, y: -400 },
      { tipo: "lustre",     x: 230, y: -406, comp: 40 },
      { tipo: "candelabro", x: 410, y: -500 },
      { tipo: "abobora",    x: 660, y: -580 },
      { tipo: "armario",    x: 760, y: -580, id: "armario3", w: 52, h: 62 },

      // 3º andar
      { tipo: "candelabro", x: 170, y: -740 },
      { tipo: "quadro",     x: 620, y: -790 },
      { tipo: "morcego",    x: 330, y: -700 },
      { tipo: "abobora",    x: 560, y: -900 },
      { tipo: "candelabro", x: 740, y: -980 },
      { tipo: "armario",    x: 210, y: -1060, id: "armario4", w: 52, h: 62 },
      { tipo: "candelabro", x: 350, y: -1060 },
      { tipo: "armario",    x: 500, y: -1060, id: "armario5", w: 52, h: 62 },

      // sótão
      { tipo: "abobora",    x: 750, y: -1140 },
      { tipo: "quadro",     x: 480, y: -1180 },
      { tipo: "morcego",    x: 200, y: -1250 },
      { tipo: "candelabro", x: 150, y: -1300 },
      { tipo: "abobora",    x: 740, y: -1460 },
      { tipo: "morcego",    x: 650, y: -1530 },
      { tipo: "armario",    x: 340, y: -1540, id: "armario6", w: 52, h: 62 },
      { tipo: "candelabro", x: 520, y: -1540 },
      { tipo: "lustre",     x: 420, y: -1700, comp: 60 },
      { tipo: "teia",       x: 0,   y: -1700 },
      { tipo: "teia",       x: 800, y: -1700, espelho: true },




    // ===== DECORAÇÃO EXTRA ... =====
    { tipo: "lampada", x: 210, y: 240, comp: 50, cor: "laranja" },
    // ... todo o resto da decoração ...
    { tipo: "teia", x: 0, y: -1280, aranha: true }
  ],     // fecha o array objetos
},    

    // ---------------------------------------------------
  // FASE 4: caverna (floresta, chão falso, caverna ondulada e aranha)
  //   Floresta (x 0 a 1500), chão falso de 760 (x 1500 a 2260), poço de 420 de queda,
  //   caverna (x 2260 a 8520). Tetos baixos (só agachado) em x 3120 e x 4460.
  //   A aranha aparece no 1º teto baixo e persegue até o fim.
  //   O trecho reto de x 6720 a 8220 está livre: é onde vai o carrinho de mina.
  // ---------------------------------------------------
  {
    nome: "Caverna",
    cenario: "floresta",
    paleta: 0,
    fim: 9900,
    vertical: true,
    topo: 0,
    base: 440,
    ancora: 360,
    camVel: 0.45,
    limiteQueda: 1000,
    monstro: false,
    aranha: true,                            // liga a aranha nesta fase
    mina: { trilhoIni: 6720, trilhoFim: 8380, piso: 780, carrinhoX: 6820 },
    aranhaGatilho: { x: 3120, w: 220 },      // zona do 1º teto baixo (trecho 4)

    plataformas: [
      // --- floresta ---
      { x: 0,    y: 380, w: 1500, h: 600 },
      { x: 380,  y: 340, w: 40,   h: 40,  estilo: "caixote" },
      { x: 880,  y: 300, w: 120,  h: 20,  estilo: "tabua" },
      { x: 1180, y: 340, w: 60,   h: 40,  estilo: "pedra" },
      { x: 1240, y: 300, w: 60,   h: 80,  estilo: "pedra" },

      // --- o chão falso: 760 de largura, não dá para pular por cima ---
      { x: 1500, y: 380, w: 760,  h: 100, falso: true, atraso: 2 },

      // --- fundo do poço ---
      { x: 1500, y: 800, w: 760,  h: 300, rocha: "piso", semGrama: true },

      // --- caverna: trecho(x, largura, y do teto, y do piso) ---
      ...trecho(2260, 300, 620, 800),    //  1  entrada
      ...trecho(2560, 300, 570, 750),    //  2  sobe 50 (pula)
      ...trecho(2860, 260, 600, 780),    //  3  desce
      ...trecho(3120, 220, 734, 780),    //  4  TETO BAIXO: agachar (a aranha aparece aqui)
      ...trecho(3340, 300, 630, 810),    //  5  desce
      ...trecho(3640, 270, 580, 740),    //  6  sobe 70 (pula)
      ...trecho(3910, 250, 520, 700),    //  7  sobe 40: ponto mais alto
      ...trecho(4160, 300, 600, 790),    //  8  desce 90
      ...trecho(4460, 240, 744, 790),    //  9  TETO BAIXO: agachar
      ...trecho(4700, 300, 610, 790),    // 10
      ...trecho(5000, 260, 570, 750),    // 11  sobe 40 (pula)
      ...trecho(5260, 300, 590, 770),    // 12
      ...trecho(5560, 300, 600, 780),    // 13  (novo)
      ...trecho(5860, 260, 560, 740),    // 14  sobe 40 (pula)
      ...trecho(6120, 300, 630, 790),    // 15  desce 50
      ...trecho(6420, 300, 590, 770),    // 16  respiro antes do carrinho

            // --- barricada: o carrinho quebra ela ---
      { x: 7860, y: 600, w: 50, h: 180, barricada: true, semGrama: true },

      // --- saída: sobe em degraus até o portal ---
      ...trecho(8220, 220, 600, 780),    // saída do trilho (plano)
      ...trecho(8440, 220, 560, 730),    // sobe 50
      ...trecho(8660, 200, 520, 680),    // sobe 50
      ...trecho(8860, 220, 540, 720),    // desce 40
      ...trecho(9080, 220, 480, 650),    // sobe 70
      ...trecho(9300, 220, 440, 590),    // sobe 60
      ...trecho(9520, 300, 400, 550),    // plataforma do portal
      { x: 9820, y: 380, w: 400, h: 700, semGrama: true },   // parede do fim
    ],

    espinhos: [
      { x: 2420, y: 780, w: 60, h: 20 },
      { x: 2760, y: 730, w: 40, h: 20 },
      { x: 2980, y: 760, w: 40, h: 20 },
      { x: 3480, y: 790, w: 60, h: 20 },
      { x: 4090, y: 680, w: 40, h: 20 },
      { x: 4300, y: 770, w: 60, h: 20 },
      { x: 4820, y: 770, w: 60, h: 20 },
      { x: 5200, y: 730, w: 40, h: 20 },
      { x: 5390, y: 750, w: 40, h: 20 },
      { x: 5700, y: 760, w: 60, h: 20 },    // 13
      { x: 5980, y: 720, w: 40, h: 20 },    // 14
      { x: 8700, y: 660, w: 40, h: 20 },    // degrau 3 da subida
      { x: 9400, y: 570, w: 40, h: 20 },    // degrau 6 da subida
      { x: 6240, y: 770, w: 60, h: 20 },    // 15
    ],

    // poco = a abertura no chão da floresta; fim = onde a caverna acaba;
    // fundo = até onde o vazio é desenhado
        caverna: { poco: { x: 1500, y: 380, w: 760 }, fim: 9820, fundo: 900 },

    luz: { x: 9760, y: 460, w: 10, h: 90 },

    objetos: [
      // floresta (nada em cima do chão falso, senão fica flutuando quando ele cai)
      { tipo: "placa",     x: 170 },
      { tipo: "pedra",     x: 290, s: 1 },
      { tipo: "moita",     x: 330 },
      { tipo: "toco",      x: 520 },
      { tipo: "muro",      x: 545 },
      { tipo: "cerca",     x: 740 },
      { tipo: "tronco",    x: 900 },
      { tipo: "cogumelos", x: 960 },
      { tipo: "corrente",  x: 1000, y: 0, comp: 120 },
      { tipo: "lanterna",  x: 1100 },
      { tipo: "galhos",    x: 1335 },
      { tipo: "moita",     x: 1440 },
      // o outro lado da superfície, que se vê de longe
      { tipo: "lanterna",  x: 2330 },
      { tipo: "tronco",    x: 2450 },
      { tipo: "lapide",    x: 2600 },
      // caverna
      { tipo: "cogumelos", x: 2340, y: 800 },
      { tipo: "pedra",     x: 2660, y: 750, s: 0.8 },
      { tipo: "corrente",  x: 2710, y: 570, comp: 60 },
      { tipo: "cogumelos", x: 2940, y: 780 },
      { tipo: "pedra",     x: 3760, y: 740, s: 0.8 },
      { tipo: "corrente",  x: 4040, y: 520, comp: 50 },
      { tipo: "cogumelos", x: 4260, y: 790 },
      { tipo: "corrente",  x: 4860, y: 610, comp: 70 },
      { tipo: "cogumelos", x: 5060, y: 750 },
      { tipo: "pedra",     x: 5300, y: 770, s: 1 },
      { tipo: "cogumelos", x: 5650, y: 780 },
      { tipo: "pedra",     x: 5780, y: 780, s: 0.8 },
      { tipo: "corrente",  x: 5960, y: 560, comp: 60 },
      { tipo: "cogumelos", x: 6020, y: 740 },
      { tipo: "corrente",  x: 6250, y: 630, comp: 70 },
      { tipo: "pedra",     x: 6300, y: 790, s: 0.9 },
      { tipo: "cogumelos", x: 6560, y: 770 },
      { tipo: "corrente",  x: 7200, y: 600, comp: 60 },   // trecho do carrinho: só correntes no teto
            // subida final
      { tipo: "cogumelos", x: 8480, y: 730 },
      { tipo: "pedra",     x: 8820, y: 680, s: 0.7 },
      { tipo: "corrente",  x: 8980, y: 540, comp: 60 },
      { tipo: "cogumelos", x: 9180, y: 650 },
      { tipo: "corrente",  x: 9420, y: 440, comp: 50 },
      { tipo: "pedra",     x: 9600, y: 550, s: 0.8 },
      { tipo: "corrente",  x: 7700, y: 600, comp: 80 },
    ],
  },
  
// fecha a fase
];       // fecha o F



// O que a fase atual está usando (preenchido por carregarFase)
let faseAtual;
let numeroFase = 0;
let FIM_DO_MUNDO, plataformas, espinhos, luz, objetos;

// Os triângulos embaixo das pontas de cada beirada (a hitbox deles é criada aqui)
function espinhosDosSuportes(f) {
  const lista = [];
  if (f.cenario !== "casa") return lista;
  for (const p of f.plataformas) {
    if (p.tipo !== "assoalho" || p.h !== 14) continue;   // só as beiradas
    lista.push({ x: p.x + 8,         y: p.y + 14, w: 20, h: 12, invertido: true, suporte: true });
    lista.push({ x: p.x + p.w - 28,  y: p.y + 14, w: 20, h: 12, invertido: true, suporte: true });
  }
  return lista;
}

function carregarFase(n) {
  numeroFase = n;
  faseAtual = FASES[n];
  FIM_DO_MUNDO = faseAtual.fim;
  plataformas = faseAtual.plataformas;
  espinhos = faseAtual.espinhos.concat(espinhosDosSuportes(faseAtual));
  luz = faseAtual.luz;
  objetos = faseAtual.objetos;
  paleta = PALETAS[faseAtual.paleta];
}