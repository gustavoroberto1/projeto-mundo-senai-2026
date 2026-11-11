// =====================================================================
//  FASE 14 - A porta foge entre duas ilhas.
// =====================================================================
FASES.push({
  nome: 'Pega a saída',
  spawnAleatorioInimigos: true,
  porta: { x: 730, y: 350, foge: [{ x: 250, y: 350 }, { x: 560, y: 350 }] },
  plataformas: [
    { x: 0, y: 400, largura: 210, altura: 50 },
    { x: 300, y: 400, largura: 200, altura: 50 },
    { x: 590, y: 400, largura: 210, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'espinho', x: 370, largura: 30 },
    { tipo: 'espinho', x: 630, largura: 30 }
  ]
});
