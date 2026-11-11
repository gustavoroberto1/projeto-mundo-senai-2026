// A transição entre fases tem três etapas:
// 1. "fechando": quadrados coloridos crescem até cobrir a tela.
// 2. "cartao": a tela fica escura e mostra o número e o nome da nova fase.
// 3. "abrindo": os quadrados encolhem para revelar a nova fase.
//
// O loop principal atualiza a transição em vez de atualizar o jogo enquanto
// ela está ativa. Assim, os personagens e os objetos ficam parados durante
// a animação.
//
// Este arquivo usa dados e funções globais do jogo: ctx desenha no canvas;
// LARGURA_TELA e ALTURA_TELA definem seu tamanho; FASES, numeroFase e fase
// identificam as fases; carregarFase e terminarJogo controlam o fluxo do jogo.

// Durações em frames. Com uma atualização de 60 frames por segundo,
// 60 frames correspondem aproximadamente a um segundo.
const TRANSICAO_FECHAR = 40;   // duração da etapa em que o mosaico cobre a tela
const TRANSICAO_CARTAO = 75;   // duração da exibição do cartão da fase
const TRANSICAO_ABRIR = 40;    // duração da etapa em que o mosaico revela a tela
const TRANSICAO_TAMANHO = 50;  // largura e altura de cada quadrado, em pixels

const transicao = {
  ativa: false,       // indica se a animação está acontecendo
  etapa: '',          // etapa atual: 'fechando', 'cartao' ou 'abrindo'
  tempo: 0,           // frames já passados na etapa atual
  proximaFase: 0,     // índice da fase a carregar; FASES.length indica que o jogo terminou
  pontosGanhos: 0,    // pontos obtidos na fase concluída, exibidos no cartão
  quadrados: []       // mosaico; cada quadrado tem posição (x, y), atraso e cor
};

// Monta uma grade de quadrados que cobre a tela. Cada quadrado recebe um
// atraso aleatório para que eles não cresçam todos ao mesmo tempo.
function criarQuadradosDaTransicao() {
  const tamanhoQuadrado = TRANSICAO_TAMANHO;
  const quadrados = [];

  // Avança de quadrado em quadrado pelas linhas e colunas da tela.
  for (let y = 0; y < ALTURA_TELA; y += tamanhoQuadrado) {
    for (let x = 0; x < LARGURA_TELA; x += tamanhoQuadrado) {
      quadrados.push({
        x: x, // posição horizontal do canto superior esquerdo
        y: y, // posição vertical do canto superior esquerdo
        atraso: Math.random() * 0.5, // atraso normalizado entre 0 e 0.5 do progresso
        cor: Math.random() < 0.25 ? '#8b1e2b' : '#000' // 25% são vermelho-escuros
      });
    }
  }

  // Guarda a grade no estado para ser usada durante o desenho da animação.
  transicao.quadrados = quadrados;
}

// Inicia a animação para a próxima fase. É chamada pelo fluxo de troca de fase.
function iniciarTransicao(proximaFase, pontosGanhos) {
  // Ignora chamadas repetidas enquanto uma transição já está em andamento.
  if (transicao.ativa) return;

  transicao.ativa = true;
  transicao.etapa = 'fechando';
  transicao.tempo = 0;
  transicao.proximaFase = proximaFase;
  transicao.pontosGanhos = pontosGanhos;

  // Cria os quadrados e seus atrasos para o mosaico que fechará a tela.
  criarQuadradosDaTransicao();
}

// Atualiza a máquina de etapas da transição. O loop principal chama esta
// função uma vez por frame no lugar da atualização normal do jogo.
function atualizarTransicao() {
  transicao.tempo++;

  // Quando o mosaico cobre a tela, já é seguro trocar o conteúdo da fase.
  if (transicao.etapa === 'fechando' && transicao.tempo >= TRANSICAO_FECHAR) {
    // Um índice além da última fase significa que não há outra fase para carregar.
    if (transicao.proximaFase >= FASES.length) {
      transicao.ativa = false;
      terminarJogo();
      return;
    }

    carregarFase(transicao.proximaFase);
    transicao.etapa = 'cartao';
    transicao.tempo = 0;
  // Depois do cartão, sorteia novos atrasos e começa a revelar a fase.
  } else if (transicao.etapa === 'cartao' && transicao.tempo >= TRANSICAO_CARTAO) {
    criarQuadradosDaTransicao();
    transicao.etapa = 'abrindo';
    transicao.tempo = 0;
  // Ao terminar a abertura, devolve o controle ao loop normal do jogo.
  } else if (transicao.etapa === 'abrindo' && transicao.tempo >= TRANSICAO_ABRIR) {
    transicao.ativa = false;
    transicao.etapa = '';
  }
}

