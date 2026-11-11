// casa.js - Fase 3 (casa mal-assombrada): uma torre para ESCALAR, só para cima.
// Os DADOS da fase (beiradas, espinhos, luz, objetos) ficam em fase.js, na terceira entrada de FASES.
// Aqui ficam só os desenhos: paredes e janelas, detalhes das tábuas e a decoração (com os armários).

const CASA_LARGURA = 800;
const CASA_TETO = -1700;                                   // daqui para cima é o telhado
const CASA_ANDARES = [380, -100, -580, -1060, CASA_TETO];  // chão de cada andar, de baixo para cima (o último é o teto)
const CASA_PAPEIS = [
  { cima: "#120c18", baixo: "#271b2e" },   // térreo
  { cima: "#0f101c", baixo: "#1d2133" },   // 1º andar (azulado)
  { cima: "#170d12", baixo: "#2e1a22" },   // 2º andar (vinho)
  { cima: "#0c0a10", baixo: "#1c1722" },   // sótão (quase preto)
];

// ---------- CENÁRIO (desenhado ANTES das plataformas) ----------
function janela(x, y) {   // x, y = canto de cima à esquerda; 44 x 70
  ctx.save();
  ctx.shadowColor = "#ff9a3c";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "rgba(255,160,60,0.5)";
  ctx.beginPath();
  ctx.moveTo(x, y + 70); ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x + 22, y - 10, x + 44, y + 20);
  ctx.lineTo(x + 44, y + 70);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 4); ctx.lineTo(x + 22, y + 70);
  ctx.moveTo(x, y + 38);     ctx.lineTo(x + 44, y + 38);
  ctx.stroke();
  ctx.restore();
}

function desenharCasa() {
  const vTopo = cameraY - 4, vBase = cameraY + ALTURA + 4;   // faixa do mundo que aparece na tela

  // papel de parede de cada andar (a cor muda de andar para andar)
  for (let i = 0; i < CASA_PAPEIS.length; i++) {
    const baixo = CASA_ANDARES[i], cima = CASA_ANDARES[i + 1];
    const y0 = Math.max(cima, vTopo), y1 = Math.min(baixo, vBase);
    if (y1 <= y0) continue;

    const g = ctx.createLinearGradient(0, cima, 0, baixo);
    g.addColorStop(0, CASA_PAPEIS[i].cima);
    g.addColorStop(1, CASA_PAPEIS[i].baixo);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, CASA_LARGURA, y1 - y0);

    ctx.fillStyle = "rgba(255,255,255,0.03)";                 // listras
    for (let x = 20; x < CASA_LARGURA; x += 40) ctx.fillRect(x, y0, 14, y1 - y0);
  }

  // cornija na divisa de cada andar
  for (const y of CASA_ANDARES.slice(1, -1)) {
    if (y < vTopo - 12 || y > vBase + 12) continue;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, y - 6, CASA_LARGURA, 12);
    ctx.fillStyle = "rgba(255,190,120,0.10)";
    ctx.fillRect(0, y - 6, CASA_LARGURA, 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    for (let x = 6; x < CASA_LARGURA; x += 24) ctx.fillRect(x, y + 6, 10, 5);
  }

  // rodapé do térreo
  if (vBase > 362 && vTopo < 380) {
    ctx.fillStyle = "#08050b";
    ctx.fillRect(0, 362, CASA_LARGURA, 18);
  }

  // janelas, uma de cada lado, de baixo para cima
  for (let i = 0; i < 8; i++) {
    const wy = 270 - i * 240;
    if (wy + 80 < vTopo || wy - 20 > vBase) continue;
    janela(i % 2 ? 676 : 80, wy);
  }

  // colunas nas laterais
  ctx.fillStyle = "#050308";
  ctx.fillRect(0, vTopo, 10, vBase - vTopo);
  ctx.fillRect(CASA_LARGURA - 10, vTopo, 10, vBase - vTopo);

  // telhado
  if (vTopo < CASA_TETO) {
    ctx.fillStyle = "#07040a";
    ctx.fillRect(0, vTopo, CASA_LARGURA, CASA_TETO - vTopo);
    ctx.fillStyle = "#120c18";
    ctx.fillRect(0, CASA_TETO - 10, CASA_LARGURA, 10);        // viga do teto
    ctx.strokeStyle = "#0d0813";                               // escoras nos cantos
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, CASA_TETO + 90);                ctx.lineTo(90, CASA_TETO);
    ctx.moveTo(CASA_LARGURA, CASA_TETO + 90);     ctx.lineTo(CASA_LARGURA - 90, CASA_TETO);
    ctx.stroke();
  }
}

