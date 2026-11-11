// =====================================================================
//  PAREDE: parede baixa que surge na frente do jogador
//
//  Na fase:  { tipo: 'parede', x: 250 }
//  Opção:    aparecerEm: 160   (posição do jogador que faz ela surgir; padrão x - 90)
// =====================================================================
registrarArmadilha('parede', {

  preparar: function (a) {
    definirPadrao(a, 'y', 360);
    definirPadrao(a, 'largura', 30);
    definirPadrao(a, 'altura', 40);
    definirPadrao(a, 'aparecerEm', a.x - 90);
    definirPadrao(a, 'visivel', false);
  },

  atualizar: function (a) {
    const frente = jogador.x + jogador.largura;   // lado direito do jogador
    if (!a.visivel && frente > a.aparecerEm) {
      a.visivel = true;
    }
  },

  solida: function (a) {
    return a.visivel;
  },

  desenhar: function (a) {
    if (a.visivel) desenharPedra(a);
  }

  // (sem aoMorrer: parede que já apareceu continua aparecendo)
});
