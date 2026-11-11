// =====================================================================
//  FASE 16 - Um corredor de espinhos e um voador que controla o céu.
// =====================================================================
FASES.push({
  nome: 'Corredor de vento',
  spawnAleatorioInimigos: true,
  plataformas: [
    { x: 0, y: 400, largura: 800, altura: 50 },
    { x: 170, y: 315, largura: 110, altura: 14 },
    { x: 520, y: 315, largura: 110, altura: 14 }
  ],
  armadilhas: [
    { tipo: 'espinhoTeto', x: 220, ativarEm: 190 },
    { tipo: 'espinhoTeto', x: 400, ativarEm: 370 },
    { tipo: 'espinhoDeslizante', x: 820, ativarEm: 470, velocidade: 3.2 }
  ]
});
