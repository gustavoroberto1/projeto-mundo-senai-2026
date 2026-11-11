// =====================================================
// MINA (fase 4): carrinho empurravel, trilhos, vigas, lampadas, barricada e portal
// A fase precisa de:  mina: { trilhoIni, trilhoFim, piso, carrinhoX }
// e de uma plataforma  { ..., barricada: true }
// =====================================================
const MINA_CFG = {
  largCarrinho: 90,
  altCarrinho: 56,
  vel: 1,              // velocidade do carrinho em relacao a do jogador (1 = igual)
  velDentro: 4.5,      // velocidade do carrinho quando voce esta dentro (a aranha anda 3.0)
  folgaBatente: 10,    // o carrinho para a esta distancia do fim do trilho
  primeiraViga: 6800,
  ultimaViga: 9700,
  espacoVigas: 280,
};

let carrinhoMina = null;

// Chamada pelo aoReiniciar() do caverna.js
function reiniciarCarrinhoMina() {
  carrinhoMina = null;
  const m = faseAtual.mina;
  if (!m) return;
  const plat = {
    x: m.carrinhoX,
    y: m.piso - MINA_CFG.altCarrinho,
    w: MINA_CFG.largCarrinho,
    h: MINA_CFG.altCarrinho,
    semGrama: true,
  };
  plataformas.push(plat);          // 'plataformas' aqui e a copia da fase, entao reinicia limpo
    carrinhoMina = { plat, rot: 0, dentro: false, vel: 0, perto: false };
}

// Chamada pelo atualizarFalsos() do caverna.js
function atualizarCarrinhoMina(dt) {
  const c = carrinhoMina;
  const m = faseAtual.mina;
  if (!c || !m || estado !== "jogando") return;
  const j = jogador;
  const p = c.plat;
  const minX = m.trilhoIni;
  const maxX = m.trilhoFim - MINA_CFG.folgaBatente - p.w;

  // perto o bastante para apertar E e entrar?
  c.perto = !c.dentro && j.noChao &&
    Math.abs((j.x + j.w / 2) - (p.x + p.w / 2)) < p.w / 2 + 34 &&
    j.y + j.h >= p.y - 2;

  if (c.dentro) {
    // ---- DENTRO: A/D movem o carrinho, o boneco vai junto ----
    const esq = teclas["ArrowLeft"] || teclas["KeyA"];
    const dir = teclas["ArrowRight"] || teclas["KeyD"];
    const alvo = (dir ? 1 : 0) - (esq ? 1 : 0);
    c.vel += (alvo * MINA_CFG.velDentro - c.vel) * Math.min(1, 0.08 * dt);
    const novo = Math.max(minX, Math.min(maxX, p.x + c.vel * dt));
    if (novo === minX || novo === maxX) c.vel = 0;
    c.rot += (novo - p.x) / 9;
    p.x = novo;

    if (alvo !== 0) j.olhaEsquerda = alvo < 0;
    if (j.agachado) { j.agachado = false; j.h = ALTURA_EM_PE; }
    j.x = p.x + (p.w - j.w) / 2;
    j.y = p.y + 36 - j.h;          // so a cabeca e o tronco aparecem acima da borda
    j.vx = 0; j.vy = 0; j.noChao = true;

    // chegou no fim do trilho: sai sozinho do outro lado
    if (p.x >= maxX - 0.5 && alvo > 0) sairDoCarrinhoMina();
  } else {
    // ---- FORA: empurrar encostando na lateral ----
    const noNivel = j.y + j.h > p.y + 6 && j.y < p.y + p.h;
    let dir = 0;
    if (noNivel && !j.escondido) {
      if (j.vx > 0 && j.x + j.w > p.x - 4 && j.x + j.w <= p.x + 4) dir = 1;
      else if (j.vx < 0 && j.x < p.x + p.w + 4 && j.x >= p.x + p.w - 4) dir = -1;
    }
    if (dir !== 0) {
      const passo = Math.abs(j.vx) * MINA_CFG.vel * dt;
      const novo = Math.max(minX, Math.min(maxX, p.x + dir * passo));
      c.rot += (novo - p.x) / 9;
      p.x = novo;
      if (dir === 1) j.x = p.x - j.w;
      else j.x = p.x + p.w;
    }
  }

  // barricada: o carrinho bate e ela desmorona
  const b = plataformas.find((q) => q.barricada);
  if (b && p.x + p.w >= b.x - 2) {
    plataformas.splice(plataformas.indexOf(b), 1);
    desmoronar(b);                 // vem do caverna.js
  }
}

