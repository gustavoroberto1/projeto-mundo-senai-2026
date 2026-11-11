// =====================================================================
//  FASE 20 - Arena final: desvie, rebata a flecha e alcance a saída móvel.
// =====================================================================
FASES.push({
  nome: 'Arena do vendaval',
  spawnAleatorioInimigos: true,
  porta: { x: 730, y: 350, foge: [{ x: 430, y: 350 }, { x: 610, y: 350 }] },
  plataformas: [
    { x: 0, y: 400, largura: 260, altura: 50 },
    { x: 340, y: 400, largura: 120, altura: 50 },
    { x: 540, y: 400, largura: 260, altura: 50 },
    { x: 365, y: 300, largura: 90, altura: 14 }
  ],
  armadilhas: [
    { tipo: 'espinhoTeto', x: 170, ativarEm: 130 },
    { tipo: 'espinhoDeslizante', x: 820, ativarEm: 250, velocidade: 3.5 },
    { tipo: 'espinho', x: 600, largura: 30 }
  ]
});
