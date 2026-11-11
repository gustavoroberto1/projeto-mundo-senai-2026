// =====================================================================
//  FASE 13 - Gravidade baixa muda o ritmo dos saltos.
// =====================================================================
FASES.push({
  nome: 'Órbita do gato',
  gravidade: 0.3,
  pulo: 8,
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 145, altura: 50 },
    { x: 375, y: 300, largura: 90, altura: 14 },
    { x: 540, y: 345, largura: 90, altura: 14 },
    { x: 690, y: 400, largura: 110, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 725, largura: 30 },
    { tipo: 'chaoQueSome', x: 220, y: 345, largura: 90, altura: 14, espera: 24 }
  ]
});
