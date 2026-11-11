// =====================================================================
//  CHÃO INVISÍVEL: não dá pra ver, mas é sólido
//
//  Na fase:  { tipo: 'chaoInvisivel', x: 180, y: 400, largura: 440, altura: 50 }
//  (ele passa a aparecer depois que o jogador pisa nele ou morre)
// =====================================================================
registrarArmadilha('chaoInvisivel', {

  preparar: function (a) {
    definirPadrao(a, 'visivel', false);
  },

  solida: function (a) {
    return true;
  },

  aoPisar: function (a) {
    a.visivel = true;                    // pisou, então agora aparece
  },

  desenhar: function (a) {
    if (a.visivel) {
      ctx.globalAlpha = 0.5;
      desenharPlataforma(a);
      ctx.globalAlpha = 1;
    }
  },

  aoMorrer: function (a) {
    a.visivel = true;                    // depois de morrer, o chão passa a aparecer
  }
});
