// =====================================================
// ARANHA DA FASE 4
// Só o bicho: surgir, animar e desenhar. A perseguição vem depois.
// Usa globais do projeto: ctx, ALTURA, depurar e (se existir) chaoAbaixo().
// Tudo é desenhado em coordenadas do MUNDO (dentro da câmera).
// =====================================================

const ARANHA_CFG = {
  escala: 1.25,      // tamanho geral (1 = pequena, 2 = enorme)
  velocidade: 0,     // 0 = só surge e fica; >0 anda atrás do alvo (perseguição, depois)
  distSurgir: 190,   // quantos px atrás do jogador ela aparece (a câmera mostra ~267 atrás)
  tempoOlhos: 100    // quadros só com os olhos brilhando no escuro, antes de sair
};

let aranhaF4 = null;
let aranhaJaSurgiu = false;
let _aranhaAudio = null;

// Onde cada perna apoia o pé (x local) e onde nasce no corpo.
const _A_PE   = [92, 52, -48, -98];
const _A_QUADRIL = [30, 12, -14, -32];

// Olhos: x, y, raio (coordenadas locais do corpo)
const _A_OLHOS = [
  [42, -10, 4.6], [34, -15, 3.8], [47, -17, 3.0], [40, -20, 2.7],
  [31,  -7, 2.3], [48,  -5, 2.5], [37,  -4, 1.9], [44, -24, 1.9]
];

// ---------- utilidades ----------
function _aranhaRand(seed) {
  const h = Math.sin(seed * 12.9898) * 43758.5453;
  return h - Math.floor(h);
}

function _easeOutBack(p) {
  const c1 = 1.9, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

function _chaoAranha(x, yRef) {
  if (typeof chaoAbaixo === "function") {
    const g = chaoAbaixo(x, yRef - 60);
    if (g >= yRef - 60 && g <= yRef + 80) return g;   // só aceita chão de verdade, perto
  }
  return yRef;
}

// Cinemática inversa de 2 ossos: acha o joelho (sempre dobrado para cima).
function _ikAranha(hx, hy, fx, fy, l1, l2) {
  const dx = fx - hx, dy = fy - hy;
  const d = Math.hypot(dx, dy) || 0.001;
  const dd = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.5, d));
  const ux = dx / d, uy = dy / d;
  const al = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - al * al));
  const mx = hx + ux * al, my = hy + uy * al;
  const k1 = { x: mx - uy * h, y: my + ux * h };
  const k2 = { x: mx + uy * h, y: my - ux * h };
  const k = k1.y < k2.y ? k1 : k2;
  return { kx: k.x, ky: k.y, ex: hx + ux * dd, ey: hy + uy * dd };
}

// Segmento afilado (grosso na base, fino na ponta).
function _afilado(x1, y1, x2, y2, w1, w2) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  ctx.lineTo(x2 + nx * w2 / 2, y2 + ny * w2 / 2);
  ctx.lineTo(x2 - nx * w2 / 2, y2 - ny * w2 / 2);
  ctx.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
  ctx.closePath();
  ctx.fill();
}

// Pelos eriçados ao longo de um segmento.
function _pelos(x1, y1, x2, y2, n, comp, seed, t) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const px = x1 + dx * u, py = y1 + dy * u;
    const r = _aranhaRand(seed + k * 3.1);
    const lado = r > 0.5 ? 1 : -1;
    const l = comp * (0.5 + r);
    const w = Math.sin(t * 0.2 + seed + k) * 0.9;
    ctx.moveTo(px, py);
    ctx.lineTo(px - uy * lado * l + ux * l * 0.6 + w, py + ux * lado * l + uy * l * 0.6);
  }
  ctx.stroke();
}

