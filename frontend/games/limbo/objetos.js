// =====================================================================
//  OBJETOS  -  decoração do cenário + sistema de iluminação
// =====================================================================

// Se os objetos da casa (abobora, candelabro, quadro, armario, morcego, lustre, teia)
// já são desenhados em OUTRO arquivo, ponha false para não aparecerem duplicados.
const OBJETOS_CASA_AQUI = true;

// Ajustes da iluminação (só escurece a fase "casa"; as luzes coloridas funcionam em qualquer fase)
const ILUM = {
  ligada: true,
  ambiente: "10,4,22",   // cor da escuridão (R,G,B)
  escuridao: 0.58,       // 0 = sem escuro, 1 = breu total. Se ficar escuro demais, baixe.
  poeira: true,          // partículas flutuando dentro da luz
};

const LUZES = [];        // luzes do quadro atual (preenchida durante desenharObjetos)
let _camadaEscura = null;

// Registra uma luz. x,y no sistema de coordenadas ATUAL do canvas (funciona com câmera/translate).
//   raio  = alcance do brilho | rgb = "255,140,20" | forca = 0..1
//   cone  = { ang, comp, ab, f }  feixe direcional (ang em radianos: PI/2 = para baixo)
function adicionarLuz(x, y, raio, rgb, forca, cone) {
  const m = ctx.getTransform();
  const s = Math.hypot(m.a, m.b) || 1;
  LUZES.push({
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
    r: raio * s,
    rgb: rgb,
    f: forca === undefined ? 1 : forca,
    cone: cone ? { ang: cone.ang, comp: cone.comp * s, ab: cone.ab, f: cone.f === undefined ? 1 : cone.f } : null,
  });
}

// tremida de chama de vela (0.55 a 1.05)
function tremer(t, seed) {
  return 0.8 + 0.2 * Math.sin(t * 13 + seed) * Math.sin(t * 7.3 + seed * 2.1) + 0.05 * Math.sin(t * 31 + seed);
}

// chama de vela: (x,y) é a base da chama
function chama(x, y, s, t, seed) {
  const sway = Math.sin(t * 9 + seed) * 1.3 * s;
  const alt = (9 + Math.sin(t * 13 + seed * 2) * 1.6) * s;
  ctx.save();
  ctx.shadowColor = "rgba(255,150,40,0.95)";
  ctx.shadowBlur = 10 * s;
  ctx.fillStyle = "#ff8f1c";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 3.6 * s, y - alt * 0.45, x + sway, y - alt);
  ctx.quadraticCurveTo(x + 3.6 * s, y - alt * 0.45, x, y);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffe9a0";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 1.6 * s, y - alt * 0.3, x + sway * 0.5, y - alt * 0.6);
  ctx.quadraticCurveTo(x + 1.6 * s, y - alt * 0.3, x, y);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------
//  DECORAÇÕES (cada função desenha com (0,0) = base do objeto)
// ---------------------------------------------------------------------

