// =====================================================================
//  UTILIDADES (funções pequenas usadas em vários lugares)
// =====================================================================

// Se o objeto ainda não tem esse campo, coloca o valor padrão.
function definirPadrao(objeto, campo, valor) {
  if (objeto[campo] === undefined) {
    objeto[campo] = valor;
  }
}

// Devolve true se a imagem já carregou e pode ser desenhada
function imagemPronta(imagem) {
  return imagem.complete && imagem.naturalWidth > 0;
}

// Carrega uma imagem só uma vez e guarda pra reaproveitar (usado no cenário)
const IMAGENS_GUARDADAS = {};
function obterImagem(caminho) {
  if (IMAGENS_GUARDADAS[caminho] === undefined) {
    const imagem = new Image();
    imagem.src = caminho;
    IMAGENS_GUARDADAS[caminho] = imagem;
  }
  return IMAGENS_GUARDADAS[caminho];
}
