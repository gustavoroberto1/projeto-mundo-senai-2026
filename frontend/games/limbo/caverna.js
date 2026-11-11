// =====================================================
// CAVERNA + CHÃO FALSO (fase 4)
//   falso: true          -> parece chão normal, mas desmorona quando o jogador pisa.
//   rocha: "teto"/"piso" -> (vem do trecho() do fase.js) ganha saliências na borda:
//                           estalactites, lobos e calombos, mais hachuras de tinta.
//   A fase precisa de  caverna: { poco, fim, fundo }  para desenhar o fundo.
// =====================================================

let entulho = [];       // pedaços do chão caindo
let camPisoCav = 0;     // trava suave: dentro da caverna a câmera não mostra o céu

// Chamada por reiniciar(): devolve o chão falso e limpa o entulho.
function aoReiniciar() {
  plataformas = faseAtual.plataformas.slice();
  for (const p of faseAtual.plataformas) delete p.cai;
  entulho = [];
  camPisoCav = 0;
    if (typeof reiniciarCarrinhoMina === "function") reiniciarCarrinhoMina();
}

function desmoronar(p) {
  for (let x = p.x; x < p.x + p.w; x += 14) {
    for (let y = p.y; y < p.y + p.h; y += 20) {
      const w = 10 + Math.random() * 10;
      entulho.push({
        x: x + 2 + Math.random() * 4,
        y: y,
        w: w,
        h: 10 + Math.random() * 12,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.5,
        rot: 0,
        vr: (Math.random() - 0.5) * 0.12,
        lo: p.x + 2,
        hi: p.x + p.w - w - 2,
        parado: false,
      });
    }
  }
}

function atualizarFalsos(dt) {
  const cx = jogador.x + jogador.w / 2;
  const pes = jogador.y + jogador.h;

  for (const p of plataformas.slice()) {
    if (!p.falso) continue;
    if (p.cai === undefined) {
      if (jogador.noChao && Math.abs(pes - p.y) < 2 && cx > p.x + 24 && cx < p.x + p.w - 24) {
        p.cai = p.atraso === undefined ? 6 : p.atraso;
      }
    } else {
      p.cai -= dt;
      if (p.cai <= 0) {
        desmoronar(p);
        plataformas.splice(plataformas.indexOf(p), 1);
        jogador.noChao = false;
      }
    }
  }

  for (const e of entulho) {
    if (e.parado) continue;
    e.vy += GRAVIDADE * dt;
    e.x = Math.min(Math.max(e.x + e.vx * dt, e.lo), e.hi);
    e.y += e.vy * dt;
    e.rot += e.vr * dt;
    const solo = chaoAbaixo(e.x + e.w / 2, e.y + e.h - 4);
    if (e.y + e.h >= solo) {
      e.y = solo - e.h;
      e.vx = e.vy = e.vr = 0;
      e.rot = 0;
      e.parado = true;
    }
  }

  // câmera: dentro da caverna ela não sobe até mostrar o céu da floresta
  if (faseAtual.caverna) {
    const c = faseAtual.caverna;
    const dentro = jogador.y > c.poco.y + 60;
        // na subida final (perto do portal) a câmera pode subir mais, para mostrar o arco e o teto
    const pisoCam = jogador.x > 8300 ? 300 : c.poco.y;
    camPisoCav += ((dentro ? pisoCam : 0) - camPisoCav) * Math.min(1, 0.12 * dt);
    if (cameraY < camPisoCav) cameraY = camPisoCav;
  }
    if (typeof atualizarCarrinhoMina === "function") atualizarCarrinhoMina(dt);
}

function desenharEntulho() {
  ctx.save();
  ctx.fillStyle = "#070707";
  ctx.strokeStyle = "#1d1d1d";
  ctx.lineWidth = 1;
  for (const e of entulho) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate(e.rot);
    ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
    ctx.strokeRect(-e.w / 2, -e.h / 2, e.w, e.h);
    ctx.restore();
  }
  ctx.restore();
  desenharAcabamentoCaverna();   // o jogo.js chama esta função logo depois das plataformas
    if (faseAtual.mina && typeof desenharCarrinhoMina === "function") desenharCarrinhoMina();
}

// ---------- as rochas (teto e piso do corredor) ----------

let _rochas = { fase: null, tetos: [], pisos: [] };
function rochas() {
  if (_rochas.fase !== faseAtual) {
    const ps = faseAtual.plataformas;
    _rochas = {
      fase: faseAtual,
      tetos: ps.filter((p) => p.rocha === "teto"),
      pisos: ps.filter((p) => p.rocha === "piso"),
    };
  }
  return _rochas;
}

// y do piso / do fundo do teto em um x (null se não houver)
function pisoEm(x) {
  for (const p of rochas().pisos) if (x >= p.x && x < p.x + p.w) return p.y;
  return null;
}
function tetoEm(x) {
  for (const p of rochas().tetos) if (x >= p.x && x < p.x + p.w) return p.y + p.h;
  return null;
}