// ---------- desenho ----------
function desenharCarrinhoMina() {
  const m = faseAtual.mina;
  if (!m) return;
  const t = performance.now() / 1000;
  ctx.save();
  desenharPortalMina(t);
  desenharVigasMina(t);
  desenharTrilhosMina(m);
  desenharBarricadaMina();
  desenharCorpoCarrinhoMina();
  ctx.restore();
}

function desenharPortalMina(t) {
  const L = luz;
  const cx = L.x + L.w / 2, cy = L.y + L.h / 2;
  if (cx < camera - 360 || cx > camera + LARGURA + 360) return;
  const base = L.y + L.h;

  // halo
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
  g.addColorStop(0, rgba(paleta.luz, 0.38));
  g.addColorStop(1, rgba(paleta.luz, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - 200, cy - 200, 400, 400);

  // raios entrando na caverna
  ctx.fillStyle = rgba(paleta.luz, 0.05);
  for (let k = -2; k <= 2; k++) {
    const a = Math.PI + k * 0.12 + Math.sin(t * 0.8 + k) * 0.03;
    const len = 320 + ruido(k + 20) * 80;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - 0.05) * len, cy + Math.sin(a - 0.05) * len);
    ctx.lineTo(cx + Math.cos(a + 0.05) * len, cy + Math.sin(a + 0.05) * len);
    ctx.closePath();
    ctx.fill();
  }

  // arco de pedra em volta da luz
  const ax0 = L.x - 30, ax1 = L.x + L.w + 30;
  const acx = (ax0 + ax1) / 2, ar = (ax1 - ax0) / 2, atopo = L.y - 8;
  ctx.beginPath();
  ctx.moveTo(ax0, base);
  ctx.lineTo(ax0, atopo);
  ctx.arc(acx, atopo, ar, Math.PI, 0);
  ctx.lineTo(ax1, base);
  ctx.fillStyle = rgba(paleta.luz, 0.10);
  ctx.fill();
  ctx.strokeStyle = "rgba(150,162,156,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function desenharVigasMina(t) {
  const x0 = camera - 100, x1 = camera + LARGURA + 100;
  let i = 0;
  for (let x = MINA_CFG.primeiraViga; x <= MINA_CFG.ultimaViga; x += MINA_CFG.espacoVigas, i++) {
    if (x < x0 || x > x1) continue;
    const xd = x + 56;
    const t1 = tetoEm(x), t2 = tetoEm(xd), p1 = pisoEm(x), p2 = pisoEm(xd);
    if (t1 === null || t2 === null || p1 === null || p2 === null) continue;
    const topo = Math.max(t1, t2);
    const base = Math.min(p1, p2);

    // escoras diagonais
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 6, topo + 48);  ctx.lineTo(x + 24, topo + 14);
    ctx.moveTo(xd - 6, topo + 48); ctx.lineTo(xd - 24, topo + 14);
    ctx.strokeStyle = "#0d0b09";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = "rgba(135,148,141,0.30)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // postes e viga de cima
    ctx.fillStyle = "#0d0b09";
    ctx.strokeStyle = "rgba(135,148,141,0.38)";
    ctx.lineWidth = 1.2;
    for (const px of [x, xd]) {
      ctx.fillRect(px - 6, topo, 12, base - topo);
      ctx.strokeRect(px - 6, topo, 12, base - topo);
    }
    ctx.fillRect(x - 14, topo, 84, 14);
    ctx.strokeRect(x - 14, topo, 84, 14);

    // veios da madeira
    ctx.beginPath();
    for (const px of [x, xd]) {
      for (let k = 0; k < 3; k++) {
        const yy = topo + 30 + ruido(i * 7 + k * 1.7 + px) * Math.max(10, base - topo - 70);
        ctx.moveTo(px - 2, yy);
        ctx.lineTo(px - 2, yy + 16);
      }
    }
    ctx.stroke();

    // lampada pendurada (uma sim, uma nao)
    if (i % 2 === 1) {
      const lx = x + 28, ly = topo + 40;
      const f = 0.8 + 0.2 * Math.sin(t * 7 + i * 3) * Math.sin(t * 3.1 + i);
      const gl = ctx.createRadialGradient(lx, ly, 2, lx, ly, 110);
      gl.addColorStop(0, "rgba(255,226,160," + (0.30 * f).toFixed(2) + ")");
      gl.addColorStop(1, "rgba(255,226,160,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(lx - 110, ly - 110, 220, 220);
      ctx.strokeStyle = "#0d0b09";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, topo + 14);
      ctx.lineTo(lx, ly - 8);
      ctx.stroke();
      ctx.fillStyle = "#0d0b09";
      ctx.fillRect(lx - 6, ly - 8, 12, 14);
      ctx.fillStyle = "rgba(255,236,190," + f.toFixed(2) + ")";
      ctx.fillRect(lx - 3, ly - 4, 6, 8);
    }
  }
}

