// =====================================================================
//  FASE 18 - No escuro, o corredor avisa que a plataforma está perto.
// =====================================================================
FASES.push({
  nome: 'Apagão com eco',
  escuro: true,
  spawnAleatorioInimigos: false,
  plataformas: [
    { x: 0, y: 400, largura: 290, altura: 50 },
    { x: 630, y: 400, largura: 170, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 290, y: 400, largura: 100, altura: 50, espera: 32 },
    { tipo: 'chaoQueSome', x: 410, y: 400, largura: 100, altura: 50, espera: 26 },
    { tipo: 'espinho', x: 450, largura: 30, visivel: true },
    { tipo: 'espinho', x: 690, largura: 30 }
  ]
});
