// =====================================================================
//  CONTROLE DE FASES: carregar, morrer, reiniciar e passar de fase
// =====================================================================
// Cópia-base usada para restaurar os inimigos ao renascer ou reiniciar.
let inimigosOriginaisFase = [];

// Repõe a fila inicial de inimigos e prepara os primeiros que cabem na tela.
function restaurarListaOriginalDeInimigos() {
  fase.inimigos = [];
  fase.filaInimigos = JSON.parse(
    JSON.stringify(inimigosOriginaisFase)
  );

  prepararInimigos();
}
// Cria o estado jogável da fase indicada e reinicializa seus sistemas.
function carregarFase(indiceFase) {
  numeroFase = indiceFase;
  pontosInimigosPendentes = 0;

  // Faz uma CÓPIA da fase pra não estragar a original da lista FASES
  fase = JSON.parse(JSON.stringify(FASES[indiceFase]));

  // Valores padrão da fase
  definirPadrao(fase, 'inicio', { x: 40, y: 350 });
  definirPadrao(fase, 'plataformas', [ { x: 0, y: 400, largura: 800, altura: 50 } ]);
  definirPadrao(fase, 'armadilhas', []);
  definirPadrao(fase, 'inimigos', []);
  definirPadrao(fase, 'filaInimigos', []);          // (o jogo preenche) inimigos esperando vaga na tela
  definirPadrao(fase, 'pontosSpawnInimigos', []);
  definirPadrao(fase, 'porta', { x: 730, y: 350 });
  definirPadrao(fase, 'invertida', false);
  definirPadrao(fase, 'escuro', false);
  definirPadrao(fase, 'gravidade', GRAVIDADE_PADRAO);
  definirPadrao(fase, 'pulo', FORCA_PULO_PADRAO);
  definirPadrao(fase, 'velocidade', VELOCIDADE_JOGADOR);
  definirPadrao(fase, 'agachado', false);       // true = o gato fica agachado a fase inteira
  definirPadrao(fase, 'podeAgachar', false);    // true = o jogador pode agachar segurando Shift

  prepararPorta(fase.porta);

  // Valores padrão das armadilhas (cada tipo tem o seu, na pasta armadilhas)
  for (let i = 0; i < fase.armadilhas.length; i++) {
    completarArmadilha(fase.armadilhas[i]);
  }

  // Monta a fila de inimigos da fase e coloca os primeiros na tela (veja inimigos/geracao.js)
  gerarInimigosAleatorios();

  // Guarda a configuração original para que as próximas restaurações
  // não dependam da fila já consumida durante a partida.
  inimigosOriginaisFase = JSON.parse(
    JSON.stringify(fase.filaInimigos)
  );

  prepararInimigos();

  mortesNaFase = 0;
  inicioDaFase = performance.now();
  resetarEspada();
  criarJogador();
  congelarFase();                 // a fase só começa quando o gato se mexer
}

// ---------------------------------------------------------------------
//  FASE PARADA ATÉ O GATO SE MEXER
//  Enquanto faseIniciada é false: inimigos, tiros e armadilhas ficam congelados
//  e o relógio da fase não anda. O primeiro movimento (andar, pular, dash, agachar
//  ou bater com a espada) chama iniciarFase().
// ---------------------------------------------------------------------
function congelarFase() {
  faseIniciada = false;
  congeladoDesde = performance.now();
}

function iniciarFase() {
  faseIniciada = true;
  inicioDaFase = inicioDaFase + (performance.now() - congeladoDesde);   // o tempo parado não conta
}

// O gato fez alguma ação de jogo? (W e S sozinhos só escolhem a direção da espada, não contam)
function jogadorComecouAMexer() {
  for (let i = 0; i < TECLAS_QUE_INICIAM_A_FASE.length; i++) {
    if (teclas[TECLAS_QUE_INICIAM_A_FASE[i]]) return true;
  }
  return espada.tempo > 0;
}

// Chamada quando o jogador morre. O gato dá um pulinho e cai (animação de morte);
// quando a animação termina, a função renascer() devolve ele pro começo da fase.
function morrer() {
  if (jogador.morto) return;          // já está morrendo, não conta duas vezes
  mortesNaFase++;
  mortesTotais++;

  if (jogador.y > ALTURA_TELA) {      // caiu no buraco: já está fora da tela, volta direto
    renascer();
    return;
  }

  jogador.morto = true;
  jogador.tempoMorte = 0;
  jogador.vx = 0;
  jogador.vy = -FORCA_PULO_MORTE;
  jogador.noChao = false;
}

// Fim da animação de morte: as armadilhas voltam ao normal (os espinhos escondidos
// somem de novo, o chão volta...), os inimigos que sobraram voltam ao começo, a porta volta pro lugar
// e o gato reaparece no início.
function renascer() {
  resetarArmadilhas();
  restaurarListaOriginalDeInimigos();
  resetarPorta();
  resetarEspada();
  criarJogador();

  if (CONGELAR_AO_RENASCER) {
    congelarFase();
  }
}

// Recarrega a fase do zero. O carregamento reinicia mortesNaFase, mas preserva
// o tempo corrido e mortesTotais para a pontuação e o resultado final.
function reiniciarFase() {
  if (!jogando) return;
  if (jogador.morto) return;
  if (transicao.ativa) return;   

  const inicioGuardado = inicioDaFase;

  const inimigosGuardados = JSON.parse(
    JSON.stringify(inimigosOriginaisFase)
  );

  carregarFase(numeroFase);

  inimigosOriginaisFase = inimigosGuardados;
  restaurarListaOriginalDeInimigos();

  // Mantém o contador de mortes inalterado.
  inicioDaFase = inicioGuardado;
}
function passarDeFase() {
  if (transicao.ativa) return;      // já está passando de fase
  // Calcula os pontos base descontando o tempo e as mortes desta fase.
  const segundos = (performance.now() - inicioDaFase) / 1000;
  let pontos = PONTOS_POR_FASE - segundos * PERDA_POR_SEGUNDO - mortesNaFase * PERDA_POR_MORTE;
  pontos = Math.round(pontos);
  if (pontos < PONTOS_MINIMOS_POR_FASE) {
    pontos = PONTOS_MINIMOS_POR_FASE;
  }
  pontos += pontosInimigosPendentes;
  pontosTotais = pontosTotais + pontos;
  pontosInimigosPendentes = 0;

  // A troca de fase acontece dentro da transição (veja transicao.js)
  iniciarTransicao(numeroFase + 1, pontos);
}