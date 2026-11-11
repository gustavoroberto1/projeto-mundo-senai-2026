// =====================================================
// RUSH: o monstro da fase 3 (a casa)
//   Etapas: espera -> aviso (luzes piscam) -> passando (escuro total, ele cruza a tela)
//           -> fim, ou -> susto (ele te pegou: jumpscare e morte)
//   Para ligar numa fase, coloque  rush: true  nela (em fase.js).
//   Esconder: segurar Shift na frente de um armário (a lógica fica em jogo.js).
// =====================================================

// ---------- AJUSTES (tempo em quadros: 60 = 1 segundo) ----------
const RUSH_PRIMEIRA_ESPERA = [200, 340];   // antes da 1ª vez: de 5 a 9 s
const RUSH_ESPERA = [320, 640];            // entre uma vez e outra: de 7 a 14 s
const RUSH_AVISO = 210;                    // luzes piscando antes dele aparecer (3,5 s)
const RUSH_VELOCIDADE = 20;                // pixels por quadro quando ele passa
const RUSH_TREMOR_MAX = 70;                // força do tremor da tela, em pixels
const RUSH_ESCURIDAO = 0.94;               // 1 = preto total
const RUSH_RAIO_LUZ = 150;                 // luz em volta do jogador no escuro (0 = escuridão total)
const RUSH_MATA_DIST = 80;                 // a que distância (na horizontal) ele pega o jogador
const RUSH_SUSTO_DURACAO = 85;             // duração do jumpscare (~1,4 s)
const RUSH_SOM = true;                     // false = sem som
const RUSH_VOLUME = 0.8;                   // volume geral dos sons (0 a 1)

const rush = {
  etapa: "espera",
  timer: 0,
  x: 0, y: 0, dir: 1,
  escuro: 0, tremor: 0,
  tx: 0, ty: 0,                // deslocamento do tremor neste quadro
  piscaTimer: 0, apagada: false,
  susto: 0, sx: 0, sy: 0,      // jumpscare: quadro atual e de onde o rosto parte na tela
  preto: false,                // tela preta depois do susto
};

function sorteioRush(par) {
  return par[0] + Math.random() * (par[1] - par[0]);
}

function reiniciarRush() {
  rush.etapa = "espera";
  rush.timer = sorteioRush(RUSH_PRIMEIRA_ESPERA);
  rush.escuro = 0;
  rush.tremor = 0;
  rush.tx = 0;
  rush.ty = 0;
  rush.apagada = false;
  rush.susto = 0;
  rush.preto = false;
}

function iniciarPassagemRush() {
  rush.etapa = "passando";
  rush.dir = Math.random() < 0.5 ? 1 : -1;                          // vem da esquerda ou da direita
  rush.x = rush.dir === 1 ? camera - 460 : camera + LARGURA + 460;  // começa fora da tela
  rush.y = jogador.y + jogador.h / 2 - 8;                           // na altura do boneco
  somRush("passa");
}

function iniciarSustoRush() {
  rush.etapa = "susto";
  rush.susto = 0;
  rush.sx = rush.x - camera;       // onde o rosto estava na tela: o susto parte daí
  rush.sy = rush.y - cameraY;
  estado = "susto";
  somRush("grito");
}

