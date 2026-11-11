// =====================================================================
//  REGISTRO DE ARMADILHAS  (carregue este arquivo ANTES dos outros desta pasta)
//
//  Cada tipo de armadilha mora no seu próprio arquivo e se "cadastra" aqui
//  com registrarArmadilha('nomeDoTipo', { ... }).
//
//  Dentro do { ... } você escreve só o que a armadilha precisa. Tudo é opcional:
//    preparar(a)   completa os valores padrão (roda 1 vez quando a fase carrega)
//    atualizar(a)  roda a cada frame (liga a armadilha, move ela...)
//    solida(a)     devolve true se o jogador pode pisar/bater nela agora
//    aoPisar(a)    roda quando o jogador pousa em cima dela
//    mata(a)       devolve true se ela mata quem encostar agora
//    desenhar(a)   desenha a armadilha
//    aoMorrer(a)   roda quando o jogador morre (volta ao normal)
//
//  "a" é a armadilha que está escrita na fase, por exemplo { tipo: 'espinho', x: 400 }.
// =====================================================================
const TIPOS_ARMADILHA = {};

function registrarArmadilha(nome, comportamento) {
  TIPOS_ARMADILHA[nome] = comportamento;
}

// Completa uma armadilha com os valores padrão do tipo dela.
function completarArmadilha(a) {
  const tipo = TIPOS_ARMADILHA[a.tipo];
  if (tipo === undefined) {
    console.warn('Tipo de armadilha desconhecido: "' + a.tipo + '" (confere se escreveu certo e se o arquivo dele está no index.html)');
    return;
  }
  if (tipo.preparar) tipo.preparar(a);
}

// Roda a cada frame: liga as armadilhas quando o jogador chega perto e move as que se mexem
function atualizarArmadilhas() {
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    const tipo = TIPOS_ARMADILHA[a.tipo];
    if (tipo && tipo.atualizar) tipo.atualizar(a);
  }
}

// Chamada quando o jogador morre: cada armadilha volta ao que deve voltar
function resetarArmadilhas() {
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    const tipo = TIPOS_ARMADILHA[a.tipo];
    if (tipo && tipo.aoMorrer) tipo.aoMorrer(a);
  }
}

// Lista as armadilhas em que o jogador pode pisar / bater agora
function listarArmadilhasSolidas() {
  const lista = [];
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    const tipo = TIPOS_ARMADILHA[a.tipo];
    if (tipo && tipo.solida && tipo.solida(a)) lista.push(a);
  }
  return lista;
}

// Chamada quando o jogador pousa em cima de algo sólido (pode ser plataforma ou armadilha)
function jogadorPisouEm(solido) {
  const tipo = TIPOS_ARMADILHA[solido.tipo];
  if (tipo && tipo.aoPisar) tipo.aoPisar(solido);
}

// Devolve true se alguma armadilha mortal está encostando no jogador
function armadilhaMatouJogador() {
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    const tipo = TIPOS_ARMADILHA[a.tipo];
    if (tipo && tipo.mata && tipo.mata(a) && colidiu(jogador, a)) {
      return true;
    }
  }
  return false;
}

function desenharArmadilhas() {
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    const tipo = TIPOS_ARMADILHA[a.tipo];
    if (tipo && tipo.desenhar) tipo.desenhar(a);
    if (
      (a.tipo === 'espinho' && a.visivel) ||
      (a.tipo === 'espinhoDeslizante' && a.ativo) ||
      (a.tipo === 'espinhoTeto' && a.caindo)
    ) {
      desenharHitbox(a, 'red');
    }
  }
}
