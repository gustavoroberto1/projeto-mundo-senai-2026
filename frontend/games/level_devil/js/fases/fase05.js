// =====================================================================
//  FASE 5 - A primeira porta é falsa; a saída real aparece depois do salto.
// =====================================================================
FASES.push({
  nome: 'Saída suspeita',
  spawnAleatorioInimigos: true,
  porta: { x: 735, y: 350, foge: [{ x: 560, y: 350 }] },
  plataformas: [
    { x: 0, y: 400, largura: 270, altura: 50 },
    { x: 340, y: 400, largura: 460, altura: 50 }
  ],
  armadilhas: [
    { tipo: 'chaoQueSome', x: 270, y: 400, largura: 70, altura: 50, espera: 30 },
    { tipo: 'portaFalsa', x: 390 },
    { tipo: 'espinho', x: 620, largura: 30 }
  ]
});
