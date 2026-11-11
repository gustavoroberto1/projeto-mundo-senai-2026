// =====================================================================
//  DESENHO NA TELA
// =====================================================================
// Desenha um retângulo com a mesma geometria usada pelo sistema de colisão.
function desenharRetangulo(retangulo, cor) {
  ctx.fillStyle = cor;
  ctx.fillRect(retangulo.x, retangulo.y, retangulo.largura, retangulo.altura);
}

function desenharHitbox(retangulo, cor) {
  if (!MOSTRAR_HITBOX || !retangulo) return;
  ctx.save();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.strokeRect(retangulo.x, retangulo.y, retangulo.largura, retangulo.altura);
  ctx.restore();
}

// Imagem de fundo da fase (a fase pode ter a sua com  cenario: 'img/cenario/outro.jpg')
function desenharCenario() {
  const imagem = obterImagem(fase.cenario || CENARIO_PADRAO);
  if (imagemPronta(imagem)) {
    ctx.drawImage(imagem, 0, 0, LARGURA_TELA, ALTURA_TELA);
  } else {
    ctx.fillStyle = '#33c6ff';          // céu azul, caso a imagem não carregue
    ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);
  }
}

// Desenha uma plataforma de terra e duas faixas verdes que formam a grama.
function desenharChao(r) {
  ctx.fillStyle = '#7a4b2a';
  ctx.fillRect(r.x, r.y, r.largura, r.altura);
  ctx.fillStyle = '#3fae3a';
  ctx.fillRect(r.x, r.y, r.largura, Math.min(8, r.altura));
  ctx.fillStyle = '#2f8f2c';
  ctx.fillRect(r.x, r.y + Math.min(8, r.altura) - 2, r.largura, 2);
}

// ---------------------------------------------------------------------
//  PEDRA
//  Bloco de pedra (usado nos tetos baixos e nas paredes): pedras de tamanhos
//  diferentes, contorno escuro e musgo no topo, nas cores do desenho da pedra.
//  Ele preenche o bloco INTEIRO (o que você vê é exatamente onde o gato bate).
//  O desenho é montado uma vez por bloco e guardado, então não pesa no jogo.
// ---------------------------------------------------------------------
const PEDRA_PIXEL = 3;                                  // tamanho de cada "pixel" do desenho (maior = mais grosso)
const PEDRA_CONTORNO = '#1c0f1e';
const PEDRA_CORES = ['#6a5f5d', '#5f5656', '#564e51', '#4b444a'];   // as pedras (sorteadas)
const PEDRA_LUZ = '#7d7370';                            // quina de cima/esquerda de cada pedra
const PEDRA_SOMBRA = '#3b333a';                         // quina de baixo/direita de cada pedra
const PEDRA_MUSGO = ['#bacd35', '#8ea82b'];             // musgo claro e escuro
const PEDRA_ALTURA_FILEIRA = [5, 7];                    // altura das fileiras de pedra, em "pixels" (mínimo, máximo)
const PEDRA_LARGURA_PEDRA = [8, 16];                    // largura de cada pedra, em "pixels" (mínimo, máximo)

const PEDRAS_PRONTAS = {};

