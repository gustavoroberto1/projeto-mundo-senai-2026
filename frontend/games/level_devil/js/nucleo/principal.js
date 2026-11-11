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

// Loop principal: atualiza e desenha um frame e agenda o próximo enquanto
// a partida estiver ativa.
function loopDoJogo() {
  if (!jogando) return;

  if (transicao.ativa) {
    atualizarTransicao();           // passando de fase: o jogo fica parado
  } else {
    atualizarJogo();
  }

  if (jogando) {                    // o jogo pode ter acabado dentro do update
    desenharJogo();
    desenharTransicao();            // por cima de tudo
  }

  requestAnimationFrame(loopDoJogo);
}

// Começa mostrando o menu
mostrarMenu();