// ---------- som: um guincho sintetizado (sem arquivo de áudio) ----------
function gritoAranha() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!_aranhaAudio) _aranhaAudio = new AC();
    const ac = _aranhaAudio;
    if (ac.state === "suspended") ac.resume();
    const t0 = ac.currentTime;

    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(1900, t0 + 0.25);
    osc.frequency.exponentialRampToValueAtTime(260, t0 + 1.0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + 1.05);

    const len = Math.floor(ac.sampleRate * 0.9);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const dado = buf.getChannelData(0);
    for (let i = 0; i < len; i++) dado[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const ruido = ac.createBufferSource();
    ruido.buffer = buf;
    const filtro = ac.createBiquadFilter();
    filtro.type = "bandpass"; filtro.frequency.value = 2400; filtro.Q.value = 3;
    const g2 = ac.createGain(); g2.gain.value = 0.12;
    ruido.connect(filtro); filtro.connect(g2); g2.connect(ac.destination);
    ruido.start(t0);
  } catch (e) { /* sem áudio, segue o jogo */ }
}

// ---------- criar / remover ----------
function surgirAranha(x, chaoY, dir) {
  const s = ARANHA_CFG.escala;
  const d = dir || 1;
  aranhaF4 = {
    x, y: chaoY, dir: d, s,
    t: 0, te: 0, estado: "olhos",
    alpha: 0, altura: 0.5, olhosA: 0, cy: chaoY - 46 * s * 0.5,
    pernas: []
  };
  for (let i = 0; i < 8; i++) {
    const lado = i < 4 ? 0 : 1, slot = i % 4;
    const fx = x + d * (_A_PE[slot] + lado * 8) * s;
    aranhaF4.pernas.push({
      lado, slot, fx, fy: _chaoAranha(fx, chaoY),
      passo: -1, sx: 0, sy: 0, tx: 0, seed: i * 17.3
    });
  }
}

// Aparece atrás do jogador, virada para ele.
function surgirAranhaAtras(j) {
  const pes = j.y + j.h;
  surgirAranha(j.x - ARANHA_CFG.distSurgir, pes, 1);
}

// Chame todo quadro: dispara uma única vez quando o jogador agacha dentro da zona.
// zona = { x, w } em coordenadas do mundo.
function gatilhoAranha(j, zona) {
  if (aranhaF4 || aranhaJaSurgiu) return;
  if (j.agachado && j.x + j.w > zona.x && j.x < zona.x + zona.w) {
    aranhaJaSurgiu = true;
    surgirAranhaAtras(j);
  }
}

// jogo.js usa este nome: a tela treme quando ela sai do escuro
function tremorAranha() {
  const a = aranhaF4;
  if (!a || a.estado !== "surge") return null;
  const k = 7 * (1 - Math.min(1, a.te / 50));
  return { x: (Math.random() - 0.5) * k, y: (Math.random() - 0.5) * k };
}

// jogador.js usa este nome ao reiniciar
function reiniciarAranha() { removerAranha(); }

function removerAranha() {
  aranhaF4 = null;
  aranhaJaSurgiu = false;
}

