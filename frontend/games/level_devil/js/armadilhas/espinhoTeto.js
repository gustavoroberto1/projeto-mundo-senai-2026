// =====================================================================
//  ESPINHO DO TETO: cai do teto quando o jogador chega perto
//
//  Na fase:  { tipo: 'espinhoTeto', x: 250 }
//  Opção:    ativarEm: 200   (posição do jogador que faz ele cair; padrão x - 60)
// =====================================================================
registrarArmadilha('espinhoTeto', {

  preparar: function (a) {
    definirPadrao(a, 'y', 0);
    definirPadrao(a, 'largura', 40);
    definirPadrao(a, 'altura', 20);
    definirPadrao(a, 'ativarEm', a.x - 60);
    a.velocidade = 0;
    a.caindo = false;
  },

  atualizar: function (a) {
    const frente = jogador.x + jogador.largura;   // lado direito do jogador

    if (!a.caindo && frente > a.ativarEm) {
      a.caindo = true;
    }

    if (a.caindo && a.y < 380) {        // 380 = altura do chão (400) - altura do espinho (20)
      a.velocidade = a.velocidade + 0.5;
      a.y = a.y + a.velocidade;
      if (a.y > 380) a.y = 380;
    }
  },

  mata: function (a) {
    return a.caindo;
  },

  desenhar: function (a) {
    if (a.caindo) desenharEspinhosParaBaixo(a);
  },

  aoMorrer: function (a) {
    a.caindo = false;
    a.y = 0;
    a.velocidade = 0;
  }
});
