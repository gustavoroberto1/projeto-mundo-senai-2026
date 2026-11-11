function camadaArvores(velocidade, opacidade, espaco, alturaBase) {
  ctx.globalAlpha = opacidade;
  ctx.fillStyle = paleta.arvore;
  for (let i = 0; i < 30; i++) {
    const altura = alturaBase + (i * 53) % 140;
    const x = i * espaco + (i % 3) * 20 - camera * velocidade;
    ctx.fillRect(Math.round(x), ALTURA - altura, 12 + (i % 3) * 6, altura);
  }
  ctx.globalAlpha = 1;
}

// lanterna pendurada com cone de luz, como nas imagens de referência
function desenharLanterna(x) {
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = paleta.luz;
  ctx.beginPath();
  ctx.moveTo(x, 130);
  ctx.lineTo(x - 50, 380);
  ctx.lineTo(x + 50, 380);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#050505";
  ctx.fillRect(x - 1, 0, 2, 120);
  ctx.fillRect(x - 6, 120, 12, 14);
  ctx.fillStyle = paleta.luz;
  ctx.fillRect(x - 3, 124, 6, 7);
}

// ---------- BONECO ARTICULADO ----------
// ângulo 0 = apontando para baixo; positivo = para frente; ~3 = para cima

function ruido(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function desenharGrama() {
  const t = performance.now() / 1000;
  const pesX = jogador.x + jogador.w / 2;
  const pesY = jogador.y + jogador.h;

  ctx.strokeStyle = "#050505";
  ctx.lineCap = "round";
  ctx.lineWidth = 1.6;

  for (const p of plataformas) {
    if (p.x + p.w < camera - 20 || p.x > camera + LARGURA + 20) continue;   // fora da tela
    if (p.semGrama || p.estilo) continue;                                   // sem grama em blocos

    const ini = Math.max(p.x + 2, Math.floor(camera / 4) * 4 - 8);
    const fim = Math.min(p.x + p.w - 2, camera + LARGURA + 8);

    ctx.beginPath();
    for (let x = ini; x <= fim; x += 4) {
      // não nasce grama em cima dos espinhos
      if (espinhos.some((e) => e.y + e.h === p.y && x > e.x - 4 && x < e.x + e.w + 4)) continue;

      const i = Math.round(x / 4);
      const alt = 4 + ruido(i) * 6 + (ruido(i + 5) > 0.85 ? 6 : 0);   // de vez em quando um tufo maior
      let curva = Math.sin(t * 1.6 + i * 0.5) * 1.5 + (ruido(i + 9) - 0.5) * 4;

      // o jogador empurra a grama quando passa
      const perto = Math.abs(x - pesX);
      if (perto < 18 && Math.abs(pesY - p.y) < 6) {
        curva += (x < pesX ? -1 : 1) * (18 - perto) * 0.3;
      }

      ctx.moveTo(x, p.y + 1);
      ctx.quadraticCurveTo(x + curva * 0.3, p.y - alt * 0.6, x + curva, p.y - alt);
    }
    ctx.stroke();
  }
}

// y padrão = 380 (o chão). Correntes usam y: 0 (penduradas no teto).

// número "aleatório" que sempre dá o mesmo resultado para a mesma entrada
// (assim as árvores não ficam tremendo a cada quadro de segundo)-
function pseudo(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// desenha um galho e vai dividindo em galhos menores
function desenharGalho(x, y, ang, comp, esp, prof, seed) {
  if (prof === 0 || comp < 5) return;
  const x2 = x + Math.cos(ang) * comp;
  const y2 = y + Math.sin(ang) * comp;
  ctx.lineWidth = Math.max(1, esp);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const filhos = pseudo(seed) > 0.6 ? 3 : 2;
  for (let k = 0; k < filhos; k++) {
    const lado = filhos === 3 ? k - 1 : (k === 0 ? -1 : 1);
    const desvio = lado * (0.3 + pseudo(seed + k * 7) * 0.45);
    desenharGalho(
      x2, y2,
      ang + desvio,
      comp * (0.62 + pseudo(seed + k * 3) * 0.15),
      esp * 0.65,
      prof - 1,
      seed + k * 13 + 1
    );
  }
}

// árvores com tronco afinando e galhos ramificados
function camadaGalhos(velocidade, opacidade, espaco, alturaBase) {
  ctx.globalAlpha = opacidade;
  ctx.fillStyle = paleta.arvore;
  ctx.strokeStyle = paleta.arvore;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < 30; i++) {
    const x = i * espaco + (i % 3) * 20 - camera * velocidade;
    if (x < -160 || x > LARGURA + 160) continue;   // fora da tela, nem desenha

    const altura = alturaBase * 0.8 + pseudo(i) * 120;
    const largura = 10 + pseudo(i + 50) * 8;
    const inclina = (pseudo(i + 9) - 0.5) * 14;     // tronco levemente torto
    const baseY = ALTURA;
    const topoX = x + largura / 2 + inclina;
    const topoY = ALTURA - altura;

    // tronco: trapézio, grosso embaixo e fino em cima
    ctx.beginPath();
    ctx.moveTo(x - 3, baseY);
    ctx.lineTo(x + largura + 3, baseY);
    ctx.lineTo(topoX + 2, topoY);
    ctx.lineTo(topoX - 2, topoY);
    ctx.closePath();
    ctx.fill();

    // galhos laterais ao longo do tronco
    for (let j = 0; j < 5; j++) {
      const t = 0.35 + j * 0.13;                    // altura no tronco (0 base, 1 topo)
      const gx = x + largura / 2 + inclina * t;
      const gy = baseY - altura * t;
      const lado = (i + j) % 2 === 0 ? -1 : 1;
      const ang = -Math.PI / 2 + lado * (0.7 + pseudo(i * 5 + j) * 0.5);
      desenharGalho(gx, gy, ang, 22 + pseudo(i + j * 11) * 22, 3.5 - j * 0.4, 3, i * 31 + j * 17);
    }

    // copa: o topo se abre em galhos finos
    desenharGalho(topoX, topoY, -Math.PI / 2, 26 + pseudo(i + 3) * 14, 3.5, 4, i * 97);
  }
  ctx.globalAlpha = 1;
}