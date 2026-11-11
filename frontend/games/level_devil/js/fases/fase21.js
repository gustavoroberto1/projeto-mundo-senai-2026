// =====================================================================
//  FASE 21 - Túnel baixo com espaço seguro para passar agachado.
// =====================================================================
FASES.push({
  nome: 'Túnel de pedra',
  spawnAleatorioInimigos: true,
  podeAgachar: true,
  plataformas: [
    { x: 0, y: 400, largura: 800, altura: 50 },
    { x: 260, y: 315, largura: 280, altura: 58, estilo: 'pedra' }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 175, largura: 30 },
    { tipo: 'espinho', x: 660, largura: 30 }
  ]
});