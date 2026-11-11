// =====================================================================
//  FASE 12 - Invertida, com uma ilha segura no meio.
// =====================================================================
FASES.push({
  nome: 'Mundo ao contrário',
  invertida: true,
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 235, altura: 50 },
    { x: 320, y: 360, largura: 150, altura: 14 },
    { x: 550, y: 400, largura: 250, altura: 50 }
  ],
  armadilhas: [

    { tipo: 'espinho', x: 620, largura: 30 }
  ]
});