// ---------- atualizar ----------
function atualizarAranha(dt, alvo) {
  if (!alvo && typeof jogador === "object") alvo = jogador;
  // gatilho: a fase define aranhaGatilho: { x, w } (zona do teto baixo)
  if (!aranhaF4 && !aranhaJaSurgiu && alvo && typeof faseAtual === "object" && faseAtual.aranhaGatilho) {
    gatilhoAranha(alvo, faseAtual.aranhaGatilho);
  }
  const a = aranhaF4;
  if (!a) return;
  a.t += dt; a.te += dt;

  if (a.estado === "olhos") {
    a.olhosA = Math.min(1, a.te / 30);
    if (a.te > ARANHA_CFG.tempoOlhos) { a.estado = "surge"; a.te = 0; gritoAranha(); }
  } else if (a.estado === "surge") {
    const p = Math.min(1, a.te / 50);
    a.alpha = Math.min(1, p * 1.6);
    a.altura = 0.5 + 0.5 * _easeOutBack(p);
    a.olhosA = 1;
    if (p >= 1) { a.estado = "viva"; a.altura = 1; a.alpha = 1; }
  }

  let andando = false;
  if (a.estado === "viva" && alvo && ARANHA_CFG.velocidade > 0) {
    a.dir = alvo.x > a.x ? 1 : -1;
    a.x += a.dir * ARANHA_CFG.velocidade * dt;
    andando = true;
  }

  a.y = _chaoAranha(a.x, a.y);
  const bob = Math.sin(a.t * 0.12) * 1.8 * a.s;
  a.cy = a.y - 46 * a.s * a.altura + bob;

  // pernas: pé fica plantado no chão e só dá passo quando fica longe demais
  let andandoN = 0;
  for (const p of a.pernas) if (p.passo >= 0) andandoN++;
  for (const p of a.pernas) {
    const ideal = a.x + a.dir * (_A_PE[p.slot] + p.lado * 8) * a.s;
    if (p.passo < 0) {
      const longe = Math.abs(p.fx - ideal) > 30 * a.s;
      const tique = Math.random() < 0.006 * dt;   // tremedeira nervosa
      if ((longe || tique) && andandoN < 3) {
        p.passo = 0; p.sx = p.fx; p.sy = p.fy;
        p.tx = ideal + (longe ? a.dir * 8 * a.s * (andando ? 1 : 0) : (Math.random() - 0.5) * 16 * a.s);
        andandoN++;
      }
    }
    if (p.passo >= 0) {
      p.passo += dt / 12;
      const gy = _chaoAranha(p.tx, a.y);
      if (p.passo >= 1) { p.fx = p.tx; p.fy = gy; p.passo = -1; }
      else {
        const u = p.passo;
        p.fx = p.sx + (p.tx - p.sx) * u;
        p.fy = p.sy + (gy - p.sy) * u - Math.sin(Math.PI * u) * 24 * a.s;
      }
    }
  }
}

// ---------- desenhar ----------
function _desenharPerna(a, p, cor, corPelo) {
  const s = a.s;
  const hx = a.x + a.dir * (_A_QUADRIL[p.slot] + p.lado * 6) * s;
  const hy = a.cy + (2 + p.lado * 2) * s;
  const ik = _ikAranha(hx, hy, p.fx, p.fy, 62 * s, 78 * s);

  ctx.fillStyle = cor;
  _afilado(hx, hy, ik.kx, ik.ky, 9 * s, 6 * s);
  _afilado(ik.kx, ik.ky, ik.ex, ik.ey, 6 * s, 1.6 * s);
  ctx.beginPath(); ctx.arc(ik.kx, ik.ky, 4.6 * s, 0, 6.2832); ctx.fill();   // junta inchada

  ctx.strokeStyle = corPelo; ctx.lineWidth = 1;
  _pelos(hx, hy, ik.kx, ik.ky, 9, 8 * s, p.seed, a.t);
  _pelos(ik.kx, ik.ky, ik.ex, ik.ey, 11, 7 * s, p.seed + 50, a.t);
}

