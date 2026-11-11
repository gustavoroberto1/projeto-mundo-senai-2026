// =====================================================================
//  TELAS: início do jogo e tela final
//  (a tela inicial agora é o ArcadeShell — veja o init() no index.html)
// =====================================================================
function comecarJogo() {
  // O jogador já foi identificado na plataforma do Arcade: usa o mesmo nickname.
  const jogadorArcade = window.ArcadeShell && ArcadeShell.player();
  apelido = (jogadorArcade && jogadorArcade.nickname) || 'Anônimo';
  pontosTotais = 0;
  mortesTotais = 0;
  arcadeInicioTs = Date.now();

  canvas.style.display = 'block';
  botaoReiniciar.style.display = 'inline-block';
  document.activeElement.blur();    // tira o foco do campo de texto pra as teclas funcionarem

  // Dica pra testar: abra o index.html com ?fase=15 no final do endereço
  // pra começar direto na fase 15.
  let indiceFaseInicial = 0;
  const numeroFaseSolicitado = parseInt(new URLSearchParams(location.search).get('fase'), 10);
  if (numeroFaseSolicitado >= 1 && numeroFaseSolicitado <= FASES.length) {
    indiceFaseInicial = numeroFaseSolicitado - 1;
  }

  carregarFase(indiceFaseInicial);
  jogando = true;
  loopDoJogo();
}

// Chamada quando o gato passa da ÚLTIMA fase: mostra a tela de vitória
async function terminarJogo() {
  jogando = false;

  // A partida já acabou e vai ser salva: esconde o botão flutuante "Sair" do
  // ArcadeShell para não oferecer salvar a mesma pontuação de novo.
  const botaoSairArcade = document.querySelector('#arcade-shell-root .as-exit-floating');
  if (botaoSairArcade) botaoSairArcade.style.display = 'none';

  botaoReiniciar.style.display = 'none';
  canvas.style.display = 'none';
  telaFim.style.display = 'block';
  telaFim.classList.remove('mostrar');
  void telaFim.offsetWidth;                     // reinicia a animação de entrada
  telaFim.classList.add('mostrar');

  document.getElementById('resultado').textContent =
    apelido + ': ' + pontosTotais + ' pontos, ' + mortesTotais + ' mortes';
  document.getElementById('fimPosicao').textContent = 'Enviando pontuação para o dashboard...';

  // Persiste o resultado (dashboard do Arcade + ranking local) e mostra a posição.
  const resultado = await salvarResultadoArcade();

  let textoPosicao = '';
  if (!resultado.enviado) {
    textoPosicao = 'Não foi possível enviar ao dashboard (sem conexão). Pontuação salva só neste aparelho.';
  } else if (resultado.isNewRecord) {
    textoPosicao = '🏆 Novo recorde pessoal salvo no dashboard!';
  } else {
    textoPosicao = 'Pontuação enviada ao dashboard!';
  }
  document.getElementById('fimPosicao').textContent = textoPosicao;

  mostrarRanking('rankFim');
  iniciarConfete();
}

// Associa as ações da interface aos respectivos botões.
// "Próximo jogador": recarrega a página, que volta à tela inicial do ArcadeShell.
botaoNovoJogador.onclick = function () { location.reload(); };
botaoReiniciar.onclick = function () {
  reiniciarFase();
  botaoReiniciar.blur();     // evita que apertar espaço "clique" no botão sem querer
};