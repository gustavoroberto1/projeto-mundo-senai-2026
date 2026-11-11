// Prédios destruídos ao fundo (parallax)
function camadaPredios(velocidade, opacidade, espaco, alturaBase) {
  ctx.globalAlpha = opacidade;

  for (let i = 0; i < 45; i++) {
    const larg = espaco * (0.8 + pseudo(i + 40) * 0.35);
    const x = i * espaco - camera * velocidade;
    if (x + larg < -20 || x > LARGURA + 20) continue;   // fora da tela

    const altura = alturaBase + pseudo(i) * 180;
    const corpoTopo = ALTURA - altura * 0.55;

    // corpo do prédio, com o topo irregular
    ctx.fillStyle = paleta.arvore;
    ctx.beginPath();
    ctx.moveTo(x, ALTURA);
    ctx.lineTo(x, corpoTopo);
    ctx.lineTo(x + larg * 0.35, corpoTopo + pseudo(i + 3) * 14);
    ctx.lineTo(x + larg * 0.7, corpoTopo - pseudo(i + 4) * 10);
    ctx.lineTo(x + larg, corpoTopo + pseudo(i + 5) * 18);
    ctx.lineTo(x + larg, ALTURA);
    ctx.closePath();
    ctx.fill();

    // janelas
    ctx.fillStyle = rgba(paleta.luz, 0.07);
    const cols = Math.floor(larg / 20);
    const rows = Math.floor((ALTURA - corpoTopo - 20) / 28);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (pseudo(i * 131 + c * 17 + r * 3) < 0.45) continue;
        ctx.fillRect(x + 6 + c * 20, corpoTopo + 14 + r * 28, 9, 15);
      }
    }
  }

  ctx.globalAlpha = 1;
}

