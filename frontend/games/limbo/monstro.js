function aparecerMonstro() {
  monstro.ativo = true;
  monstro.alpha = 0;

  // Começa fora da tela, à direita.
  monstro.x = camera + LARGURA + 160;

  // Altura aleatória.
  monstro.destinoY = 100 + Math.random() * 90;
  monstro.y = monstro.destinoY;

  // Vai até ultrapassar a borda esquerda.
  monstro.destinoX = -160;

  // Velocidade aleatória.
  monstro.velocidade = 0.8 + Math.random() * 0.7;
}



function escolherDestinoMonstro() {
  monstro.destinoX = 50 + Math.random() * (LARGURA - 100);
  monstro.destinoY = 40 + Math.random() * (ALTURA * 0.45);
}






function atualizarMonstro(dt) {
  if (!monstro.ativo) {
    monstro.espera -= dt;

    if (monstro.espera <= 0) {
      aparecerMonstro();
    }

    return;
  }

  monstro.alpha = Math.min(1, monstro.alpha + 0.025 * dt);

  // Movimento contínuo para a esquerda.
  monstro.x -= monstro.velocidade * dt;

  // Oscilação visual sem acumular deslocamento.
  monstro.y = monstro.destinoY +
    Math.sin(performance.now() / 350) * 4;

  // Reinicia o ciclo quando o monstro sair da tela.
  if (monstro.x < camera -160) {
    monstro.ativo = false;
    monstro.alpha = 0;
    monstro.espera = 120 + Math.random() * 300;
  }
}



