// =====================================================================
//  PRINCIPAL: o "coração" do jogo (carregue este arquivo SEMPRE por último)
// =====================================================================

// Atualiza os sistemas do jogo na ordem necessária em cada frame.
function atualizarJogo() {
  // A fase fica PARADA (inimigos, tiros e armadilhas congelados) até o gato se mexer
  if (!faseIniciada && !jogador.morto && jogadorComecouAMexer()) iniciarFase();
  if (faseIniciada) atualizarArmadilhas();
  animarInimigos();                 // animações que terminam sozinhas (ex: explosão da bomba), até com o gato morrendo

  if (jogador.morto) {              // animação de morte: o gato só cai, sem controle
    atualizarMorte();
    return;
  }

  moverJogador();
  atualizarAtaqueEspada();
  if (faseIniciada) atualizarInimigos();
  resolverEspadaContraInimigos();   // ANTES de checar a morte: se o golpe acertou, o inimigo some primeiro
  if (verificarMorte()) return;     // se morreu, não precisa checar a porta
  verificarPorta();
}

// Verifica todas as condições de morte e retorna true se alguma delas ocorreu.
function verificarMorte() {
  // Caiu no buraco
  if (jogador.y > ALTURA_TELA) {
    morrer();
    return true;
  }

  // Encostou numa armadilha mortal
  if (armadilhaMatouJogador()) {
    morrer();
    return true;
  }

  // Encostou num inimigo vivo
  if (inimigoMatouJogador()) {
    morrer();
    return true;
  }

  return false;
}

// Loop principal: atualiza e desenha a cada frame e agenda o próximo enquanto
// a partida estiver ativa.
//
// A lógica roda em passos de tempo FIXOS (independente da taxa de atualização
// da tela do jogador): sem isso, o jogo rodava mais rápido em monitores de
// 120/144Hz do que nos 60Hz originais, porque cada frame do navegador
// disparava um passo inteiro de física/movimento.
const PASSO_FIXO_MS = 1000 / 60;      // 60 "ticks" de lógica por segundo
const MAX_PASSOS_POR_FRAME = 5;       // evita "espiral da morte" se a aba travar
let acumuladorLoop = 0;
let ultimoFrameLoop = 0;

function loopDoJogo(agora) {
  if (!jogando) return;
  if (typeof agora !== 'number') agora = performance.now();

  if (!ultimoFrameLoop) ultimoFrameLoop = agora;
  let delta = agora - ultimoFrameLoop;
  ultimoFrameLoop = agora;
  if (delta > 250) delta = 250;       // aba em segundo plano / lag: não tenta recuperar tudo de uma vez
  acumuladorLoop += delta;

  let passos = 0;
  while (acumuladorLoop >= PASSO_FIXO_MS && passos < MAX_PASSOS_POR_FRAME) {
    if (transicao.ativa) {
      atualizarTransicao();         // passando de fase: o jogo fica parado
    } else {
      atualizarJogo();
    }
    acumuladorLoop -= PASSO_FIXO_MS;
    passos++;
  }

  if (jogando) {                    // o jogo pode ter acabado dentro do update
    desenharJogo();
    desenharTransicao();            // por cima de tudo
  }

  requestAnimationFrame(loopDoJogo);
}

// A tela inicial é mostrada pelo ArcadeShell (veja o init() no index.html).
