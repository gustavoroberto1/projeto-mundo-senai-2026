// =====================================================================
//  FASE 4 - Um trecho curto com controles invertidos e espaço para reagir.
// =====================================================================
FASES.push({
  nome: 'Controles espelhados',
  invertida: true,
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 300, altura: 50 },
    { x: 390, y: 400, largura: 410, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 470, largura: 30 },
    { tipo: 'chaoQueSome', x: 300, y: 400, largura: 90, altura: 50, espera: 24 }
  ]
});
