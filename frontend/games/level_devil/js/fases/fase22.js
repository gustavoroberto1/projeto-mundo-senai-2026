// =====================================================================
//  FASE 22 - Agache no túnel e saia antes de a bomba chegar.
// =====================================================================
FASES.push({
  nome: 'Túnel com visita',
  spawnAleatorioInimigos: true,
  podeAgachar: true,
  plataformas: [
    { x: 0,   y: 400, largura: 800, altura: 50 },
    { x: 270, y: 310, largura: 250, altura: 62, estilo: 'pedra' }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 170, largura: 30 },
    { tipo: 'espinho', x: 615, largura: 30 }
  ]
});