function desenharFumaca() {
  const t = performance.now() / 1000;
  for (let k = 0; k < 8; k++) {
    const base = k * 560 + 200 - camera * 0.3;
    if (base < -150 || base > LARGURA + 150) continue;
    for (let s = 0; s < 10; s++) {
      const f = s / 10;
      const cx = base + Math.sin(t * 0.5 + s * 0.8 + k) * 16 * f + f * 50;
      const cy = ALTURA - 140 - f * 250;
      ctx.fillStyle = "rgba(12,10,12," + 0.3 * (1 - f) + ")";
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + f * 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Cinzas caindo (desenhadas na tela, fora do translate da câmera)
function desenharCinzas() {
  const t = performance.now() / 1000;
  ctx.fillStyle = rgba(paleta.luz, 0.4);
  for (let i = 0; i < 45; i++) {
    const vel = 14 + pseudo(i) * 22;
    const y = (pseudo(i + 100) * ALTURA + t * vel) % ALTURA;
    const bruto = pseudo(i + 200) * LARGURA - camera * 0.4 + Math.sin(t * 0.7 + i) * 18;
    const x = ((bruto % LARGURA) + LARGURA) % LARGURA;
    const s = 1 + pseudo(i + 300) * 1.5;
    ctx.fillRect(x, y, s, s);
  }
}

// ---------- CHÃO QUEBRADO ----------

// Pedaços de concreto e vergalhões na borda de um buraco.
// lado: -1 = saem para a esquerda, 1 = para a direita
function bordaQuebrada(x, y, lado) {
  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  for (let k = 0; k < 4; k++) {
    ctx.lineTo(x + lado * (5 + ruido(x + k * 3) * 12), y + 16 + k * 20);
    ctx.lineTo(x + lado * 2, y + 26 + k * 20);
  }
  ctx.lineTo(x, y + 90);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 2; k++) {
    const by = y + 14 + k * 34;
    ctx.moveTo(x, by);
    ctx.lineTo(x + lado * (10 + ruido(x + k) * 10), by + 6 + ruido(x + k + 4) * 10);
  }
  ctx.stroke();
}

// Todo chão (plataforma com h: 100) ganha o visual de asfalto quebrado
function desenharChao() {
  for (const p of plataformas) {
    if (p.h !== 100) continue;                           // vigas, caixotes e lajes ficam lisos
    if (p.x + p.w < camera - 40 || p.x > camera + LARGURA + 40) continue;

    const ini = Math.max(p.x, camera - 20);
    const fim = Math.min(p.x + p.w, camera + LARGURA + 20);

    // topo irregular, cheio de lascas
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.moveTo(ini, p.y);
    for (let x = Math.ceil(ini / 14) * 14; x < fim; x += 14) ctx.lineTo(x, p.y - 1 - ruido(x) * 3);
    ctx.lineTo(fim, p.y);
    ctx.closePath();
    ctx.fill();

    // juntas das lajes
    ctx.strokeStyle = "#181818";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ini, p.y + 38);
    ctx.lineTo(fim, p.y + 38);
    for (let x = Math.ceil(ini / 130) * 130; x < fim; x += 130) {
      ctx.moveTo(x, p.y + 2);       ctx.lineTo(x, p.y + 38);
      ctx.moveTo(x + 65, p.y + 38); ctx.lineTo(x + 65, p.y + 76);
    }
    ctx.stroke();

    // rachaduras que descem e se ramificam
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.ceil(ini / 46) * 46; x < fim; x += 46) {
      if (ruido(x + 3) < 0.45) continue;
      const prof = 30 + ruido(x + 8) * 40;
      let cx = x, cy = p.y + 2;
      ctx.moveTo(cx, cy);
      for (let k = 1; k <= 4; k++) {
        cx += (ruido(x + k * 5) - 0.5) * 18;
        cy += prof / 4;
        ctx.lineTo(cx, cy);
        if (k === 2) {                                   // galho da rachadura
          ctx.lineTo(cx + (ruido(x + k) > 0.5 ? 12 : -12), cy + 10);
          ctx.moveTo(cx, cy);
        }
      }
    }
    ctx.stroke();

    // buracos no asfalto
    for (let x = Math.ceil(ini / 64) * 64; x < fim; x += 64) {
      if (ruido(x + 21) < 0.8) continue;
      ctx.beginPath();
      ctx.ellipse(x, p.y + 1, 18, 5, 0, 0, Math.PI);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // bordas arrebentadas
    if (p.x > camera - 40) bordaQuebrada(p.x, p.y, -1);
    if (p.x + p.w < camera + LARGURA + 40) bordaQuebrada(p.x + p.w, p.y, 1);
  }
}

// ---------- ÔNIBUS ----------
// O teto e os bancos são plataformas da fase. Aqui só o desenho.
// Parte de trás (desenhada antes do boneco): interior, janelas, bancos, corrimão
function desenharOnibusFundo(o) {
  const t = performance.now() / 1000;
  const x0 = o.x, w = o.w;
  const teto = 290;                                      // parte de baixo do teto (y 276 + h 14)

  ctx.save();

  // parede do fundo: mais escura em cima, um pouco mais clara embaixo
  ctx.fillStyle = "#101010";
  ctx.fillRect(x0, teto, w, 62);
  ctx.fillStyle = "#171717";
  ctx.fillRect(x0, 352, w, 28);

  // janelas: o céu aparece por elas
  for (let k = 0; k < Math.floor(w / 70); k++) {
    const jx = x0 + 14 + k * 70;
    ctx.fillStyle = rgba(paleta.luz, 0.14);
    ctx.fillRect(jx, 298, 52, 32);
    if (ruido(o.x + k) > 0.4) {                          // vidro rachado
      ctx.strokeStyle = "#101010";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(jx + 10, 298); ctx.lineTo(jx + 26, 314); ctx.lineTo(jx + 20, 330);
      ctx.moveTo(jx + 26, 314); ctx.lineTo(jx + 44, 306);
      ctx.stroke();
    }
    ctx.strokeStyle = "#050505";
    ctx.lineWidth = 3;
    ctx.strokeRect(jx, 298, 52, 32);
  }

  // caixas de roda
  for (const wx of [x0 + 85, x0 + w - 85]) {
    ctx.fillStyle = "#070707";
    ctx.beginPath();
    ctx.arc(wx, 380, 26, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, 380, 26, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, 380, 10, Math.PI, 0);
    ctx.stroke();
  }

  // bancos (as plataformas da fase ficam no mesmo lugar: ônibus + 80, + 220, + 330)
  for (const off of [80, 220, 330]) {
    const sx = x0 + off;
    ctx.fillStyle = "#050505";
    ctx.fillRect(sx, 366, 34, 14);                       // assento
    ctx.fillRect(sx + 1, 338, 9, 30);                    // encosto
    ctx.fillRect(sx - 2, 334, 15, 7);                    // apoio de cabeça
  }

  // corrimão e alças balançando (algumas já caíram)
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, 302);
  ctx.lineTo(x0 + w - 6, 302);
  ctx.stroke();
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 6; k++) {
    if (ruido(o.x + k * 3) < 0.25) continue;
    const sx = x0 + 50 + k * 66;
    const bal = Math.sin(t * 1.2 + k) * 2;
    ctx.beginPath();
    ctx.moveTo(sx, 302);
    ctx.lineTo(sx + bal, 316);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + bal, 320, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // teto: brilho na borda, emendas e ferro retorcido nas duas pontas
  ctx.strokeStyle = "#262626";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, 277.5);
  ctx.lineTo(x0 + w, 277.5);
  for (let x = x0 + 60; x < x0 + w; x += 60) {
    ctx.moveTo(x, 279);
    ctx.lineTo(x, 288);
  }
  ctx.stroke();
  ctx.fillStyle = "#050505";
  for (const [ex, lado] of [[x0, -1], [x0 + w, 1]]) {
    ctx.beginPath();
    ctx.moveTo(ex, 288);
    ctx.lineTo(ex + lado * 12, 296);
    ctx.lineTo(ex + lado * 2, 299);
    ctx.lineTo(ex + lado * 10, 305);
    ctx.lineTo(ex, 303);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// Parte da frente (desenhada DEPOIS do boneco): pilares que passam na frente dele
function desenharFrenteCidade() {
  for (const o of objetos) {
    if (o.tipo !== "onibus") continue;
    if (o.x + o.w < camera - 20 || o.x > camera + LARGURA + 20) continue;
    for (const off of [0, 140, 280, o.w - 6]) {
      ctx.fillStyle = "#050505";
      ctx.fillRect(o.x + off, 290, 6, 90);
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(o.x + off + 1, 290, 1.5, 90);
    }
  }
}

// ---------- OBJETOS URBANOS ----------
// Não têm colisão (a van e o ônibus usam as plataformas que você colocou na fase).
const TIPOS_CIDADE = [
  "van", "poste", "lixeira", "escombros", "fio",
  "lixeiraTombada", "pneus", "carrinho", "semaforo", "ponto", "onibus",
  "carro", "predio",
];

function desenharObjetosCidade() {
  const t = performance.now() / 1000;

  for (const o of objetos) {
    if (!TIPOS_CIDADE.includes(o.tipo)) continue;
    if (o.x + (o.comp || 0) + (o.w || 0) < camera - 150 || o.x > camera + LARGURA + 150) continue;
    if (o.tipo === "onibus") { desenharOnibusFundo(o); continue; }
    if (o.tipo === "predio") { desenharPredio(o); continue; }

    ctx.save();
    ctx.translate(o.x, o.y === undefined ? 380 : o.y);   // (0,0) = base do objeto
    ctx.fillStyle = "#030303";
    ctx.strokeStyle = "#030303";
    ctx.lineCap = "round";

    if (o.tipo === "van") {
      // o corpo preto é a própria plataforma; aqui só vão os detalhes (100 x 40)
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-42, -34, 24, 14);                  // vidros quebrados
      ctx.strokeRect(-12, -34, 24, 14);
      ctx.strokeRect(18, -34, 24, 14);
      ctx.beginPath();
      ctx.moveTo(-8, -33); ctx.lineTo(4, -22);
      ctx.moveTo(-50, -12); ctx.lineTo(50, -12);
      ctx.stroke();
      for (const dx of [-30, 30]) {
        ctx.beginPath();
        ctx.arc(dx, -8, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

    } else if (o.tipo === "carro") {
      // carro de 100 x 40 (a plataforma invisível da fase tem o mesmo tamanho)
      if (o.espelhar) ctx.scale(-1, 1);

      const corpo = ctx.createLinearGradient(0, -40, 0, 0);
      corpo.addColorStop(0, "#161312");
      corpo.addColorStop(1, "#030303");
      ctx.fillStyle = corpo;
      ctx.beginPath();
      ctx.moveTo(-50, -8);
      ctx.lineTo(-50, -32);
      ctx.lineTo(-45, -37);
      ctx.lineTo(-41, -40);
      ctx.lineTo(40, -40);
      ctx.lineTo(47, -34);
      ctx.lineTo(50, -30);
      ctx.lineTo(50, -8);
      ctx.closePath();
      ctx.fill();

      // luz do pôr do sol batendo no teto
      ctx.strokeStyle = rgba(paleta.luz, 0.3);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-41, -39.5);
      ctx.lineTo(40, -39.5);
      ctx.stroke();

      // vidros: para-brisa, lateral e traseiro
      for (const [gx, gw] of [[-37, 24], [-9, 22], [19, 20]]) {
        ctx.fillStyle = rgba(paleta.luz, 0.1);
        ctx.fillRect(gx, -36, gw, 12);
        ctx.strokeStyle = "#030303";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(gx, -36, gw, 12);
      }
      ctx.strokeStyle = "#030303";                       // rachadura no para-brisa
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-30, -36); ctx.lineTo(-24, -31); ctx.lineTo(-27, -24);
      ctx.moveTo(-24, -31); ctx.lineTo(-16, -33);
      ctx.stroke();

      // lataria: divisões das portas, maçanetas e amassados
      ctx.strokeStyle = "#232120";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-50, -14); ctx.lineTo(50, -14);
      ctx.moveTo(-12, -24); ctx.lineTo(-12, -8);
      ctx.moveTo(17, -24);  ctx.lineTo(17, -8);
      ctx.moveTo(-6, -19);  ctx.lineTo(0, -19);
      ctx.stroke();

      // rodas, com aro claro para aparecer no escuro
      for (const wx of [-30, 30]) {
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(wx, -8, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2c2928";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wx, -8, 9, 0, Math.PI * 2);
        ctx.arc(wx, -8, 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // farol quebrado que pisca de vez em quando
      if (Math.sin(t * 7 + o.x) > 0.85) {
        ctx.fillStyle = paleta.luz;
        ctx.fillRect(-50, -26, 3, 5);
        ctx.fillStyle = rgba(paleta.luz, 0.12);
        ctx.beginPath();
        ctx.moveTo(-50, -26);
        ctx.lineTo(-90, -34);
        ctx.lineTo(-90, -8);
        ctx.lineTo(-50, -21);
        ctx.closePath();
        ctx.fill();
      }

    } else if (o.tipo === "poste") {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(2, -70, 8, -125);
      ctx.quadraticCurveTo(14, -140, 30, -138);
      ctx.stroke();
      ctx.fillRect(26, -140, 16, 7);
      if (Math.sin(t * 9) * Math.sin(t * 2.3 + o.x) > 0.85) {   // a luz pisca de vez em quando
        ctx.fillStyle = rgba(paleta.luz, 0.18);
        ctx.beginPath();
        ctx.moveTo(32, -133);
        ctx.lineTo(-20, 0);
        ctx.lineTo(90, 0);
        ctx.lineTo(40, -133);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = paleta.luz;
        ctx.fillRect(30, -134, 8, 3);
      }

    } else if (o.tipo === "lixeira") {
      ctx.fillRect(-9, -24, 18, 24);
      ctx.save();
      ctx.translate(-12, -26);
      ctx.rotate(-0.5);
      ctx.fillRect(0, -3, 22, 4);                        // tampa torta
      ctx.restore();
      ctx.strokeStyle = "#1f1f1f";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4, -20); ctx.lineTo(-4, -4);
      ctx.moveTo(3, -20);  ctx.lineTo(3, -4);
      ctx.stroke();

    } else if (o.tipo === "lixeiraTombada") {
      ctx.fillRect(-14, -18, 28, 18);
      ctx.beginPath();
      ctx.ellipse(-14, -9, 4, 9, 0, 0, Math.PI * 2);     // boca da lixeira
      ctx.fill();
      ctx.strokeStyle = "#1f1f1f";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -16); ctx.lineTo(-6, -2);
      ctx.moveTo(4, -16);  ctx.lineTo(4, -2);
      ctx.stroke();
      for (let k = 0; k < 7; k++) {                      // lixo espalhado
        ctx.beginPath();
        ctx.ellipse(-20 - k * 7, -2 - ruido(o.x + k) * 4, 4 + ruido(k + 9) * 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (o.tipo === "pneus") {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(k === 1 ? 3 : 0, -6 - k * 11, 17, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "#232323";
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(k === 1 ? 3 : 0, -6 - k * 11, 11, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();                                        // um pneu caído em pé ao lado
      ctx.translate(30, -14);
      ctx.rotate(0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

    } else if (o.tipo === "carrinho") {
      ctx.rotate(-0.12);                                 // meio tombado
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-14, -30); ctx.lineTo(16, -30); ctx.lineTo(12, -14); ctx.lineTo(-10, -14);
      ctx.closePath();
      for (let g = -6; g <= 8; g += 7) { ctx.moveTo(g, -30); ctx.lineTo(g - 2, -14); }
      ctx.moveTo(-14, -30); ctx.lineTo(-22, -40); ctx.lineTo(-30, -40);   // puxador
      ctx.moveTo(-8, -14);  ctx.lineTo(-8, -6);
      ctx.moveTo(10, -14);  ctx.lineTo(10, -6);
      ctx.stroke();
      for (const dx of [-8, 10]) {
        ctx.beginPath();
        ctx.arc(dx, -3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (o.tipo === "semaforo") {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1, -105);
      ctx.quadraticCurveTo(2, -122, -20, -120);
      ctx.stroke();
      ctx.save();                                        // caixa pendurada torta
      ctx.translate(-22, -120);
      ctx.rotate(0.3 + Math.sin(t * 1.1 + o.x) * 0.04);
      ctx.fillRect(-7, 0, 14, 36);
      ctx.fillStyle = "#1c1c1c";
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(0, 7 + k * 11, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.sin(t * 2.4 + o.x) > 0.9) {               // a lâmpada do meio acende por um instante
        ctx.fillStyle = paleta.luz;
        ctx.beginPath();
        ctx.arc(0, 18, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else if (o.tipo === "ponto") {
      // poste
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1, -96);
      ctx.stroke();

      // placa torta com vidro rachado
      ctx.save();
      ctx.translate(1, -96);
      ctx.rotate(0.12);
      ctx.fillRect(-14, -18, 28, 22);
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-10, -14, 20, 13);
      ctx.beginPath();
      ctx.moveTo(-4, -14); ctx.lineTo(0, -8); ctx.lineTo(-3, -1);
      ctx.moveTo(0, -8);   ctx.lineTo(6, -10);
      ctx.stroke();
      ctx.restore();

      // banco
      const bx = 16, bw = 58;
      ctx.fillStyle = "#030303";
      ctx.fillRect(bx, -20, bw, 4);                      // assento
      ctx.fillRect(bx + 5, -16, 4, 16);                  // pernas
      ctx.fillRect(bx + bw - 9, -16, 4, 16);
      ctx.fillRect(bx + 5, -42, 3, 22);                  // hastes do encosto
      ctx.fillRect(bx + bw - 8, -42, 3, 22);
      ctx.fillRect(bx + 2, -42, bw - 4, 3);              // ripa de cima
      ctx.fillRect(bx + 2, -33, (bw - 4) * 0.5, 3);      // ripa de baixo (só metade)
      ctx.save();                                        // a outra metade caiu
      ctx.translate(bx + bw - 8, -33);
      ctx.rotate(-0.6);
      ctx.fillRect(-(bw - 4) * 0.3, 0, (bw - 4) * 0.3, 3);
      ctx.restore();

      // luz do pôr do sol no encosto
      ctx.strokeStyle = rgba(paleta.luz, 0.22);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx + 2, -41.4);
      ctx.lineTo(bx + bw - 2, -41.4);
      ctx.stroke();

    } else if (o.tipo === "escombros") {
      for (let k = 0; k < 6; k++) {
        const bx = -30 + k * 11;
        const h = 8 + ruido(o.x + k) * 16;
        const w = 10 + ruido(o.x + k + 9) * 10;
        ctx.beginPath();
        ctx.moveTo(bx - w / 2, 1);
        ctx.lineTo(bx - w * 0.2, -h);
        ctx.lineTo(bx + w * 0.4, -h * 0.7);
        ctx.lineTo(bx + w / 2, 1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.lineWidth = 1.5;                               // vergalhões saindo do entulho
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        ctx.moveTo(-20 + k * 20, -10);
        ctx.lineTo(-20 + k * 20 + (k - 1) * 8, -34 - k * 4);
      }
      ctx.stroke();

    } else if (o.tipo === "fio") {
      // fio de energia caído, balançando (use y: 0 e comp = largura)
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 1.5;
      const sag = 55 + Math.sin(t * 0.8 + o.x) * 4;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.quadraticCurveTo(o.comp / 2, 30 + sag, o.comp, 20);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Cones de trânsito: tomam o lugar dos espinhos na cidade (mesma hitbox)
function desenharCones(e) {
  for (let x = e.x; x < e.x + e.w; x += 20) {
    const topo = e.y;
    const baseY = e.y + e.h - 3;

    // corpo do cone
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.moveTo(x + 8, topo);
    ctx.lineTo(x + 12, topo);
    ctx.lineTo(x + 17, baseY);
    ctx.lineTo(x + 3, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + 1, baseY, 18, 3);   // base quadrada

    // faixa clara refletiva
    ctx.fillStyle = "#2a2a2a";
    ctx.beginPath();
    ctx.moveTo(x + 10 - 4.1, topo + 7);
    ctx.lineTo(x + 10 + 4.1, topo + 7);
    ctx.lineTo(x + 10 + 5.2, topo + 11);
    ctx.lineTo(x + 10 - 5.2, topo + 11);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- PRÉDIO ----------
// O bloco sólido é a plataforma da fase (mesmo x). Embaixo dele fica o vão do térreo.
function desenharPredio(o) {
  const p = plataformas.find((q) => q.x === o.x);
  if (!p) return;                                   // precisa de uma plataforma no mesmo x
  const t = performance.now() / 1000;
  const x = p.x, w = p.w;
  const y0 = p.y, y1 = p.y + p.h;                   // bloco sólido
  const topo = y0 - (o.extra || 130);               // parte alta: só visual, o jogador não alcança
  const corte = x + w * 0.62;                       // daqui para a direita o prédio desabou

  ctx.save();
  ctx.lineCap = "round";

  // ----- térreo: o vão por onde se passa agachado -----
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(x, y1, w, 380 - y1);
  ctx.fillStyle = rgba(paleta.luz, 0.05);           // um pouco de luz entrando pelo outro lado
  ctx.fillRect(x + 12, y1 + 4, w - 24, 380 - y1 - 4);

  ctx.strokeStyle = "#0a0a0a";                      // viga que caiu na diagonal
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y1 + 2);
  ctx.lineTo(x + w * 0.56, 377);
  ctx.stroke();

  ctx.fillStyle = "#030303";                        // entulho no chão do térreo
  for (let k = 0; k < 7; k++) {
    const bx = x + 16 + k * ((w - 32) / 6);
    const h = 3 + ruido(o.x + k) * 7;
    ctx.beginPath();
    ctx.moveTo(bx - 6, 380);
    ctx.lineTo(bx - 1, 380 - h);
    ctx.lineTo(bx + 6, 380);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "#0a0a0a";                      // fios pendurados balançando
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) {
    const fx = x + 36 + k * 44;
    ctx.beginPath();
    ctx.moveTo(fx, y1);
    ctx.lineTo(fx + Math.sin(t * 1.4 + k * 2) * 3, y1 + 14 + k * 3);
    ctx.stroke();
  }

  // pilares nas pontas do vão
  for (const px of [x, x + w - 10]) {
    ctx.fillStyle = "#080707";
    ctx.fillRect(px, y1, 10, 380 - y1);
    ctx.fillStyle = "#1e1b1a";
    ctx.fillRect(px + (px === x ? 1 : 8), y1, 1.5, 380 - y1);
  }

  // ----- bloco sólido (a fachada) -----
  const parede = ctx.createLinearGradient(x, 0, x + w, 0);
  parede.addColorStop(0, "#110f0e");
  parede.addColorStop(1, "#070606");
  ctx.fillStyle = parede;
  ctx.fillRect(x, y0, w, y1 - y0);

  // ----- parte alta: o lado esquerdo ainda de pé, com o topo quebrado -----
  ctx.fillStyle = "#0d0b0b";
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, topo + 16);
  ctx.lineTo(x + w * 0.16, topo);
  ctx.lineTo(x + w * 0.28, topo + 20);
  ctx.lineTo(x + w * 0.45, topo + 6);
  ctx.lineTo(corte, topo + 46);
  ctx.lineTo(corte, y0);
  ctx.closePath();
  ctx.fill();

  // lado direito desabou: sobram lajes inclinadas e pilares quebrados
  ctx.fillStyle = "#0a0808";
  for (let k = 1; k <= 3; k++) {
    const ly = y0 - k * 36;
    const len = (x + w - corte) * (1.05 - k * 0.25);
    ctx.beginPath();
    ctx.moveTo(corte, ly);
    ctx.lineTo(corte + len, ly + 6 + k * 3);
    ctx.lineTo(corte + len, ly + 12 + k * 3);
    ctx.lineTo(corte, ly + 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#2a2625";                    // ferro pendurado na ponta da laje
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(corte + len, ly + 12 + k * 3);
    ctx.lineTo(corte + len + Math.sin(t * 1.3 + k) * 2, ly + 24 + k * 3);
    ctx.stroke();
  }
  ctx.fillStyle = "#0a0808";
  for (const [cx, h] of [[corte + 6, 118], [x + w - 8, 84]]) {
    ctx.fillRect(cx, y0 - h, 5, h);
    ctx.strokeStyle = "#2a2625";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx + 2, y0 - h);
    ctx.lineTo(cx + 3, y0 - h - 10);
    ctx.stroke();
  }

  // ----- janelas (algumas acesas, rachadas ou sem moldura) -----
  const janelas = (ax, ay, aw, ah, seed) => {
    const cols = Math.floor((aw - 10) / 30);
    const rows = Math.floor(ah / 34);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const h = ruido(seed + c * 7 + r * 13);
        if (h < 0.25) continue;                     // janela arrancada: só parede
        const jx = ax + (c + 0.5) * (aw / cols) - 9;
        const jy = ay + r * 34 + 6;
        ctx.fillStyle = h > 0.88
          ? rgba(paleta.luz, 0.22 + Math.sin(t * 5 + c + r) * 0.06)   // fogo lá dentro
          : rgba(paleta.luz, 0.08);
        ctx.fillRect(jx, jy, 18, 22);
        ctx.strokeStyle = "#030303";
        ctx.lineWidth = 2;
        ctx.strokeRect(jx, jy, 18, 22);
        if (h > 0.6 && h <= 0.88) {                 // vidro rachado
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(jx + 3, jy); ctx.lineTo(jx + 11, jy + 10); ctx.lineTo(jx + 7, jy + 22);
          ctx.stroke();
        }
      }
    }
  };
  janelas(x, y0 + 4, w, p.h - 8, o.x);
  janelas(x, topo + 50, corte - x, y0 - topo - 56, o.x + 50);

  // rachadura grande na fachada
  ctx.strokeStyle = "#1d1a19";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.7, y0 + 2);
  ctx.lineTo(x + w * 0.62, y0 + 50);
  ctx.lineTo(x + w * 0.7, y0 + 90);
  ctx.lineTo(x + w * 0.58, y1 - 8);
  ctx.stroke();

  // luz do pôr do sol nas bordas e cornija na base do bloco
  ctx.strokeStyle = rgba(paleta.luz, 0.18);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 0.75, y1);
  ctx.lineTo(x + 0.75, topo + 16);
  ctx.moveTo(x + w - 0.75, y1);
  ctx.lineTo(x + w - 0.75, y0);
  ctx.stroke();
  ctx.fillStyle = "#050505";
  ctx.fillRect(x, y1 - 6, w, 6);

  // ferros saindo da base do bloco, para dentro do vão
  ctx.strokeStyle = "#2a2625";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 5; k++) {
    ctx.moveTo(x + 14 + k * 32, y1);
    ctx.lineTo(x + 14 + k * 32 + (k % 2 ? 3 : -3), y1 + 6 + (k % 2) * 3);
  }
  ctx.stroke();

  ctx.restore();
}

// ---------- BLOCOS SOLTOS (caixote, viga, laje) ----------
// O visual vem do campo "estilo" da plataforma em fase.js. A colisão continua sendo o retângulo.
function desenharBlocos() {
  const t = performance.now() / 1000;
  for (const p of plataformas) {
    if (!p.estilo) continue;
    if (p.x + p.w < camera - 40 || p.x > camera + LARGURA + 40) continue;   // fora da tela
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (p.estilo === "caixote") blocoCaixote(p);
    else if (p.estilo === "viga") blocoViga(p, t);
    else if (p.estilo === "laje") blocoLaje(p);
    else if (p.estilo === "pedra") blocoPedra(p);
    else if (p.estilo === "tabua") blocoTabua(p, t);
    else if (p.estilo === "massa") blocoMassa(p, t);
    ctx.restore();
  }
}

// Caixa de madeira: travessas em X (uma já quebrou), pregos e um canto lascado
function blocoCaixote(p) {
  const { x, y, w, h } = p;

  ctx.fillStyle = "#070606";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w * 0.62, y);
  ctx.lineTo(x + w * 0.7, y + 3);                    // lasca no topo
  ctx.lineTo(x + w * 0.82, y + 1.5);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // moldura e travessas
  const m = 4;
  ctx.strokeStyle = "#221f1e";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + m, y + m, w - m * 2, h - m * 2);
  ctx.beginPath();
  ctx.moveTo(x + m, y + m);
  ctx.lineTo(x + w - m, y + h - m);                  // travessa inteira
  ctx.moveTo(x + w - m, y + m);
  ctx.lineTo(x + w * 0.58, y + h * 0.42);            // a outra quebrou no meio
  ctx.stroke();

  // pregos
  ctx.fillStyle = "#34302f";
  for (const [nx, ny] of [[x + m, y + m], [x + w - m, y + m], [x + m, y + h - m], [x + w - m, y + h - m]]) {
    ctx.beginPath();
    ctx.arc(nx, ny, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // tábua solta saindo pela lateral
  ctx.strokeStyle = "#0a0909";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w, y + h * 0.3);
  ctx.lineTo(x + w + 6, y + h * 0.22);
  ctx.stroke();

  // luz do pôr do sol na borda de cima
  ctx.strokeStyle = rgba(paleta.luz, 0.28);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w * 0.62, y + 0.6);
  ctx.moveTo(x + w * 0.82, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// Viga de aço pendurada por cabos, com treliça e pontas retorcidas
function blocoViga(p, t) {
  const { x, y, w, h } = p;

  // cabos que seguram a viga (desenhados antes, ficam atrás)
  ctx.strokeStyle = "#0b0a0a";
  ctx.lineWidth = 1.6;
  for (const fx of [x + w * 0.18, x + w * 0.82]) {
    const bal = Math.sin(t * 0.9 + fx) * 2;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.quadraticCurveTo(fx + bal, y / 2, fx + bal * 0.5, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fx, y - 3, 3, 0, Math.PI * 2);           // argola
    ctx.stroke();
  }

  // corpo e mesas (abas) de cima e de baixo
  ctx.fillStyle = "#080707";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#151211";
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);

  // treliça em X na alma
  ctx.strokeStyle = "#1f1b1a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let px = x; px < x + w - 1; px += 20) {
    const q = Math.min(px + 20, x + w);
    ctx.moveTo(px, y + 4); ctx.lineTo(q, y + h - 4);
    ctx.moveTo(q, y + 4);  ctx.lineTo(px, y + h - 4);
  }
  ctx.stroke();

  // rebites
  ctx.fillStyle = "#2d2928";
  for (let px = x + 6; px < x + w - 3; px += 12) {
    ctx.beginPath();
    ctx.arc(px, y + 2, 0.9, 0, Math.PI * 2);
    ctx.arc(px, y + h - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // pontas arrebentadas
  ctx.fillStyle = "#080707";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + 9, y + 3);
  ctx.lineTo(x + w + 3, y + 8);
  ctx.lineTo(x + w + 12, y + 13);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 6, y + 5);
  ctx.lineTo(x - 2, y + 10);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // luz do pôr do sol
  ctx.strokeStyle = rgba(paleta.luz, 0.3);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// Laje de concreto: topo reto, embaixo todo lascado, vergalhões nas pontas
function blocoLaje(p) {
  const { x, y, w, h } = p;

  ctx.fillStyle = "#080707";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - 3);
  for (let k = 7; k >= 0; k--) {
    const px = x + (w * k) / 7;
    ctx.lineTo(px + 3, y + h - ruido(x + k) * 9);
    ctx.lineTo(px, y + h - 2 - ruido(x + k + 5) * 6);
  }
  ctx.closePath();
  ctx.fill();

  // camadas e rachaduras
  ctx.strokeStyle = "#1d1a19";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 10);
  ctx.lineTo(x + w * 0.45, y + 10);
  ctx.moveTo(x + w * 0.52, y + 10);
  ctx.lineTo(x + w - 4, y + 10);
  ctx.moveTo(x + w * 0.35, y + 1);
  ctx.lineTo(x + w * 0.3, y + 12);
  ctx.lineTo(x + w * 0.38, y + 22);
  ctx.moveTo(x + w * 0.74, y + 10);
  ctx.lineTo(x + w * 0.7, y + 18);
  ctx.stroke();

  // vergalhões saindo das pontas
  ctx.strokeStyle = "#2a2625";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y + 9);
  ctx.lineTo(x - 9, y + 11);
  ctx.lineTo(x - 12, y + 6);
  ctx.moveTo(x + w, y + 17);
  ctx.lineTo(x + w + 10, y + 15);
  ctx.lineTo(x + w + 13, y + 20);
  ctx.stroke();

  // luz do pôr do sol
  ctx.strokeStyle = rgba(paleta.luz, 0.28);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// ---------- BLOCOS DA FLORESTA ----------

// Pedra empilhada (degraus): topo lascado, fileiras de pedras e rachadura
function blocoPedra(p) {
  const { x, y, w, h } = p;

  ctx.fillStyle = "#070707";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 4);
  ctx.lineTo(x + w * 0.25, y);
  ctx.lineTo(x + w * 0.5, y + 2);
  ctx.lineTo(x + w * 0.78, y);
  ctx.lineTo(x + w, y + 3);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // juntas das pedras, desencontradas de uma fileira para outra
  ctx.strokeStyle = "#1c1a19";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let fila = 0;
  for (let topo = y; topo < y + h - 3; topo += 18) {
    const base = Math.min(topo + 18, y + h);
    if (base < y + h) { ctx.moveTo(x, base); ctx.lineTo(x + w, base); }
    const off = fila % 2 ? w * 0.65 : w * 0.35;
    ctx.moveTo(x + off, topo + 1);
    ctx.lineTo(x + off, base);
    fila++;
  }
  ctx.stroke();

  // rachadura
  ctx.strokeStyle = "#232120";
  ctx.beginPath();
  const rx = x + w * (0.2 + ruido(x) * 0.5);
  ctx.moveTo(rx, y + 2);
  ctx.lineTo(rx - 4, y + h * 0.35);
  ctx.lineTo(rx + 3, y + h * 0.6);
  ctx.stroke();

  // luz na borda de cima
  ctx.strokeStyle = rgba(paleta.luz, 0.22);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + 0.6);
  ctx.lineTo(x + w * 0.5, y + 2.6);
  ctx.moveTo(x + w * 0.78, y + 0.6);
  ctx.lineTo(x + w, y + 3.6);
  ctx.stroke();
}

// Plataforma de tábuas pendurada por cordas, com cipós embaixo
function blocoTabua(p, t) {
  const { x, y, w, h } = p;

  // cordas (ficam atrás)
  ctx.strokeStyle = "#0b0a0a";
  ctx.lineWidth = 1.5;
  for (const fx of [x + 10, x + w - 10]) {
    const bal = Math.sin(t * 0.9 + fx) * 2;
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.quadraticCurveTo(fx + bal, y / 2, fx + bal * 0.5, 0);
    ctx.stroke();
  }

  ctx.fillStyle = "#070606";
  ctx.fillRect(x, y, w, h);

  // emendas das tábuas e veio da madeira
  ctx.strokeStyle = "#1e1b1a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let px = x + 30; px < x + w - 5; px += 30) {
    ctx.moveTo(px, y + 1);
    ctx.lineTo(px, y + h - 1);
  }
  ctx.moveTo(x + 3, y + h / 2);
  ctx.lineTo(x + w - 3, y + h / 2);
  ctx.stroke();

  // pregos
  ctx.fillStyle = "#34302f";
  for (let px = x + 6; px < x + w - 3; px += 30) {
    ctx.beginPath();
    ctx.arc(px, y + 4, 1, 0, Math.PI * 2);
    ctx.arc(px, y + h - 4, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // ponta quebrada com farpas
  ctx.fillStyle = "#070606";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + 7, y + 4);
  ctx.lineTo(x + w + 2, y + 9);
  ctx.lineTo(x + w + 8, y + h - 2);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // cipós pendurados
  ctx.strokeStyle = "#0b0a0a";
  ctx.lineWidth = 1.3;
  for (const f of [0.2, 0.55, 0.85]) {
    const bal = Math.sin(t * 1.3 + f * 9) * 2;
    ctx.beginPath();
    ctx.moveTo(x + w * f, y + h);
    ctx.quadraticCurveTo(x + w * f + bal, y + h + 8, x + w * f + bal * 1.5, y + h + 14 + f * 8);
    ctx.stroke();
  }

  ctx.strokeStyle = rgba(paleta.luz, 0.25);
  ctx.beginPath();
  ctx.moveTo(x, y + 0.6);
  ctx.lineTo(x + w, y + 0.6);
  ctx.stroke();
}

// Massa de terra e raízes (o túnel baixo): rachaduras e raízes pendendo
function blocoMassa(p, t) {
  const { x, y, w, h } = p;

  ctx.fillStyle = "#060606";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x - 4, y + h * 0.5);
  ctx.lineTo(x + 6, y + 14);
  ctx.lineTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.7, y + 8);
  ctx.lineTo(x + w - 6, y + 2);
  ctx.lineTo(x + w + 4, y + h * 0.45);
  ctx.lineTo(x + w, y + h);
  for (let k = 8; k >= 0; k--) {                       // barriga irregular, sempre dentro da hitbox
    ctx.lineTo(x + (w * k) / 8, y + h - (k % 2 ? 4 + ruido(x + k) * 6 : 0));
  }
  ctx.closePath();
  ctx.fill();

  // rachaduras
  ctx.strokeStyle = "#1d1a19";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 6);
  ctx.lineTo(x + w * 0.24, y + h * 0.3);
  ctx.lineTo(x + w * 0.34, y + h * 0.55);
  ctx.lineTo(x + w * 0.28, y + h * 0.8);
  ctx.moveTo(x + w * 0.7, y + 14);
  ctx.lineTo(x + w * 0.78, y + h * 0.4);
  ctx.lineTo(x + w * 0.72, y + h * 0.7);
  ctx.stroke();

  // raízes caindo pelas laterais e pendendo por baixo
  ctx.strokeStyle = "#0a0909";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let k = 0; k < 6; k++) {
    const rx = x + 8 + k * ((w - 16) / 5);
    const bal = Math.sin(t * 1.1 + k * 1.7) * 1.5;
    ctx.beginPath();
    ctx.moveTo(rx, y + h - 4);
    ctx.quadraticCurveTo(rx + bal, y + h + 3, rx + bal * 1.6, y + h + 8 + (k % 3) * 3);
    ctx.stroke();
  }

  ctx.strokeStyle = rgba(paleta.luz, 0.2);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 0.6);
  ctx.lineTo(x + w * 0.7, y + 8.6);
  ctx.stroke();
}