// LÂMPADA: y = onde o fio prende | comp = fio | cor: laranja|verde|roxa|azul|vermelha | pisca: true
function desenharLampada(o, t) {
  const cores = {
    laranja:  ["255,140,20", "#ffb347"],
    verde:    ["120,255,120", "#b6ffb0"],
    roxa:     ["170,90,255", "#d9b3ff"],
    azul:     ["90,170,255", "#bfe0ff"],
    vermelha: ["255,60,60", "#ffb0b0"],
  };
  const [rgb, miolo] = cores[o.cor] || cores.laranja;
  const comp = o.comp || 50;

  let brilho = 0.88 + Math.sin(t * 3 + o.x) * 0.08;
  if (o.pisca) {                                         // falha elétrica
    const rajada = Math.sin(t * 2.3 + o.x) * Math.sin(t * 5.1 + o.x * 0.3);
    if (rajada > 0.8) brilho = Math.sin(t * 70 + o.x) > 0 ? 0.55 : 0.08;
  }

  ctx.rotate(Math.sin(t * 0.8 + o.x) * 0.035);          // balança no fio

  ctx.strokeStyle = "#2a2230";                           // fio
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, comp - 18); ctx.stroke();

  ctx.fillStyle = "#17121d";                             // campânula de metal
  ctx.beginPath();
  ctx.moveTo(-3, comp - 20); ctx.lineTo(3, comp - 20);
  ctx.lineTo(13, comp - 6);  ctx.lineTo(-13, comp - 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#2b2236";
  ctx.fillRect(-13, comp - 7, 26, 2);

  ctx.save();                                            // bulbo
  ctx.shadowColor = `rgb(${rgb})`;
  ctx.shadowBlur = 18 * brilho;
  ctx.globalAlpha = Math.min(1, 0.3 + brilho);
  ctx.fillStyle = miolo;
  ctx.beginPath(); ctx.arc(0, comp, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(0, comp, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  adicionarLuz(0, comp, 175, rgb, brilho, { ang: Math.PI / 2, comp: 210, ab: 0.5, f: brilho * 0.8 });
}

// OLHOS no escuro: { tipo:"olhos", x, y (centro), cor: "amarelo"|"verde"|"laranja"|"vermelho" }
function desenharOlhos(o, t) {
  const cores = { amarelo: "#ffe45c", verde: "#7dff7d", laranja: "#ff9a2e", vermelho: "#ff4040" };
  const cor = cores[o.cor] || cores.amarelo;
  const ciclo = (t * 0.4 + o.x * 0.013) % 1;
  const abertura = ciclo > 0.94 ? 0.1 : 1;
  ctx.shadowColor = cor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = cor;
  for (const dx of [-7, 7]) {
    ctx.beginPath();
    ctx.ellipse(dx, 0, 3.5, 2.5 * abertura + 0.3, dx < 0 ? 0.35 : -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  adicionarLuz(0, 0, 28, cor === "#ff4040" ? "255,60,60" : "200,255,120", 0.4);
}

// ABÓBORA com vela dentro (luz laranja que treme). Opcional: s = escala
function desenharAbobora(o, t) {
  const s = o.s || 1;
  const fl = Math.min(1, tremer(t, o.x));
  ctx.scale(s, s);

  const gomos = [[-8, 7], [8, 7], [-4, 8.5], [4, 8.5], [0, 9]];
  ctx.fillStyle = "#0b0408";
  for (const [dx, rx] of gomos) {
    ctx.beginPath(); ctx.ellipse(dx, -11, rx, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = `rgba(255,120,20,${0.25 * fl})`;     // contorno de luz nos gomos
  ctx.lineWidth = 1;
  for (const [dx, rx] of gomos) {
    ctx.beginPath(); ctx.ellipse(dx, -11, rx, 11, 0, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.fillStyle = "#13200e";                             // cabo
  ctx.beginPath();
  ctx.moveTo(-2.5, -21); ctx.quadraticCurveTo(-3, -27, 2, -29);
  ctx.lineTo(4.5, -27);  ctx.quadraticCurveTo(1.5, -25, 2.5, -21);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#1d3a16";                           // gavinha
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(8, -23, 3, Math.PI, Math.PI * 2.6); ctx.stroke();

  ctx.save();                                            // rosto aceso
  ctx.shadowColor = "rgba(255,140,30,0.95)";
  ctx.shadowBlur = 9 * fl;
  ctx.fillStyle = `rgba(255,${150 + Math.floor(60 * fl)},40,${0.95 * fl})`;
  ctx.beginPath();
  ctx.moveTo(-7, -15); ctx.lineTo(-2, -15); ctx.lineTo(-4.5, -20); ctx.closePath();
  ctx.moveTo(2, -15);  ctx.lineTo(7, -15);  ctx.lineTo(4.5, -20);  ctx.closePath();
  ctx.moveTo(-1.2, -12); ctx.lineTo(1.2, -12); ctx.lineTo(0, -14.5); ctx.closePath();
  ctx.moveTo(-8, -10); ctx.lineTo(-5, -8); ctx.lineTo(-3, -10); ctx.lineTo(0, -7.5);
  ctx.lineTo(3, -10);  ctx.lineTo(5, -8);  ctx.lineTo(8, -10);  ctx.lineTo(6, -5);
  ctx.lineTo(3, -6.5); ctx.lineTo(0, -4);  ctx.lineTo(-3, -6.5); ctx.lineTo(-6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  adicionarLuz(0, -12, 100, "255,125,25", 0.95 * fl);
}

// CANDELABRO de 3 velas
function desenharCandelabro(o, t) {
  ctx.fillStyle = "#0a0608";
  ctx.strokeStyle = "#0a0608";
  ctx.beginPath(); ctx.ellipse(0, -3, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-1.5, -30, 3, 27);
  ctx.beginPath(); ctx.ellipse(0, -14, 3.6, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -26); ctx.quadraticCurveTo(-13, -22, -13, -33);
  ctx.moveTo(0, -26); ctx.quadraticCurveTo(13, -22, 13, -33);
  ctx.stroke();
  const velas = [[-13, -33, 8], [0, -30, 12], [13, -33, 8]];
  for (const [vx, vy, vh] of velas) {
    ctx.fillStyle = "#2b2219";
    ctx.fillRect(vx - 2, vy - vh, 4, vh);
    ctx.fillStyle = "#6b5a40";
    ctx.fillRect(vx - 2, vy - vh, 1.2, vh);
    ctx.fillStyle = "#0a0608";
    ctx.fillRect(vx - 3.5, vy - 1.5, 7, 2);
    chama(vx, vy - vh, 1, t, vx + o.x);
  }
  adicionarLuz(0, -40, 115, "255,170,60", 0.9 * Math.min(1, tremer(t, o.x)));
}

// VELAS derretidas, de alturas diferentes
function desenharVelas(o, t) {
  ctx.fillStyle = "#1a1410";
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 2.5, 0, 0, Math.PI * 2); ctx.fill();   // poça de cera
  const velas = [[-8, 12], [0, 20], [8, 9], [14, 15]];
  for (const [vx, vh] of velas) {
    ctx.fillStyle = "#2b2219";
    ctx.fillRect(vx - 2, -vh, 4, vh);
    ctx.fillStyle = "#6b5a40";
    ctx.fillRect(vx - 2, -vh, 1.2, vh);
    ctx.fillStyle = "#3a2e20";                                                    // cera escorrendo
    ctx.fillRect(vx + 0.5, -vh, 1.2, vh * 0.45);
    chama(vx, -vh, 0.9, t, vx + o.x);
  }
  adicionarLuz(2, -20, 75, "255,170,60", 0.8 * Math.min(1, tremer(t, o.x + 3)));
}

// QUADRO assombrado (y = centro). Os olhos do retrato seguem o jogador.
function desenharQuadro(o, t) {
  ctx.rotate(Math.sin(o.x * 0.7) * 0.03);
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(-25, -32, 50, 64);
  ctx.strokeStyle = "#4a3722";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-24, -31, 48, 62);
  ctx.fillStyle = "#0a0810";
  ctx.fillRect(-19, -26, 38, 52);
  ctx.fillStyle = "#17121f";
  ctx.beginPath(); ctx.ellipse(0, -6, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-17, 26); ctx.quadraticCurveTo(-16, 8, 0, 10); ctx.quadraticCurveTo(16, 8, 17, 26);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#5a4528";
  for (const [cx, cy] of [[-25, -32], [25, -32], [-25, 32], [25, 32]]) ctx.fillRect(cx - 2, cy - 2, 4, 4);

  let dx = 0, dy = 0;
  if (typeof jogador !== "undefined") {
    dx = Math.max(-1, Math.min(1, (jogador.x - o.x) / 160));
    dy = Math.max(-1, Math.min(1, (jogador.y - (o.y || 0)) / 150));
  }
  const brilho = 0.55 + 0.3 * Math.sin(t * 2 + o.x);
  ctx.shadowColor = "#b6ff7a";
  ctx.shadowBlur = 6;
  ctx.fillStyle = `rgba(190,255,130,${brilho})`;
  for (const ex of [-3.6, 3.6]) {
    ctx.beginPath(); ctx.ellipse(ex + dx * 1.6, -8 + dy * 1.2, 1.6, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  adicionarLuz(0, -8, 26, "190,255,130", 0.25 * brilho);
}

// ARMÁRIO (w, h do level). De vez em quando algo espia pela fresta da porta.
function desenharArmario(o, t) {
  const w = o.w || 52, h = o.h || 62;
  ctx.fillStyle = "#0a0608";
  ctx.fillRect(-w / 2, -h, w, h - 4);
  ctx.fillRect(-w / 2 - 3, -h - 5, w + 6, 6);            // cornija
  ctx.fillRect(-w / 2 + 2, -5, 6, 5);                    // pés
  ctx.fillRect(w / 2 - 8, -5, 6, 5);
  ctx.strokeStyle = "#241a14";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-w / 2 + 4, -h + 5, w / 2 - 7, h - 16); // almofadas das portas
  ctx.strokeRect(3, -h + 5, w / 2 - 7, h - 16);
  ctx.fillStyle = "#6e5520";                             // maçanetas
  ctx.beginPath(); ctx.arc(-3.5, -h * 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5, -h * 0.5, 1.5, 0, Math.PI * 2); ctx.fill();

  const ciclo = (t * 0.22 + o.x * 0.01) % 1;
  if (ciclo > 0.72 && ciclo < 0.86) {                    // fresta com olhos
    ctx.fillStyle = "#0e1a0e";
    ctx.fillRect(-2, -h + 8, 4, h - 20);
    ctx.shadowColor = "#7dff7d";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#b6ffb0";
    ctx.beginPath(); ctx.arc(-0.9, -h * 0.62, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0.9, -h * 0.62, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// MORCEGO: voa em círculo. Com pendurado:true dorme de cabeça para baixo (y = onde prende).
function desenharMorcego(o, t) {
  const seed = o.x * 0.03;
  ctx.fillStyle = "#050206";
  if (o.pendurado) {
    ctx.rotate(Math.sin(t * 0.9 + seed) * 0.04);
    ctx.fillRect(-0.6, 0, 1.2, 5);
    ctx.beginPath(); ctx.ellipse(0, 11, 3.4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-3.2, 11, 2, 6.5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.2, 11, 2, 6.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 18, 2.6, 0, Math.PI * 2); ctx.fill();
    if (Math.sin(t * 0.6 + seed) > 0.8) {                // abre os olhos de vez em quando
      ctx.fillStyle = "#ff4040";
      ctx.beginPath(); ctx.arc(-1, 18.5, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(1, 18.5, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  const raio = o.raio || 36;
  ctx.translate(Math.cos(t * 0.6 + seed) * raio, Math.sin(t * 1.2 + seed) * 10);
  ctx.scale(-Math.sin(t * 0.6 + seed) > 0 ? 1 : -1, 1);
  const bater = Math.sin(t * 16 + seed) * 0.7;
  ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -6, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, -8); ctx.lineTo(-2.4, -12); ctx.lineTo(-0.6, -8.6);
  ctx.moveTo(3, -8);  ctx.lineTo(2.4, -12);  ctx.lineTo(0.6, -8.6);
  ctx.fill();
  for (const lado of [1, -1]) {
    ctx.save();
    ctx.scale(lado, 1);
    ctx.rotate(-bater);
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.quadraticCurveTo(10, -12, 24, -8);
    ctx.quadraticCurveTo(21, -2, 19, 1);
    ctx.quadraticCurveTo(15, -1, 13, 4);
    ctx.quadraticCurveTo(9, 2, 5, 6);
    ctx.quadraticCurveTo(3, 3, 2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#ff4040";
  ctx.beginPath(); ctx.arc(-1.2, -6.5, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1.2, -6.5, 0.7, 0, Math.PI * 2); ctx.fill();
}

// LUSTRE de velas (y = onde a corrente prende, comp = tamanho da corrente)
function desenharLustre(o, t) {
  const comp = o.comp || 50;
  ctx.rotate(Math.sin(t * 0.7 + o.x * 0.02) * 0.03);
  ctx.strokeStyle = "#0a0608";
  ctx.lineWidth = 1.6;
  for (let k = 0; k < Math.floor(comp / 6); k++) {       // elos
    ctx.beginPath(); ctx.ellipse(0, k * 6 + 3, k % 2 ? 1 : 2.4, 3.2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.translate(0, comp);
  ctx.strokeStyle = "#120c10";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#120c10";
  ctx.beginPath(); ctx.moveTo(-3, 3); ctx.lineTo(3, 3); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();   // pingente
  for (const dx of [-17, 17]) {
    ctx.beginPath(); ctx.moveTo(dx - 1.5, 4); ctx.lineTo(dx + 1.5, 4); ctx.lineTo(dx, 11); ctx.closePath(); ctx.fill();
  }
  for (const vx of [-20, -10, 0, 10, 20]) {
    ctx.fillStyle = "#2b2219";
    ctx.fillRect(vx - 1.8, -11, 3.6, 10);
    ctx.fillStyle = "#6b5a40";
    ctx.fillRect(vx - 1.8, -11, 1, 10);
    chama(vx, -11, 0.9, t, vx + o.x);
  }
  adicionarLuz(0, -8, 160, "255,170,70", 1.0 * Math.min(1, tremer(t, o.x)));
}

// TEIA de canto (espelho:true vira para a esquerda; aranha:true põe uma aranhazinha)
function desenharTeia(o, t) {
  if (o.espelho) ctx.scale(-1, 1);
  const R = o.r || 70;
  const sw = Math.sin(t * 0.8 + o.x * 0.1 + o.y * 0.01) * 1.5;
  ctx.strokeStyle = "rgba(225,225,240,0.30)";
  ctx.lineWidth = 1;
  const n = 6;
  ctx.beginPath();
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI / 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * R + (k > 0 ? sw : 0), Math.sin(a) * R + (k > 0 ? sw * 0.5 : 0));
  }
  ctx.stroke();
  for (let r = 1; r <= 4; r++) {
    const rr = R * r / 4.4;
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI / 2;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (k === 0) ctx.moveTo(x, y);
      else {
        const a0 = ((k - 0.5) / n) * Math.PI / 2;
        ctx.quadraticCurveTo(Math.cos(a0) * rr * 0.86, Math.sin(a0) * rr * 0.86, x, y);
      }
    }
    ctx.stroke();
  }
  if (o.aranha) {
    ctx.save();
    ctx.translate(R * 0.34, R * 0.34);
    ctx.scale(0.6, 0.6);
    corpoAranha(t, o.x);
    ctx.restore();
  }
}

function corpoAranha(t, seed) {
  ctx.fillStyle = "#050206";
  ctx.strokeStyle = "#050206";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 5, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -1, 3, 0, Math.PI * 2); ctx.fill();
  for (const lado of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y0 = -1 + k * 1.6;
      const mex = Math.sin(t * 5 + k + seed) * 1.2;
      ctx.beginPath();
      ctx.moveTo(lado * 2, y0);
      ctx.quadraticCurveTo(lado * (8 + k), y0 - 5 + k * 2.5 + mex, lado * (9 + k * 1.2), y0 + 4 + k * 2);
      ctx.stroke();
    }
  }
  ctx.save();
  ctx.shadowColor = "#ff3b3b";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#ff3b3b";
  ctx.beginPath(); ctx.arc(-1, -1.8, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1, -1.8, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ARANHA pendurada no fio (y = onde o fio prende, comp = fio). Sobe e desce devagar.
function desenharAranha(o, t) {
  const comp = o.comp || 60;
  const len = comp * (0.78 + 0.22 * Math.sin(t * 0.7 + o.x * 0.05));
  ctx.strokeStyle = "rgba(225,225,240,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
  ctx.translate(0, len);
  ctx.rotate(Math.sin(t * 1.3 + o.x) * 0.08);
  corpoAranha(t, o.x);
}

// CAVEIRA com olhos verdes que pulsam (s = escala)
function desenharCaveira(o, t) {
  const s = o.s || 1;
  ctx.scale(s, s);
  ctx.fillStyle = "#b9b19a";
  ctx.beginPath(); ctx.ellipse(0, -11, 7.5, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4.5, -6); ctx.lineTo(-4, -1); ctx.lineTo(4, -1); ctx.lineTo(4.5, -6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#08060a";
  ctx.beginPath(); ctx.ellipse(-3, -11, 2.2, 2.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -11, 2.2, 2.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -8.4); ctx.lineTo(-1.1, -6.2); ctx.lineTo(1.1, -6.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#08060a";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const dx of [-2.4, -0.8, 0.8, 2.4]) { ctx.moveTo(dx, -3.6); ctx.lineTo(dx, -1); }
  ctx.stroke();
  const p = 0.5 + 0.4 * Math.sin(t * 3 + o.x);
  ctx.save();
  ctx.shadowColor = "#7dff7d";
  ctx.shadowBlur = 7;
  ctx.fillStyle = `rgba(130,255,130,${p})`;
  ctx.beginPath(); ctx.arc(-3, -11, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -11, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  adicionarLuz(0, -11, 34, "120,255,120", 0.45 * p);
}

// CALDEIRÃO borbulhando com poção verde
function desenharCaldeirao(o, t) {
  ctx.fillStyle = "#0a090c";
  ctx.fillRect(-15, -6, 4, 6);
  ctx.fillRect(11, -6, 4, 6);
  ctx.beginPath(); ctx.ellipse(0, -19, 20, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#16131a";
  ctx.beginPath(); ctx.ellipse(0, -32, 19, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  const pulso = 0.85 + 0.15 * Math.sin(t * 3 + o.x);
  ctx.save();
  ctx.shadowColor = "#7dff6a";
  ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(125,255,106,${0.9 * pulso})`;
  ctx.beginPath(); ctx.ellipse(0, -32, 15, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  for (let k = 0; k < 5; k++) {                          // bolhas subindo
    const ph = (t * 0.5 + k * 0.21) % 1;
    const bx = -10 + k * 5 + Math.sin(t * 3 + k) * 1.5;
    ctx.fillStyle = `rgba(160,255,140,${1 - ph})`;
    ctx.beginPath(); ctx.arc(bx, -32 - ph * 22, 1 + ph * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  for (let k = 0; k < 3; k++) {                          // fumaça
    const ph = (t * 0.25 + k * 0.33) % 1;
    ctx.fillStyle = `rgba(120,255,120,${0.1 * (1 - ph)})`;
    ctx.beginPath(); ctx.ellipse(Math.sin(t + k * 2) * 6, -36 - ph * 40, 6 + ph * 8, 4 + ph * 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  chama(-6, -1, 1.1, t, o.x);
  chama(6, -1, 1.1, t, o.x + 3);
  adicionarLuz(0, -34, 115, "110,255,100", 0.85 * pulso, { ang: -Math.PI / 2, comp: 80, ab: 0.45, f: 0.5 });
}

// PILHA DE LIVROS velhos
function desenharLivros(o, t) {
  const livros = [[-14, 6, 28, "#2a1230"], [-11, 6, 22, "#1a2a22"], [-12, 6, 26, "#2a1a12"]];
  let y = 0;
  livros.forEach(([x, h, w, cor], k) => {
    ctx.save();
    ctx.translate(x + w / 2, y - h / 2);
    ctx.rotate((k - 1) * 0.05);
    ctx.fillStyle = cor;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#6e5520";
    ctx.fillRect(-w / 2 + 3, -h / 2 + 1, 1.5, h - 2);
    ctx.fillRect(w / 2 - 5, -h / 2 + 1, 1.5, h - 2);
    ctx.restore();
    y -= h;
  });
}

// RELÓGIO de pêndulo: os ponteiros giram para trás
function desenharRelogio(o, t) {
  ctx.fillStyle = "#0b0709";
  ctx.fillRect(-15, -8, 30, 8);
  ctx.fillRect(-11, -76, 22, 70);
  ctx.beginPath();
  ctx.moveTo(-15, -76); ctx.lineTo(-15, -104);
  ctx.quadraticCurveTo(0, -122, 15, -104);
  ctx.lineTo(15, -76); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -118, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#17110f";
  ctx.fillRect(-7, -72, 14, 56);
  const px = Math.sin(t * 2.2 + o.x) * 5.5;
  ctx.strokeStyle = "#6e5520";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(px, -34); ctx.stroke();
  ctx.fillStyle = "#9a7a2c";
  ctx.beginPath(); ctx.arc(px, -32, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = "#9cff9c";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#1c261c";
  ctx.beginPath(); ctx.arc(0, -96, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#4a3a1c";
  ctx.beginPath(); ctx.arc(0, -96, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    ctx.moveTo(Math.cos(a) * 8, -96 + Math.sin(a) * 8);
    ctx.lineTo(Math.cos(a) * 9.4, -96 + Math.sin(a) * 9.4);
  }
  ctx.stroke();
  ctx.strokeStyle = "#c9d8a0";
  ctx.lineWidth = 1.2;
  const am = -t * 0.6 - Math.PI / 2, ah = -t * 0.05 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(0, -96); ctx.lineTo(Math.cos(am) * 8, -96 + Math.sin(am) * 8);
  ctx.moveTo(0, -96); ctx.lineTo(Math.cos(ah) * 5.5, -96 + Math.sin(ah) * 5.5);
  ctx.stroke();
  adicionarLuz(0, -96, 40, "150,255,150", 0.3);
}

// CORVO empoleirado (espelho:true olha para a esquerda)
function desenharCorvo(o, t) {
  if (o.espelho) ctx.scale(-1, 1);
  ctx.fillStyle = "#050206";
  ctx.strokeStyle = "#050206";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, -10, 9, 6, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(-17, -1); ctx.lineTo(-5, -11); ctx.closePath(); ctx.fill();   // cauda
  ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(-1, 0); ctx.moveTo(3, -5); ctx.lineTo(3, 0); ctx.stroke();    // patas
  ctx.save();
  ctx.translate(6, -15);
  ctx.rotate(Math.sin(t * 0.8 + o.x) * 0.18);            // inclina a cabeça
  ctx.beginPath(); ctx.arc(1, -2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(10, -1); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();       // bico
  const pisca = ((t * 0.5 + o.x * 0.02) % 1) > 0.95;
  if (!pisca) {
    ctx.shadowColor = "#ff3b3b";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#ff3b3b";
    ctx.beginPath(); ctx.arc(2.4, -3, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "#1b1620";
  ctx.beginPath(); ctx.arc(-1, -10, 5, 3.4, 5.4); ctx.stroke();
}

// FANTASMA flutuando (y = centro). Muda de direção sozinho.
function desenharFantasma(o, t) {
  const seed = o.x * 0.01;
  const px = Math.sin(t * 0.45 + seed) * 16;
  const py = Math.sin(t * 1.1 + seed) * 6;
  const dir = Math.cos(t * 0.45 + seed) > 0 ? 1 : -1;
  const alpha = 0.3 + 0.12 * Math.sin(t * 1.7 + seed);
  ctx.translate(px, py);
  ctx.scale(dir, 1);
  ctx.save();
  ctx.shadowColor = "rgba(170,200,255,0.8)";
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(0, -24, 0, 26);
  g.addColorStop(0, `rgba(225,238,255,${alpha + 0.18})`);
  g.addColorStop(1, `rgba(190,210,255,${alpha * 0.25})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-13, 12);
  ctx.lineTo(-13, -8);
  ctx.bezierCurveTo(-13, -30, 13, -30, 13, -8);
  ctx.lineTo(13, 12);
  for (let k = 0; k < 4; k++) {                          // barra ondulando
    const x1 = 13 - (k + 0.5) * 6.5, x2 = 13 - (k + 1) * 6.5;
    ctx.quadraticCurveTo(x1, 12 + (k % 2 ? -7 : 7) + Math.sin(t * 4 + k) * 2, x2, 12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#0a0814";
  ctx.beginPath(); ctx.ellipse(-5, -12, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5, -12, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -4, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  adicionarLuz(0, 0, 100, "150,190,255", 0.5 * (alpha / 0.4));
}

// FOGO-FÁTUO: chama azul-esverdeada que vagueia (y = centro)
function desenharFogoFatuo(o, t) {
  const a = o.x * 0.02;
  const pos = (tt) => [Math.cos(tt * 0.7 + a) * 22, Math.sin(tt * 1.1 + a) * 12];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = 6; k >= 0; k--) {                         // rastro
    const [x, y] = pos(t - k * 0.06);
    ctx.fillStyle = `rgba(110,255,220,${0.12 * (1 - k / 7)})`;
    ctx.beginPath(); ctx.arc(x, y, 7 - k * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  const [px, py] = pos(t);
  const g = ctx.createRadialGradient(px, py, 0, px, py, 12);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(120,255,220,0.7)");
  g.addColorStop(1, "rgba(120,255,220,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  adicionarLuz(px, py, 100, "110,255,220", 0.8 * (0.85 + 0.15 * Math.sin(t * 6 + a)));
}

// JANELA com lua e cortinas rasgadas (y = centro). espelho:true joga a luz para a esquerda.
function desenharJanela(o, t) {
  const dir = o.espelho ? -1 : 1;
  ctx.fillStyle = "#0b0710";
  ctx.fillRect(-32, -66, 64, 132);
  ctx.save();                                            // vidro com céu
  ctx.beginPath();
  ctx.moveTo(-28, 40); ctx.lineTo(-28, -20);
  ctx.arc(0, -20, 28, Math.PI, 0);
  ctx.lineTo(28, 40); ctx.closePath();
  ctx.clip();
  const sky = ctx.createLinearGradient(0, -48, 0, 40);
  sky.addColorStop(0, "#232a63");
  sky.addColorStop(1, "#14102e");
  ctx.fillStyle = sky;
  ctx.fillRect(-28, -48, 56, 90);
  ctx.save();
  ctx.shadowColor = "#f3efd0";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#f3efd0";
  ctx.beginPath(); ctx.arc(8 * dir, -14, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "rgba(190,185,150,0.55)";              // crateras
  ctx.beginPath(); ctx.arc(4 * dir, -18, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12 * dir, -9, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(8,6,20,0.85)";                   // nuvem passando
  const cx = ((t * 6 + o.x) % 120) - 60;
  ctx.beginPath(); ctx.ellipse(cx, -8, 20, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 10, -12, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#0b0710";                           // caixilho
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -48); ctx.lineTo(0, 40);
  ctx.moveTo(-28, -8); ctx.lineTo(28, -8);
  ctx.stroke();
  ctx.fillStyle = "#0b0710";                             // peitoril
  ctx.fillRect(-36, 40, 72, 6);
  ctx.fillStyle = "#1d0f26";                             // cortinas rasgadas
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(lado * 30, -50);
    ctx.lineTo(lado * 16, -50);
    ctx.quadraticCurveTo(lado * 12, 0, lado * 18 + Math.sin(t * 0.9 + lado) * 1.5, 38);
    ctx.lineTo(lado * 22, 34); ctx.lineTo(lado * 25, 44); ctx.lineTo(lado * 30, 36);
    ctx.closePath(); ctx.fill();
  }
  adicionarLuz(0, 0, 150, "150,180,255", 0.5);
  adicionarLuz(0, 12, 120, "150,180,255", 0.0, { ang: Math.PI / 2 - 0.55 * dir, comp: 240, ab: 0.24, f: 0.55 });
}

// ---------------------------------------------------------------------
//  Tabelas: qual função desenha cada "tipo"
// ---------------------------------------------------------------------
const DECOR_GERAL = {
  lampada: desenharLampada, olhos: desenharOlhos, aranha: desenharAranha, caveira: desenharCaveira,
  caldeirao: desenharCaldeirao, livros: desenharLivros, relogio: desenharRelogio, corvo: desenharCorvo,
  fantasma: desenharFantasma, fogofatuo: desenharFogoFatuo, janela: desenharJanela, velas: desenharVelas,
};
const DECOR_CASA = {
  abobora: desenharAbobora, candelabro: desenharCandelabro, quadro: desenharQuadro, armario: desenharArmario,
  morcego: desenharMorcego, lustre: desenharLustre, teia: desenharTeia,
};

// ---------------------------------------------------------------------
//  DESENHO DOS OBJETOS
// ---------------------------------------------------------------------
function desenharObjetos() {
  const t = performance.now() / 1000;
  LUZES.length = 0;

  const H = ctx.canvas.height;
  const vertical = typeof faseAtual !== "undefined" && faseAtual && faseAtual.vertical;

  for (const o of objetos) {
    if (o.x < camera - 220 || o.x > camera + LARGURA + 220) continue;   // fora da tela
    if (o.tipo === "lanterna") { desenharLanterna(o.x); continue; }

    if (vertical) {                                      // fora da tela, para cima ou para baixo
      const m = ctx.getTransform();
      const sy = m.b * o.x + m.d * (o.y === undefined ? 380 : o.y) + m.f;
      if (sy < -300 || sy > H + 300) continue;
    }

    ctx.save();
    ctx.translate(o.x, o.y === undefined ? 380 : o.y);   // (0,0) = base do objeto
    ctx.fillStyle = "#030303";
    ctx.strokeStyle = "#030303";
    ctx.lineCap = "round";

    if (o.tipo === "placa") {
      ctx.rotate(-0.04);
      ctx.fillRect(-2, -36, 4, 36);                       // poste
      ctx.save();
      ctx.translate(0, -42);
      ctx.rotate(0.05);
      ctx.fillRect(-17, -10, 34, 20);                     // tábua
      ctx.strokeStyle = "#2a2a2a";                        // seta desenhada na placa
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(9, 0);
      ctx.moveTo(4, -4);  ctx.lineTo(9, 0); ctx.lineTo(4, 4);
      ctx.stroke();
      ctx.restore();

    } else if (o.tipo === "pedra") {
      const s = o.s || 1;
      ctx.beginPath();
      ctx.moveTo(-14 * s, 1);
      ctx.quadraticCurveTo(-12 * s, -15 * s, -2 * s, -13 * s);
      ctx.quadraticCurveTo(10 * s, -17 * s, 15 * s, 1);
      ctx.closePath();
      ctx.fill();

    } else if (o.tipo === "toco") {
      ctx.beginPath();
      ctx.moveTo(-15, 1);
      ctx.quadraticCurveTo(-9, -6, -8, -22);
      ctx.lineTo(8, -24);
      ctx.quadraticCurveTo(9, -6, 16, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";                          // topo cortado
      ctx.beginPath();
      ctx.ellipse(0, -23, 8, 2.5, 0.05, 0, Math.PI * 2);
      ctx.fill();

    } else if (o.tipo === "cerca") {
      const alturas = [34, 28, 36, 22];
      ctx.save();
      ctx.rotate(-0.03);
      ctx.fillRect(-4, -24, 40, 4);                       // travessa (a última tábua caiu)
      ctx.fillRect(52, -22, 18, 4);
      for (let k = 0; k < 4; k++) {
        const px = k * 22;
        ctx.save();
        ctx.translate(px, 0);
        ctx.rotate((k - 1.5) * 0.04);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3, -alturas[k]);
        ctx.lineTo(0, -alturas[k] - 5);                   // ponta da estaca
        ctx.lineTo(3, -alturas[k]);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

    } else if (o.tipo === "galhos") {
      ctx.lineWidth = 1.8;
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.38 + Math.sin(t * 1.2 + k) * 0.03;
        const len = 18 + ruido(o.x + k) * 16;
        const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.quadraticCurveTo(ex * 0.3 + (ruido(k) - 0.5) * 6, ey * 0.6, ex, ey);
        ctx.moveTo(ex * 0.6, ey * 0.6);                   // gravetinho
        ctx.lineTo(ex * 0.6 + (k % 2 ? 8 : -8), ey * 0.6 - 6);
        ctx.stroke();
      }

    } else if (o.tipo === "cogumelos") {
      for (const [dx, h, r] of [[-10, 10, 6], [0, 17, 8], [11, 8, 5]]) {
        ctx.fillStyle = "#030303";
        ctx.fillRect(dx - 1.5, -h, 3, h + 1);             // haste
        ctx.shadowColor = paleta.luz;                     // chapéu brilha de leve
        ctx.shadowBlur = 10;
        ctx.fillStyle = rgba(paleta.luz, 0.6);
        ctx.beginPath();
        ctx.ellipse(dx, -h, r, r * 0.6, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

    } else if (o.tipo === "lapide") {
      ctx.rotate(0.05);
      ctx.beginPath();
      ctx.moveTo(-9, 1);
      ctx.lineTo(-9, -26);
      ctx.quadraticCurveTo(0, -38, 9, -26);
      ctx.lineTo(9, 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#2a2a2a";                        // cruz
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -29); ctx.lineTo(0, -14);
      ctx.moveTo(-4, -24); ctx.lineTo(4, -24);
      ctx.stroke();

    } else if (o.tipo === "corrente") {
      ctx.rotate(Math.sin(t * 0.9 + o.x) * 0.04);         // balança como pêndulo
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 1.5;
      const n = Math.floor(o.comp / 7);
      for (let k = 0; k < n; k++) {                       // elos alternados (de frente e de lado)
        ctx.beginPath();
        ctx.ellipse(0, k * 7 + 3.5, k % 2 ? 1.2 : 3, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();                                    // gancho na ponta
      ctx.arc(0, n * 7 + 6, 4, 0, Math.PI);
      ctx.stroke();

    } else if (DECOR_GERAL[o.tipo]) {
      DECOR_GERAL[o.tipo](o, t);

    } else if (OBJETOS_CASA_AQUI && DECOR_CASA[o.tipo]) {
      DECOR_CASA[o.tipo](o, t);
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------
//  ILUMINAÇÃO  -  chame DEPOIS de desenhar tudo (cenário, objetos, jogador)
//  Escurece a fase "casa" e abre buracos de luz onde há lâmpada, vela, abóbora...
//  Depois pinta a cor das luzes por cima e solta poeira dentro dos feixes.
// ---------------------------------------------------------------------
function caminhoCone(c, l, esc) {
  const dx = Math.cos(l.cone.ang), dy = Math.sin(l.cone.ang);
  const L = l.cone.comp, w = Math.tan(l.cone.ab * esc) * L;
  c.beginPath();
  c.moveTo(l.x, l.y);
  c.lineTo(l.x + dx * L - dy * w, l.y + dy * L + dx * w);
  c.lineTo(l.x + dx * L + dy * w, l.y + dy * L - dx * w);
  c.closePath();
}

function desenharIluminacao() {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const t = performance.now() / 1000;
  const casa = typeof faseAtual !== "undefined" && faseAtual && faseAtual.cenario === "casa";
  const luzes = LUZES.filter((l) => l.x + l.r > 0 && l.x - l.r < W && l.y + l.r > 0 && l.y - l.r < H);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // 1) escuridão com buracos de luz
  if (ILUM.ligada && casa) {
    if (!_camadaEscura) _camadaEscura = document.createElement("canvas");
    if (_camadaEscura.width !== W || _camadaEscura.height !== H) {
      _camadaEscura.width = W;
      _camadaEscura.height = H;
    }
    const c = _camadaEscura.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, W, H);
    c.fillStyle = `rgba(${ILUM.ambiente},${ILUM.escuridao})`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "destination-out";
    for (const l of luzes) {
      if (l.r < 1) continue;
      const f = Math.min(1, l.f);
      if (f > 0) {
        const g = c.createRadialGradient(l.x, l.y, l.r * 0.04, l.x, l.y, l.r);
        g.addColorStop(0, `rgba(0,0,0,${f})`);
        g.addColorStop(0.3, `rgba(0,0,0,${f * 0.78})`);
        g.addColorStop(0.65, `rgba(0,0,0,${f * 0.28})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      }
      if (l.cone) {
        const dx = Math.cos(l.cone.ang), dy = Math.sin(l.cone.ang);
        for (const [esc, al] of [[1, 0.35], [0.72, 0.35], [0.45, 0.4]]) {
          caminhoCone(c, l, esc);
          const g = c.createLinearGradient(l.x, l.y, l.x + dx * l.cone.comp, l.y + dy * l.cone.comp);
          g.addColorStop(0, `rgba(0,0,0,${al * l.cone.f})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g;
          c.fill();
        }
      }
    }
    c.globalCompositeOperation = "source-over";
    ctx.drawImage(_camadaEscura, 0, 0);
  }

  // 2) cor da luz (soma por cima)
  ctx.globalCompositeOperation = "lighter";
  for (const l of luzes) {
    if (l.r < 1) continue;
    if (l.f > 0) {
      const a = 0.3 * l.f;
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(${l.rgb},${a})`);
      g.addColorStop(0.4, `rgba(${l.rgb},${a * 0.45})`);
      g.addColorStop(1, `rgba(${l.rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    if (l.cone) {
      const dx = Math.cos(l.cone.ang), dy = Math.sin(l.cone.ang);
      for (const [esc, al] of [[1, 0.1], [0.72, 0.1], [0.45, 0.12]]) {
        caminhoCone(ctx, l, esc);
        const g = ctx.createLinearGradient(l.x, l.y, l.x + dx * l.cone.comp, l.y + dy * l.cone.comp);
        g.addColorStop(0, `rgba(${l.rgb},${al * l.cone.f})`);
        g.addColorStop(1, `rgba(${l.rgb},0)`);
        ctx.fillStyle = g;
        ctx.fill();
      }
    }
  }

  // 3) poeira flutuando dentro da luz
  if (ILUM.poeira && luzes.length) {
    const esc = H / 450;
    for (let k = 0; k < 48; k++) {
      const px = (((k * 137.5 + Math.sin(t * 0.3 + k) * 18 + t * (4 + (k % 4) * 2)) % W) + W) % W;
      const py = (((k * 89.7 + Math.cos(t * 0.25 + k * 1.7) * 22 - t * (2 + (k % 3))) % H) + H) % H;
      let f = 0, melhor = null, mf = 0;
      for (const l of luzes) {
        const d = Math.hypot(px - l.x, py - l.y);
        const v = Math.max(0, 1 - d / l.r) * l.f;
        f += v;
        if (v > mf) { mf = v; melhor = l; }
      }
      if (!melhor || f < 0.06) continue;
      const a = Math.min(0.85, f * 0.8) * (0.6 + 0.4 * Math.sin(t * 2 + k));
      ctx.fillStyle = `rgba(${melhor.rgb},${a})`;
      ctx.beginPath();
      ctx.arc(px, py, (1.1 + (k % 3) * 0.5) * esc, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------
//  EFEITOS DE TELA  -  chame depois da iluminação
// ---------------------------------------------------------------------

// névoa roxa rasteira em duas camadas, deslizando devagar
function desenharNevoa() {
  const t = performance.now() / 1000;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const esc = H / 450;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let camada = 0; camada < 2; camada++) {
    const vel = camada ? 5 : 11;
    const alfa = camada ? 0.1 : 0.16;
    for (let k = 0; k < 6; k++) {
      const x = ((k * 190 * esc + t * vel * (1 + k * 0.25) * esc) % (W + 440 * esc)) - 220 * esc;
      const y = H - (22 + camada * 26 + (k % 3) * 14) * esc;
      const r = (camada ? 220 : 170) * esc;
      const g = ctx.createRadialGradient(x, y, 8 * esc, x, y, r);
      g.addColorStop(0, `rgba(150,90,200,${alfa})`);
      g.addColorStop(1, "rgba(150,90,200,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);
    }
  }
  ctx.restore();
}

// bordas escuras
function desenharVinheta() {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(5,0,10,0.65)");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Objetos grandes o bastante para esconder o jogador agachado.
// w e h = área protegida (o desenho é um pouco maior). O x do objeto é o centro dele.
const TAMANHO_ABRIGO = {
  rochedo: { w: 54, h: 40 },
  tronco:  { w: 90, h: 40 },
  muro:    { w: 80, h: 42 },
  moita:   { w: 60, h: 38 },
};

// O jogador está escondido do olho?
function escondido() {
  if (!jogador.agachado || !jogador.noChao) return false;

  // 1) atrás de um objeto grande o bastante para cobrir o jogador agachado
  for (const o of objetos) {
    const tam = TAMANHO_ABRIGO[o.tipo];
    if (!tam || tam.h < jogador.h) continue;
    const dentro = jogador.x >= o.x - tam.w / 2 && jogador.x + jogador.w <= o.x + tam.w / 2;
    const noMesmoChao = Math.abs(jogador.y + jogador.h - 380) < 4;
    if (dentro && noMesmoChao) return true;
  }

  // 2) embaixo de um teto (o túnel baixo ou uma plataforma no ar)
  return plataformas.some((p) =>
    p.y + p.h <= jogador.y + 2 &&
    jogador.x >= p.x && jogador.x + jogador.w <= p.x + p.w
  );
}

// Os abrigos são desenhados DEPOIS do boneco, para ele parecer estar atrás deles.
function desenharAbrigos() {
  const t = performance.now() / 1000;

  for (const o of objetos) {
    if (!TAMANHO_ABRIGO[o.tipo]) continue;
    if (o.x < camera - 120 || o.x > camera + LARGURA + 120) continue;
    if (faseAtual.cenario === "cidade" && (o.tipo === "rochedo" || o.tipo === "muro")) {
      desenharAbrigoCidade(o);
      continue;
    }
    ctx.save();
    ctx.translate(o.x, 380);          // (0,0) = base do objeto, no chão
    ctx.fillStyle = "#030303";
    ctx.strokeStyle = "#030303";
    ctx.lineCap = "round";

    if (o.tipo === "rochedo") {
      ctx.beginPath();
      ctx.moveTo(-38, 1);
      ctx.lineTo(-38, -22);
      ctx.quadraticCurveTo(-36, -46, -16, -50);
      ctx.quadraticCurveTo(0, -56, 16, -50);
      ctx.quadraticCurveTo(36, -44, 38, -22);
      ctx.lineTo(38, 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1f1f1f";                        // rachaduras
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -50); ctx.lineTo(-10, -34); ctx.lineTo(-4, -22);
      ctx.moveTo(14, -48); ctx.lineTo(18, -30);
      ctx.stroke();

    } else if (o.tipo === "tronco") {
      ctx.beginPath();
      ctx.moveTo(-54, 1);
      ctx.quadraticCurveTo(-58, -20, -52, -42);
      ctx.lineTo(50, -42);
      ctx.quadraticCurveTo(56, -20, 52, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";                          // ponta cortada, com anéis
      ctx.beginPath();
      ctx.ellipse(51, -21, 5, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(51, -21, 2.5, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#030303";                        // tocos de galhos quebrados
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-26, -40); ctx.lineTo(-32, -58);
      ctx.moveTo(10, -41);  ctx.lineTo(16, -56);
      ctx.stroke();

    } else if (o.tipo === "muro") {
      ctx.beginPath();                                    // topo todo quebrado
      ctx.moveTo(-45, 1);
      ctx.lineTo(-45, -48); ctx.lineTo(-32, -50); ctx.lineTo(-28, -60); ctx.lineTo(-12, -58);
      ctx.lineTo(-8, -48);  ctx.lineTo(8, -52);   ctx.lineTo(14, -46);  ctx.lineTo(30, -48);
      ctx.lineTo(34, -42);  ctx.lineTo(45, -44);  ctx.lineTo(45, 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1c1c1c";                        // juntas dos tijolos
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let y = -12; y > -48; y -= 12) { ctx.moveTo(-45, y); ctx.lineTo(45, y); }
      ctx.moveTo(-22, -12); ctx.lineTo(-22, -24);
      ctx.moveTo(12, -24);  ctx.lineTo(12, -36);
      ctx.moveTo(-6, -36);  ctx.lineTo(-6, -48);
      ctx.stroke();

    } else if (o.tipo === "moita") {
      for (let k = 0; k < 5; k++) {                       // folhagem feita de várias bolhas
        ctx.beginPath();
        ctx.ellipse(-34 + k * 17, -20 - (k % 2) * 8, 20, 24, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(-48, -14, 96, 15);
      ctx.lineWidth = 1.6;                                // gravetos balançando
      for (let k = 0; k < 9; k++) {
        const bx = -40 + k * 10;
        const topo = -44 - (k % 3) * 4;
        ctx.beginPath();
        ctx.moveTo(bx, topo + 10);
        ctx.lineTo(bx + Math.sin(t * 1.5 + k) * 2, topo - 6);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ---------- INSTRUÇÕES (acima da placa) ----------
function desenharInstrucoes() {
  const placa = objetos.find((o) => o.tipo === "placa");
  if (!placa) return;

  // some aos poucos quando o jogador se afasta da placa
  const dist = Math.abs(jogador.x - placa.x);
  const alpha = Math.max(0, Math.min(1, 1 - (dist - 350) / 250));
  if (alpha <= 0) return;

  const linhas = [
    "Setas ou A / D  -  andar",
    "Espaço, W ou seta para cima  -  pular",
    "Shift  -  agachar",
    "R  -  reiniciar",
    "1 a 5  -  trocar a cor do cenário",
  ];

  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.font = "15px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 6;
  for (let i = 0; i < linhas.length; i++) {
    ctx.fillText(linhas[i], placa.x, 220 + i * 20);   // termina logo acima da placa
  }
  ctx.restore();
}