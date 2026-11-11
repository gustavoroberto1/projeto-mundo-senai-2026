// =====================================================================
//  FASE 9 - Plataformas alternadas e uma que desaparece.
// =====================================================================
FASES.push({
  nome: 'Pedras apressadas',
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 170, altura: 50 },
    { x: 210, y: 350, largura: 90, altura: 14 },
    { x: 570, y: 350, largura: 90, altura: 14 },
    { x: 700, y: 400, largura: 100, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 390, y: 320, largura: 90, altura: 14, espera: 20 },
    { tipo: 'espinho', x: 735, largura: 30 }
  ]
});