function desenharTrilhosMina(m) {
  const ini = Math.max(m.trilhoIni, camera - 40);
  const fim = Math.min(m.trilhoFim, camera + LARGURA + 40);
  if (fim <= ini) return;
  const y = m.piso;

  // dormentes
  ctx.fillStyle = "#0d0b09";
  ctx.strokeStyle = "rgba(135,148,141,0.38)";
  ctx.lineWidth = 1;
  for (let x = Math.ceil(ini / 36) * 36; x < fim; x += 36) {
    ctx.fillRect(x, y - 5, 22, 5);
    ctx.strokeRect(x + 0.5, y - 4.5, 22, 5);
  }
  // os dois trilhos
  ctx.strokeStyle = "rgba(170,180,175,0.55)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ini, y - 7); ctx.lineTo(fim, y - 7);
  ctx.moveTo(ini, y - 3); ctx.lineTo(fim, y - 3);
  ctx.stroke();

  // batente no fim do trilho
  const bx = m.trilhoFim - MINA_CFG.folgaBatente + 2;
  if (bx > camera - 40 && bx < camera + LARGURA + 40) {
    ctx.fillStyle = "#0d0b09";
    ctx.strokeStyle = "rgba(135,148,141,0.5)";
    ctx.lineWidth = 1.3;
    ctx.fillRect(bx, y - 28, 10, 28);
    ctx.strokeRect(bx, y - 28, 10, 28);
  }
}

function desenharBarricadaMina() {
  const b = plataformas.find((q) => q.barricada);
  if (!b || b.x + b.w < camera - 60 || b.x > camera + LARGURA + 60) return;
  ctx.fillStyle = "#0d0b09";
  ctx.strokeStyle = "rgba(135,148,141,0.45)";
  ctx.lineWidth = 1.4;
  const n = Math.max(2, Math.round(b.h / 30));
  const th = b.h / n;
  for (let i = 0; i < n; i++) {
    const jx = (ruido(i * 3.7 + b.x) - 0.5) * 6;       // cada tabua levemente torta
    ctx.fillRect(b.x + jx, b.y + i * th + 1, b.w, th - 2);
    ctx.strokeRect(b.x + jx, b.y + i * th + 1, b.w, th - 2);
  }
  // escoras em X
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + 4);        ctx.lineTo(b.x + b.w, b.y + b.h - 4);
  ctx.moveTo(b.x + b.w, b.y + 4);  ctx.lineTo(b.x, b.y + b.h - 4);
  ctx.stroke();
  // pregos
  ctx.fillStyle = "rgba(200,205,200,0.65)";
  for (let i = 0; i < n; i++) {
    const yy = b.y + i * th + th / 2 - 1;
    ctx.fillRect(b.x + 6, yy, 2, 2);
    ctx.fillRect(b.x + b.w - 8, yy, 2, 2);
  }
}

