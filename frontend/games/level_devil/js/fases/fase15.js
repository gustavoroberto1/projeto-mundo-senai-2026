// =====================================================================
//  FASE 15 - Três saltos sobre ilhas; o meio some depois do pouso.
// =====================================================================
FASES.push({
  nome: 'Arquipélago instável',
  spawnAleatorioInimigos: true,
  porta: { x: 765, y: 350 },
  plataformas: [
    { x: 0, y: 400, largura: 130, altura: 50 },
    { x: 220, y: 365, largura: 90, altura: 14 },
    { x: 560, y: 365, largura: 90, altura: 14 },
    { x: 710, y: 400, largura: 90, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 390, y: 335, largura: 90, altura: 14, espera: 18 },
    { tipo: 'espinho', x: 740, largura: 30 }
  ]
});