// ---------- ABRIGOS DA CIDADE ----------
// "rochedo" vira bloco de concreto e "muro" ganha tijolos faltando e ferro exposto
function desenharAbrigoCidade(o) {
  ctx.save();
  ctx.translate(o.x, 380);          // (0,0) = base no chão
  ctx.fillStyle = "#030303";
  ctx.strokeStyle = "#030303";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (o.tipo === "rochedo") {
    // laje caída, encostada atrás do bloco
    ctx.fillStyle = "#0a0909";
    ctx.beginPath();
    ctx.moveTo(-24, -46);
    ctx.lineTo(24, -76);
    ctx.lineTo(30, -69);
    ctx.lineTo(-18, -39);
    ctx.closePath();
    ctx.fill();

    // bloco principal, com cantos quebrados
    ctx.fillStyle = "#030303";
    ctx.beginPath();
    ctx.moveTo(-38, 1);
    ctx.lineTo(-38, -34);
    ctx.lineTo(-30, -48);
    ctx.lineTo(-8, -50);
    ctx.lineTo(-4, -44);
    ctx.lineTo(22, -46);
    ctx.lineTo(38, -36);
    ctx.lineTo(38, 1);
    ctx.closePath();
    ctx.fill();

    // rachaduras
    ctx.strokeStyle = "#1f1c1b";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, -48); ctx.lineTo(-20, -30); ctx.lineTo(-12, -16); ctx.lineTo(-18, -2);
    ctx.moveTo(16, -44);  ctx.lineTo(22, -26);
    ctx.stroke();

    // vergalhões saindo do topo
    ctx.strokeStyle = "#2a2625";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, -48); ctx.lineTo(-30, -60); ctx.lineTo(-24, -66);
    ctx.moveTo(4, -45);   ctx.lineTo(8, -58);
    ctx.stroke();

    // luz do pôr do sol
    ctx.strokeStyle = rgba(paleta.luz, 0.22);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-30, -47.4); ctx.lineTo(-8, -49.4);
    ctx.moveTo(-4, -43.4);  ctx.lineTo(22, -45.4);
    ctx.stroke();

  } else if (o.tipo === "muro") {
    ctx.beginPath();
    ctx.moveTo(-45, 1);
    ctx.lineTo(-45, -52);
    ctx.lineTo(-30, -54);
    ctx.lineTo(-24, -46);
    ctx.lineTo(-10, -48);
    ctx.lineTo(-6, -58);
    ctx.lineTo(12, -56);
    ctx.lineTo(18, -44);
    ctx.lineTo(34, -46);
    ctx.lineTo(45, -40);
    ctx.lineTo(45, 1);
    ctx.closePath();
    ctx.fill();

    // tijolos faltando: deixam um pouco de luz passar
    ctx.fillStyle = rgba(paleta.luz, 0.08);
    ctx.fillRect(-22, -32, 10, 10);
    ctx.fillRect(14, -22, 10, 10);
    ctx.fillRect(-4, -12, 10, 10);

    // juntas dos tijolos, desencontradas
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    let fila = 0;
    for (let y = -10; y > -46; y -= 10) {
      ctx.moveTo(-45, y); ctx.lineTo(45, y);
      for (let bx = -45 + (fila % 2) * 10; bx < 45; bx += 20) {
        ctx.moveTo(bx, y); ctx.lineTo(bx, y + 10);
      }
      fila++;
    }
    ctx.stroke();

    // ferros expostos no topo
    ctx.strokeStyle = "#2a2625";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, -58);  ctx.lineTo(-9, -70);  ctx.lineTo(-3, -75);
    ctx.moveTo(12, -56);  ctx.lineTo(15, -66);
    ctx.moveTo(-38, -53); ctx.lineTo(-40, -62);
    ctx.stroke();

    // luz do pôr do sol
    ctx.strokeStyle = rgba(paleta.luz, 0.22);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-45, -51.4); ctx.lineTo(-30, -53.4);
    ctx.moveTo(-6, -57.4);  ctx.lineTo(12, -55.4);
    ctx.stroke();
  }

  ctx.restore();
}