// Saliências de uma rocha: calculadas uma vez só e guardadas.
// No teto: pontas (estalactites), dentes duplos e lobos redondos.
// No piso: só calombos baixos (pontas no chão lembrariam os espinhos).
// O comprimento respeita a folga: onde o teto é baixo, quase não pende nada.
const cacheSaliencias = new WeakMap();
function saliencias(p) {
  if (cacheSaliencias.has(p)) return cacheSaliencias.get(p);
  const lista = [];
  const teto = p.rocha === "teto";
  let x = p.x + 6;
  let i = 0;
  while (x < p.x + p.w - 14) {
    const r = ruido(p.x * 0.7 + i * 3.1);
    const r2 = ruido(p.x * 1.3 + i * 5.7 + 11);
    const tipo = teto ? (r < 0.4 ? "ponta" : r < 0.75 ? "lobo" : "dente") : (r < 0.7 ? "lobo" : "pedra");
    const larg0 = tipo === "lobo" ? 28 + r2 * 30 : tipo === "dente" ? 26 + r2 * 12 : 14 + r2 * 18;
    const larg = Math.min(larg0, p.x + p.w - 6 - x);
    const cx = x + larg / 2;
    let comp;
    if (teto) {
      const chao = pisoEm(cx);
      const folga = chao === null ? 200 : chao - (p.y + p.h);
      const maximo = Math.max(3, Math.min(46, folga - 72));
      comp = tipo === "lobo" ? Math.min(maximo, 8 + r2 * 12) : Math.min(maximo, 14 + r2 * 34);
    } else {
      comp = 4 + r2 * 6;
    }
    lista.push({ tipo, cx, larg, comp, r2 });
    x += larg + 2 + r * 8;
    i++;
  }
  cacheSaliencias.set(p, lista);
  return lista;
}

// dir = +1: pende para baixo (teto); -1: sobe (piso)
function caminhoSaliencia(s, yBase, dir) {
  const a = s.cx - s.larg / 2;
  const b = s.cx + s.larg / 2;
  const fundo = yBase - dir * 2;
  ctx.beginPath();
  ctx.moveTo(a, fundo);
  if (s.tipo === "lobo" || s.tipo === "pedra") {
    ctx.bezierCurveTo(a, yBase + dir * s.comp * 1.3, b, yBase + dir * s.comp * 1.3, b, fundo);
  } else if (s.tipo === "ponta") {
    const ponta = s.cx + (s.r2 - 0.5) * 8;
    ctx.quadraticCurveTo(s.cx - s.larg * 0.12, yBase + dir * s.comp * 0.55, ponta, yBase + dir * s.comp);
    ctx.quadraticCurveTo(s.cx + s.larg * 0.12, yBase + dir * s.comp * 0.55, b, fundo);
  } else {   // dente: duas pontas de tamanhos diferentes
    ctx.lineTo(a + s.larg * 0.28, yBase + dir * s.comp);
    ctx.lineTo(s.cx, yBase + dir * s.comp * 0.3);
    ctx.lineTo(a + s.larg * 0.74, yBase + dir * s.comp * 0.8);
    ctx.lineTo(b, fundo);
  }
  ctx.closePath();
}

// modo "preencher": silhueta preta (antes das plataformas); "contorno": traço de tinta (depois)
function desenharRochas(modo) {
  const x0 = camera - 60;
  const x1 = camera + LARGURA + 60;
  const r = rochas();
  for (const p of r.tetos.concat(r.pisos)) {
    if (p.x + p.w < x0 || p.x > x1) continue;
    const teto = p.rocha === "teto";
    const yBase = teto ? p.y + p.h : p.y;
    const dir = teto ? 1 : -1;
    for (const s of saliencias(p)) {
      if (s.cx + s.larg < x0 || s.cx - s.larg > x1) continue;
      caminhoSaliencia(s, yBase, dir);
      if (modo === "preencher") ctx.fill(); else ctx.stroke();
    }
    if (modo === "contorno") {
      ctx.beginPath();
      ctx.moveTo(Math.max(p.x, x0), yBase);
      ctx.lineTo(Math.min(p.x + p.w, x1), yBase);
      ctx.stroke();
    }
  }
}

// riscos diagonais de tinta dentro da rocha, perto da borda
function desenharHachuras() {
  const x0 = camera - 20;
  const x1 = camera + LARGURA + 20;
  ctx.strokeStyle = "rgba(100,112,106,0.30)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const r = rochas();
  for (const p of r.tetos.concat(r.pisos)) {
    if (p.x + p.w < x0 || p.x > x1) continue;
    const teto = p.rocha === "teto";
    const yBase = teto ? p.y + p.h : p.y;
    const dentro = teto ? -1 : 1;
    const ini = Math.max(p.x + 4, Math.floor(x0 / 9) * 9);
    const fim = Math.min(p.x + p.w - 4, x1);
    for (let x = ini; x < fim; x += 9) {
      const n = ruido(x * 0.37 + p.y);
      if (n < 0.35) continue;
      const prof = 8 + n * 26;
      ctx.moveTo(x, yBase + dentro * 4);
      ctx.lineTo(x - 6, yBase + dentro * (4 + prof));
      if (n > 0.8) {
        ctx.moveTo(x - 7, yBase + dentro * 6);
        ctx.lineTo(x + 2, yBase + dentro * (6 + prof * 0.6));
      }
    }
  }
  ctx.stroke();
}

