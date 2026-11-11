// =====================================================================
//  FASE 23 - Final: dois túneis, espinho central e inimigos dos dois lados.
// =====================================================================
FASES.push({
  nome: 'O último corredor',
  spawnAleatorioInimigos: true,
  podeAgachar: true,
  plataformas: [
    { x: 0,   y: 400, largura: 800, altura: 50 },
    { x: 180, y: 310, largura: 160, altura: 62, estilo: 'pedra' },
    { x: 560, y: 310, largura: 160, altura: 62, estilo: 'pedra' },
  ],
  armadilhas: [
    { tipo: 'espinho', x: 390, largura: 30 },
    { tipo: 'espinhoTeto', x: 455, ativarEm: 400 },
    { tipo: 'chaoQueSome', x: 370, y: 350, largura: 70, altura: 14, espera: 20 }
  ]
});