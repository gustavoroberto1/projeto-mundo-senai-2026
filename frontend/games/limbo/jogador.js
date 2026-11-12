const CORES = { "#": "#000000", "g": "#2b2b2b", "o": "#1d1d1d", "W": "#ffffff" };

const CABECA = [
  "....#.#..#.#..",
  "..###########.",
  ".############.",
  "..###oo##oo##.",
  "..##oWWooWWo#.",
  "..##oWWooWWo#.",
  "..###oo##oo##.",
  "..###########.",
  "...#########..",
  "....#######...",
];
const OMBROS = [".############."];

// Tronco + braços em posições diferentes (8 linhas cada)
const BRACOS_PARADOS = [
  ".##gg#####g##.",
  ".##g#g####g##.",
  ".##g##g###g##.",
  ".##g###g##g##.",
  ".##g####g#g##.",
  ".##g#####gg##.",
  ".##g######g##.",
  ".##g######g##.",
];
const BRACOS_ATRAS = [      // braço esquerdo balança para trás
  ".##gg#####g##.",
  ".##g#g####g##.",
  "##.g##g###g##.",
  "##.g###g##g##.",
  "##.g####g#g##.",
  "##.g#####gg##.",
  "##.g######g##.",
  "##.g######g##.",
];
const BRACOS_FRENTE = [     // braço direito balança para frente
  ".##gg#####g##.",
  ".##g#g####g##.",
  ".##g##g###g.##",
  ".##g###g##g.##",
  ".##g####g#g.##",
  ".##g#####gg.##",
  ".##g######g.##",
  ".##g######g.##",
];
const BRACOS_ABERTOS = [    // no pulo, os dois braços abertos
  ".##gg#####g##.",
  ".##g#g####g##.",
  "##.g##g###g.##",
  "##.g###g##g.##",
  "##.g####g#g.##",
  "##.g#####gg.##",
  "##.g######g.##",
  "##.g######g.##",
];

const BARRA = ["##############", "##############", "##############", "#.##.##.###.##"];

// Pernas (5 linhas cada)
const PERNAS_PARADO  = ["...###..###...", "...###..###...", "...###..###...", "..####..####..", "..####..#####."];
const PERNAS_ABERTAS = ["..###....###..", ".###......###.", ".###......###.", ".###......####", "####......####"];
const PERNAS_PE_E    = [".....####.....", ".....####.....", "....###.###...", "....###.####..", "........#####."];  // pé esquerdo no ar
const PERNAS_PE_D    = [".....####.....", ".....####.....", "...###.###....", "...####.###...", "...####......."];  // pé direito no ar
const PERNAS_PULO    = ["..###....###..", ".###......###.", ".###.....###..", ".####....####.", ".####.....###."];

// Junta os pedaços para formar um desenho completo
function montar(bracos, pernas) {
  return [...CABECA, ...OMBROS, ...bracos, ...BARRA, ...pernas];
}

// Agachado: a mesma cabeça, mas com olhos fechados e tudo preto
// (troca as letras W, o e g por #, que é preto)
const CABECA_FECHADA = CABECA.slice(0, 9).map((linha) => linha.replace(/[Wog]/g, "#"));
const AGACHADO = [
  ...CABECA_FECHADA,
  ".############.",
  "##############",
  "##############",
  "##############",
  "##############",
  "#.##.##.######",
  ".####....#####",
  ".####....#####",
];

const SPRITES = {
  parado:   montar(BRACOS_PARADOS, PERNAS_PARADO),
  pulando:  montar(BRACOS_ABERTOS, PERNAS_PULO),
  agachado: AGACHADO,
};

// Ciclo de caminhada: 4 quadros que se repetem
const CICLO_ANDAR = [
  montar(BRACOS_ATRAS,   PERNAS_ABERTAS),
  montar(BRACOS_PARADOS, PERNAS_PE_E),
  montar(BRACOS_FRENTE,  PERNAS_ABERTAS),
  montar(BRACOS_PARADOS, PERNAS_PE_D),
];



