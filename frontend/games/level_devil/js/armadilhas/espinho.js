// =====================================================================
//  ESPINHO: fica escondido e aparece quando o jogador chega perto
//
//  Na fase:  { tipo: 'espinho', x: 400 }
//  Opções:   visivel: true   (já começa aparecendo)
//            largura: 30     (padrão 40)
//            aparecerEm: 350 (posição do jogador que faz ele aparecer; padrão x - 80)
//
//  Depois que o gato morre, o espinho escondido SOME de novo (só volta a aparecer
//  quando o gato chegar perto outra vez). Os que começam com visivel: true continuam à mostra.
// =====================================================================
registrarArmadilha('espinho', {

  preparar: function (a) {
    definirPadrao(a, 'y', 380);
    definirPadrao(a, 'largura', 40);
    definirPadrao(a, 'altura', 20);
    definirPadrao(a, 'aparecerEm', a.x - 80);   // aparece quando o jogador está a 80px
    definirPadrao(a, 'visivel', false);
    a.visivelInicial = a.visivel;               // guarda como ele começou (escondido ou à mostra)
  },

  atualizar: function (a) {
    const frente = jogador.x + jogador.largura;   // lado direito do jogador
    if (!a.visivel && frente > a.aparecerEm) {
      a.visivel = true;
    }
  },

  mata: function (a) {
    return a.visivel;
  },

  desenhar: function (a) {
    if (a.visivel) desenharEspinhosParaCima(a);
  },

  aoMorrer: function (a) {
    a.visivel = a.visivelInicial;               // esconde de novo
  }
});
