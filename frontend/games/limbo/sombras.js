// =====================================================
// MINA (fase 5: Sombras)
//   Continuação direta da fase 4: o boneco começa no fim do corredor da caverna, perto de
//   um desfiladeiro. A saliência de madeira cede, ele despenca até uma mina abandonada
//   bem mais funda e atravessa 7900 de comprimento (e uns 1400 de altura).
//
//   O que tem aqui:
//     - os DADOS da fase (FASES.push no meio do arquivo): chão, tetos, pontes, andaimes,
//       vagonete que anda sobre os trilhos, elevador, espinhos, pingentes de pedra e checkpoints
//     - a mecânica: movimento do vagonete/elevador, pingentes que caem, queda, checkpoints
//     - o desenho: fundo, desfiladeiro, bordas de pedra, objetos, ESCURIDÃO com luzes
//
//   Precisa do caverna.js (as tábuas das pontes usam o "falso: true" dele) e do rush.js (sons).
// =====================================================

// ---------- AJUSTES ----------
const MINA_SOM = true;             // false = sem som
const MINA_ESCURIDAO = 0.92;       // 1 = preto total (fora das luzes)
const MINA_RAIO_JOGADOR = 170;     // luz em volta do boneco
const MINA_TREMOR_QUEDA = 3.5;     // quanto a tela treme durante a queda

// alturas dos andares (as contas da fase usam estes valores)
const MN_Y0 = 300;     // chão do corredor da caverna
const MN_M = 1700;     // salão onde a queda termina
const MN_U = 1300;     // mezanino
const MN_T = 900;      // galeria de cima

// ---------- ESTADO ----------
let minaCp = 0;                 // último checkpoint alcançado
let minaVisto = false;          // o título "Sombras" já apareceu?
let minaTitulo = 0;
let minaLuzes = [];             // luzes do quadro (preenchidas durante o desenho)
let minaPart = [];              // poeira, cacos, fagulhas
let minaPing = [];              // pingentes de pedra (estado de cada um)
let minaRochas = [];            // blocos de pedra (para achar as bordas expostas)
let minaCanvas = null, minaC = null;
const minaQ = { iniciada: false, caindo: false, vMax: 0, impacto: 0, lant: null, tx: 0, ty: 0, cpBrilho: 0 };

// ---------- AUXILIARES ----------
function mnMix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return "rgb(" + c(16) + "," + c(8) + "," + c(0) + ")";
}

// o ponto está fora de qualquer bloco de pedra?
function mnLivre(x, y, ig) {
  for (const q of minaRochas) {
    if (q !== ig && x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h) return false;
  }
  return true;
}

// altura do primeiro chão que está embaixo de x (a partir de yMin)
function mnSolo(x, yMin) {
  let s = 1e9;
  for (const p of plataformas) {
    if (x > p.x && x < p.x + p.w && p.y >= yMin && p.y < s) s = p.y;
  }
  return s;
}

function mnPisca(t, s) {
  return 0.9 + Math.sin(t * 8.3 + s) * 0.06 + Math.sin(t * 21.7 + s * 1.7) * 0.04;
}

function mnPart(tipo, x, y, vx, vy, vida, r) {
  minaPart.push({ tipo, x, y, vx, vy, vida, vida0: vida, r, g: tipo === "caco" ? 0.5 : 0 });
}

function mnLuz(x, y, r, a, cor) {
  if (x + r < camera || x - r > camera + LARGURA || y + r < cameraY || y - r > cameraY + ALTURA) return;
  minaLuzes.push({ x, y, r, a, cor });
}