function desenharAcabamentoCaverna() {
  if (!faseAtual.caverna) return;
  ctx.save();
  desenharHachuras();
  ctx.strokeStyle = "rgba(135,148,141,0.30)";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  desenharRochas("contorno");
  ctx.restore();
}

// ---------- o vazio da caverna (desenhado ANTES das plataformas pretas) ----------
function desenharCaverna() {
  const c = faseAtual.caverna;
  if (!c) return;
  const poco = c.poco;
  const larg = c.fim - poco.x;
  const alt = c.fundo - poco.y;
  const t = performance.now() / 1000;

  ctx.save();
  ctx.beginPath();
  ctx.rect(poco.x, poco.y, larg, alt);
  ctx.clip();

  // parede do fundo: cinza esverdeado, mais escura embaixo
  const g = ctx.createLinearGradient(0, poco.y, 0, c.fundo);
  g.addColorStop(0, "#2a302e");
  g.addColorStop(0.5, "#181c1b");
  g.addColorStop(1, "#0b0d0c");
  ctx.fillStyle = g;
  ctx.fillRect(poco.x, poco.y, larg, alt);

  // manchas claras de pedra molhada
  const passo = 160;
  const ini = Math.floor((camera - 220) / passo) * passo;
  for (let x = ini; x < camera + LARGURA + 220; x += passo) {
    const r1 = ruido(x * 0.013);
    const r2 = ruido(x * 0.029 + 7);
    ctx.fillStyle = "rgba(120,135,128,0.10)";
    ctx.beginPath();
    ctx.ellipse(x + r1 * 120, 540 + r2 * 260, 60 + r1 * 70, 36 + r2 * 46, r1 - 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(x + 60 + r2 * 90, 600 + r1 * 200, 40 + r2 * 50, 26 + r1 * 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // dentes ao longe (segunda camada de rocha)
  ctx.fillStyle = "rgba(6,8,7,0.85)";
  const p2 = 46;
  const ini2 = Math.floor((camera - 60) / p2) * p2;
  for (let x = ini2; x < camera + LARGURA + 60; x += p2) {
    const n1 = ruido(x * 0.11);
    const n2 = ruido(x * 0.23 + 3);
    const ponta = 540 + 90 + n1 * 150;
    ctx.beginPath();
    ctx.moveTo(x - 16, 500);
    ctx.lineTo(x + 16, 500);
    ctx.lineTo(x + (n2 - 0.5) * 14, ponta);
    ctx.closePath();
    ctx.fill();
    const ponta2 = c.fundo - 70 - n2 * 140;
    ctx.beginPath();
    ctx.moveTo(x - 10 + p2 / 2, c.fundo);
    ctx.lineTo(x + 14 + p2 / 2, c.fundo);
    ctx.lineTo(x + 2 + p2 / 2 + (n1 - 0.5) * 12, ponta2);
    ctx.closePath();
    ctx.fill();
  }

  // luz que entra pelo buraco do chão
  const luzG = ctx.createLinearGradient(0, poco.y, 0, 860);
  luzG.addColorStop(0, rgba(paleta.luz, 0.20));
  luzG.addColorStop(1, rgba(paleta.luz, 0.0));
  ctx.fillStyle = luzG;
  ctx.beginPath();
  ctx.moveTo(poco.x + 10, poco.y);
  ctx.lineTo(poco.x + poco.w - 10, poco.y);
  ctx.lineTo(poco.x + poco.w + 150, 860);
  ctx.lineTo(poco.x + 170, 860);
  ctx.closePath();
  ctx.fill();

  // neblina rente ao chão da caverna
  const nev = ctx.createLinearGradient(0, 700, 0, c.fundo);
  nev.addColorStop(0, "rgba(150,165,158,0)");
  nev.addColorStop(1, "rgba(150,165,158,0.16)");
  ctx.fillStyle = nev;
  ctx.fillRect(poco.x, 700, larg, c.fundo - 700);

  // gotas caindo do teto até o piso
  ctx.fillStyle = "rgba(200,215,222,0.6)";
  for (let k = 0; k < 40; k++) {
    const gx = 1880 + k * 241;
    if (gx < camera - 10 || gx > camera + LARGURA + 10) continue;
    const teto = tetoEm(gx);
    const piso = pisoEm(gx);
    if (teto === null || piso === null) continue;
    const f = ((t + k * 0.83) % 2.8) / 2.8;
    const gy = teto + 8 + f * f * (piso - teto - 14);
    ctx.fillRect(gx, gy, 1.6, 4);
  }

  ctx.restore();

  // silhueta das saliências (mesma cor das plataformas, então se funde com elas)
  ctx.save();
  ctx.fillStyle = "#050505";
  desenharRochas("preencher");
  ctx.restore();
}