function _desenharOlhos(a) {
  const t = a.t;
  for (let i = 0; i < _A_OLHOS.length; i++) {
    const [ex, ey, r] = _A_OLHOS[i];
    const fl = 0.75 + 0.25 * Math.sin(t * 0.3 + i * 2.1);
    // pisca
    const piscar = (Math.floor(t / 41 + i * 0.13) % 6 === 5 && (t % 41) < 5) ? 0.05 : 1;
    const al = a.olhosA * fl * piscar;
    if (al <= 0.01) continue;
    ctx.globalAlpha = al;
    const halo = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * 4.5);
    halo.addColorStop(0, "rgba(255,50,25,0.55)");
    halo.addColorStop(1, "rgba(255,30,10,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(ex, ey, r * 4.5, 0, 6.2832); ctx.fill();
    const g = ctx.createRadialGradient(ex - r * 0.3, ey - r * 0.3, 0, ex, ey, r);
    g.addColorStop(0, "#ff9a7a"); g.addColorStop(0.5, "#ff2a14"); g.addColorStop(1, "#5a0300");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(ex, ey, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ex - r * 0.35, ey - r * 0.35, r * 0.22, 0, 6.2832); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function _desenharCorpo(a) {
  const t = a.t;
  const resp = 1 + 0.035 * Math.sin(t * 0.1);

  // ----- abdômen inchado, cheio de caroços -----
  ctx.save();
  ctx.translate(-38, 4);
  ctx.scale(resp, resp);
  const ag = ctx.createRadialGradient(-12, -14, 3, 0, 0, 62);
  ag.addColorStop(0, "#2b2b22"); ag.addColorStop(0.35, "#0e0e0b"); ag.addColorStop(1, "#020202");
  ctx.fillStyle = ag;
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 38, 0, 0, 6.2832); ctx.fill();
  for (let i = 0; i < 12; i++) {                       // bolhas / pústulas no contorno
    const ang = (i / 12) * 6.2832 + 0.3;
    const rr = 6 + _aranhaRand(i * 7.7) * 6;
    const bx = Math.cos(ang) * 43, by = Math.sin(ang) * 35;
    ctx.fillStyle = "#070706";
    ctx.beginPath(); ctx.arc(bx, by, rr, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "rgba(170,190,90,0.16)";
    ctx.beginPath(); ctx.arc(bx - rr * 0.3, by - rr * 0.3, rr * 0.35, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = "rgba(150,165,70,0.20)";             // manchas doentias
  for (let i = 0; i < 9; i++) {
    const mx = (_aranhaRand(i * 3.3) - 0.5) * 60, my = (_aranhaRand(i * 5.9) - 0.5) * 44;
    ctx.beginPath(); ctx.ellipse(mx, my, 2 + _aranhaRand(i) * 4, 1.5 + _aranhaRand(i + 9) * 3, 0.6, 0, 6.2832); ctx.fill();
  }
  ctx.fillStyle = "rgba(210,230,140,0.10)";            // brilho de coisa molhada
  ctx.beginPath(); ctx.ellipse(-16, -20, 16, 6, -0.5, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = "#0a0a08"; ctx.lineWidth = 1;      // pelos do abdômen
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * 6.2832;
    const r = _aranhaRand(i * 2.7);
    const w = Math.sin(t * 0.15 + i) * 0.06;
    const l = 5 + r * 9;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 45, Math.sin(ang) * 37);
    ctx.lineTo(Math.cos(ang + w) * (45 + l), Math.sin(ang + w) * (37 + l));
    ctx.stroke();
  }
  ctx.restore();

  // ----- pedículo -----
  ctx.fillStyle = "#050504";
  ctx.beginPath(); ctx.ellipse(-4, 2, 10, 12, 0, 0, 6.2832); ctx.fill();

  // ----- cefalotórax -----
  const cg = ctx.createRadialGradient(18, -10, 2, 24, 0, 40);
  cg.addColorStop(0, "#26261e"); cg.addColorStop(0.4, "#0c0c09"); cg.addColorStop(1, "#020202");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.ellipse(24, 0, 30, 24, 0, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = "#0a0a08"; ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const ang = -Math.PI * 0.95 + (i / 25) * Math.PI * 1.3;
    const l = 4 + _aranhaRand(i * 4.1) * 8;
    ctx.beginPath();
    ctx.moveTo(24 + Math.cos(ang) * 30, Math.sin(ang) * 24);
    ctx.lineTo(24 + Math.cos(ang) * (30 + l), Math.sin(ang) * (24 + l));
    ctx.stroke();
  }
}

function _desenharPresas(a) {
  const t = a.t;
  const abre = 0.5 + 0.5 * Math.sin(t * 0.07);
  const ponta = { x: 55 + abre * 5, y: 33 + abre * 9 };

  // boca escura
  ctx.fillStyle = "rgba(90,0,0,0.9)";
  ctx.beginPath(); ctx.ellipse(48, 9, 7, 4 + abre * 3, 0, 0, 6.2832); ctx.fill();

  // pedipalpos tremendo
  ctx.strokeStyle = "#060605"; ctx.lineCap = "round";
  for (let i = 0; i < 2; i++) {
    const w = Math.sin(t * 0.35 + i * 2) * 5;
    ctx.lineWidth = 5 - i;
    ctx.beginPath();
    ctx.moveTo(44 - i * 3, 12);
    ctx.lineTo(54 + w - i * 2, 26 + i * 2);
    ctx.lineTo(60 + w * 0.6, 38 + i * 3);
    ctx.stroke();
  }

  // presas (as duas, uma atrás da outra)
  for (let i = 0; i < 2; i++) {
    const off = i * 5, tx = ponta.x - off * 0.6, ty = ponta.y - i * 2;
    ctx.fillStyle = i ? "#17140d" : "#2a2619";
    ctx.beginPath();
    ctx.moveTo(43 + off, 3);
    ctx.quadraticCurveTo(62 + off, 8, tx, ty);
    ctx.quadraticCurveTo(54 + off, 16, 48 + off, 15);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d8d29a";                         // pontinha amarelada
    ctx.beginPath(); ctx.arc(tx, ty - 1, 1.6, 0, 6.2832); ctx.fill();

    // veneno pingando
    for (let j = 0; j < 3; j++) {
      const ph = (t * 0.018 + j * 0.34 + i * 0.17) % 1;
      const al = 1 - ph;
      ctx.fillStyle = "rgba(170,215,60," + (al * 0.9).toFixed(2) + ")";
      ctx.beginPath(); ctx.ellipse(tx, ty + 2 + ph * 55, 1.8 * (1 - ph * 0.3), 2.6 + ph * 2, 0, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = "rgba(170,215,60,0.55)"; ctx.lineWidth = 1.2;   // fio de baba
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + 6 + abre * 8); ctx.stroke();
  }

  // baba esticada entre as presas e o queixo
  ctx.strokeStyle = "rgba(200,225,130,0.45)"; ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(47 + k * 3, 12);
    ctx.quadraticCurveTo(46 + k * 3, 20 + abre * 10 + k * 3, ponta.x - 3 - k * 2, ponta.y - 6);
    ctx.stroke();
  }
}

function desenharAranha() {
  const a = aranhaF4;
  if (!a) return;
  const s = a.s;

  ctx.save();

  if (a.estado !== "olhos") {
    ctx.globalAlpha = a.alpha;

    // sombra no chão
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(a.x, a.y + 2, 80 * s, 7 * s, 0, 0, 6.2832); ctx.fill();

    // pernas de trás (mais escuras)
    for (let i = 4; i < 8; i++) _desenharPerna(a, a.pernas[i], "#0e0d0b", "#16140f");

    // corpo + cabeça (coordenadas locais, viradas para a direção)
    ctx.save();
    ctx.translate(a.x, a.cy);
    ctx.scale(a.dir * s, s);
    _desenharCorpo(a);
    ctx.restore();

    // pernas da frente
    for (let i = 0; i < 4; i++) _desenharPerna(a, a.pernas[i], "#030303", "#0a0908");

    ctx.save();
    ctx.translate(a.x, a.cy);
    ctx.scale(a.dir * s, s);
    _desenharPresas(a);
    ctx.restore();
  }

  // olhos (valem sozinhos no escuro na fase "olhos")
  ctx.save();
  ctx.translate(a.x, a.cy);
  ctx.scale(a.dir * s, s);
  _desenharOlhos(a);
  ctx.restore();

  ctx.restore();

  if (typeof depurar !== "undefined" && depurar) {
    ctx.fillStyle = "#0f0";
    for (const p of a.pernas) ctx.fillRect(p.fx - 2, p.fy - 2, 4, 4);
  }
}

// Teste rápido: com o modo depurar ligado (tecla H), a tecla K faz a aranhaF4 surgir.
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyK" && typeof depurar !== "undefined" && depurar && typeof jogador === "object") {
    removerAranha();
    aranhaJaSurgiu = true;
    surgirAranhaAtras(jogador);
  }
});