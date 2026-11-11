// =====================================================================
//  ESPINHO DESLIZANTE: vem deslizando da direita depois que o jogador passa de "ativarEm"
//
//  Na fase:  { tipo: 'espinhoDeslizante', x: 820, ativarEm: 150 }
//  Opção:    velocidade: 6   (padrão 3; maior = mais rápido)
// =====================================================================
registrarArmadilha('espinhoDeslizante', {

  preparar: function (a) {
    definirPadrao(a, 'y', 380);
    definirPadrao(a, 'largura', 40);
    definirPadrao(a, 'altura', 20);
    definirPadrao(a, 'velocidade', 3);
    a.velocidadeInicial = a.velocidade;   // guarda pra voltar ao normal quando o jogador morrer
    a.xInicial = a.x;
    a.ativo = false;
  },

  atualizar: function (a) {
    const frente = jogador.x + jogador.largura;   // lado direito do jogador

    // -----------------------------------------------------------------
    // EXEMPLO (tire os // pra ligar): quando ESTE espinho chega a 150px
    // do jogador, ele passa a deslizar a 8.
    //
    // const distancia = a.x - frente;
    // if (a.ativo && distancia < 150) {
    //   a.velocidade = 8;
    // }
    // -----------------------------------------------------------------

    if (!a.ativo && frente > a.ativarEm) {
      a.ativo = true;
    }
    if (a.ativo && a.x > -60) {
      a.x = a.x - a.velocidade;
    }
  },

  mata: function (a) {
    return a.ativo;
  },

  desenhar: function (a) {
    if (a.ativo) desenharEspinhosParaCima(a);
  },

  aoMorrer: function (a) {
    a.ativo = false;
    a.x = a.xInicial;
    a.velocidade = a.velocidadeInicial;
  }
});

// Muda a velocidade de TODOS os espinhos deslizantes da fase.
// Como usar: mudarVelocidadeDoEspinho(8);   (o padrão é 3; maior = mais rápido)
// Quando o jogador morre, a velocidade volta sozinha ao valor original.
function mudarVelocidadeDoEspinho(novaVelocidade) {
  for (let i = 0; i < fase.armadilhas.length; i++) {
    const a = fase.armadilhas[i];
    if (a.tipo === 'espinhoDeslizante') {
      a.velocidade = novaVelocidade;
    }
  }
}