// ---------- LÓGICA ----------
function atualizarRush(dt) {
  const r = rush;

  if (r.etapa === "espera") {
    r.escuro = 0;
    r.tremor = 0;
    r.timer -= dt;
    if (r.timer <= 0) {
      r.etapa = "aviso";
      r.timer = RUSH_AVISO;
      r.piscaTimer = 0;
      r.apagada = false;
      somRush("aviso");
    }

  } else if (r.etapa === "aviso") {
    r.timer -= dt;
    const p = 1 - r.timer / RUSH_AVISO;          // 0 -> 1 ao longo do aviso
    r.piscaTimer -= dt;
    if (r.piscaTimer <= 0) {                     // alterna luz / escuro; o escuro dura cada vez mais
      r.apagada = !r.apagada;
      r.piscaTimer = r.apagada
        ? 3 + Math.random() * 6 + p * 14
        : (4 + Math.random() * 20) * (1 - p * 0.8);
    }
    r.escuro = r.apagada ? RUSH_ESCURIDAO * (0.5 + 0.5 * p) : 0;
    if (r.timer < 30) r.escuro = RUSH_ESCURIDAO;   // no fim do aviso apaga de vez
    r.tremor = 0.25 + 0.5 * p;
    if (r.timer <= 0) iniciarPassagemRush();

  } else if (r.etapa === "passando") {
    r.escuro += (RUSH_ESCURIDAO - r.escuro) * Math.min(1, 0.3 * dt);
    r.x += r.dir * RUSH_VELOCIDADE * dt;
    const alvoY = jogador.y + jogador.h / 2 - 8;
    r.y += (alvoY - r.y) * Math.min(1, 0.05 * dt);               // acompanha a altura do boneco
    const dist = Math.abs(r.x - (camera + LARGURA / 2));
    r.tremor = Math.max(0.5, Math.min(1, 1.4 - dist / 650));     // treme mais quando está perto
    const saiu = r.dir === 1 ? r.x > camera + LARGURA + 520 : r.x < camera - 520;
    if (saiu) {
      r.etapa = "fim";
      r.timer = 90;
    } else if (estado === "jogando" && !jogador.escondido &&
               Math.abs(r.x - (jogador.x + jogador.w / 2)) < RUSH_MATA_DIST) {
      iniciarSustoRush();                                        // pegou o jogador fora do armário
    }

  } else if (r.etapa === "fim") {
    r.timer -= dt;
    r.tremor *= Math.pow(0.92, dt);
    r.escuro = RUSH_ESCURIDAO * Math.max(0, r.timer / 90);
    if (r.timer < 55 && Math.floor(r.timer / 6) % 2 === 0) r.escuro *= 0.2;   // luzes voltando falhando
    if (r.timer <= 0) {
      r.etapa = "espera";
      r.timer = sorteioRush(RUSH_ESPERA);
      r.escuro = 0;
      r.tremor = 0;
    }

  } else if (r.etapa === "susto") {
    r.susto += dt;
    r.escuro = RUSH_ESCURIDAO;
    r.tremor = 2.2;                              // a tela sacode violentamente
    if (r.susto >= RUSH_SUSTO_DURACAO) {
      r.preto = true;                            // fica tudo preto até reiniciar
      morrer();
      contador = 40;
    }
  }

  const amp = RUSH_TREMOR_MAX * r.tremor;
  r.tx = (Math.random() - 0.5) * 2 * amp;
  r.ty = (Math.random() - 0.5) * 2 * amp;
}

// Usada em jogo.js para tremer o mundo inteiro
function tremorRush() {
  if (!faseAtual.rush || (estado !== "jogando" && estado !== "susto")) return { x: 0, y: 0 };
  return { x: rush.tx, y: rush.ty };
}

// ---------- ESCURIDÃO (na tela, por cima do cenário) ----------
function desenharEscuridaoRush() {
  if (!faseAtual.rush || rush.escuro < 0.01) return;
  const e = rush.escuro;

  ctx.save();
  if (RUSH_RAIO_LUZ > 0) {
    // sobra um pouco de luz em volta do jogador
    const sx = jogador.x + jogador.w / 2 - camera + rush.tx;
    const sy = jogador.y + jogador.h / 2 - cameraY + rush.ty;
    const g = ctx.createRadialGradient(sx, sy, 8, sx, sy, RUSH_RAIO_LUZ + 40);
    g.addColorStop(0,    "rgba(0,0,0," + (e * 0.15) + ")");
    g.addColorStop(0.55, "rgba(0,0,0," + (e * 0.55) + ")");
    g.addColorStop(1,    "rgba(0,0,0," + e + ")");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = "rgba(0,0,0," + e + ")";
  }
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.restore();
}
// ---------- O MONSTRO ----------