// ---------- DETALHES DAS PLATAFORMAS (desenhados DEPOIS delas) ----------
function desenharDetalhesCasa() {
  for (const p of plataformas) {
    if (!p.tipo) continue;
    if (p.y > cameraY + ALTURA + 40 || p.y + p.h < cameraY - 40) continue;   // fora da tela

    if (p.tipo === "assoalho") { detalheAssoalho(p); continue; }

    ctx.strokeStyle = "#2f2536";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (p.tipo === "caixote") { ctx.rect(p.x + 3, p.y + 3, p.w - 6, p.h - 6); ctx.moveTo(p.x + 3, p.y + 3); ctx.lineTo(p.x + p.w - 3, p.y + p.h - 3); }
    if (p.tipo === "bau")     { ctx.moveTo(p.x, p.y + 12); ctx.lineTo(p.x + p.w, p.y + 12); ctx.rect(p.x + p.w / 2 - 4, p.y + 8, 8, 10); }
    if (p.tipo === "comoda")  { ctx.moveTo(p.x, p.y + p.h / 2); ctx.lineTo(p.x + p.w, p.y + p.h / 2); ctx.moveTo(p.x + p.w / 2 - 4, p.y + 8); ctx.lineTo(p.x + p.w / 2 + 4, p.y + 8); }
    if (p.tipo === "barril")  { ctx.moveTo(p.x, p.y + 12); ctx.lineTo(p.x + p.w, p.y + 12); ctx.moveTo(p.x, p.y + p.h - 12); ctx.lineTo(p.x + p.w, p.y + p.h - 12); }
    ctx.stroke();
  }
}

