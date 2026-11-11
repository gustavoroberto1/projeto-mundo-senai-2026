// =====================================================================
//  FASE 10 - Suba pelas plataformas e não confie na última.
// =====================================================================
FASES.push({
  nome: 'Escadaria quebrada',
  spawnAleatorioInimigos: true,
  porta: { x: 740, y: 145 },
  plataformas: [
    { x: 0, y: 400, largura: 800, altura: 50 },
    { x: 120, y: 340, largura: 90, altura: 14 },
    { x: 265, y: 285, largura: 90, altura: 14 },
    { x: 410, y: 230, largura: 90, altura: 14 },
    { x: 700, y: 200, largura: 100, altura: 14 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 575, y: 180, largura: 90, altura: 14, espera: 18 }
  ]
});
