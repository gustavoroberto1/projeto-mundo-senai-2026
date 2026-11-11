// =====================================================================
//  COLISÃO
// =====================================================================

// Verifica se duas caixas retangulares se sobrepõem. Os objetos comparados
// precisam ter x, y, largura e altura. Apenas encostar pelas bordas não conta
// como colisão.
function colidiu(retanguloA, retanguloB) {
  return retanguloA.x < retanguloB.x + retanguloB.largura &&
         retanguloA.x + retanguloA.largura > retanguloB.x &&
         retanguloA.y < retanguloB.y + retanguloB.altura &&
         retanguloA.y + retanguloA.altura > retanguloB.y;
}

// Cria uma cópia menor do retângulo, removendo margemPx de cada lado.
// Útil para exigir uma sobreposição mais clara antes de considerar um contato.
function encolherRetangulo(retangulo, margemPx) {
  return {
    x: retangulo.x + margemPx,
    y: retangulo.y + margemPx,
    largura: retangulo.largura - margemPx * 2,
    altura: retangulo.altura - margemPx * 2
  };
}

// Reúne as plataformas e armadilhas que são sólidas neste momento.
// O movimento do jogador usa essa lista para pousar e bloquear deslocamentos.
function listarSolidos() {
  const solidos = [];

  // Plataformas sempre fazem parte dos sólidos.
  for (let i = 0; i < fase.plataformas.length; i++) {
    solidos.push(fase.plataformas[i]);
  }

  // Algumas armadilhas só são sólidas em determinados momentos.
  const armadilhasSolidas = listarArmadilhasSolidas();
  for (let i = 0; i < armadilhasSolidas.length; i++) {
    solidos.push(armadilhasSolidas[i]);
  }

  return solidos;
}
