// =====================================================================
//  FASE 19 - Uma rota de plataformas com piso que some e parede surpresa.
// =====================================================================
FASES.push({
  nome: 'Rota de risco',
  spawnAleatorioInimigos: true,
  porta: { x: 765, y: 350 },
  plataformas: [
    { x: 0, y: 400, largura: 165, altura: 50 },
    { x: 465, y: 335, largura: 95, altura: 14 },
    { x: 650, y: 400, largura: 150, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 265, y: 365, largura: 95, altura: 14, espera: 16 },
    { tipo: 'parede', x: 680, aparecerEm: 600, altura: 35 },
    { tipo: 'espinho', x: 715, largura: 30 }
  ]
});
