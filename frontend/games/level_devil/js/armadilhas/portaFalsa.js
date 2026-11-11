// =====================================================================
//  PORTA FALSA: igual à porta de verdade, mas mata
//
//  Na fase:  { tipo: 'portaFalsa', x: 420 }
// =====================================================================
registrarArmadilha('portaFalsa', {

  preparar: function (a) {
    definirPadrao(a, 'y', 350);
    definirPadrao(a, 'largura', 30);
    definirPadrao(a, 'altura', 50);
  },

  mata: function (a) {
    return true;
  },

  desenhar: function (a) {
    desenharPorta(a);
  }
});