// Mantém um número dentro do intervalo de 0 a 1.
// Valores menores viram 0; valores maiores viram 1.
function limitar01(valor) {
  return Math.max(0, Math.min(1, valor));
}

// Aplica uma curva de animação: o movimento começa rápido e desacelera
// suavemente até parar. O parâmetro esperado está entre 0 e 1.
function suavizarSaida(progresso) {
  return 1 - Math.pow(1 - progresso, 3);
}

// Desenha o mosaico de acordo com um progresso entre 0 e 1:
// 0 não desenha quadrados; 1 cobre a tela inteira.
function desenharMosaico(progresso) {
  const tamanhoQuadrado = TRANSICAO_TAMANHO;

  for (let indiceQuadrado = 0; indiceQuadrado < transicao.quadrados.length; indiceQuadrado++) {
    const quadrado = transicao.quadrados[indiceQuadrado];

    // Cada quadrado começa a crescer depois do seu atraso aleatório.
    const progressoDoQuadrado = limitar01((progresso - quadrado.atraso) / 0.5);
    const fatorDeCrescimento = suavizarSaida(progressoDoQuadrado);
    if (fatorDeCrescimento <= 0) continue;

    // O pixel extra evita frestas causadas por arredondamentos entre quadrados.
    const ladoDoQuadrado = Math.ceil(tamanhoQuadrado * fatorDeCrescimento) + 1;
    const deslocamentoInterno = (tamanhoQuadrado - ladoDoQuadrado) / 2;

    ctx.fillStyle = quadrado.cor;
    ctx.fillRect(
      quadrado.x + deslocamentoInterno,
      quadrado.y + deslocamentoInterno,
      ladoDoQuadrado,
      ladoDoQuadrado
    );
  }
}

// Desenha o cartão enquanto a tela está coberta: número da fase, nome,
// posição da fase na sequência e pontos ganhos na fase anterior.
function desenharCartaoDaFase() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

  // Os textos entram nos primeiros 20 frames e começam a desaparecer
  // nos últimos 15 frames do cartão.
  const progressoDeEntrada = suavizarSaida(limitar01(transicao.tempo / 20));
  const progressoDeSaida = limitar01((transicao.tempo - (TRANSICAO_CARTAO - 15)) / 15);
  const opacidade = 1 - progressoDeSaida;

  const centroDaTelaX = LARGURA_TELA / 2;
  const deslocamentoDoTexto = (1 - progressoDeEntrada) * 250;

  ctx.save();
  ctx.globalAlpha = opacidade;
  ctx.textAlign = 'center';

  // O título começa à esquerda do centro e desliza até o centro.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(
    'FASE ' + (numeroFase + 1),
    centroDaTelaX - deslocamentoDoTexto,
    ALTURA_TELA / 2 - 10
  );

  // O nome começa à direita do centro e desliza na direção oposta.
  ctx.fillStyle = '#e63946';
  ctx.font = '24px sans-serif';
  ctx.fillText(
    fase.nome,
    centroDaTelaX + deslocamentoDoTexto,
    ALTURA_TELA / 2 + 30
  );

  // Os detalhes inferiores aparecem junto com a entrada e também desaparecem
  // junto com o restante do cartão.
  ctx.globalAlpha = opacidade * progressoDeEntrada;
  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText(
    (numeroFase + 1) + ' / ' + FASES.length,
    centroDaTelaX,
    ALTURA_TELA / 2 + 60
  );
  ctx.fillText(
    '+' + transicao.pontosGanhos + ' pontos',
    centroDaTelaX,
    ALTURA_TELA / 2 + 85
  );

  // Restaura as configurações anteriores do contexto do canvas para não
  // afetar os desenhos feitos depois do cartão.
  ctx.restore();
}

// Desenha a camada da transição por cima do jogo. O loop principal chama
// esta função depois de desenhar a cena normal.
function desenharTransicao() {
  if (!transicao.ativa) return;

  // Ao fechar, o progresso vai de 0 a 1 e cobre a tela.
  if (transicao.etapa === 'fechando') {
    desenharMosaico(transicao.tempo / TRANSICAO_FECHAR);
  // Durante o cartão, o mosaico já cobre a tela e o cartão fica visível.
  } else if (transicao.etapa === 'cartao') {
    desenharCartaoDaFase();
  // Ao abrir, o progresso do mosaico vai de 1 a 0 e revela a nova fase.
  } else if (transicao.etapa === 'abrindo') {
    desenharMosaico(1 - transicao.tempo / TRANSICAO_ABRIR);
  }
}