// Tábua de assoalho: luz quente em cima, emendas, pregos e suportes embaixo
function detalheAssoalho(p) {
  const prof = Math.min(p.h, 14);

  ctx.strokeStyle = "rgba(255,170,90,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 0.6);
  ctx.lineTo(p.x + p.w, p.y + 0.6);
  ctx.stroke();

  ctx.strokeStyle = "#251b2b";
  ctx.beginPath();
  for (let x = p.x + 34; x < p.x + p.w - 6; x += 34) { ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + prof); }
  ctx.stroke();

  ctx.fillStyle = "#3a2f40";
  for (let x = p.x + 8; x < p.x + p.w - 4; x += 34) {
    ctx.beginPath();
    ctx.arc(x, p.y + 4, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.h > 30) return;                       // o piso do térreo é grosso: sem suportes
  ctx.fillStyle = "#050505";
  for (const sx of [p.x + 18, p.x + p.w - 18]) {
    ctx.beginPath();
    ctx.moveTo(sx - 9, p.y + p.h);
    ctx.lineTo(sx + 9, p.y + p.h);
    ctx.lineTo(sx, p.y + p.h + 13);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- DECORAÇÃO E ARMÁRIOS ----------
const TIPOS_DECOR = ["abobora", "candelabro", "teia", "quadro", "lustre", "morcego", "armario"];

function desenharDecoracaoCasa() {
  const t = performance.now() / 1000;

  for (const o of objetos) {
    if (!TIPOS_DECOR.includes(o.tipo)) continue;
    const oy = o.y === undefined ? 380 : o.y;
    if (o.x < camera - 120 || o.x > camera + LARGURA + 120) continue;     // fora da tela (lados)
    if (oy < cameraY - 200 || oy > cameraY + ALTURA + 200) continue;      // fora da tela (cima/baixo)

    ctx.save();
    ctx.translate(o.x, oy);   // (0,0) = base do objeto
    ctx.fillStyle = "#030303";
    ctx.strokeStyle = "#030303";
    ctx.lineCap = "round";
    const pisca = 0.8 + Math.sin(t * 9 + o.x) * 0.1 + Math.sin(t * 5.3 + o.x) * 0.1;

    if (o.tipo === "abobora") {
      ctx.fillStyle = "#3a1a06";
      ctx.beginPath(); ctx.ellipse(0, -12, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#030303"; ctx.fillRect(-1.5, -27, 3, 6);                 // cabinho
      ctx.shadowColor = "#ff9a3c"; ctx.shadowBlur = 14 * pisca;
      ctx.fillStyle = "rgba(255,179,71," + pisca + ")";                          // rosto aceso
      ctx.beginPath();
      ctx.moveTo(-9, -15); ctx.lineTo(-4, -15); ctx.lineTo(-6.5, -21);
      ctx.moveTo(4, -15);  ctx.lineTo(9, -15);  ctx.lineTo(6.5, -21);
      ctx.moveTo(-8, -9); ctx.lineTo(-4, -6); ctx.lineTo(-1, -9); ctx.lineTo(2, -6); ctx.lineTo(5, -9); ctx.lineTo(8, -8); ctx.lineTo(5, -3); ctx.lineTo(-5, -3);
      ctx.fill();

    } else if (o.tipo === "candelabro") {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.moveTo(-9, -38); ctx.quadraticCurveTo(-9, -30, 0, -30); ctx.quadraticCurveTo(9, -30, 9, -38); ctx.stroke();
      ctx.fillRect(-8, -2, 16, 3);
      for (const [dx, dy] of [[-9, -38], [0, -42], [9, -38]]) {
        ctx.fillStyle = "#1d1814"; ctx.fillRect(dx - 2, dy - 10, 4, 10);
        ctx.shadowColor = "#ffb347"; ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(255,207,107," + pisca + ")";
        ctx.beginPath(); ctx.ellipse(dx, dy - 14, 2, 4 * pisca, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

    } else if (o.tipo === "teia") {
      if (o.espelho) ctx.scale(-1, 1);
      ctx.strokeStyle = "rgba(225,225,225,0.35)";
      ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) { const a = k * Math.PI / 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); ctx.stroke(); }
      for (let r = 14; r <= 58; r += 14) { ctx.beginPath(); ctx.arc(0, 0, r, 0.05, Math.PI / 2 - 0.05); ctx.stroke(); }

    } else if (o.tipo === "quadro") {
      ctx.rotate(((o.x % 3) - 1) * 0.06);                // sempre meio torto
      ctx.beginPath(); ctx.moveTo(-14, -26); ctx.lineTo(0, -38); ctx.lineTo(14, -26); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillRect(-20, -26, 40, 52);
      ctx.fillStyle = "#1e1624"; ctx.fillRect(-16, -22, 32, 44);
      ctx.fillStyle = "#08050b"; ctx.beginPath(); ctx.ellipse(0, -2, 11, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = "#fff"; ctx.shadowBlur = 6; ctx.fillStyle = "#fff";   // retrato com olhos que brilham
      ctx.fillRect(-7, -6, 3, 5); ctx.fillRect(4, -6, 3, 5);

    } else if (o.tipo === "lustre") {
      ctx.rotate(Math.sin(t * 0.8) * 0.03);               // balança pendurado
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, o.comp); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, o.comp, 28, 7, 0, 0, Math.PI * 2); ctx.stroke();
      for (const dx of [-24, -12, 0, 12, 24]) {
        ctx.shadowColor = "#ffb347"; ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(255,207,107," + pisca + ")";
        ctx.beginPath(); ctx.ellipse(dx, o.comp - 10, 2, 4 * pisca, 0, 0, Math.PI * 2); ctx.fill();
      }

    } else if (o.tipo === "morcego") {
      const f = Math.sin(t * 9 + o.x) * 6;                // bate as asas
      ctx.translate(Math.sin(t * 0.6 + o.x) * 15, Math.sin(t * 1.1 + o.x) * 6);
      for (const d of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(d * 8, -10 - f, d * 22, -4 + f);
        ctx.quadraticCurveTo(d * 15, 0, d * 11, 4);
        ctx.quadraticCurveTo(d * 6, 1, 0, 6);
        ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(0, 2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();

    } else if (o.tipo === "armario") {
      ctx.fillStyle = "#0d0807";
      ctx.fillRect(-26, -62, 52, 60);                      // corpo
      ctx.fillRect(-30, -68, 60, 7);                       // coroa
      ctx.fillRect(-24, -2, 6, 3); ctx.fillRect(18, -2, 6, 3);   // pés
      ctx.fillStyle = "#1c1412"; ctx.fillRect(-30, -68, 60, 1.5);   // luz na borda de cima
      ctx.strokeStyle = "#2b1e1a"; ctx.lineWidth = 1.5;
      ctx.strokeRect(-22, -56, 19, 50); ctx.strokeRect(3, -56, 19, 50);   // portas
      ctx.fillStyle = "#5a4a34";
      ctx.beginPath(); ctx.arc(-6, -32, 2, 0, Math.PI * 2); ctx.arc(7, -32, 2, 0, Math.PI * 2); ctx.fill();
    }      // tem alguém escondido aqui: a fresta escurece e um olho brilha lá dentro
    if (jogador.escondido && armarioPerto() === o) {
      ctx.fillStyle = "#000";
      ctx.fillRect(-1.5, -56, 3, 50);
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(0, -38, 1.6, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Para as funções dos armários (que vêm depois): devolve o armário ao alcance do jogador, ou null.
// "Ao alcance" = pés na mesma altura da base do armário e a menos de 40 de distância na horizontal.
function armarioPerto() {
  const cx = jogador.x + jogador.w / 2;
  const pes = jogador.y + jogador.h;
  return objetos.find((o) =>
    o.tipo === "armario" &&
    Math.abs(o.x - cx) < 40 &&
    Math.abs((o.y === undefined ? 380 : o.y) - pes) < 6
  ) || null;
}