function mnCorrente(x0, y0, x1, y1) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.floor(len / 6));
  ctx.strokeStyle = "#241d17";
  ctx.lineWidth = 1.3;
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    ctx.beginPath();
    ctx.ellipse(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, k % 2 ? 1.1 : 2.4, 3.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------- CONSTRUTORES DA FASE ----------
function mnChao(x, y, w, h, extra) {
  return Object.assign({ x, y, w, h: h || 500, tipo: "chao", semGrama: true }, extra);
}
// teto: o bloco vai de "topo" (padrão -600) até "base" (a parte de baixo, que o jogador vê)
function mnTeto(x, base, w, topo, extra) {
  const t = topo === undefined ? -600 : topo;
  return Object.assign({ x, y: t, w, h: base - t, tipo: "teto", semGrama: true }, extra);
}
// ponte de tábuas podres: cada tábua desmorona alguns instantes depois de pisada
function mnTabuas(x, y, w, n) {
  const lista = [], seg = w / n;
  for (let i = 0; i < n; i++) {
    lista.push({ x: x + i * seg, y, w: seg, h: 28, tipo: "tabua", semGrama: true, falso: true, atraso: 14 + (i * 7) % 11 });
  }
  return lista;
}
function mnAndaime(x, y, w, pilar) {
  return { x, y, w, h: 24, tipo: "andaime", pilar, semGrama: true };
}
function mnPuas(x, chaoY, w) {
  return { x, y: chaoY - 20, w, h: 20 };
}

// ---------- A FASE ----------
PALETAS.push({ ceuCima: "#0c1218", ceuBaixo: "#26323c", arvore: "#05070a", luz: "#ffc27a" });

FASES.push((function () {
  const Y0 = MN_Y0, M = MN_M, U = MN_U, T = MN_T;

  return {
    nome: "Sombras",
    cenario: "mina",
    paleta: PALETAS.length - 1,
    fim: 7900,
    vertical: true,
    topo: 0,                    // a câmera nunca sobe acima disto
    base: 1430,                 // nem desce abaixo disto
    ancora: () => ancoraMina(), // onde o boneco aparece na tela (muda perto do desfiladeiro)
    camVel: 0.2,
    velMax: 15,                 // velocidade máxima de queda
    limiteQueda: 1900,          // abaixo disto o boneco morre
    monstro: false,

    // onde reaparecer. "ativa" = a partir de que x o ponto é salvo
    checkpoints: [
      { x: 70,   y: Y0, ativa: 0 },
      { x: 2010, y: M,  ativa: 1990 },
      { x: 2950, y: M,  ativa: 2940 },
      { x: 3700, y: M,  ativa: 3690 },
      { x: 5060, y: U,  ativa: 5050 },
      { x: 5860, y: U,  ativa: 5850 },
      { x: 6460, y: T,  ativa: 6455 },
      { x: 7160, y: T,  ativa: 7155 },
    ],

    plataformas: [
      // ===== A: corredor da caverna (y = 300) =====
      mnChao(0, Y0, 880, 1900),                           // chão + parede esquerda do desfiladeiro
      mnTeto(0, 140, 880),                                // teto do corredor
      mnTeto(480, 250, 160, 100, { semEst: true }),       // teto baixo: só passa agachado (Shift)
      { x: 880, y: Y0, w: 130, h: 28, tipo: "tabua", semGrama: true, falso: true, atraso: 24 },   // a saliência que cede

      // ===== desfiladeiro: parede da direita e teto do salão =====
      mnTeto(1700, 1320, 2540),

      // ===== B: salão onde a queda termina (y = 1700) =====
      mnChao(880, M, 1620, 500),
      { x: 1290, y: 1660, w: 96, h: 40, tipo: "vagonete", semGrama: true },    // vagonete tombado (degrau)
      mnChao(2060, 1664, 90, 36),                                                // monte de pedra
      ...mnTabuas(2500, M, 400, 5),                                              // ponte podre sobre o abismo 1

      // ===== C: trilhos =====
      mnChao(2900, M, 300, 500),
      mnTeto(3000, 1650, 200, 1200, { semEst: true }),    // túnel baixo (agachado)
      // vagonete que vai e volta sobre o abismo 2
      { x: 3200, y: M, w: 100, h: 30, tipo: "vagonete", semGrama: true, mov: { eixo: "x", de: 3200, ate: 3540, vel: 0.016, fase: 0 } },
      mnChao(3640, M, 1350, 500),

      // ===== D: andaimes subindo para o mezanino =====
      mnTeto(4240, 800, 2100),                            // o teto sobe: espaço para os andaimes
      mnAndaime(4300, 1620, 100, M),
      mnAndaime(4480, 1540, 90, M),
      mnAndaime(4650, 1460, 100, M),
      mnAndaime(4830, 1380, 90, M),

      // ===== E: mezanino (y = 1300) =====
      mnChao(4990, U, 300, 900),
      ...mnTabuas(5290, U, 510, 6),                       // ponte podre sobre o abismo 3
      mnChao(5800, U, 540, 900),
      mnTeto(5900, 1250, 200, 700, { semEst: true }),     // túnel baixo (agachado)

      // ===== F: elevador =====
      { x: 6340, y: U, w: 110, h: 24, tipo: "elevador", semGrama: true, mov: { eixo: "y", de: U, ate: T, vel: 0.012, fase: 0 } },

      // ===== G: galeria de cima (y = 900) =====
      mnTeto(6340, 500, 1560),
      mnChao(6450, T, 420, 1400),
      ...mnTabuas(6870, T, 280, 4),                       // ponte podre sobre o abismo 4
      mnChao(7150, T, 340, 1400),
      mnTeto(7200, 850, 140, 300, { semEst: true }),      // túnel baixo (agachado)
      mnChao(7610, T, 290, 1400),
      mnTeto(7900, 2200, 100),                            // parede do fim
    ],

    espinhos: [
      mnPuas(340, Y0, 40),
      mnPuas(700, Y0, 40),
      mnPuas(1960, M, 40),
      mnPuas(2260, M, 60),
      mnPuas(3780, M, 60),
      mnPuas(4410, M, 60),      // embaixo do vão entre os andaimes 1 e 2
      mnPuas(4590, M, 40),      // embaixo do vão entre os andaimes 2 e 3
      mnPuas(6190, U, 60),
      mnPuas(7390, T, 40),
    ],

    // pedras que se soltam do teto quando o boneco passa por perto.
    //   topo = onde prende, comp = tamanho, atraso = quadros tremendo antes de cair,
    //   radio = a que distância (na horizontal) ela dispara, alcance = até que profundidade abaixo dela
    //   Os de radio grande disparam cedo (ainda no chão firme) e caem bem na hora em que quem vem correndo chega:
    //   dá para ver a poeira e esperar. Os que caem em cima de uma ponte quebram uma tábua e abrem um buraco.
    pingentes: [
      { x: 790,  topo: 140,  comp: 70,  atraso: 26 },                                   // corredor: só corre
      { x: 4010, topo: 1320, comp: 90,  atraso: 19, radio: 150 },
      { x: 5520, topo: 800,  comp: 100, atraso: 14, radio: 250, alcance: 560 },         // dispara ainda no chão firme e quebra uma tábua da ponte
      { x: 6620, topo: 500,  comp: 90,  atraso: 12, radio: 110 },
      { x: 6770, topo: 500,  comp: 110, atraso: 13, radio: 110 },
      { x: 7020, topo: 500,  comp: 100, atraso: 12, radio: 200 },                       // idem: abre um buraco na ponte da galeria
    ],

    luz: { x: 7780, y: 810, w: 10, h: 90 },

    // lampiao: y = onde fica a lâmpada, topo = onde a corrente prende. cp = só acende no checkpoint
    // os outros: y = chão onde ficam. Nada disto tem colisão.
    objetos: [
      // ----- corredor -----
      { tipo: "trilho", x: 0, y: Y0, w: 880 },
      { tipo: "cristal", x: 235, y: Y0 },
      { tipo: "gotas", x: 270, y: 140, piso: Y0 },
      { tipo: "poca", x: 270, y: Y0, w: 70 },
      { tipo: "esqueleto", x: 430, y: Y0 },
      { tipo: "cristal", x: 585, y: Y0, r: 110 },
      { tipo: "sinal", x: 690, y: Y0 },
      { tipo: "escora", x: 840, y: Y0, alt: 160, w: 60 },

      // ----- salão da queda -----
      { tipo: "trilho", x: 1000, y: M, w: 1500 },
      { tipo: "nevoa", x: 1000, y: M - 10, w: 700 },
      { tipo: "gotas", x: 1520, y: 1320, piso: M },
      { tipo: "poca", x: 1520, y: M, w: 80 },
      { tipo: "esqueleto", x: 1600, y: M, dir: -1 },
      { tipo: "lampiao", x: 1860, y: 1480, topo: 1320, r: 220 },
      { tipo: "lampiao", x: 2030, y: 1490, topo: 1320, r: 200, cp: 1 },
      { tipo: "picareta", x: 2170, y: M },
      { tipo: "barrilFogo", x: 2210, y: M },
      { tipo: "escora", x: 2400, y: M, alt: 380, w: 100 },
      { tipo: "sinal", x: 2480, y: M },
      { tipo: "corda", x: 2500, y: M, w: 400 },

      // ----- trilhos -----
      { tipo: "nevoa", x: 2900, y: M - 10, w: 300 },
      { tipo: "lampiao", x: 2960, y: 1490, topo: 1320, r: 220, cp: 2 },
      { tipo: "esqueleto", x: 3120, y: M },
      { tipo: "trilho", x: 3190, y: 1738, w: 460, suspenso: true },
      { tipo: "trilho", x: 3640, y: M, w: 600 },
      { tipo: "nevoa", x: 3640, y: M - 10, w: 500 },
      { tipo: "lampiao", x: 3730, y: 1490, topo: 1320, r: 220, cp: 3 },
      { tipo: "barrilFogo", x: 3920, y: M },
      { tipo: "cristal", x: 4110, y: M },
      { tipo: "escora", x: 4200, y: M, alt: 380, w: 60 },

      // ----- andaimes -----
      { tipo: "trilho", x: 4240, y: M, w: 750 },
      { tipo: "cristal", x: 4400, y: M, r: 120 },
      { tipo: "lampiao", x: 4530, y: 1330, topo: 800, r: 230 },
      { tipo: "esqueleto", x: 4700, y: 1460 },
      { tipo: "lampiao", x: 4960, y: 1210, topo: 800, r: 210 },

      // ----- mezanino -----
      { tipo: "nevoa", x: 5000, y: U - 10, w: 300 },
      { tipo: "lampiao", x: 5070, y: 1120, topo: 800, r: 220, cp: 4 },
      { tipo: "corda", x: 5290, y: U, w: 510 },
      { tipo: "lampiao", x: 5620, y: 1060, topo: 800, r: 230 },
      { tipo: "lampiao", x: 5880, y: 1120, topo: 800, r: 220, cp: 5 },
      { tipo: "esqueleto", x: 6000, y: U },
      { tipo: "barrilFogo", x: 6275, y: U },
      { tipo: "sinal", x: 6322, y: U },

      // ----- galeria de cima -----
      { tipo: "nevoa", x: 6450, y: T - 10, w: 400 },
      { tipo: "lampiao", x: 6520, y: 710, topo: 500, r: 240, cp: 6 },
      { tipo: "escora", x: 6620, y: T, alt: 400, w: 100 },
      { tipo: "cristal", x: 6820, y: T },
      { tipo: "corda", x: 6870, y: T, w: 280 },
      { tipo: "lampiao", x: 7010, y: 720, topo: 500, r: 230 },
      { tipo: "lampiao", x: 7170, y: 710, topo: 500, r: 210, cp: 7 },
      { tipo: "esqueleto", x: 7265, y: T, dir: -1 },
      { tipo: "sinal", x: 7470, y: T },
      { tipo: "barrilFogo", x: 7660, y: T },
      { tipo: "lampiao", x: 7740, y: 700, topo: 500, r: 300 },
      { tipo: "cristal", x: 7850, y: T },
    ],
  };
})());

// =====================================================
// LÓGICA
// =====================================================

// onde o boneco aparece na tela (olha para baixo perto do desfiladeiro e durante a queda)
function ancoraMina() {
  if (minaQ.caindo) return 175;
  if (jogador.y < 400 && jogador.x > 560) {
    const u = Math.max(0, Math.min(1, (jogador.x - 560) / 320));
    return 270 - 170 * u;
  }
  return 270;
}

// reiniciar() usa isto para saber onde colocar o boneco
function inicioMina() {
  if (!faseAtual || faseAtual.cenario !== "mina") return null;
  const c = faseAtual.checkpoints[minaCp] || faseAtual.checkpoints[0];
  return { x: c.x, y: c.y };
}

function mnPosMover(p, reset) {
  const m = p.mov;
  if (m.fase0 === undefined) m.fase0 = m.fase || 0;
  if (reset) m.fase = m.fase0;
  const f = 0.5 - 0.5 * Math.cos(m.fase);
  if (m.eixo === "x") p.x = m.de + (m.ate - m.de) * f;
  else p.y = m.de + (m.ate - m.de) * f;
}

// chamada por reiniciar(): devolve tudo ao lugar e coloca a câmera onde o boneco está
function reiniciarMina() {
  if (!faseAtual || faseAtual.cenario !== "mina") return;
  plataformas = faseAtual.plataformas.slice();            // devolve as tábuas que caíram
  for (const p of faseAtual.plataformas) {
    delete p.cai;
    if (p.mov) mnPosMover(p, true);
  }
  if (typeof entulho !== "undefined") entulho = [];
  minaRochas = faseAtual.plataformas.filter((p) => p.tipo === "chao" || p.tipo === "teto");
  minaPing = faseAtual.pingentes.map((p) => Object.assign({}, p, { y: p.topo, estado: 0, t: 0, vy: 0 }));
  minaPart = [];
  minaLuzes = [];
  Object.assign(minaQ, { iniciada: false, caindo: false, vMax: 0, impacto: 0, lant: null, tx: 0, ty: 0, cpBrilho: 0 });

  camera = Math.max(0, Math.min(jogador.x - LARGURA / 3, FIM_DO_MUNDO - LARGURA));
  cameraY = Math.max(faseAtual.topo, Math.min(faseAtual.base, jogador.y + jogador.h / 2 - ancoraMina()));

  if (!minaVisto) { minaTitulo = 210; minaVisto = true; }
}

// vagonete e elevador: andam em vai-e-vem e levam quem está em cima
function atualizarMoveisMina(dt) {
  if (!faseAtual || faseAtual.cenario !== "mina") return;
  for (const p of plataformas) {
    if (!p.mov) continue;
    const ox = p.x, oy = p.y;
    const pes = jogador.y + jogador.h;
    const em = jogador.noChao && Math.abs(pes - oy) < 4 && jogador.x + jogador.w > ox && jogador.x < ox + p.w;
    p.mov.fase += p.mov.vel * dt;
    mnPosMover(p, false);
    if (em) { jogador.x += p.x - ox; jogador.y += p.y - oy; }
  }
}

function iniciarQuedaMina() {
  const q = minaQ;
  q.iniciada = true;
  const lx = Math.max(940, Math.min(1650, jogador.x + (jogador.olhaEsquerda ? -60 : 60)));
  q.lant = { x: lx, y: jogador.y - 30, vy: 0, quebrou: false, t: 0 };   // o lampião da saliência cai junto
  somMina("queda");
}

function impactoMina() {
  const q = minaQ;
  q.impacto = 45;
  const fx = jogador.x + jogador.w / 2, fy = jogador.y + jogador.h;
  for (let i = 0; i < 34; i++) {
    mnPart("poeira", fx + (Math.random() - 0.5) * 30, fy - 2, (Math.random() - 0.5) * 5, -Math.random() * 1.6, 55 + Math.random() * 40, 5 + Math.random() * 9);
  }
  for (let i = 0; i < 10; i++) {
    mnPart("caco", fx + (Math.random() - 0.5) * 20, fy - 4, (Math.random() - 0.5) * 6, -2 - Math.random() * 4, 60, 3 + Math.random() * 3);
  }
  somMina("impacto");
}

function mnQuebrarPedra(x, y) {
  for (let i = 0; i < 12; i++) mnPart("caco", x + (Math.random() - 0.5) * 12, y - 4, (Math.random() - 0.5) * 6, -1 - Math.random() * 3.5, 70, 3 + Math.random() * 4);
  for (let i = 0; i < 9; i++) mnPart("poeira", x + (Math.random() - 0.5) * 20, y - 2, (Math.random() - 0.5) * 2.4, -Math.random() * 1.2, 40 + Math.random() * 25, 4 + Math.random() * 6);
  somMina("pedra");
}

// chamada no fim de atualizar(): checkpoints, queda, pingentes e partículas
function atualizarMina(dt) {
  if (!faseAtual || faseAtual.cenario !== "mina") return;
  const q = minaQ;
  const cx = jogador.x + jogador.w / 2;
  const pes = jogador.y + jogador.h;

  // --- checkpoints ---
  const cps = faseAtual.checkpoints;
  for (let i = minaCp + 1; i < cps.length; i++) {
    if (jogador.noChao && jogador.x >= cps[i].ativa && Math.abs(pes - cps[i].y) < 4) {
      minaCp = i;
      q.cpBrilho = 60;
    } else break;
  }
  if (q.cpBrilho > 0) q.cpBrilho -= dt;

  // --- a queda no desfiladeiro ---
  const noVazio = !jogador.noChao && jogador.vy > 4 && jogador.y > 330 && jogador.x > 850 && jogador.x < 1725 && jogador.y < MN_M;
  if (noVazio && !q.caindo) {
    q.caindo = true;
    q.vMax = 0;
    if (!q.iniciada) iniciarQuedaMina();
  }
  if (q.caindo) q.vMax = Math.max(q.vMax, jogador.vy);
  if (q.caindo && jogador.noChao) {
    q.caindo = false;
    if (q.vMax > 9) impactoMina();
  }

  // o lampião que cai junto, quebra no fundo e vira brasa
  const L = q.lant;
  if (L) {
    if (!L.quebrou) {
      L.vy = Math.min(L.vy + 0.5 * dt, 22);
      L.y += L.vy * dt;
      if (L.y >= MN_M - 10) {
        L.quebrou = true;
        L.y = MN_M - 8;
        for (let i = 0; i < 14; i++) mnPart("fagulha", L.x, L.y - 4, (Math.random() - 0.5) * 6, -1 - Math.random() * 4, 50 + Math.random() * 40, 2);
        somMina("vidro");
      }
    } else {
      L.t += dt;
      if (Math.random() < 0.25 * dt) mnPart("fagulha", L.x + (Math.random() - 0.5) * 6, L.y - 6, (Math.random() - 0.5) * 0.8, -0.8 - Math.random(), 40, 2);
      if (L.t > 230) q.lant = null;
    }
  }

  // --- tremor da tela ---
  let amp = 0;
  if (q.caindo) amp += MINA_TREMOR_QUEDA * Math.min(1, q.vMax / 15);
  if (q.impacto > 0) { q.impacto -= dt; amp += 16 * Math.max(0, q.impacto / 45); }
  q.tx = (Math.random() - 0.5) * 2 * amp;
  q.ty = (Math.random() - 0.5) * 2 * amp;

  // --- pingentes ---
  for (const p of minaPing) {
    if (p.estado === 0) {
      if (Math.abs(cx - p.x) < (p.radio || 64) && pes > p.topo + 10 && pes < p.topo + (p.alcance || 460) && jogador.y > p.topo) {
        p.estado = 1;
        p.t = p.atraso || 26;
        somMina("treme");
      }
    } else if (p.estado === 1) {
      p.t -= dt;
      if (Math.random() < 0.4 * dt) mnPart("poeira", p.x + (Math.random() - 0.5) * 14, p.topo + 4, (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.6, 28, 3 + Math.random() * 3);
      if (p.t <= 0) { p.estado = 2; p.vy = 0; }
    } else if (p.estado === 2) {
      p.vy = Math.min(p.vy + 0.9 * dt, 24);
      p.y += p.vy * dt;
      const ponta = p.y + p.comp;
      const caixa = { x: p.x - 6, y: p.y + p.comp * 0.15, w: 12, h: p.comp * 0.85 };
      if (estado === "jogando" && colide(caixa, jogador)) morrer();
      const solo = mnSolo(p.x, ponta - 6);
      if (ponta >= solo) {
        p.estado = 3;
        mnQuebrarPedra(p.x, solo);
        // se caiu em cima de uma tábua de ponte, a tábua vai junto: abre um buraco na ponte
        const tab = plataformas.find((q) => q.tipo === "tabua" && p.x > q.x && p.x < q.x + q.w && Math.abs(q.y - solo) < 1);
        if (tab) {
          if (typeof desmoronar === "function") desmoronar(tab);
          plataformas.splice(plataformas.indexOf(tab), 1);
        }
      }
      else if (p.y > 3000) p.estado = 3;
    }
  }

  // --- partículas ---
  for (let i = minaPart.length - 1; i >= 0; i--) {
    const k = minaPart[i];
    k.vida -= dt;
    if (k.vida <= 0) { minaPart.splice(i, 1); continue; }
    k.vy += k.g * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    if (k.tipo === "poeira") { k.vx *= 0.97; k.vy *= 0.97; }
  }
  if (minaPart.length > 260) minaPart.splice(0, minaPart.length - 260);

  if (minaTitulo > 0) minaTitulo -= dt;
}

function tremorMina() {
  if (!faseAtual || faseAtual.cenario !== "mina" || estado !== "jogando") return { x: 0, y: 0 };
  return { x: minaQ.tx, y: minaQ.ty };
}

// =====================================================
// DESENHO: FUNDO
// =====================================================

// o fundo da tela (não anda junto com o mundo): névoa, colunas de pedra, estruturas de madeira
function desenharFundoMina() {
  minaLuzes.length = 0;                              // as luzes são refeitas a cada quadro
  const t = performance.now() / 1000;
  const prof = Math.max(0, Math.min(1, (cameraY - 60) / 1300));   // 0 = corredor, 1 = fundo da mina

  const g = ctx.createLinearGradient(0, 0, 0, ALTURA);
  g.addColorStop(0, mnMix("#121a21", "#07090c", prof));
  g.addColorStop(1, mnMix("#2a3640", "#141d25", prof));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // estalactites, estalagmites e colunas ao longe
  const oy = -cameraY * 0.1;
  ctx.fillStyle = "rgba(4,6,9,0.9)";
  for (let i = 0; i < 90; i++) {
    const sx = i * 120 + (pseudo(i) - 0.5) * 70 - camera * 0.1;
    if (sx < -120 || sx > LARGURA + 40) continue;
    const w = 24 + pseudo(i + 3) * 64;
    const alt = 90 + pseudo(i + 5) * 230;
    const tipo = i % 3;
    ctx.beginPath();
    if (tipo === 0) {                                // pende do teto
      ctx.moveTo(sx, oy - 10); ctx.lineTo(sx + w, oy - 10); ctx.lineTo(sx + w * 0.5 + (pseudo(i + 7) - 0.5) * 20, oy + alt);
    } else if (tipo === 1) {                         // sobe do chão
      ctx.moveTo(sx, ALTURA + 10); ctx.lineTo(sx + w, ALTURA + 10); ctx.lineTo(sx + w * 0.5 + (pseudo(i + 7) - 0.5) * 20, ALTURA - alt * 0.8 + oy * 0.5);
    } else {                                         // coluna de lado a lado
      ctx.moveTo(sx, ALTURA + 10); ctx.lineTo(sx + (pseudo(i + 6) - 0.5) * 8, -10);
      ctx.lineTo(sx + w * 0.55 + (pseudo(i + 7) - 0.5) * 8, -10); ctx.lineTo(sx + w * 0.55, ALTURA + 10);
    }
    ctx.closePath();
    ctx.fill();
  }

  // pórticos de madeira (só aparecem na parte funda: a mina de verdade)
  const pm = Math.max(0, Math.min(1, (cameraY - 500) / 700));
  if (pm > 0.02) {
    ctx.strokeStyle = "rgba(4,6,9," + (0.7 * pm) + ")";
    ctx.lineCap = "butt";
    for (let k = 0; k < 40; k++) {
      const sx = k * 250 + 60 - camera * 0.3;
      if (sx < -200 || sx > LARGURA + 40) continue;
      const topo = 70 - cameraY * 0.15 % 40;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(sx, ALTURA + 10); ctx.lineTo(sx, topo);
      ctx.moveTo(sx + 160, ALTURA + 10); ctx.lineTo(sx + 160, topo);
      ctx.moveTo(sx - 18, topo); ctx.lineTo(sx + 178, topo);
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx, topo + 70); ctx.lineTo(sx + 50, topo);
      ctx.moveTo(sx + 160, topo + 70); ctx.lineTo(sx + 110, topo);
      ctx.stroke();
    }
  }

  // névoa passando devagar
  for (let i = 0; i < 4; i++) {
    const mx = ((t * (8 + i * 3) + i * 260) % (LARGURA + 500)) - 250;
    const my = 200 + i * 55 + Math.sin(t * 0.3 + i) * 14;
    const gg = ctx.createRadialGradient(mx, my, 10, mx, my, 220);
    gg.addColorStop(0, "rgba(130,160,180,0.10)");
    gg.addColorStop(1, "rgba(130,160,180,0)");
    ctx.fillStyle = gg;
    ctx.fillRect(mx - 220, my - 220, 440, 440);
  }
}

// o desfiladeiro (desenhado no mundo, antes das plataformas)
function desenharAbismoMina() {
  const x0 = 880, x1 = 1700;
  if (x1 < camera - 40 || x0 > camera + LARGURA + 40) return;
  const t = performance.now() / 1000;
  const topo = Math.max(-600, cameraY - 20), fundo = Math.min(MN_M, cameraY + ALTURA + 20);
  if (fundo <= topo) return;

  ctx.save();
  const g = ctx.createLinearGradient(0, -600, 0, MN_M);
  g.addColorStop(0, "#05070a");
  g.addColorStop(0.4, "#090c10");
  g.addColorStop(1, "#1d2831");
  ctx.fillStyle = g;
  ctx.fillRect(x0, topo, x1 - x0, fundo - topo);

  // colunas de rocha lá no fundo do desfiladeiro
  ctx.fillStyle = "rgba(3,5,7,0.8)";
  for (let i = 0; i < 9; i++) {
    const px = x0 + 30 + i * 88 + (pseudo(i + 30) - 0.5) * 40;
    const pw = 24 + pseudo(i + 31) * 50;
    ctx.beginPath();
    ctx.moveTo(px, topo); ctx.lineTo(px + pw, topo);
    ctx.lineTo(px + pw * 0.6, fundo); ctx.lineTo(px + pw * 0.3, fundo);
    ctx.closePath();
    ctx.fill();
  }

  // ponte de corda lá embaixo, quase invisível (só dá para ver quando o lampião passa)
  ctx.strokeStyle = "rgba(3,5,7,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1000, 1440);
  ctx.quadraticCurveTo(1320, 1500, 1640, 1448);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  for (let k = 0; k <= 8; k++) {
    const px = 1000 + k * 80;
    ctx.beginPath();
    ctx.moveTo(px, 1440 + Math.sin(k / 8 * Math.PI) * 40);
    ctx.lineTo(px, 1470 + Math.sin(k / 8 * Math.PI) * 40);
    ctx.stroke();
  }

  // lamparinas distantes lá no fundo: o que a mina esconde
  for (const [lx, ly] of [[1010, 1560], [1250, 1620], [1470, 1530], [1620, 1600]]) {
    const f = mnPisca(t, lx);
    ctx.fillStyle = "rgba(255,190,110," + (0.85 * f) + ")";
    ctx.beginPath();
    ctx.arc(lx, ly, 2.3, 0, Math.PI * 2);
    ctx.fill();
    mnLuz(lx, ly, 85 * f, 0.55, "255,170,90");
  }
  ctx.restore();
}

// =====================================================
// DESENHO: MUNDO
// =====================================================

// borda irregular horizontal (dir -1 = topo do bloco, 1 = parte de baixo)
function mnBordaH(p, xa, xb, y, dir) {
  const passo = 8;
  let run = [];
  const fecha = () => {
    if (run.length > 1) {
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.moveTo(run[0].x, y);
      for (const q of run) ctx.lineTo(q.x, q.y);
      ctx.lineTo(run[run.length - 1].x, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = dir < 0 ? "rgba(120,150,170,0.38)" : "rgba(120,150,170,0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(run[0].x, run[0].y);
      for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
      ctx.stroke();
    }
    run = [];
  };
  for (let x = Math.floor(xa / passo) * passo; x <= xb + passo; x += passo) {
    const xx = Math.min(Math.max(x, p.x), p.x + p.w);
    if (mnLivre(xx, y + dir * 3, p)) {
      const off = 1 + ruido(xx * 0.31) * 3.4 + (dir < 0 && ruido(xx * 0.9) > 0.9 ? 5 : 0);
      run.push({ x: xx, y: y + dir * off });
    } else fecha();
  }
  fecha();
}

// borda irregular vertical (dir -1 = lado esquerdo do bloco, 1 = direito)
function mnBordaV(p, ya, yb, x, dir) {
  const passo = 10;
  let run = [];
  const fecha = () => {
    if (run.length > 1) {
      ctx.fillStyle = "#050505";
      ctx.beginPath();
      ctx.moveTo(x, run[0].y);
      for (const q of run) ctx.lineTo(q.x, q.y);
      ctx.lineTo(x, run[run.length - 1].y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(120,150,170,0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(run[0].x, run[0].y);
      for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
      ctx.stroke();
    }
    run = [];
  };
  for (let y = Math.floor(ya / passo) * passo; y <= yb + passo; y += passo) {
    const yy = Math.min(Math.max(y, p.y), p.y + p.h);
    if (mnLivre(x + dir * 3, yy, p)) run.push({ x: x + dir * (1 + ruido(yy * 0.23 + x) * 4), y: yy });
    else fecha();
  }
  fecha();
}

function mnEstalactites(p, xa, xb, y) {
  if (p.semEst) return;
  ctx.fillStyle = "#050505";
  for (let x = Math.ceil(xa / 36) * 36; x < xb; x += 36) {
    const j = ruido(x * 0.17);
    if (j < 0.4 || x < p.x + 8 || x > p.x + p.w - 8 || !mnLivre(x, y + 4, p)) continue;
    const len = 9 + j * 30;
    const dx = (j - 0.7) * 5;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 1);
    ctx.lineTo(x + dx, y + len);
    ctx.lineTo(x + 6, y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(120,150,170,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + dx, y + len);
    ctx.stroke();
  }
}

function mnBordas(p) {
  const xa = Math.max(p.x, camera - 30), xb = Math.min(p.x + p.w, camera + LARGURA + 30);
  const ya = Math.max(p.y, cameraY - 30), yb = Math.min(p.y + p.h, cameraY + ALTURA + 30);
  if (xb <= xa || yb <= ya) return;
  if (p.y >= cameraY - 30) mnBordaH(p, xa, xb, p.y, -1);
  if (p.y + p.h <= cameraY + ALTURA + 30) {
    mnBordaH(p, xa, xb, p.y + p.h, 1);
    mnEstalactites(p, xa, xb, p.y + p.h);
  }
  if (p.x >= camera - 30) mnBordaV(p, ya, yb, p.x, -1);
  if (p.x + p.w <= camera + LARGURA + 30) mnBordaV(p, ya, yb, p.x + p.w, 1);
}

// tábua de ponte: madeira podre, pregos e pontas lascadas. Treme quando vai cair.
function mnDesTabua(p) {
  const tremendo = p.cai !== undefined;
  ctx.save();
  if (tremendo) ctx.translate((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.6);
  ctx.fillStyle = "#17120d";
  ctx.fillRect(p.x + 1, p.y, p.w - 2, p.h);
  ctx.fillStyle = "#050505";
  ctx.fillRect(p.x, p.y + p.h * 0.5 - 1, p.w, 2);

  ctx.strokeStyle = "rgba(90,70,50,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const yy = p.y + 4 + i * 6, x0 = p.x + 4 + ruido(p.x + i) * 14;
    ctx.moveTo(x0, yy);
    ctx.lineTo(x0 + 14 + ruido(p.x + i * 3) * 24, yy + (i % 2 ? 1 : -1));
  }
  ctx.stroke();

  ctx.fillStyle = "#3a332c";
  for (const nx of [p.x + 6, p.x + p.w - 6]) {
    ctx.beginPath();
    ctx.arc(nx, p.y + 5, 1.1, 0, Math.PI * 2);
    ctx.arc(nx, p.y + p.h - 5, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#050505";                        // pontas lascadas
  ctx.beginPath();
  ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 7); ctx.lineTo(p.x, p.y + 12); ctx.lineTo(p.x - 2, p.y + 20); ctx.lineTo(p.x, p.y + p.h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w + 3, p.y + 9); ctx.lineTo(p.x + p.w, p.y + 14); ctx.lineTo(p.x + p.w + 2, p.y + 22); ctx.lineTo(p.x + p.w, p.y + p.h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(190,150,100,0.42)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 0.6);
  ctx.lineTo(p.x + p.w, p.y + 0.6);
  ctx.stroke();

  if (tremendo) {                                   // rachando
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w * 0.35, p.y); ctx.lineTo(p.x + p.w * 0.3, p.y + 12); ctx.lineTo(p.x + p.w * 0.42, p.y + p.h);
    ctx.moveTo(p.x + p.w * 0.7, p.y); ctx.lineTo(p.x + p.w * 0.76, p.y + 10); ctx.lineTo(p.x + p.w * 0.68, p.y + p.h);
    ctx.stroke();
  }
  ctx.restore();
}

// andaime de madeira: piso de tábuas sobre postes e travessas em X
function mnDesAndaime(p) {
  const x = p.x, y = p.y, w = p.w, fundo = p.pilar || y + 120;
  ctx.fillStyle = "#100c08";
  for (const px of [x + 10, x + w - 18]) ctx.fillRect(px, y + p.h, 8, fundo - y - p.h);
  ctx.strokeStyle = "#140f0a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let yy = y + p.h; yy + 70 < fundo; yy += 70) {
    ctx.moveTo(x + 14, yy); ctx.lineTo(x + w - 14, yy + 70);
    ctx.moveTo(x + w - 14, yy); ctx.lineTo(x + 14, yy + 70);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(190,150,100,0.18)";      // luz no poste
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const px of [x + 10, x + w - 18]) { ctx.moveTo(px + 0.5, y + p.h); ctx.lineTo(px + 0.5, fundo); }
  ctx.stroke();

  ctx.fillStyle = "#17120d";
  ctx.fillRect(x, y, w, p.h);
  ctx.fillStyle = "#050505";
  ctx.fillRect(x, y + 10, w, 2);
  ctx.fillStyle = "#3a332c";
  for (let nx = x + 8; nx < x + w - 4; nx += 22) {
    ctx.beginPath();
    ctx.arc(nx, y + 5, 1, 0, Math.PI * 2);
    ctx.arc(nx, y + p.h - 5, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(190,150,100,0.42)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// vagonete (o parado é uma carcaça; o que anda ainda tem uma lanterna na frente)
function mnDesCarrinho(p) {
  const x = p.x, y = p.y, w = p.w, h = p.h;
  const corpoH = Math.min(h - 4, 26);
  ctx.save();
  ctx.fillStyle = "#0e0b09";
  ctx.beginPath();
  ctx.moveTo(x - 2, y); ctx.lineTo(x + w + 2, y); ctx.lineTo(x + w - 7, y + corpoH); ctx.lineTo(x + 7, y + corpoH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1b1612";
  ctx.fillRect(x - 3, y - 2, w + 6, 4);

  ctx.strokeStyle = "#241d17";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const f of [0.3, 0.7]) { ctx.moveTo(x + w * f, y + 3); ctx.lineTo(x + w * f - (f - 0.5) * 6, y + corpoH); }
  ctx.stroke();
  ctx.fillStyle = "rgba(120,60,30,0.28)";
  ctx.fillRect(x + 12, y + 7, 14, 10);
  ctx.fillRect(x + w - 30, y + 11, 10, 8);
  ctx.fillStyle = "#3a332c";
  for (let nx = x + 8; nx < x + w - 4; nx += 16) {
    ctx.beginPath();
    ctx.arc(nx, y + 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const ang = p.x * 0.12;                              // as rodas giram com o movimento
  for (const wx of [x + 22, x + w - 22]) {
    const wy = y + corpoH + 4;
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(wx, wy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2b2824";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(wx, wy, 7, 0, Math.PI * 2);
    for (let k = 0; k < 3; k++) {
      const a = ang + k * Math.PI / 3;
      ctx.moveTo(wx - Math.cos(a) * 6, wy - Math.sin(a) * 6);
      ctx.lineTo(wx + Math.cos(a) * 6, wy + Math.sin(a) * 6);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(190,150,100,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 1.4);
  ctx.lineTo(x + w + 3, y - 1.4);
  ctx.stroke();

  if (p.mov) {                                         // lanterna presa na ponta
    const t = performance.now() / 1000;
    const f = mnPisca(t, p.mov.de);
    ctx.strokeStyle = "#241d17";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w + 3, y - 1); ctx.lineTo(x + w + 10, y - 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,220,150," + (0.5 + 0.5 * f) + ")";
    ctx.beginPath();
    ctx.ellipse(x + w + 10, y - 17, 3, 4.4 * f, 0, 0, Math.PI * 2);
    ctx.fill();
    mnLuz(x + w / 2, y - 24, 165, 0.95 * f, "255,176,96");
  }
  ctx.restore();
}

// elevador de carga: piso, cabos e uma lanterna
function mnDesElevador(p) {
  const x = p.x, y = p.y, w = p.w;
  const t = performance.now() / 1000;
  ctx.strokeStyle = "#0b0a09";
  ctx.lineWidth = 2;
  for (const cx of [x + 10, x + w - 10]) {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, 500);
    ctx.stroke();
  }
  ctx.fillStyle = "#17120d";
  ctx.fillRect(x, y, w, p.h);
  ctx.fillStyle = "#050505";
  ctx.fillRect(x, y + 9, w, 2);
  ctx.fillStyle = "rgba(160,130,60,0.25)";              // faixas de aviso gastas
  for (let fx = x + 6; fx < x + w - 10; fx += 18) {
    ctx.beginPath();
    ctx.moveTo(fx, y + 2); ctx.lineTo(fx + 8, y + 2); ctx.lineTo(fx + 4, y + 8); ctx.lineTo(fx - 4, y + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#0c0a08";                            // grade dos lados
  ctx.fillRect(x + 2, y - 44, 6, 44);
  ctx.fillRect(x + w - 8, y - 44, 6, 44);
  ctx.fillRect(x, y - 46, w, 5);
  const f = mnPisca(t, 9);
  ctx.fillStyle = "rgba(255,220,150," + (0.5 + 0.5 * f) + ")";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y - 38, 3.2, 4.6 * f, 0, 0, Math.PI * 2);
  ctx.fill();
  mnLuz(x + w / 2, y - 32, 190, 1, "255,176,96");
  ctx.strokeStyle = "rgba(190,150,100,0.4)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// ---------- espinhos da mina (chamado por jogo.js no lugar dos triângulos comuns) ----------
function desenharPuasMina(e) {
  for (let x = e.x; x < e.x + e.w; x += 20) {
    const j = ruido(x * 0.13);
    const ponta = e.y - 4 - j * 6;
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.moveTo(x, e.y + e.h);
    ctx.lineTo(x + 7 + j * 3, ponta);
    ctx.lineTo(x + 20, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(150,80,40,0.45)";            // ferrugem
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, e.y + e.h - 2);
    ctx.lineTo(x + 7 + j * 3, ponta + 2);
    ctx.stroke();
  }
}

// ---------- objetos ----------
function desenharObjetosMina(t) {
  for (const o of objetos) {
    const alcance = (o.r || 200) + (o.w || 0) + (o.comp || 0);
    if (o.x + alcance < camera - 60 || o.x - alcance > camera + LARGURA + 60) continue;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (o.tipo) {
      case "lampiao": {
        const ativo = o.cp === undefined || minaCp >= o.cp;
        const lx = o.x + Math.sin(t * 0.9 + o.x) * 2.4, ly = o.y;
        const f = ativo ? mnPisca(t, o.x) : 0.3 + 0.12 * Math.sin(t * 2.2 + o.x);
        mnCorrente(o.x, o.topo, lx, ly - 8);
        ctx.fillStyle = "#0b0907";
        ctx.fillRect(lx - 7, ly - 9, 14, 4);
        ctx.fillRect(lx - 6, ly + 6, 12, 3);
        ctx.strokeStyle = "#241d17";
        ctx.lineWidth = 1.3;
        ctx.strokeRect(lx - 5.5, ly - 5, 11, 11);
        ctx.fillStyle = "rgba(255,220,150," + (0.35 + 0.6 * f) + ")";
        ctx.beginPath();
        ctx.ellipse(lx, ly + 1, 3.2, 4.6 * f + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        const pulso = (o.cp !== undefined && o.cp === minaCp) ? 1 + Math.max(0, minaQ.cpBrilho) / 60 * 0.7 : 1;
        mnLuz(lx, ly, (o.r || 210) * (ativo ? 1 : 0.35) * pulso * (0.92 + 0.08 * f), ativo ? 1 : 0.65, "255,176,96");
        break;
      }

      case "barrilFogo": {
        const f = mnPisca(t, o.x) * (0.9 + 0.1 * Math.sin(t * 13 + o.x));
        ctx.translate(o.x, o.y);
        ctx.fillStyle = "#0b0907";
        ctx.beginPath();
        ctx.moveTo(-13, 0); ctx.lineTo(13, 0); ctx.lineTo(11, -34); ctx.lineTo(-11, -34);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#241d17";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12.5, -10); ctx.lineTo(12.5, -10);
        ctx.moveTo(-11.5, -24); ctx.lineTo(11.5, -24);
        ctx.stroke();
        for (let k = 0; k < 5; k++) {                   // as chamas
          const bx = (k - 2) * 4.2;
          const h = 10 + 9 * Math.abs(Math.sin(t * 9 + k * 1.7)) * f;
          ctx.fillStyle = "rgba(255,140,50,0.9)";
          ctx.beginPath();
          ctx.moveTo(bx - 3.4, -33);
          ctx.quadraticCurveTo(bx - 4 + Math.sin(t * 7 + k) * 2, -33 - h * 0.6, bx + Math.sin(t * 11 + k) * 2, -33 - h);
          ctx.quadraticCurveTo(bx + 4, -33 - h * 0.5, bx + 3.4, -33);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(255,225,150,0.9)";
          ctx.beginPath();
          ctx.moveTo(bx - 1.6, -33);
          ctx.quadraticCurveTo(bx, -33 - h * 0.7, bx + 1.6, -33);
          ctx.closePath();
          ctx.fill();
        }
        if (Math.random() < 0.12) mnPart("fagulha", o.x + (Math.random() - 0.5) * 8, o.y - 38, (Math.random() - 0.5) * 0.8, -0.7 - Math.random() * 0.8, 50, 2);
        mnLuz(o.x, o.y - 40, 205 * f, 1, "255,140,60");
        break;
      }

      case "cristal": {
        const pul = 0.9 + 0.1 * Math.sin(t * 1.7 + o.x);
        ctx.translate(o.x, o.y);
        for (const [bx, h, w, dx] of [[-8, 22, 5, -3], [0, 34, 6, 2], [9, 18, 5, 4], [-15, 12, 4, -4]]) {
          ctx.fillStyle = "rgba(90,190,180,0.85)";
          ctx.beginPath();
          ctx.moveTo(bx - w, 0); ctx.lineTo(bx + dx, -h); ctx.lineTo(bx + w, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "rgba(190,255,245,0.7)";
          ctx.beginPath();
          ctx.moveTo(bx - w * 0.1, -2); ctx.lineTo(bx + dx, -h); ctx.lineTo(bx + w * 0.5, -2);
          ctx.closePath();
          ctx.fill();
        }
        mnLuz(o.x, o.y - 18, (o.r || 135) * pul, 0.9, "110,220,205");
        break;
      }

      case "trilho": {
        const x0 = Math.max(o.x, camera - 20), x1 = Math.min(o.x + o.w, camera + LARGURA + 20);
        if (x1 > x0) {
          if (o.suspenso) {                              // cavaletes sob os trilhos
            ctx.strokeStyle = "#0c0a08";
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let cx = Math.ceil(x0 / 115) * 115; cx < x1; cx += 115) {
              ctx.moveTo(cx, o.y); ctx.lineTo(cx - 22, o.y + 120);
              ctx.moveTo(cx, o.y); ctx.lineTo(cx + 22, o.y + 120);
              ctx.moveTo(cx - 12, o.y + 60); ctx.lineTo(cx + 12, o.y + 60);
            }
            ctx.stroke();
          }
          ctx.fillStyle = "#0c0a08";
          for (let sx = Math.ceil(x0 / 28) * 28; sx < x1; sx += 28) ctx.fillRect(sx - 5, o.y - 1, 10, 4);
          ctx.fillStyle = "#16191b";
          ctx.fillRect(x0, o.y - 5, x1 - x0, 3);
          ctx.strokeStyle = "rgba(160,175,190,0.32)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x0, o.y - 5.4);
          ctx.lineTo(x1, o.y - 5.4);
          ctx.stroke();
        }
        break;
      }

      case "escora": {
        const hw = (o.w || 90) / 2, alt = o.alt || 300;
        ctx.fillStyle = "#0e0a07";
        ctx.fillRect(o.x - hw - 5, o.y - alt, 10, alt);
        ctx.fillRect(o.x + hw - 5, o.y - alt, 10, alt);
        ctx.fillRect(o.x - hw - 18, o.y - alt - 2, 2 * hw + 36, 12);
        ctx.strokeStyle = "#0e0a07";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(o.x - hw, o.y - alt + 40); ctx.lineTo(o.x - hw + 26, o.y - alt + 10);
        ctx.moveTo(o.x + hw, o.y - alt + 40); ctx.lineTo(o.x + hw - 26, o.y - alt + 10);
        ctx.stroke();
        ctx.strokeStyle = "rgba(190,150,100,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x - hw - 4, o.y); ctx.lineTo(o.x - hw - 4, o.y - alt);
        ctx.moveTo(o.x + hw - 4, o.y); ctx.lineTo(o.x + hw - 4, o.y - alt);
        ctx.stroke();
        break;
      }

      case "esqueleto": {
        ctx.translate(o.x, o.y);
        if (o.dir === -1) ctx.scale(-1, 1);
        ctx.strokeStyle = "rgba(150,145,130,0.8)";
        ctx.fillStyle = "rgba(150,145,130,0.8)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-4, -8); ctx.lineTo(-7, -26);                       // coluna
        ctx.moveTo(-4, -8); ctx.lineTo(14, -12); ctx.lineTo(26, -1);   // perna dobrada
        ctx.moveTo(-6, -22); ctx.lineTo(6, -17); ctx.lineTo(10, -6);   // braço
        ctx.stroke();
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {                                  // costelas
          const ry = -24 + k * 4;
          ctx.moveTo(-6, ry); ctx.quadraticCurveTo(3, ry - 1, 5, ry + 3);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-9, -34, 5.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.arc(-10.5, -34.5, 1.3, 0, Math.PI * 2);
        ctx.arc(-6.6, -34.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a2218";                                     // capacete apagado
        ctx.beginPath();
        ctx.arc(-9, -35, 6.4, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "gotas": {
        const ciclo = 2.4 + (o.x % 7) * 0.1;
        const f = ((t + o.x * 0.013) % ciclo) / ciclo;
        if (f < 0.6) {
          const u = f / 0.6;
          ctx.fillStyle = "rgba(180,205,225,0.75)";
          ctx.beginPath();
          ctx.ellipse(o.x, o.y + u * u * (o.piso - o.y), 1.3, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (o.piso < ALTURA * 5) {
          const u = (f - 0.6) / 0.4;
          ctx.strokeStyle = "rgba(180,205,225," + (0.5 * (1 - u)) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(o.x, o.piso, 3 + u * 11, 1 + u * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }

      case "poca": {
        ctx.fillStyle = "rgba(70,95,115,0.35)";
        ctx.beginPath();
        ctx.ellipse(o.x, o.y + 0.5, (o.w || 60) / 2, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(170,195,215,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x - (o.w || 60) * 0.3, o.y - 0.5);
        ctx.lineTo(o.x + (o.w || 60) * 0.3, o.y - 0.5);
        ctx.stroke();
        break;
      }

      case "nevoa": {
        const dx = Math.sin(t * 0.25 + o.x * 0.01) * 24;
        const g = ctx.createRadialGradient(o.x + o.w / 2 + dx, o.y, 4, o.x + o.w / 2 + dx, o.y, o.w / 2);
        g.addColorStop(0, "rgba(140,170,190,0.16)");
        g.addColorStop(1, "rgba(140,170,190,0)");
        ctx.fillStyle = g;
        ctx.fillRect(o.x, o.y - 70, o.w, 90);
        break;
      }

      case "corda": {                                    // corrimão da ponte: postes e corda frouxa
        const bal = Math.sin(t * 0.8 + o.x) * 1.5;
        ctx.strokeStyle = "#0c0907";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(o.x + 3, o.y); ctx.lineTo(o.x + 3, o.y - 38);
        ctx.moveTo(o.x + o.w - 3, o.y); ctx.lineTo(o.x + o.w - 3, o.y - 38);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(o.x + 3, o.y - 36);
        ctx.quadraticCurveTo(o.x + o.w / 2, o.y - 14 + bal, o.x + o.w - 3, o.y - 36);
        ctx.stroke();
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (const f of [0.18, 0.5, 0.82]) {
          const px = o.x + o.w * f;
          ctx.moveTo(px, o.y - 22 + Math.sin(f * Math.PI) * 6);
          ctx.lineTo(px + bal, o.y - 10 + Math.sin(f * Math.PI) * 5);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(190,150,100,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(o.x + 2, o.y - 37);
        ctx.quadraticCurveTo(o.x + o.w / 2, o.y - 15 + bal, o.x + o.w - 4, o.y - 37);
        ctx.stroke();
        break;
      }

      case "sinal": {                                    // placa de perigo torta e enferrujada
        ctx.translate(o.x, o.y);
        ctx.rotate(-0.06);
        ctx.fillStyle = "#0c0a08";
        ctx.fillRect(-2, -50, 4, 50);
        ctx.beginPath();
        ctx.moveTo(0, -78); ctx.lineTo(15, -52); ctx.lineTo(-15, -52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(150,80,40,0.55)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -70); ctx.lineTo(0, -61);
        ctx.moveTo(0, -57.5); ctx.lineTo(0, -56);
        ctx.stroke();
        break;
      }

      case "picareta": {
        ctx.translate(o.x, o.y);
        ctx.strokeStyle = "#100c08";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-10, -36);
        ctx.stroke();
        ctx.strokeStyle = "#2a2724";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-22, -34); ctx.quadraticCurveTo(-11, -44, 2, -36);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
}

function desenharPingentes() {
  for (const p of minaPing) {
    if (p.estado === 3) continue;
    if (p.x < camera - 60 || p.x > camera + LARGURA + 60) continue;
    if (p.y + p.comp < cameraY - 40 || p.y > cameraY + ALTURA + 40) continue;
    const tr = p.estado === 1 ? (Math.random() - 0.5) * 2.4 : 0;
    const x = p.x + tr, y = p.y, c = p.comp, w = 10 + c * 0.08;
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.moveTo(x - w, y - 3);
    ctx.lineTo(x - w * 0.4, y + c * 0.55);
    ctx.lineTo(x + 1, y + c);
    ctx.lineTo(x + w * 0.5, y + c * 0.5);
    ctx.lineTo(x + w, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(160,185,205,0.42)";           // brilho no gume: dá para ver que é perigoso
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - w + 1, y - 2);
    ctx.lineTo(x - w * 0.4, y + c * 0.55);
    ctx.lineTo(x + 1, y + c);
    ctx.stroke();
    ctx.fillStyle = "rgba(190,215,235,0.8)";
    ctx.beginPath();
    ctx.arc(x + 1, y + c - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function desenharParticulasMina(t) {
  // poeirinha parada no ar: só aparece onde bate luz
  ctx.fillStyle = "rgba(190,200,210,0.3)";
  for (let i = 0; i < 46; i++) {
    const px = camera + ((pseudo(i) * LARGURA * 1.1 + t * (3 + pseudo(i + 5) * 6)) % LARGURA);
    const py = cameraY + ((pseudo(i + 9) * ALTURA + t * (2 + pseudo(i + 11) * 4) * (i % 2 ? 1 : -1) + ALTURA * 10) % ALTURA);
    ctx.fillRect(px, py, 1.4, 1.4);
  }
  for (const k of minaPart) {
    const f = k.vida / k.vida0;
    if (k.tipo === "poeira") {
      ctx.fillStyle = "rgba(150,160,170," + (0.24 * f) + ")";
      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r * (1.6 - f * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else if (k.tipo === "caco") {
      ctx.fillStyle = "#050505";
      ctx.fillRect(k.x, k.y, k.r, k.r * 0.7);
      ctx.fillStyle = "rgba(160,185,205,0.3)";
      ctx.fillRect(k.x, k.y, k.r, 0.9);
    } else {
      ctx.fillStyle = "rgba(255,190,100," + f + ")";
      ctx.fillRect(k.x, k.y, 1.8, 1.8);
    }
  }
}

// tudo do mundo da mina que fica atrás do boneco (chamado por jogo.js)
function desenharMundoMina() {
  const t = performance.now() / 1000;
  for (const p of plataformas) {
    if (p.x + p.w < camera - 40 || p.x > camera + LARGURA + 40 || p.y + p.h < cameraY - 60 || p.y > cameraY + ALTURA + 60) continue;
    if (p.tipo === "chao" || p.tipo === "teto") mnBordas(p);
    else if (p.tipo === "tabua") mnDesTabua(p);
    else if (p.tipo === "andaime") mnDesAndaime(p);
    else if (p.tipo === "vagonete") mnDesCarrinho(p);
    else if (p.tipo === "elevador") mnDesElevador(p);
  }
  desenharObjetosMina(t);
  desenharPingentes();
  desenharParticulasMina(t);

  // o lampião que caiu com o boneco
  const L = minaQ.lant;
  if (L) {
    const f = mnPisca(t, 3);
    if (!L.quebrou) {
      ctx.fillStyle = "rgba(255,225,160,0.95)";
      ctx.fillRect(L.x - 3, L.y - 5, 6, 10);
      ctx.strokeStyle = "#241d17";
      ctx.lineWidth = 1.3;
      ctx.strokeRect(L.x - 4.5, L.y - 6.5, 9, 13);
      mnLuz(L.x, L.y, 270, 1, "255,190,110");
    } else {
      const r = Math.max(0, 160 * (1 - L.t / 230)) * f;
      if (r > 4) mnLuz(L.x, L.y - 4, r, 0.9, "255,150,70");
    }
  }

  // a luz do fim da fase aparece de longe
  if (luz) mnLuz(luz.x + luz.w / 2, luz.y + luz.h / 2, 340, 1, "255,214,160");
}

// =====================================================
// DESENHO: ESCURIDÃO E QUEDA (na tela, por cima de tudo)
// =====================================================

// cobre tudo de preto e abre buracos de luz: o jogador, os lampiões, o fogo, os cristais...
function desenharEscuridaoMina() {
  if (!faseAtual || faseAtual.cenario !== "mina") return;
  if (!minaCanvas) {
    minaCanvas = document.createElement("canvas");
    minaCanvas.width = LARGURA;
    minaCanvas.height = ALTURA;
    minaC = minaCanvas.getContext("2d");
  }
  const q = minaQ;
  const sx0 = -Math.round(camera) + q.tx, sy0 = -Math.round(cameraY) + q.ty;

  let amb = MINA_ESCURIDAO;
  if (q.caindo) amb = Math.min(0.97, amb + 0.04);
  // logo depois do impacto: apagão e luzes voltando falhando
  let lm = 1;
  if (q.impacto > 31) lm = 0;
  else if (q.impacto > 0) lm = Math.sin(q.impacto * 2.3) > -0.1 ? 1 : 0.35;

  minaC.globalCompositeOperation = "source-over";
  minaC.clearRect(0, 0, LARGURA, ALTURA);
  minaC.fillStyle = "rgba(0,0,0," + amb + ")";
  minaC.fillRect(0, 0, LARGURA, ALTURA);
  minaC.globalCompositeOperation = "destination-out";

  const luzes = minaLuzes.slice();
  if (!jogador.escondido) {
    luzes.push({ x: jogador.x + jogador.w / 2, y: jogador.y + jogador.h / 2, r: q.caindo ? 125 : MINA_RAIO_JOGADOR, a: 0.9, cor: "255,236,200", fraca: true });
  }
  for (const l of luzes) {
    const x = l.x + sx0, y = l.y + sy0;
    if (x + l.r < 0 || x - l.r > LARGURA || y + l.r < 0 || y - l.r > ALTURA) continue;
    const a = Math.min(1, l.a * lm);
    if (a <= 0.01) continue;
    const g = minaC.createRadialGradient(x, y, l.r * 0.05, x, y, l.r);
    g.addColorStop(0, "rgba(0,0,0," + a + ")");
    g.addColorStop(0.45, "rgba(0,0,0," + (a * 0.55) + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    minaC.fillStyle = g;
    minaC.beginPath();
    minaC.arc(x, y, l.r, 0, Math.PI * 2);
    minaC.fill();
  }
  ctx.drawImage(minaCanvas, 0, 0);

  // um leve tom colorido em volta de cada luz
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const l of luzes) {
    const x = l.x + sx0, y = l.y + sy0;
    if (x + l.r < 0 || x - l.r > LARGURA || y + l.r < 0 || y - l.r > ALTURA) continue;
    const a = Math.min(1, l.a * lm) * (l.fraca ? 0.04 : 0.13);
    if (a <= 0.005) continue;
    const g = ctx.createRadialGradient(x, y, 2, x, y, l.r * 0.8);
    g.addColorStop(0, "rgba(" + l.cor + "," + a + ")");
    g.addColorStop(1, "rgba(" + l.cor + ",0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
}

// vento da queda, flash do impacto e o título da fase
function desenharQuedaMina() {
  if (!faseAtual || faseAtual.cenario !== "mina") return;
  const q = minaQ;
  const t = performance.now() / 1000;

  if (q.caindo) {                                      // riscos de vento subindo pela tela
    const forca = Math.min(1, q.vMax / 15);
    ctx.save();
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 24; i++) {
      const x = pseudo(i * 3.1) * LARGURA;
      const sp = 700 + pseudo(i) * 900;
      const y = ALTURA + 80 - ((t * sp + pseudo(i + 9) * ALTURA) % (ALTURA + 160));
      const len = 30 + pseudo(i + 4) * 60;
      ctx.strokeStyle = "rgba(170,195,215," + (0.05 + 0.12 * forca * pseudo(i + 2)) + ")";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (q.impacto > 41) {                                // clarão do impacto
    ctx.fillStyle = "rgba(255,255,255," + ((q.impacto - 41) / 4 * 0.7) + ")";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
  }

  if (minaTitulo > 0 && estado === "jogando") {        // título da fase
    const a = Math.max(0, Math.min(1, (210 - minaTitulo) / 45, minaTitulo / 55));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 12;
    ctx.font = "44px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Sombras", LARGURA / 2, 150);
    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Fase 5", LARGURA / 2, 176);
    ctx.restore();
  }
}

// =====================================================
// SOM (usa as funções de áudio do rush.js)
// =====================================================
function somMina(tipo) {
  if (!MINA_SOM || typeof ctxAudioRush !== "function") return;
  const a = ctxAudioRush();
  if (!a) return;
  if (tipo === "queda") {            // vento e um rumor grave durante a queda
    ruidoRush(a, 2.4, 260, 1700, 0.45);
    tomRush(a, 2.4, 70, 34, 0.25, "sine");
  } else if (tipo === "impacto") {   // o baque no fundo da mina
    tomRush(a, 0.6, 80, 28, 0.8, "square");
    ruidoRush(a, 0.9, 700, 80, 0.9);
  } else if (tipo === "vidro") {     // o lampião quebrando
    ruidoRush(a, 0.5, 6000, 2500, 0.4);
    tomRush(a, 0.3, 1800, 900, 0.1, "triangle");
  } else if (tipo === "pedra") {     // pedra do teto se espatifando
    ruidoRush(a, 0.45, 600, 100, 0.7);
    tomRush(a, 0.3, 90, 45, 0.5, "square");
  } else if (tipo === "treme") {     // o teto começa a estalar
    ruidoRush(a, 0.5, 200, 120, 0.25);
  }
}

// =====================================================
// ENGATES COM O RESTO DO JOGO
// =====================================================

// quando uma fase é carregada (menu ou Enter), o checkpoint volta ao começo
if (typeof carregarFase === "function") {
  const mnCarregarOriginal = carregarFase;
  carregarFase = function (n) {
    mnCarregarOriginal(n);
    minaCp = 0;
    minaVisto = false;
  };
}

// TESTE: aperte J na fase 5 para pular para o próximo checkpoint. Pode apagar depois.
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyJ" && faseAtual && faseAtual.cenario === "mina" && estado === "jogando") {
    minaCp = (minaCp + 1) % faseAtual.checkpoints.length;
    reiniciar();
  }
});