// =====================================================================
//  ANIMAÇÃO DE MORTE DOS INIMIGOS (vale pra todos os tipos)
//
//  Quando a espada acerta um inimigo, o combate.js chama matarInimigo(inimigo):
//    1) o inimigo SAI da lista na hora (não machuca mais o gato, abre vaga na fila,
//       e os tiros dele somem, igual era antes);
//    2) nasce um "efeito de morte": uma cópia do inimigo congelada no momento do golpe,
//       que pisca branca, é arremessada pra longe do gato girando, cai, some aos poucos
//       e solta estrelinhas/penas/fumaça. Quando termina, o efeito some sozinho.
//
//  O desenho do inimigo morrendo é o MESMO desenho do inimigo vivo (o desenhar() do tipo),
//  então quando você criar um tipo novo de inimigo ele já ganha a animação.
//  Pra mudar o jeito de morrer de cada tipo, mexa em MORTE_PARAMETROS no config.js.
// =====================================================================
const EFEITOS_MORTE = [];

function criarEfeitoMorte(inimigo) {
  const params = MORTE_PARAMETROS[inimigo.tipo] || MORTE_PADRAO;
  const centroX = inimigo.x + inimigo.largura / 2;
  const centroY = inimigo.y + inimigo.altura / 2 - (params.centroYSubir || 0);

  // Voa pra longe do gato (se não der pra saber, pra onde o inimigo estava olhando)
  let lado = centroX - (jogador.x + jogador.largura / 2) >= 0 ? 1 : -1;
  if (centroX === jogador.x + jogador.largura / 2) lado = inimigo.direcao < 0 ? -1 : 1;

  // Cópia congelada do inimigo (sem tiros e sem ataque em andamento) pra desenhar enquanto morre
  const copia = Object.assign({}, inimigo, { projeteis: [], ataque: 'nenhum' });
  if (copia.virado !== undefined) copia.virado = -lado;       // de frente pro golpe, voando de costas

  // O chão mais perto debaixo dele (pra ele quicar em vez de atravessar). null = não tem, aí cai pra fora da tela.
  let chao = null;
  const solidos = listarSolidos();
  const pes = inimigo.y + inimigo.altura;
  for (let i = 0; i < solidos.length; i++) {
    const s = solidos[i];
    if (s.visivel === false) continue;
    const embaixo = centroX >= s.x && centroX <= s.x + s.largura && s.y >= pes - 4;
    if (embaixo && (chao === null || s.y < chao)) chao = s.y;
  }

  const efeito = {
    chao: chao,
    giro: params.giro,
    tipo: TIPOS_INIMIGO[inimigo.tipo],
    copia: copia,
    params: params,
    tempo: 0,
    lado: lado,
    centroX: centroX,
    centroY: centroY,
    impactoX: centroX,                 // onde o golpe pegou (o anel do impacto fica aqui)
    impactoY: centroY,
    vx: params.impulsoX * lado,
    vy: params.impulsoY,
    angulo: 0,
    particulas: []
  };

  for (let i = 0; i < MORTE_PARTICULAS; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const forca = 1.2 + Math.random() * 2.8;
    efeito.particulas.push({
      x: centroX, y: centroY,
      vx: Math.cos(angulo) * forca + efeito.vx * 0.3,
      vy: Math.sin(angulo) * forca - (params.fumaca ? 0.6 : 1.5),
      tamanho: params.fumaca ? 6 + Math.random() * 6 : 3 + Math.floor(Math.random() * 3),
      vida: 22 + Math.floor(Math.random() * 18),
      idade: 0,
      cor: params.particulas[Math.floor(Math.random() * params.particulas.length)]
    });
  }

  EFEITOS_MORTE.push(efeito);
}

// Chamada pelo combate quando a espada acerta: o inimigo morre COM animação
function matarInimigo(inimigo) {
  if (fase.inimigos.indexOf(inimigo) < 0) return;

  removerInimigo(inimigo);
  pontosInimigosPendentes += PONTOS_POR_INIMIGO;
  criarEfeitoMorte(inimigo);
}

