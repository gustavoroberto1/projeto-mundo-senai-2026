// =====================================================================
//  CHÃO QUE SOME: parece chão normal, some quando o jogador pisa
//
//  Na fase:  { tipo: 'chaoQueSome', x: 200, y: 400, largura: 120, altura: 50 }
//  Opção:    espera: 20   (frames até sumir depois de pisar; 0 = some na hora)
// =====================================================================
registrarArmadilha('chaoQueSome', {

  preparar: function (a) {
    definirPadrao(a, 'espera', 0);
    a.pisado = false;
    a.sumiu = false;
    a.contador = 0;
  },

  atualizar: function (a) {
    if (a.pisado && !a.sumiu) {
      a.contador++;
      if (a.contador >= a.espera) {
        a.sumiu = true;
      }
    }
  },

  solida: function (a) {
    return !a.sumiu;
  },

  aoPisar: function (a) {
    if (a.espera === 0) {
      a.sumiu = true;                    // some na hora
    } else {
      a.pisado = true;                   // começa a contagem pra sumir
    }
  },

  desenhar: function (a) {
    if (!a.sumiu) {
      if (a.pisado) ctx.globalAlpha = 0.5;        // fica meio transparente antes de sumir
      desenharPlataforma(a);          // igualzinho ao chão normal
      ctx.globalAlpha = 1;
    }
  },

  aoMorrer: function (a) {
    a.pisado = false;
    a.sumiu = false;
    a.contador = 0;
  }
});