function desenharCorpoCarrinhoMina() {
  const c = carrinhoMina;
  if (!c) return;
  const { x, y, w, h } = c.plat;
  if (x + w < camera - 60 || x > camera + LARGURA + 60) return;

  // caixa (mais larga em cima)
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 8, y + h - 14);
  ctx.lineTo(x + 8, y + h - 14);
  ctx.closePath();
  ctx.fillStyle = "#0b0b0a";
  ctx.fill();
  ctx.strokeStyle = "rgba(150,162,156,0.55)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // aro de cima e cintas de ferro
  ctx.fillStyle = "#0b0b0a";
  ctx.fillRect(x - 3, y - 3, w + 6, 6);
  ctx.strokeRect(x - 3, y - 3, w + 6, 6);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.33, y + 3); ctx.lineTo(x + w * 0.33 - 2, y + h - 17);
  ctx.moveTo(x + w * 0.66, y + 3); ctx.lineTo(x + w * 0.66 + 2, y + h - 17);
  ctx.stroke();

  // rebites
  ctx.fillStyle = "rgba(200,205,200,0.6)";
  for (let k = 0; k < 4; k++) ctx.fillRect(x + 12 + k * 22, y + 8, 2, 2);

  // minerio por cima do aro
  ctx.fillStyle = "#0b0b0a";
  for (let k = 0; k < 5; k++) {
    const r = 3 + ruido(k * 2.3) * 3;
    ctx.beginPath();
    ctx.arc(x + 12 + k * 16, y - 1, r, Math.PI, 0);
    ctx.fill();
  }

  // rodas (giram conforme o carrinho anda)
  for (const wx of [x + 22, x + w - 22]) {
    const wy = y + h - 9;
    ctx.fillStyle = "#050505";
    ctx.beginPath(); ctx.arc(wx, wy, 9, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = "rgba(170,180,175,0.6)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = c.rot + k * Math.PI / 3;
      ctx.moveTo(wx + Math.cos(a) * 8, wy + Math.sin(a) * 8);
      ctx.lineTo(wx - Math.cos(a) * 8, wy - Math.sin(a) * 8);
    }
    ctx.stroke();
  }
}

// ---------- entrar e sair do carrinho (tecla E) ----------
function sairDoCarrinhoMina() {
  const c = carrinhoMina, m = faseAtual.mina, j = jogador;
  if (!c || !m) return;
  const p = c.plat;
  const maxX = m.trilhoFim - MINA_CFG.folgaBatente - p.w;
  c.dentro = false;
  c.vel = 0;
  let x;
  if (p.x >= maxX - 1) x = p.x + p.w + 14;                       // no fim: sai do outro lado
  else x = j.olhaEsquerda ? p.x - j.w - 4 : p.x + p.w + 4;       // no meio: sai para onde olha
  j.x = Math.max(0, x);
  j.y = m.piso - j.h;
  j.vx = 0; j.vy = 0; j.noChao = true;
}

window.addEventListener("keydown", (e) => {
  if (e.code !== "KeyE" || e.repeat) return;
  const c = carrinhoMina;
  if (!c || estado !== "jogando") return;
  if (c.dentro) {
    sairDoCarrinhoMina();
  } else if (c.perto) {
    c.dentro = true;
    c.vel = 0;
    c.perto = false;
  }
});

// Parte da frente do carrinho, desenhada POR CIMA do boneco (ele fica "dentro")
function desenharFrenteCarrinhoMina() {
  const c = carrinhoMina;
  if (!c) return;
  const { x, y, w, h } = c.plat;

  if (c.dentro) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 8, y + h - 14);
    ctx.lineTo(x + 8, y + h - 14);
    ctx.closePath();
    ctx.fillStyle = "#0b0b0a";
    ctx.fill();
    ctx.strokeStyle = "rgba(150,162,156,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillRect(x - 3, y - 3, w + 6, 6);
    ctx.strokeRect(x - 3, y - 3, w + 6, 6);
    ctx.fillStyle = "rgba(200,205,200,0.6)";
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 12 + k * 22, y + 8, 2, 2);
    ctx.restore();
  }

  // dicas
  if (c.dentro || c.perto) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(c.dentro ? "A / D - andar     E - sair" : "E - entrar", x + w / 2, y - 34);
    ctx.restore();
  }
}

// Faz o jogo desenhar a frente do carrinho logo depois do boneco, sem mexer no jogo.js
const _desenharBonecoOriginal = desenharBoneco;
window.desenharBoneco = function () {
  _desenharBonecoOriginal();
  desenharFrenteCarrinhoMina();
};