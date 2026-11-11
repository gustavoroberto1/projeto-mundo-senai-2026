// =====================================================================
//  FASE 8 - O chão invisível cruza um vão; observe antes de correr.
// =====================================================================
FASES.push({
  nome: 'Ponte fantasma',
  spawnAleatorioInimigos: true,
  inicio: { x: 40, y: 350 },
  porta: { x: 730, y: 350 },
  plataformas: [
    { x: 0, y: 400, largura: 190, altura: 50 },
    { x: 610, y: 400, largura: 190, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoInvisivel', x: 190, y: 400, largura: 420, altura: 50 },
    { tipo: 'espinho', x: 410, largura: 30 }
  ]
});
