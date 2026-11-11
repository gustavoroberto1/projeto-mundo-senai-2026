// =====================================================================
//  FASE 11 - Paredes escalonadas obrigam a alternar corrida e salto.
// =====================================================================
FASES.push({
  nome: 'Labirinto de uma tela',
  spawnAleatorioInimigos: true,
  armadilhas: [
    { tipo: 'parede', x: 230, aparecerEm: 145, altura: 34 },
    { tipo: 'parede', x: 450, aparecerEm: 365, altura: 48 },
    { tipo: 'parede', x: 650, aparecerEm: 565, altura: 34 }
  ]
});
