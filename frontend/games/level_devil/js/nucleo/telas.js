// =====================================================================
//  TELAS: menu, início do jogo e tela final
// =====================================================================
function mostrarMenu() {
  // Esconde a partida/tela final e restaura a interface inicial.
  pararConfete();
  telaFim.classList.remove('mostrar');
  botaoReiniciar.style.display = 'none';
  telaFim.style.display = 'none';
  canvas.style.display = 'none';
  telaMenu.style.display = 'block';
  campoApelido.value = '';
  mostrarRanking('rankMenu');
}

function comecarJogo() {
  // Remove espaços extras antes de validar e guardar o apelido.
  const texto = campoApelido.value.trim();
  if (texto.length < 2) {
    textoErro.textContent = 'Nickname precisa ter pelo menos 2 letras.';
    return;
  }

  apelido = texto;
  pontosTotais = 0;
  mortesTotais = 0;
  textoErro.textContent = '';

  telaMenu.style.display = 'none';
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
function terminarJogo() {
  jogando = false;
  // Persiste o resultado e apresenta o resumo junto com a posição no ranking.
  const resultadoRanking = salvarPontuacao();

  botaoReiniciar.style.display = 'none';
  canvas.style.display = 'none';
  telaFim.style.display = 'block';
  telaFim.classList.remove('mostrar');
  void telaFim.offsetWidth;                     // reinicia a animação de entrada
  telaFim.classList.add('mostrar');

  document.getElementById('resultado').textContent =
    apelido + ': ' + pontosTotais + ' pontos, ' + mortesTotais + ' mortes';

  let textoPosicao = '';
  if (!resultadoRanking.salva) {
    textoPosicao = 'Não foi possível salvar sua pontuação no ranking.';
  } else if (resultadoRanking.posicao === 1) {
    textoPosicao = '🥇 Novo recorde! Você é o 1º do ranking!';
  } else if (resultadoRanking.posicao > 0) {
    textoPosicao = 'Você ficou em ' + resultadoRanking.posicao + 'º lugar no ranking!';
  }
  document.getElementById('fimPosicao').textContent = textoPosicao;

  mostrarRanking('rankFim');
  iniciarConfete();
}

// Associa as ações da interface aos respectivos botões.
botaoJogar.onclick = comecarJogo;
botaoNovoJogador.onclick = mostrarMenu;
botaoReiniciar.onclick = function () {
  reiniciarFase();
  botaoReiniciar.blur();     // evita que apertar espaço "clique" no botão sem querer
};

campoApelido.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') comecarJogo();
});