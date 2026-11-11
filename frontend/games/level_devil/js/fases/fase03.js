// =====================================================================
//  FASE 3 - A saída foge e o jogador precisa saltar sobre obstáculos.
// =====================================================================
FASES.push({
  nome: 'A porta fujona',
  spawnAleatorioInimigos: true,
  porta: { x: 730, y: 350, foge: [{ x: 170, y: 350 }, { x: 730, y: 350 }] },
  plataformas: [
    { x: 0, y: 400, largura: 340, altura: 50 },
    { x: 420, y: 400, largura: 380, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 300, largura: 30 },
    { tipo: 'espinho', x: 570, largura: 30 },
    { tipo: 'chaoQueSome', x: 340, y: 400, largura: 80, altura: 50, espera: 28 }
  ]
});