// Cria um gerador pseudoaleatório repetível: a mesma semente produz a mesma
// sequência, mantendo o padrão de pedra estável entre os frames.
function sorteadorComSemente(semente) {
  let n = semente >>> 0;
  return function () {
    n = (n + 0x6D2B79F5) >>> 0;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Monta a textura pixelada de um bloco numa tela auxiliar, para reutilizá-la
// sem reconstruir o mosaico de pedras em cada frame.
function montarPedra(retangulo) {
  const unidadePixel = PEDRA_PIXEL;
  const colunas = Math.max(1, Math.ceil(retangulo.largura / unidadePixel));
  const linhas = Math.max(1, Math.ceil(retangulo.altura / unidadePixel));
  const canvasPedra = document.createElement('canvas');
  canvasPedra.width = colunas * unidadePixel;
  canvasPedra.height = linhas * unidadePixel;
  const contextoPedra = canvasPedra.getContext('2d');
  const sortear = sorteadorComSemente(Math.round(
    retangulo.x * 7 + retangulo.y * 13 + retangulo.largura * 17 + retangulo.altura * 19
  ));
  const inteiroAleatorioEntre = (intervalo) =>
    intervalo[0] + Math.floor(sortear() * (intervalo[1] - intervalo[0] + 1));
  const desenharBloco = (x, y, largura, altura, cor) => {
    contextoPedra.fillStyle = cor;
    contextoPedra.fillRect(
      x * unidadePixel,
      y * unidadePixel,
      largura * unidadePixel,
      altura * unidadePixel
    );
  };

  // fundo (cor do contorno: as frestas entre as pedras ficam escuras)
  desenharBloco(0, 0, colunas, linhas, PEDRA_CONTORNO);

  // fileiras de pedras, cada uma começando num ponto diferente (como um muro de pedra solta)
  let y = 0;
  while (y < linhas) {
    const alturaFileira = Math.min(inteiroAleatorioEntre(PEDRA_ALTURA_FILEIRA), linhas - y);
    let x = -Math.floor(sortear() * PEDRA_LARGURA_PEDRA[1]);
    while (x < colunas) {
      const larguraPedra = inteiroAleatorioEntre(PEDRA_LARGURA_PEDRA);
      const x0 = Math.max(x, 0);
      const x1 = Math.min(x + larguraPedra, colunas);
      // 1 "pixel" de fresta em volta de cada pedra
      const pedraX = x0 + (x < 0 ? 0 : 1);
      const pedraY = y + 1;
      const larguraInterior = x1 - pedraX;
      const alturaInterior = alturaFileira - 1;
      if (larguraInterior > 1 && alturaInterior > 1) {
        desenharBloco(
          pedraX,
          pedraY,
          larguraInterior,
          alturaInterior,
          PEDRA_CORES[Math.floor(sortear() * PEDRA_CORES.length)]
        );
        desenharBloco(pedraX, pedraY, larguraInterior, 1, PEDRA_LUZ); // luz em cima
        desenharBloco(pedraX, pedraY, 1, alturaInterior, PEDRA_LUZ); // luz à esquerda
        desenharBloco(pedraX, pedraY + alturaInterior - 1, larguraInterior, 1, PEDRA_SOMBRA);
        desenharBloco(pedraX + larguraInterior - 1, pedraY, 1, alturaInterior, PEDRA_SOMBRA);
        if (sortear() < 0.35 && larguraInterior > 5 && alturaInterior > 3) {
          desenharBloco(pedraX + 2, pedraY + 2, Math.min(3, larguraInterior - 4), 1, PEDRA_LUZ);
        }
      }
      x += larguraPedra;
    }
    y += alturaFileira;
  }

  // musgo no topo, com algumas gotinhas escorrendo
  for (let coluna = 0; coluna < colunas; coluna++) {
    const profundidadeMusgo = 1 + Math.floor(sortear() * 2) +
      (sortear() < 0.22 ? 2 + Math.floor(sortear() * 2) : 0);
    desenharBloco(coluna, 0, 1, Math.min(profundidadeMusgo + 1, linhas), PEDRA_MUSGO[0]);
    if (sortear() < 0.5) {
      desenharBloco(coluna, Math.min(profundidadeMusgo, linhas - 1), 1, 1, PEDRA_MUSGO[1]);
    }
  }

  // contorno escuro em volta do bloco todo
  desenharBloco(0, linhas - 1, colunas, 1, PEDRA_CONTORNO);
  desenharBloco(0, 0, 1, linhas, PEDRA_CONTORNO);
  desenharBloco(colunas - 1, 0, 1, linhas, PEDRA_CONTORNO);

  return canvasPedra;
}

// Desenha o bloco de pedra com uma textura armazenada em cache.
function desenharPedra(retangulo) {
  const chave = retangulo.largura + 'x' + retangulo.altura + '@' + retangulo.x + ',' + retangulo.y;
  if (!PEDRAS_PRONTAS[chave]) PEDRAS_PRONTAS[chave] = montarPedra(retangulo);

  ctx.save();
  ctx.beginPath();
  ctx.rect(retangulo.x, retangulo.y, retangulo.largura, retangulo.altura);
  ctx.clip();                                   // corta o que passar do bloco (largura que não divide certinho)
  ctx.imageSmoothingEnabled = false;            // mantém o pixel art nítido
  ctx.drawImage(PEDRAS_PRONTAS[chave], retangulo.x, retangulo.y);
  ctx.restore();
}

// Plataforma da fase: terra com grama, ou pedra se tiver  estilo: 'pedra'
function desenharPlataforma(plataforma) {
  if (plataforma.estilo === 'pedra') {
    desenharPedra(plataforma);
  } else {
    desenharChao(plataforma);
  }
}

// Imagem do espinho (se você mudar a pasta ou o nome, é só trocar aqui)
const ESPINHO_IMAGEM = 'img/cenario/espinho.png';

// Desenha a imagem do espinho. Retorna false se a imagem ainda não carregou.
// paraBaixo = true vira a imagem de cabeça pra baixo (espinhos do teto)
function desenharSpriteDeEspinho(a, paraBaixo) {
  const imagem = obterImagem(ESPINHO_IMAGEM);
  if (!imagemPronta(imagem)) return false;

  // Quantas imagens cabem na largura do espinho, sem esticar demais
  const proporcao = imagem.naturalWidth / imagem.naturalHeight;
  const quantos = Math.max(1, Math.round(a.largura / (a.altura * proporcao)));
  const larguraCada = a.largura / quantos;

  ctx.save();
  ctx.imageSmoothingEnabled = false;      // mantém o pixel art nítido
  for (let i = 0; i < quantos; i++) {
    const centroX = a.x + i * larguraCada + larguraCada / 2;
    const centroY = a.y + a.altura / 2;

    ctx.save();
    ctx.translate(centroX, centroY);
    if (paraBaixo) ctx.scale(1, -1);
    ctx.drawImage(imagem, -larguraCada / 2, -a.altura / 2, larguraCada, a.altura);
    ctx.restore();
  }
  ctx.restore();
  return true;
}

// Espinhos do chão (apontando pra cima)
function desenharEspinhosParaCima(a) {
  if (desenharSpriteDeEspinho(a, false)) return;

  // Plano B: triângulos, caso a imagem não carregue
  ctx.fillStyle = '#e63946';
  for (let x = a.x; x < a.x + a.largura; x = x + 10) {
    ctx.beginPath();
    ctx.moveTo(x, a.y + a.altura);
    ctx.lineTo(x + 5, a.y);
    ctx.lineTo(x + 10, a.y + a.altura);
    ctx.fill();
  }
}

// Espinhos do teto (apontando pra baixo)
function desenharEspinhosParaBaixo(a) {
  if (desenharSpriteDeEspinho(a, true)) return;

  // Plano B: triângulos, caso a imagem não carregue
  ctx.fillStyle = '#e63946';
  for (let x = a.x; x < a.x + a.largura; x = x + 10) {
    ctx.beginPath();
    ctx.moveTo(x, a.y);
    ctx.lineTo(x + 10, a.y);
    ctx.lineTo(x + 5, a.y + a.altura);
    ctx.fill();
  }
}

// Escurece a fase com uma janela circular transparente em volta do jogador.
function desenharEscuridao() {
  const centroX = jogador.x + jogador.largura / 2;
  const centroY = jogador.y + jogador.altura / 2;
  const degrade = ctx.createRadialGradient(centroX, centroY, 30, centroX, centroY, 140);
  degrade.addColorStop(0, 'rgba(0,0,0,0)');     // perto do jogador: transparente
  degrade.addColorStop(1, 'rgba(0,0,0,1)');     // longe: preto total
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);
}

// Desenha o HUD, pausando o cronômetro visual enquanto a fase está congelada.
function desenharTextos() {
  const agora = faseIniciada ? performance.now() : congeladoDesde;      // parada = o relógio não anda
  const segundos = ((agora - inicioDaFase) / 1000).toFixed(1);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';          // faixa escura pro texto ficar legível em cima do céu
  ctx.fillRect(0, 0, LARGURA_TELA, 56);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(
    apelido + ' | Fase ' + (numeroFase + 1) + '/' + FASES.length +
    ' | Mortes: ' + mortesTotais + ' | Tempo: ' + segundos + 's | Pontos: ' + pontosTotais,
    10, 24);

  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText(fase.nome, LARGURA_TELA / 2, 48);

  // Aviso enquanto a fase está parada
  if (!faseIniciada && !jogador.morto) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText('Mexa-se para começar', LARGURA_TELA / 2, 90);
    ctx.fillText('Mexa-se para começar', LARGURA_TELA / 2, 90);
  }
}

// Desenha tudo, na ordem: cenário, chão, armadilhas, inimigos, porta, jogador, espada, escuridão, textos
function desenharJogo() {
  ctx.clearRect(0, 0, LARGURA_TELA, ALTURA_TELA);
  desenharCenario();

  for (let i = 0; i < fase.plataformas.length; i++) {
    desenharPlataforma(fase.plataformas[i]);
  }

  desenharArmadilhas();
  desenharInimigos();
  desenharPorta(fase.porta);
  desenharJogador();
  desenharAtaqueEspada();

  if (fase.escuro) {
    desenharEscuridao();
  }

  desenharTextos();      // por último, pra ficar por cima da escuridão
}