// Estado do jogador e da partida
const teclas = {};     // guarda quais teclas estão apertadas
const ALTURA_EM_PE = 28 * ESCALA;
const ALTURA_AGACHADO = 17 * ESCALA;
const jogador = { w: 14 * ESCALA, h: ALTURA_EM_PE };
const monstro = {
  ativo: false,
  x: 0,
  y: 0,
  destinoX: 0,
  destinoY: 0,
  espera: 100,
  tempoVisivel: 240,
  alpha: 0,
  velocidade: 0.8
};

let estado;            // "jogando", "morto" ou "venceu"
let camera;
let cameraY = 0;       // altura da câmera (só muda nas fases verticais)            // quanto a tela já "andou" para a direita
let contador;          // tempo da tela escura quando morre
let mortes = 0;
let faseMaisAlta = 0;  // quantas fases já foram concluídas (usado para a pontuação do Arcade)

// Pontuação: recompensa o progresso (fases concluídas) e penaliza as mortes.
// As fases existentes dividem igualmente PONTOS_MAXIMOS, então terminar o
// jogo inteiro sem morrer sempre vale os mesmos 20000 pontos, não importa
// quantas fases existam. Cada morte custa PONTOS_POR_MORTE, nunca ficando negativo.
const PONTOS_MAXIMOS = 20000;
const PONTOS_POR_MORTE = 200;
function pontuacaoAtual() {
  const pontosPorFase = PONTOS_MAXIMOS / FASES.length;
  return Math.max(0, Math.round(faseMaisAlta * pontosPorFase - mortes * PONTOS_POR_MORTE));
}

function reiniciar() {
  jogador.h = ALTURA_EM_PE;
  const ini = (typeof inicioMina === "function" && inicioMina()) || { x: 60, y: 380 };
  jogador.x = ini.x;
  jogador.y = ini.y - jogador.h;
  jogador.vx = 0;
  jogador.vy = 0;
  jogador.noChao = false;
  jogador.olhaEsquerda = false;
  jogador.anim = 0;
  jogador.h = ALTURA_EM_PE
  jogador.agachado = false
  estado = "jogando";
  camera = 0;
  cameraY = 0;
  contador = 0;

  monstro.ativo = false;
monstro.alpha = 0;
monstro.espera = 100 + Math.random() * 200;
if (typeof aoReiniciar === "function") aoReiniciar();
jogador.escondido = false;
if (typeof reiniciarRush === "function") reiniciarRush();
     jogador.escondido = false;
     if (typeof reiniciarRush === "function") reiniciarRush();
     if (typeof reiniciarAranha === "function") reiniciarAranha();
     if (typeof reiniciarMina === "function") reiniciarMina();
   
}

function morrer() {
  estado = "morto";
  contador = 50;
  mortes++;
}

// Desenho dos sprites do personagem
function desenharSprite(sprite, x, y, espelhar) {
  for (let l = 0; l < sprite.length; l++) {
    const linha = sprite[l];
    for (let c = 0; c < linha.length; c++) {
      const letra = linha[espelhar ? linha.length - 1 - c : c];
      if (letra === ".") continue;
      ctx.fillStyle = CORES[letra];
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = letra === "W" ? 10 : 0;   // só os olhos brilham
      ctx.fillRect(Math.round(x + c * ESCALA), Math.round(y + l * ESCALA), ESCALA, ESCALA);
    }
  }
}

function escolherSprite() {
  if (jogador.agachado) return SPRITES.agachado;
  if (!jogador.noChao) return SPRITES.pulando;
  if (jogador.vx === 0) return SPRITES.parado;
  return CICLO_ANDAR[Math.floor(jogador.anim / 6) % 4];
}


// Desenho articulado do boneco
function membro(x0, y0, a1, a2, L1, L2, dir, esp, cor, pe) {
  const x1 = x0 + Math.sin(a1) * L1 * dir;
  const y1 = y0 + Math.cos(a1) * L1;
  const x2 = x1 + Math.sin(a1 + a2) * L2 * dir;
  const y2 = y1 + Math.cos(a1 + a2) * L2;
  ctx.strokeStyle = cor;
  ctx.lineWidth = esp;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (pe) ctx.lineTo(x2 + dir * pe, y2);
  ctx.stroke();
  return { x: x2, y: y2 };   // ponta do membro (usada para desenhar as mãos)
}