// Roda a cada frame (vem de animarInimigos, então continua até com o gato morrendo)
function atualizarEfeitosMorte() {
  for (let i = EFEITOS_MORTE.length - 1; i >= 0; i--) {
    const e = EFEITOS_MORTE[i];
    e.tempo++;

    e.vy += e.params.gravidade;
    e.copia.x += e.vx;
    e.copia.y += e.vy;
    e.centroX += e.vx;
    e.centroY += e.vy;
    e.angulo += e.giro * e.lado;

    // Bateu no chão: quica 2 ou 3 vezes (cada vez menos e girando menos) e fica lá até sumir
    const pesCopia = e.copia.y + e.copia.altura;
    if (e.chao !== null && e.vy > 0 && pesCopia >= e.chao) {
      const diferenca = pesCopia - e.chao;
      e.copia.y -= diferenca;
      e.centroY -= diferenca;
      if (e.vy < 2.2) { e.vy = 0; e.vx *= 0.7; e.giro = 0; }
      else { e.vy = -e.vy * 0.4; e.vx *= 0.7; e.giro *= 0.4; }
    }
    if (e.chao !== null && e.vy === 0) e.vx *= 0.85;      // deslizando até parar

    for (let j = e.particulas.length - 1; j >= 0; j--) {
      const p = e.particulas[j];
      p.idade++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += e.params.fumaca ? -0.02 : 0.2;        // fumaça sobe, o resto cai
      p.vx *= 0.97;
      if (p.idade >= p.vida) e.particulas.splice(j, 1);
    }

    if (e.tempo >= e.params.duracao) EFEITOS_MORTE.splice(i, 1);
  }
}

// Estrelinha de pixel (um "+" com um quadrado no meio)
function desenharEstrelinha(x, y, t) {
  ctx.fillRect(Math.round(x - t / 2), Math.round(y - t * 1.5), t, t * 3);
  ctx.fillRect(Math.round(x - t * 1.5), Math.round(y - t / 2), t * 3, t);
}

function desenharEfeitosMorte() {
  for (let i = 0; i < EFEITOS_MORTE.length; i++) {
    const e = EFEITOS_MORTE[i];
    const duracao = e.params.duracao;

    // Anel do impacto, só nos primeiros frames
    if (e.tempo < 10) {
      ctx.save();
      ctx.globalAlpha = 1 - e.tempo / 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.impactoX, e.impactoY, 8 + e.tempo * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // O inimigo: pisca branco, gira e vai sumindo no final
    ctx.save();
    const sumir = e.tempo > duracao * 0.6 ? 1 - (e.tempo - duracao * 0.6) / (duracao * 0.4) : 1;
    ctx.globalAlpha = Math.max(0, sumir);
    ctx.translate(e.centroX, e.centroY);
    ctx.rotate(e.angulo);
    ctx.translate(-e.centroX, -e.centroY);
    if (e.tempo < MORTE_PISCAR_FRAMES && 'filter' in ctx) ctx.filter = 'brightness(0) invert(1)';   // silhueta branca
    if (e.tipo && e.tipo.desenhar) e.tipo.desenhar(e.copia);
    ctx.restore();

    // Partículas (estrelinhas, penas, fumaça)
    for (let j = 0; j < e.particulas.length; j++) {
      const p = e.particulas[j];
      const resta = 1 - p.idade / p.vida;
      ctx.save();
      ctx.globalAlpha = Math.max(0, resta) * (e.params.fumaca ? 0.7 : 1);
      ctx.fillStyle = p.cor;
      if (e.params.fumaca) {
        const t = p.tamanho * (1.3 - resta * 0.5);
        ctx.fillRect(Math.round(p.x - t / 2), Math.round(p.y - t / 2), Math.round(t), Math.round(t));
      } else if (e.params.estrelas) {
        desenharEstrelinha(p.x, p.y, Math.max(1, Math.round(p.tamanho / 2)));
      } else {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.tamanho, p.tamanho);
      }
      ctx.restore();
    }
  }
}