function desenharMonstro() {
  if (!monstro.ativo) return;

  const t = performance.now();
  const x = monstro.x;
  const y = monstro.y + Math.sin(t / 350) * 4;

  ctx.save();
  ctx.globalAlpha = monstro.alpha;

  // ---------- 1) FEIXE DE LUZ ATÉ O CHÃO ----------
  const topoY = y + 20;
  const chaoY = chaoAbaixo(x, y + 30);
  const sway = Math.sin(t / 700) * 8;                       // o feixe balança de leve
  const pisca = 0.85 + Math.sin(t / 90) * 0.05 + Math.sin(t / 230) * 0.06;
  const larguraTopo = 12;
  const larguraBase = 22 + (chaoY - topoY) * 0.22;          // abre conforme desce
  const meia = (p) => larguraTopo + (larguraBase - larguraTopo) * p;

  const feixe = ctx.createLinearGradient(0, topoY, 0, chaoY);
  feixe.addColorStop(0,   rgba(paleta.luz, 0.55 * pisca));
  feixe.addColorStop(0.6, rgba(paleta.luz, 0.18 * pisca));
  feixe.addColorStop(1,   rgba(paleta.luz, 0.08 * pisca));
  ctx.fillStyle = feixe;
  ctx.beginPath();
  ctx.moveTo(x - larguraTopo, topoY);
  ctx.lineTo(x + sway - larguraBase, chaoY);
  ctx.lineTo(x + sway + larguraBase, chaoY);
  ctx.lineTo(x + larguraTopo, topoY);
  ctx.closePath();
  ctx.fill();

  // miolo mais claro do feixe
  ctx.fillStyle = rgba(paleta.luz, 0.07 * pisca);
  ctx.beginPath();
  ctx.moveTo(x - 5, topoY);
  ctx.lineTo(x + sway - larguraBase * 0.35, chaoY);
  ctx.lineTo(x + sway + larguraBase * 0.35, chaoY);
  ctx.lineTo(x + 5, topoY);
  ctx.closePath();
  ctx.fill();

  // poeira flutuando dentro da luz
  for (let i = 0; i < 16; i++) {
    const p = ((t / 5000) + i * 0.0625) % 1;                // 0 = no olho, 1 = no chão
    const lateral = Math.sin(i * 12.9898 + t / 2500) * 0.8 * meia(p);
    const px = x + sway * p + lateral;
    const py = topoY + p * (chaoY - topoY);
    ctx.fillStyle = rgba(paleta.luz, 0.5 * (1 - p) * pisca);
    ctx.beginPath();
    ctx.arc(px, py, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // poça de luz onde o feixe encosta no chão
  if (chaoY < ALTURA) {
    const pocaX = x + sway;
    ctx.fillStyle = rgba(paleta.luz, 0.14 * pisca);
    ctx.beginPath();
    ctx.ellipse(pocaX, chaoY, larguraBase * 1.15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(paleta.luz, 0.22 * pisca);
    ctx.beginPath();
    ctx.ellipse(pocaX, chaoY, larguraBase * 0.65, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- 2) FUMAÇA SUBINDO PELO TOPO ----------
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const baseX = x - 50 + i * 16;
    const alt = 40 + ((i * 29) % 40);
    const bal = Math.sin(t / 600 + i * 1.3) * 10;
    ctx.strokeStyle = "rgba(4,4,4," + (0.55 - i * 0.04) + ")";
    ctx.lineWidth = 10 - (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(baseX, y - 10);
    ctx.quadraticCurveTo(baseX + bal, y - alt * 0.6, baseX + bal * 1.6, y - alt);
    ctx.stroke();
  }

  // ---------- 3) CORPO DE SOMBRA ----------
  const sombra = ctx.createRadialGradient(x - 8, y - 8, 5, x, y, 75);
  sombra.addColorStop(0,   "#0d0d0d");
  sombra.addColorStop(0.65, "#040404");
  sombra.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 82, 62, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 18, 55, 40, 0.4, 0, Math.PI * 2);   // volume extra embaixo
  ctx.fill();

  // ---------- 4) TENTÁCULOS ONDULANTES ----------
  ctx.strokeStyle = "#020202";
  for (let i = 0; i < 8; i++) {
    const sx = x - 42 + i * 12;
    const sy = y + 28;
    const comp = 40 + ((i * 37) % 55);
    const fase = t / 380 + i * 0.9;
    const segs = 10;
    let ax = sx, ay = sy;
    for (let s = 1; s <= segs; s++) {
      const f = s / segs;
      const nx = sx + Math.sin(fase - f * 3) * (4 + f * 14) - f * 6;
      const ny = sy + f * comp;
      ctx.lineWidth = Math.max(1, (6 - (i % 3)) * (1 - f) + 1);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ax = nx; ay = ny;
    }
  }

  // ---------- 5) O OLHO ----------
  const ciclo = (t / 1000) % 5;                              // pisca a cada 5 segundos
  const abre = ciclo > 4.8 ? Math.max(0.06, Math.abs(ciclo - 4.9) * 10) : 1;
  const olhar = t / 500;
  const olharX = Math.sin(olhar) * 6;
  const olharY = 4 + Math.sin(olhar * 0.7) * 3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.2);

  // brilho em volta
  ctx.shadowColor = paleta.luz;
  ctx.shadowBlur = 26;
  ctx.fillStyle = rgba(paleta.luz, 0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 31 * abre, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // tudo dentro do olho fica recortado pelo formato dele
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 28 * abre, 0, 0, Math.PI * 2);
  ctx.clip();

  const esclera = ctx.createRadialGradient(-6, -8, 2, 0, 0, 30);
  esclera.addColorStop(0,   "#ffffff");
  esclera.addColorStop(0.65, "#d6d6d6");
  esclera.addColorStop(1,   "#6a6a6a");
  ctx.fillStyle = esclera;
  ctx.fillRect(-30, -34, 60, 68);

  // veias saindo das bordas
  ctx.strokeStyle = "rgba(40,40,40,0.35)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 30);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.25) * 19, Math.sin(a + 0.25) * 22,
      Math.cos(a) * 14 + olharX * 0.5, Math.sin(a) * 16 + olharY * 0.5
    );
    ctx.stroke();
  }

  // íris
  const ix = olharX * 0.7, iy = olharY * 0.7;
  const iris = ctx.createRadialGradient(ix, iy, 3, ix, iy, 15);
  iris.addColorStop(0,   "#111111");
  iris.addColorStop(0.45, rgba(paleta.luz, 0.55));
  iris.addColorStop(0.85, "#3c3c3c");
  iris.addColorStop(1,   "#0a0a0a");
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(ix, iy, 15, 0, Math.PI * 2);
  ctx.fill();

  // pupila em fenda, dilata e contrai
  const larguraPupila = 3 + Math.sin(t / 400) * 1.2;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(ix, iy, larguraPupila, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // reflexo
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(ix - 6, iy - 7, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // sombra nas pálpebras (cima e baixo escurecem)
  const palpebra = ctx.createLinearGradient(0, -28, 0, 28);
  palpebra.addColorStop(0,   "rgba(0,0,0,0.65)");
  palpebra.addColorStop(0.3, "rgba(0,0,0,0)");
  palpebra.addColorStop(0.7, "rgba(0,0,0,0)");
  palpebra.addColorStop(1,   "rgba(0,0,0,0.55)");
  ctx.fillStyle = palpebra;
  ctx.fillRect(-30, -34, 60, 68);
  ctx.restore();   // fim do recorte

  // contorno escuro do olho
  ctx.strokeStyle = "#030303";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 28 * abre, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

// O olho mata quando vê o jogador: encostou no olho ou ficou dentro do feixe de luz.
// true = agachado (todo preto) o olho não te vê. Mude para false para desligar.
const AGACHAR_ESCONDE = true;

function olhoPegouJogador() {
  if (!monstro.ativo || monstro.alpha < 0.6) return false;   // ainda aparecendo: não mata

  const t = performance.now();
  const x = monstro.x;
  const y = monstro.y + Math.sin(t / 350) * 4;   // mesma posição usada no desenho

  // 1) corpo do olho: o ponto do jogador mais perto do centro do olho
  const pertoX = Math.max(jogador.x, Math.min(x, jogador.x + jogador.w));
  const pertoY = Math.max(jogador.y, Math.min(y, jogador.y + jogador.h));
  if (Math.hypot(pertoX - x, pertoY - y) < 26) return true;

  // 2) feixe de luz (mesmas contas do desenharMonstro)
  if (escondido()) return false;

  const topoY = y + 20;
  const chaoY = chaoAbaixo(x, y + 30);
  const sway = Math.sin(t / 700) * 8;
  const larguraTopo = 12;
  const larguraBase = 22 + (chaoY - topoY) * 0.22;

  for (const py of [jogador.y, jogador.y + jogador.h / 2, jogador.y + jogador.h]) {
    if (py < topoY || py > chaoY) continue;
    const p = (py - topoY) / (chaoY - topoY);   // 0 = no olho, 1 = no chão
    const centro = x + sway * p;
    // um pouco mais estreito que o desenho, para ser justo com quem joga
    const meia = (larguraTopo + (larguraBase - larguraTopo) * p) * 0.85;
    if (jogador.x + jogador.w > centro - meia && jogador.x < centro + meia) return true;
  }
  return false;
}

