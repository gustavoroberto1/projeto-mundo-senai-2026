// =====================================================
// MENU: tela inicial (Jogar) e escolha de fases
//   estado "menu"  = tela inicial
//   estado "fases" = escolha da fase
// =====================================================
const TITULO_JOGO = "LIMBO";

// Quando quiser bloquear fases, mude aqui (ex.: return i <= faseMaisAlcancada;)
function faseLiberada(i) {
  return true;
}

function noMenu() {
  return estado === "menu" || estado === "fases";
}

const mouse = { x: -1, y: -1 };

const botaoJogar = { x: LARGURA / 2 - 90, y: 270, w: 180, h: 46, texto: "Jogar" };
const botaoVoltar = { x: 16, y: 16, w: 90, h: 32, texto: "Voltar" };

const CARD_W = 200, CARD_H = 110, CARD_GAP = 30, CARDS_POR_LINHA = 3;

function retanguloFase(i) {
  const linha = Math.floor(i / CARDS_POR_LINHA);
  const col = i % CARDS_POR_LINHA;
  const naLinha = Math.min(CARDS_POR_LINHA, FASES.length - linha * CARDS_POR_LINHA);
  const largTotal = naLinha * CARD_W + (naLinha - 1) * CARD_GAP;
  return {
    x: (LARGURA - largTotal) / 2 + col * (CARD_W + CARD_GAP),
    y: 110 + linha * (CARD_H + 44),
    w: CARD_W,
    h: CARD_H,
  };
}

function dentroDe(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// ---------- ações ----------
function iniciarFase(i) {
  if (!FASES[i] || !faseLiberada(i)) return;
  carregarFase(i);
  reiniciar();            // deixa estado = "jogando"
  mortes = 0;
  canvas.style.cursor = "default";
}

function voltarAoMenu() {
  carregarFase(0);        // o fundo do menu é a floresta
  reiniciar();
  estado = "menu";
  mortes = 0;
}

// ---------- entrada (mouse e toque) ----------
function posicaoNoCanvas(e) {
  const r = canvas.getBoundingClientRect();   // o canvas é redimensionado pelo CSS
  mouse.x = (e.clientX - r.left) * LARGURA / r.width;
  mouse.y = (e.clientY - r.top) * ALTURA / r.height;
}

canvas.addEventListener("pointermove", posicaoNoCanvas);

canvas.addEventListener("pointerdown", (e) => {
  posicaoNoCanvas(e);
  if (estado === "menu") {
    if (dentroDe(botaoJogar, mouse.x, mouse.y)) estado = "fases";
  } else if (estado === "fases") {
    if (dentroDe(botaoVoltar, mouse.x, mouse.y)) { estado = "menu"; return; }
    for (let i = 0; i < FASES.length; i++) {
      if (dentroDe(retanguloFase(i), mouse.x, mouse.y)) { iniciarFase(i); return; }
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (estado === "menu") {
    if (e.code === "Enter" || e.code === "Space") estado = "fases";
  } else if (estado === "fases") {
    if (e.code === "Escape") estado = "menu";
    if (e.code.startsWith("Digit")) iniciarFase(Number(e.code[5]) - 1);   // 1, 2, 3... = atalho
  } else if (e.code === "Escape") {
    voltarAoMenu();       // durante o jogo, Esc volta ao menu
  }
});

// ---------- desenho ----------
function desenharBotao(b) {
  const hover = dentroDe(b, mouse.x, mouse.y);
  ctx.save();
  ctx.fillStyle = hover ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.45)";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = hover ? "#fff" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w, b.h);
  ctx.fillStyle = hover ? "#fff" : "rgba(255,255,255,0.8)";
  ctx.font = "22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.texto, b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.restore();
  return hover;
}

function desenharCardFase(i) {
  const r = retanguloFase(i);
  const f = FASES[i];
  const pal = PALETAS[f.paleta] || PALETAS[0];
  const liberada = faseLiberada(i);
  const hover = liberada && dentroDe(r, mouse.x, mouse.y);

  ctx.save();
  if (!liberada) ctx.globalAlpha = 0.4;

  // céu da fase
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, pal.ceuCima);
  g.addColorStop(1, pal.ceuBaixo);
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // silhuetas: árvores na floresta, prédios na cidade
  ctx.fillStyle = "#050505";
  for (let k = 0; k < 8; k++) {
    const h = 30 + (k * 37) % 34;
    const x = r.x + 10 + k * 24;
    if (f.cenario === "cidade") ctx.fillRect(x, r.y + r.h - 26 - h, 18, h);
    else ctx.fillRect(x + 6, r.y + r.h - 26 - h, 5, h);
  }
  ctx.fillRect(r.x, r.y + r.h - 26, r.w, 26);   // chão

  // número da fase
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 10;
  ctx.font = "44px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(String(i + 1), r.x + r.w / 2, r.y + 60);
  ctx.shadowBlur = 0;

  // cadeado, se a fase estiver bloqueada
  if (!liberada) {
    const cx = r.x + r.w / 2, cy = r.y + 78;
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - 9, cy, 18, 14);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, Math.PI, 0);
    ctx.stroke();
  }

  // borda
  ctx.strokeStyle = hover ? "#fff" : "rgba(255,255,255,0.35)";
  ctx.lineWidth = hover ? 3 : 1.5;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  // nome
  ctx.fillStyle = hover ? "#fff" : "rgba(255,255,255,0.75)";
  ctx.font = "18px Georgia, serif";
  ctx.fillText(f.nome, r.x + r.w / 2, r.y + r.h + 24);
  ctx.restore();

  return hover;
}

function desenharMenu() {
  ctx.save();
  let clicavel = false;

  if (estado === "menu") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 22;
    ctx.font = "72px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(TITULO_JOGO, LARGURA / 2, 190);
    ctx.shadowBlur = 0;

    if (desenharBotao(botaoJogar)) clicavel = true;

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Enter - jogar     F - tela cheia", LARGURA / 2, ALTURA - 24);

  } else {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    ctx.fillStyle = "#fff";
    ctx.font = "32px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Escolha a fase", LARGURA / 2, 80);

    if (desenharBotao(botaoVoltar)) clicavel = true;
    for (let i = 0; i < FASES.length; i++) {
      if (desenharCardFase(i)) clicavel = true;
    }

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Esc - voltar     1 a " + FASES.length + " - atalho", LARGURA / 2, ALTURA - 16);
  }

  ctx.restore();
  canvas.style.cursor = clicavel ? "pointer" : "default";
}