function desenharBoneco() {
  const j = jogador;
  const d = j.olhaEsquerda ? -1 : 1;
  const cx = j.x + j.w / 2;
  const base = j.y + j.h;
  const agach = j.agachado;
  const noAr = !j.noChao;
  const andando = j.vx !== 0 && j.noChao;
  const L = 9;
  const t = performance.now() / 1000;

  const COR_CASACO = "#1b1b1b";
  const COR_BORDA = "#3a3a3a";
  const COR_CABELO = "#050505";

  let pernas, bracos, tronco, inclina, cabecaDist, cabecaRy;
  const ph = j.anim * 0.26;

  if (agach) {
    const bal = andando ? Math.sin(ph) * 0.35 : 0;
    pernas = [{ a1: 1.1 + bal, a2: -1.9 }, { a1: 1.1 - bal, a2: -1.9 }];
    bracos = [{ a1: 0.9, a2: 0.8 }, { a1: 0.5, a2: 0.8 }];
    tronco = 9; inclina = 0.5; cabecaDist = 8; cabecaRy = 9;
  } else if (noAr) {
    if (j.vy < 0) {
      pernas = [{ a1: 0.9, a2: -1.3 }, { a1: -0.4, a2: -0.4 }];
      bracos = [{ a1: 2.5, a2: 0.2 }, { a1: 2.1, a2: 0.2 }];
    } else {
      pernas = [{ a1: 0.5, a2: -0.2 }, { a1: -0.5, a2: -0.1 }];
      bracos = [{ a1: 1.7, a2: 0.1 }, { a1: -1.3, a2: -0.1 }];
    }
    tronco = 16; inclina = 0.1; cabecaDist = 11; cabecaRy = 10;
  } else if (andando) {
    pernas = [0, 1].map((i) => {
      const p = ph + i * Math.PI;
      return { a1: Math.sin(p) * 0.65, a2: -Math.max(0, Math.cos(p)) * 1.0 };
    });
    bracos = [0, 1].map((i) => {
      const p = ph + i * Math.PI;
      return { a1: -Math.sin(p) * 0.7, a2: 0.35 + 0.35 * Math.max(0, Math.sin(p + Math.PI)) };
    });
    tronco = 16; inclina = 0.12; cabecaDist = 11; cabecaRy = 10;
  } else {
    const resp = Math.sin(t * 2) * 0.04;
    pernas = [{ a1: 0.08, a2: 0 }, { a1: -0.08, a2: 0 }];
    bracos = [{ a1: 0.1 + resp, a2: 0.2 }, { a1: -0.1 - resp, a2: 0.2 }];
    tronco = 16; inclina = 0; cabecaDist = 11; cabecaRy = 10;
  }

  const alcance = (p) => Math.cos(p.a1) * L + Math.cos(p.a1 + p.a2) * L;
  const quadrilY = base - Math.max(alcance(pernas[0]), alcance(pernas[1])) - 3;

  const ombroX = cx + Math.sin(inclina) * d * tronco;
  const ombroY = quadrilY - Math.cos(inclina) * tronco;
  const cabX = ombroX + Math.sin(inclina) * d * cabecaDist;
  const cabY = ombroY - Math.cos(inclina) * cabecaDist;

  // "vento": andar joga cabelo e casaco para trás; no pulo/queda, para cima/baixo
  const sopro = andando ? 1 : 0;
  const lift = noAr ? Math.max(-1, Math.min(1, j.vy / 10)) : 0;   // + caindo, - subindo

  ctx.save();

  // 1) braço e perna de trás
  membro(ombroX, ombroY + 1, bracos[1].a1, bracos[1].a2, L, L, d, 5, "#101010", 0);
  membro(cx, quadrilY, pernas[1].a1, pernas[1].a2, L, L, d, 6, "#0c0c0c", 4);

  // 2) cabelo comprido (mechas que ficam atrás do corpo)
  ctx.strokeStyle = COR_CABELO;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const sx = cabX - d * (3 + i * 2.2);
    const sy = cabY - 7 + i * 2.6;
    const len = 18 + i * 3.5;
    const bal = Math.sin(t * 3 + i * 0.9) * (1.5 + sopro * 3);
    const ex = sx - d * (len * (0.45 + sopro * 0.5)) + bal;
    const ey = sy + len * (0.95 - lift * 1.1);
    const c1x = sx - d * (len * 0.5 * (0.3 + sopro)) - bal * 0.5;
    const c1y = sy + len * 0.35;
    ctx.lineWidth = 6.5 - i * 0.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(c1x, c1y, ex, ey);
    ctx.stroke();
  }

  // 3) perna da frente (o sobretudo vai cobrir o topo dela)
  membro(cx, quadrilY, pernas[0].a1, pernas[0].a2, L, L, d, 6, "#000", 4);

  // 4) sobretudo comprido
  const hemY = quadrilY + (agach ? 7 : 11) - lift * 5;
  const flare = 8 + (andando ? Math.abs(Math.sin(ph)) * 2 : 0);
  const swing = Math.sin(ph) * 3 * sopro;
  const trail = -d * sopro * 4;
  const frenteX = cx + d * flare + swing + trail * 0.3;
  const costasX = cx - d * (flare + 2) + trail - swing * 0.5;

  ctx.beginPath();
  ctx.moveTo(ombroX - d * 8, ombroY);
  ctx.lineTo(ombroX + d * 7, ombroY);
  ctx.quadraticCurveTo(cx + d * 9, quadrilY - 2, frenteX, hemY);
  ctx.lineTo(costasX, hemY + 1);
  ctx.quadraticCurveTo(cx - d * 9, quadrilY - 2, ombroX - d * 8, ombroY);
  ctx.closePath();
  ctx.fillStyle = COR_CASACO;
  ctx.fill();
  ctx.strokeStyle = COR_BORDA;
  ctx.lineWidth = 1;
  ctx.stroke();

  // abertura da frente e gola
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ombroX + d * 3, ombroY + 2);
  ctx.quadraticCurveTo(cx + d * 4, quadrilY, frenteX - d * 4, hemY);
  ctx.stroke();

  // cinto
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - d * 8, quadrilY - 2);
  ctx.lineTo(cx + d * 8, quadrilY - 2);
  ctx.stroke();

  // 5) capuz abaixado: tecido amontoado atrás do pescoço
  ctx.save();
  ctx.translate(ombroX - d * 7, ombroY + 1);
  ctx.rotate(d * 0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = COR_CASACO;
  ctx.fill();
  ctx.strokeStyle = COR_BORDA;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = "#000";            // dobra do tecido
  ctx.beginPath();
  ctx.moveTo(-5, -1);
  ctx.quadraticCurveTo(0, 3, 5, 0);
  ctx.stroke();
  ctx.restore();

  // 6) pescoço e cabeça
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ombroX, ombroY);
  ctx.lineTo(cabX, cabY);
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cabX, cabY, 11, cabecaRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // topo do cabelo + franja
  ctx.fillStyle = COR_CABELO;
  ctx.beginPath();
  ctx.ellipse(cabX - d, cabY - 3, 12.5, cabecaRy + 1, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();                      // mecha caindo na frente do rosto
  ctx.moveTo(cabX + d * 11, cabY - 4);
  ctx.quadraticCurveTo(cabX + d * 12, cabY + 3, cabX + d * 6, cabY - 2);
  ctx.closePath();
  ctx.fill();

  // olhos brilhantes (somem quando agachado)
  if (!agach) {
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#fff";
    for (const dx of [-4, 4]) {
      ctx.beginPath();
      ctx.ellipse(cabX + d * 3 + dx, cabY + 1.5, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // 7) braço da frente: manga do casaco + mão preta
  const mao = membro(ombroX, ombroY + 1, bracos[0].a1, bracos[0].a2, L, L, d, 6.5, COR_CASACO, 0);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(mao.x, mao.y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- GRAMA E OBJETOS ----------
