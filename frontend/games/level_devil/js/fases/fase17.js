// =====================================================================
//  FASE 17 - As saídas falsas protegem a porta verdadeira.
// =====================================================================
FASES.push({
  nome: 'Galeria das saídas',
  spawnAleatorioInimigos: true,
  armadilhas: [
    { tipo: 'portaFalsa', x: 220 },
    { tipo: 'portaFalsa', x: 490 },
    { tipo: 'espinho', x: 650, largura: 30 }
  ],
  porta: {
    x: 735,
    y: 350,
    foge: [{ x: 610, y: 350 }]
  }
});