// Nuvem de sombra com fios que ficam para trás (d = direção em que ele corre)
function fumacaRush(x, y, d, t, alfa) {
  ctx.save();
  ctx.globalAlpha = alfa;

  for (let i = 0; i < 12; i++) {                         // massa de sombra
    const a = i * 1.7 + t * 2.2;
    const ox = Math.cos(a) * 30 - d * i * 12;
    const oy = Math.sin(a * 1.3) * 52;
    const r = 70 - i * 2.5;
    const g = ctx.createRadialGradient(x + ox, y + oy, 4, x + ox, y + oy, r);
    g.addColorStop(0,    "rgba(1,1,2,0.97)");
    g.addColorStop(0.65, "rgba(1,1,2,0.8)");
    g.addColorStop(1,    "rgba(1,1,2,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(1,1,2,0.95)";                  // fios de fumaça (cabelo e tentáculos)
  ctx.lineCap = "round";
  for (let i = 0; i < 10; i++) {
    const sy = y - 70 + i * 15;
    const comp = 130 + ((i * 53) % 110);
    const ond = Math.sin(t * 9 + i * 1.7) * 18;
    ctx.lineWidth = 9 - (i % 4) * 2;
    ctx.beginPath();
    ctx.moveTo(x - d * 30, sy);
    ctx.bezierCurveTo(
      x - d * comp * 0.35, sy + ond,
      x - d * comp * 0.7,  sy - ond,
      x - d * comp,        sy + ond * 0.6 + (i - 5) * 6
    );
    ctx.stroke();
  }
  ctx.restore();
}

// O rosto: tudo é desenhado ao redor de (x, y)
function rostoRush(x, y, t) {
  ctx.save();
  ctx.translate(x + (Math.random() - 0.5) * 3, y + (Math.random() - 0.5) * 3);   // treme
  ctx.rotate(Math.sin(t * 14) * 0.04);
  const pulso = 1 + Math.sin(t * 22) * 0.025;
  ctx.scale(pulso, pulso);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // pele pálida, com um brilho em volta
  const pele = ctx.createRadialGradient(-14, -30, 8, 0, 0, 84);
  pele.addColorStop(0,   "#f1ede4");
  pele.addColorStop(0.6, "#a9a396");
  pele.addColorStop(1,   "#2d2a27");
  ctx.shadowColor = "rgba(240,235,255,0.7)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = pele;
  ctx.beginPath();
  ctx.ellipse(0, -6, 58, 74, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // maçãs do rosto fundas
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 36, 16, 14, 26, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // rachaduras na pele
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, -78);  ctx.lineTo(2, -62);   ctx.lineTo(-5, -50);  ctx.lineTo(1, -40);
  ctx.moveTo(-47, 22);  ctx.lineTo(-58, 8);   ctx.lineTo(-56, -6);
  ctx.moveTo(47, 22);   ctx.lineTo(57, 10);   ctx.lineTo(55, -4);
  ctx.moveTo(-40, -52); ctx.lineTo(-52, -40);
  ctx.stroke();

  // mechas de cabelo escorrendo pela testa
  ctx.strokeStyle = "#020202";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const hx = -40 + i * 13;
    ctx.beginPath();
    ctx.moveTo(hx, -76 + Math.abs(hx) * 0.25);
    ctx.quadraticCurveTo(hx + Math.sin(t * 10 + i) * 5, -50, hx * 1.05, -30 - (i % 3) * 8);
    ctx.stroke();
  }

  // olhos: órbitas vazias (uma maior que a outra), pupila minúscula e escorrido preto
  const olhos = [
    { x: -24, y: -24, rx: 17, ry: 23, rot: -0.28, px: -2, py: 4 },
    { x: 25,  y: -28, rx: 13, ry: 18, rot: 0.22,  px: 1,  py: 3 },
  ];
  for (const o of olhos) {
    const sombra = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, o.rx + 16);
    sombra.addColorStop(0, "rgba(0,0,0,0.9)");
    sombra.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sombra;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.rx + 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#020202";
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, o.rx, o.ry, o.rot, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(o.x + o.px + (Math.random() - 0.5) * 3, o.y + o.py + (Math.random() - 0.5) * 3, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(o.x + 2, o.y + o.ry - 2);
    ctx.quadraticCurveTo(o.x + 7, o.y + o.ry + 22, o.x + 3, o.y + o.ry + 38 + Math.sin(t * 8 + o.x) * 4);
    ctx.stroke();
  }

  // sobrancelhas franzidas
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-46, -46); ctx.lineTo(-10, -36);
  ctx.moveTo(47, -50);  ctx.lineTo(12, -40);
  ctx.stroke();

  // nariz: duas fendas
  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.ellipse(-5, 6, 2.2, 6, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, 6, 2.2, 6, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // boca escancarada (a mandíbula treme)
  const boca = 56 * (1 + Math.sin(t * 26) * 0.07);
  const fundo = ctx.createLinearGradient(0, 10, 0, 22 + boca);
  fundo.addColorStop(0, "#000000");
  fundo.addColorStop(1, "#1d0707");
  ctx.fillStyle = fundo;
  ctx.beginPath();
  ctx.moveTo(-47, 22);
  ctx.quadraticCurveTo(0, 8, 47, 22);                    // lábio de cima
  ctx.quadraticCurveTo(0, 30 + 2 * boca, -47, 22);       // mandíbula
  ctx.closePath();
  ctx.fill();

  // dentes de cima (desiguais)
  ctx.fillStyle = "#e4dfd2";
  ctx.strokeStyle = "#1a1714";
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const tx = -40 + i * 10;
    const u = tx / 47;
    const base = 22 - 7 * (1 - u * u);
    const len = 11 + ((i * 37) % 13) + (i % 2) * 5;
    ctx.beginPath();
    ctx.moveTo(tx - 4.5, base - 1);
    ctx.lineTo(tx + 0.5 + ((i % 3) - 1), base + len);
    ctx.lineTo(tx + 5, base - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // dentes de baixo
  for (let i = 0; i < 7; i++) {
    const tx = -33 + i * 11;
    const u = tx / 47;
    const base = 22 + (4 + boca) * (1 - u * u);
    const len = 9 + ((i * 29) % 11);
    ctx.beginPath();
    ctx.moveTo(tx - 4.5, base + 1);
    ctx.lineTo(tx + (i % 2 ? 1.5 : -1.5), base - len);
    ctx.lineTo(tx + 4.5, base + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function desenharRush() {
  if (!faseAtual.rush || rush.etapa !== "passando") return;
  const t = performance.now() / 1000;

  ctx.save();
  ctx.translate(-camera + rush.tx, -cameraY + rush.ty);

  // halo pálido: é ele que faz a silhueta preta aparecer no escuro
  const halo = ctx.createRadialGradient(rush.x, rush.y, 20, rush.x, rush.y, 300);
  halo.addColorStop(0, "rgba(235,228,255,0.30)");
  halo.addColorStop(1, "rgba(235,228,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(rush.x - 300, rush.y - 300, 600, 600);

  // rastro de velocidade (cópias apagadas) e depois a fumaça de verdade
  for (let k = 3; k >= 1; k--) fumacaRush(rush.x - rush.dir * k * 55, rush.y, rush.dir, t - k * 0.03, 0.22);
  fumacaRush(rush.x, rush.y, rush.dir, t, 1);

  rostoRush(rush.x, rush.y, t);
  ctx.restore();
}

// ---------- SOM (gerado pelo navegador, sem arquivos) ----------
let audioRush = null;

function ctxAudioRush() {
  if (!RUSH_SOM) return null;
  try {
    audioRush = audioRush || new (window.AudioContext || window.webkitAudioContext)();
    if (audioRush.state === "suspended") audioRush.resume();
    return audioRush;
  } catch (e) {
    return null;
  }
}

// ruído com um filtro que varre de f0 até f1 (vento, rugido, chiado)
function ruidoRush(a, dur, f0, f1, vol) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const fonte = a.createBufferSource();
  fonte.buffer = buf;
  const filtro = a.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 0.8;
  const g = a.createGain();
  const t0 = a.currentTime;
  filtro.frequency.setValueAtTime(f0, t0);
  filtro.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.001, t0);
  g.gain.exponentialRampToValueAtTime(vol * RUSH_VOLUME, t0 + dur * 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  fonte.connect(filtro);
  filtro.connect(g);
  g.connect(a.destination);
  fonte.start(t0);
}

// tom que desliza de f0 até f1 (zumbido, grito)
function tomRush(a, dur, f0, f1, vol, tipo) {
  const o = a.createOscillator();
  const g = a.createGain();
  const t0 = a.currentTime;
  o.type = tipo;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.001, t0);
  g.gain.exponentialRampToValueAtTime(vol * RUSH_VOLUME, t0 + dur * 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function somRush(tipo) {
  const a = ctxAudioRush();
  if (!a) return;
  if (tipo === "aviso") {            // zumbido grave que vai subindo
    tomRush(a, RUSH_AVISO / 60, 45, 110, 0.35, "sine");
    tomRush(a, RUSH_AVISO / 60, 90, 230, 0.10, "sawtooth");
  } else if (tipo === "passa") {     // o rugido dele passando
    ruidoRush(a, 1.8, 250, 1500, 0.9);
    tomRush(a, 1.8, 110, 55, 0.35, "sawtooth");
  } else if (tipo === "grito") {     // o grito do susto
    ruidoRush(a, 1.2, 2400, 800, 1);
    tomRush(a, 1.2, 700, 260, 0.35, "sawtooth");
    tomRush(a, 1.2, 1350, 500, 0.2, "sawtooth");
    tomRush(a, 1.2, 80, 40, 0.5, "square");
  }
}

// ---------- JUMPSCARE ----------
// O rosto dispara de onde estava até encher a tela, tremendo; no fim fecha em preto.
function desenharSustoRush() {
  if (!faseAtual.rush || estado !== "susto") return;
  const f = rush.susto;
  const t = performance.now() / 1000;

  // escurece o cenário e pinta as bordas de vermelho pulsando
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0," + Math.min(0.9, 0.45 + f * 0.05) + ")";
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  const v = ctx.createRadialGradient(LARGURA / 2, ALTURA / 2, 70, LARGURA / 2, ALTURA / 2, 470);
  v.addColorStop(0, "rgba(140,0,0,0)");
  v.addColorStop(1, "rgba(140,0,0," + (0.5 + Math.sin(f * 1.4) * 0.15) + ")");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.restore();

  // o rosto: parte de onde estava e cresce rápido, depois continua tremendo e crescendo devagar
  const u = Math.min(1, f / 8);
  const e = 1 - Math.pow(1 - u, 3);
  const tremor = 6 + f * 0.25;
  const cx = rush.sx + (LARGURA / 2 - rush.sx) * e + (Math.random() - 0.5) * tremor;
  const cy = rush.sy + (200 - rush.sy) * e + (Math.random() - 0.5) * tremor;
  const esc = 0.9 + 3.7 * e + f * 0.012;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(esc, esc);
  rostoRush(0, 0, t + f * 0.08);
  ctx.restore();

  // flash branco no primeiro instante
  if (f < 7) {
    ctx.fillStyle = "rgba(255,255,255," + (1 - f / 7) * 0.95 + ")";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
  }
  // nos últimos quadros fecha em preto
  const resto = RUSH_SUSTO_DURACAO - f;
  if (resto < 12) {
    ctx.fillStyle = "rgba(0,0,0," + (1 - resto / 12) + ")";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
  }
}

// ---------- DICAS DOS ARMÁRIOS ----------
// No escuro o contorno do armário brilha, e na frente dele aparece "Segure Shift".
function desenharDicasRush() {
  if (!faseAtual.rush || estado !== "jogando") return;
  const t = performance.now() / 1000;
  const perto = armarioPerto();

  ctx.save();
  ctx.translate(-Math.round(camera) + rush.tx, -Math.round(cameraY) + rush.ty);

  for (const o of objetos) {
    if (o.tipo !== "armario") continue;
    const y = o.y === undefined ? 380 : o.y;
    if (y - cameraY < -80 || y - cameraY > ALTURA + 30) continue;     // fora da tela

    if (rush.escuro > 0.3) {
      const a = Math.min(1, (rush.escuro - 0.3) * 1.6) * (0.6 + Math.sin(t * 5 + o.x) * 0.12);
      ctx.save();
      ctx.shadowColor = "#ffb86b";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "rgba(255,184,107," + a + ")";
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x - 26, y - 62, 52, 60);
      ctx.strokeRect(o.x - 30, y - 68, 60, 7);
      ctx.restore();
    }

    if (perto === o && !jogador.escondido) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 6;
      ctx.font = "13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("Segure Shift", o.x, y - 78);
      ctx.restore();
    }
  }

  ctx.restore();
}

// ---------- TESTE ----------
// Aperte M para chamar o monstro na hora (só na fase 3). Pode apagar depois.
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM" && faseAtual && faseAtual.rush && estado === "jogando" && rush.etapa === "espera") {
    rush.timer = 0;
  }
});