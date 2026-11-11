// =====================================================================
//  FASE 6 - O teto avisa antes de cair.
// =====================================================================
FASES.push({
  nome: 'Chuva de espinhos',
  spawnAleatorioInimigos: true,
  armadilhas: [
    { tipo: 'espinhoTeto', x: 260, ativarEm: 220 },
    { tipo: 'espinhoTeto', x: 450, ativarEm: 410 },
    { tipo: 'espinhoTeto', x: 640, ativarEm: 600 }
  ]
});
