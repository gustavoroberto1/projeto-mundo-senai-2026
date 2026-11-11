// =====================================================================
//  REGISTRO DE INIMIGOS  (carregue este arquivo ANTES dos outros desta pasta)
//
//  Cada tipo de inimigo mora no seu arquivo (corredor.js, voador.js, suicida.js)
//  e se "cadastra" aqui com registrarInimigo('nome', { ... }).
//
//  Dentro do { ... } o tipo escreve só o que precisa (tudo opcional):
//    preparar(i)    completa os valores padrão (roda 1 vez quando o inimigo entra na tela)
//    atualizar(i)   roda a cada frame (movimento, tiro, contagem...)
//    animar(i)      roda a cada frame, MESMO com o gato morrendo: só pra animações que precisam
//                   terminar sozinhas (ex: o desenho da explosão da bomba)
//    mata(i)        devolve true se o inimigo está matando o gato neste frame
//    desenhar(i)    desenha o inimigo
//    resetar(i)     volta ao começo quando o gato morre
//
//  "i" é o inimigo, por exemplo { tipo: 'corredor', x: 300, y: 372 }.
//
//  Este arquivo cuida do "ciclo de vida": atualizar, desenhar, remover, resetar e
//  checar se algum inimigo matou o gato. Quem DECIDE onde e quando os inimigos
//  nascem é o geracao.js. Quem decide o que a espada faz neles é o combate/combate.js.
// =====================================================================
const TIPOS_INIMIGO = {};

function registrarInimigo(nome, comportamento) {
  TIPOS_INIMIGO[nome] = comportamento;
}

function removerInimigo(inimigo) {
  const indice = fase.inimigos.indexOf(inimigo);
  if (indice >= 0) fase.inimigos.splice(indice, 1);
}

function atualizarInimigos() {
  tentarSpawnInimigo();

  for (let i = 0; i < fase.inimigos.length; i++) {
    const inimigo = fase.inimigos[i];
    const tipo = TIPOS_INIMIGO[inimigo.tipo];
    if (tipo && tipo.atualizar) tipo.atualizar(inimigo);
  }
}

// Roda a cada frame (até durante a animação de morte do gato).
// De trás pra frente porque o animar() pode remover o próprio inimigo da lista.
function animarInimigos() {
  for (let i = fase.inimigos.length - 1; i >= 0; i--) {
    const inimigo = fase.inimigos[i];
    const tipo = TIPOS_INIMIGO[inimigo.tipo];
    if (tipo && tipo.animar) tipo.animar(inimigo);
  }

  atualizarEfeitosMorte();
}

function inimigoMatouJogador() {
  let jogadorAtingido = false;
  for (let i = fase.inimigos.length - 1; i >= 0; i--) {
    const inimigo = fase.inimigos[i];
    const tipo = TIPOS_INIMIGO[inimigo.tipo];
    if (tipo && tipo.mata && tipo.mata(inimigo)) jogadorAtingido = true;
    if (inimigo.deveRemover) removerInimigo(inimigo);
  }
  return jogadorAtingido;
}

function desenharInimigos() {
  for (let i = 0; i < fase.inimigos.length; i++) {
    const inimigo = fase.inimigos[i];
    const tipo = TIPOS_INIMIGO[inimigo.tipo];
    if (tipo && tipo.desenhar) tipo.desenhar(inimigo);
    if (tipo && tipo.desenhar && !(inimigo.tipo === 'suicida' && inimigo.explodiu)) {
      desenharHitbox(inimigo, 'red');
    }
  }

  desenharEfeitosMorte();
}

function resetarInimigos() {
  for (let i = 0; i < fase.inimigos.length; i++) {
    const inimigo = fase.inimigos[i];
    const tipo = TIPOS_INIMIGO[inimigo.tipo];
    if (tipo && tipo.resetar) tipo.resetar(inimigo);
  }
}
