// =====================================================================
//  FASE 2 - A ponte desaba depois do pouso; um corredor espera do outro lado.
// =====================================================================
FASES.push({
  nome: 'Ponte cronometrada',
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 260, altura: 50 },
    { x: 340, y: 400, largura: 460, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 260, y: 400, largura: 80, altura: 50, espera: 24 }
  ]
});
