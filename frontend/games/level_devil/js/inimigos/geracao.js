// =====================================================================
//  GERAÇÃO DE INIMIGOS: quantos nascem, de que tipo e em que lugar
//
//  Como funciona (a cada vez que uma fase carrega):
//    1. gerarInimigosAleatorios()  monta a FILA da fase: os inimigos escritos à mão
//       na fase (fase.inimigos) + sorteados pra completar a quantidade.
//    2. prepararInimigos()         tira da fila os primeiros e coloca na tela.
//    3. Toda vez que um inimigo morre, atualizarInimigos() (no _registro.js) chama
//       tentarSpawnInimigo() e o próximo da fila entra, respeitando o limite de
//       inimigos ao mesmo tempo (LIMITE_INIMIGOS_ATIVOS no config.js).
//
//  Opções da FASE que controlam isso (todas estão explicadas no js/fases/_lista.js):
//    quantidadeInimigos, limiteInimigosAtivos, tiposInimigos, spawnAleatorioInimigos,
//    pontosSpawnInimigos, permitirSobreposicaoInimigos, direcaoDisparoInimigos
//
//  Os números (distâncias mínimas, quantidade por fase...) estão no config.js,
//  nas seções "Inimigos: geração automática" e "Inimigos: velocidades".
// =====================================================================

function gerarInimigosAleatorios() {
  fase.filaInimigos = fase.inimigos.slice();
  fase.inimigos = [];

  // LIMITES (valem até pros inimigos escritos à mão na fase):
  //   - no máximo INIMIGOS_MAXIMO_DO_MESMO_TIPO do mesmo tipo (os primeiros da lista ficam)
  //   - no máximo INIMIGOS_MAXIMO_POR_FASE no total
  const contagemPorTipo = {};
  fase.filaInimigos = fase.filaInimigos.filter(function (inimigo) {
    contagemPorTipo[inimigo.tipo] = (contagemPorTipo[inimigo.tipo] || 0) + 1;
    return contagemPorTipo[inimigo.tipo] <= INIMIGOS_MAXIMO_DO_MESMO_TIPO;
  });
  if (fase.filaInimigos.length > INIMIGOS_MAXIMO_POR_FASE) {
    fase.filaInimigos.length = INIMIGOS_MAXIMO_POR_FASE;
  }
  if (fase.spawnAleatorioInimigos === false) return;

  const nivel = numeroFase + 1;

  // Quantos nascem nesta vez: um número sorteado entre o mínimo e o máximo.
  // (ou o "quantidadeInimigos" da fase, se ela definir, mas nunca passando do teto)
  const quantidadeSorteada = INIMIGOS_MINIMO_POR_FASE +
    Math.floor(Math.random() * (INIMIGOS_MAXIMO_POR_FASE - INIMIGOS_MINIMO_POR_FASE + 1));
  const quantidadeDesejada = fase.quantidadeInimigos === undefined
    ? quantidadeSorteada
    : Math.max(0, Math.floor(fase.quantidadeInimigos));
  const quantidade = Math.min(INIMIGOS_MAXIMO_POR_FASE, quantidadeDesejada);
  const faltantes = Math.max(0, quantidade - fase.filaInimigos.length);
  const tiposDisponiveis = fase.tiposInimigos
    ? fase.tiposInimigos.filter(function (tipo) {
        return TIPOS_INIMIGO[tipo] !== undefined;
      })
    : ['corredor'];

  if (!fase.tiposInimigos) {
    if (nivel >= NIVEL_VOADOR_APARECE) tiposDisponiveis.push('voador');
    if (nivel >= NIVEL_SUICIDA_APARECE) tiposDisponiveis.push('suicida');
  }

  for (let i = 0; i < faltantes; i++) {
    const inimigo = criarInimigoAleatorio(tiposDisponiveis);
    if (inimigo) {
      fase.filaInimigos.push(inimigo);
    } else {
      break;
    }
  }
}

// Quantos inimigos desse tipo a fase já tem (na tela + esperando na fila)
function contarInimigosDoTipo(tipo) {
  const todos = fase.inimigos.concat(fase.filaInimigos);
  let quantos = 0;
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].tipo === tipo) quantos++;
  }
  return quantos;
}

// Esse tipo já chegou no limite de INIMIGOS_MAXIMO_DO_MESMO_TIPO?
function tipoNoLimite(tipo) {
  return contarInimigosDoTipo(tipo) >= INIMIGOS_MAXIMO_DO_MESMO_TIPO;
}

function criarInimigoAleatorio(tiposDisponiveis) {
  const pontos = [];
  const pontosDesignados = fase.pontosSpawnInimigos || [];

  for (let i = 0; i < pontosDesignados.length; i++) {
    pontos.push({
      x: pontosDesignados[i].x,
      y: pontosDesignados[i].y,
      tipo: pontosDesignados[i].tipo,
      designado: true
    });
  }

  for (let i = 0; i < fase.plataformas.length; i++) {
    const plataforma = fase.plataformas[i];
    if (plataforma.largura < SPAWN_LARGURA_MINIMA_PLATAFORMA) continue;

    // Gera candidatos terrestres apoiados em cada plataforma.
    for (let j = 0; j < SPAWN_CANDIDATOS_POR_PLATAFORMA; j++) {
      const x = plataforma.x + Math.random() * (plataforma.largura - SPAWN_LARGURA_MINIMA_PLATAFORMA);
      const y = plataforma.y - INIMIGO_TAMANHOS.corredor.altura;
      pontos.push({ x: x, y: y, tipo: undefined, plataforma: plataforma });
    }
  }

  // Voador só recebe candidatos na metade superior da tela.
  const tamanhoVoador = INIMIGO_TAMANHOS.voador;
  const alturaVoador = tamanhoVoador.altura;
  const margemAerea = MARGEM_SEGURANCA_VOADOR;
  const yMaximoVoador = Math.floor(ALTURA_TELA / 2) - alturaVoador;
  for (let i = 0; i < SPAWN_CANDIDATOS_AEREOS; i++) {
    pontos.push({
      x: margemAerea + Math.random() * (LARGURA_TELA - margemAerea * 2 - tamanhoVoador.largura),
      y: margemAerea + Math.random() * Math.max(0, yMaximoVoador - margemAerea),
      tipo: 'voador',
      aereo: true
    });
  }

  if (pontos.length === 0) {
    console.warn('Nao foi possivel gerar inimigos: a fase nao tem plataformas nem pontos de spawn.');
    return null;
  }

  const ordem = [];
  for (let i = 0; i < pontosDesignados.length; i++) {
    const tipoDesignado = pontosDesignados[i].tipo;
    if (TIPOS_INIMIGO[tipoDesignado] && ordem.indexOf(tipoDesignado) < 0 && !tipoNoLimite(tipoDesignado)) {
      ordem.push(tipoDesignado);
    }
  }
  for (let i = 0; i < tiposDisponiveis.length; i++) {
    if (ordem.indexOf(tiposDisponiveis[i]) < 0 && !tipoNoLimite(tiposDisponiveis[i])) ordem.push(tiposDisponiveis[i]);
  }

  // Todos os tipos possíveis já estão no limite: não nasce mais ninguém (não é erro)
  if (ordem.length === 0) return null;

  const primeiroTipoAleatorio = pontosDesignados.some(function (ponto) {
    return TIPOS_INIMIGO[ponto.tipo] !== undefined;
  }) ? ordem.length : 0;
  for (let i = ordem.length - 1; i > primeiroTipoAleatorio; i--) {
    const j = primeiroTipoAleatorio + Math.floor(Math.random() * (i - primeiroTipoAleatorio + 1));
    const temporario = ordem[i];
    ordem[i] = ordem[j];
    ordem[j] = temporario;
  }

  for (let t = 0; t < ordem.length; t++) {
    const tipo = ordem[t];
    const tamanho = INIMIGO_TAMANHOS[tipo];
    const largura = tamanho.largura;
    const altura = tamanho.altura;
    const candidatos = pontos.filter(function (ponto) {
      if (ponto.tipo && ponto.tipo !== tipo) return false;
      if (tipo === 'voador' && ponto.tipo !== 'voador') return false;
      if (tipo !== 'voador' && ponto.aereo) return false;
      const y = ponto.plataforma && tipo !== 'voador'
        ? ponto.plataforma.y - altura
        : ponto.y;
      if (ponto.x < 0 || ponto.x + largura > LARGURA_TELA ||
          y < 0 || y + altura > ALTURA_TELA) return false;
      if (tipo === 'voador' && y + altura > ALTURA_TELA / 2) return false;

      const spawn = fase.inicio || { x: 40, y: 350 };
      const porta = fase.porta || { x: LARGURA_TELA - 70, y: 350, largura: 30 };
      const centroX = ponto.x + largura / 2;
      const centroInicio = spawn.x + 12;
      const centroPorta = porta.x + (porta.largura || 30) / 2;
      if (Math.abs(centroX - centroInicio) < SPAWN_DISTANCIA_MINIMA_INICIO ||
          Math.abs(centroX - centroPorta) < SPAWN_DISTANCIA_MINIMA_PORTA) return false;

      const retangulo = { x: ponto.x, y: y, largura: largura, altura: altura };
      for (let i = 0; i < fase.plataformas.length; i++) {
        const plataforma = fase.plataformas[i];
        // Mantém voadores afastados das plataformas e do chão.
        const margem = tipo === 'voador' ? margemAerea : 0;
        const areaProibida = {
          x: plataforma.x - margem,
          y: plataforma.y - margem,
          largura: plataforma.largura + margem * 2,
          altura: plataforma.altura + margem * 2
        };
        if (colidiu(retangulo, areaProibida)) return false;
      }

      // Inimigo terrestre não nasce em cima/colado de armadilha sólida (parede, chão que some, chão invisível...)
      if (tipo !== 'voador') {
        for (let i = 0; i < (fase.armadilhas || []).length; i++) {
          const a = fase.armadilhas[i];
          const tipoArmadilha = TIPOS_ARMADILHA[a.tipo];
          if (!tipoArmadilha || !tipoArmadilha.solida) continue;
          const zona = { x: a.x - 12, y: a.y, largura: (a.largura || 0) + 24, altura: a.altura || 0 };
          if (colidiu(retangulo, zona)) return false;
        }
      }

      if (!fase.permitirSobreposicaoInimigos) {
        const existentes = fase.inimigos.concat(fase.filaInimigos);
        for (let i = 0; i < existentes.length; i++) {
          const outro = existentes[i];
          if (outro.x !== undefined && outro.y !== undefined &&
              colidiu(retangulo, {
                x: outro.x,
                y: outro.y,
                largura: outro.largura || 30,
                altura: outro.altura || 28
              })) return false;
        }
      }
      return true;
    });
    if (candidatos.length === 0) continue;

    const pontosDesignadosValidos = candidatos.filter(function (ponto) {
      return ponto.designado === true;
    });
    const opcoes = pontosDesignadosValidos.length > 0 ? pontosDesignadosValidos : candidatos;
    const ponto = opcoes[Math.floor(Math.random() * opcoes.length)];
    const velocidadeProgressiva = Math.min(VELOCIDADE_PROGRESSIVA_MAXIMA, 1 + (numeroFase * VELOCIDADE_PROGRESSIVA_POR_FASE));
    const y = ponto.plataforma && tipo !== 'voador'
      ? ponto.plataforma.y - altura
      : ponto.y;
    const inimigo = {
      tipo: ponto.tipo || tipo,
      x: ponto.x,
      y: y,
      spawnValidado: true
    };
    if (inimigo.tipo === 'voador') {
      inimigo.velocidade = VELOCIDADE_VOADOR * velocidadeProgressiva;
      inimigo.intervaloDisparo = Math.max(INTERVALO_DISPARO_MINIMO, Math.round(INTERVALO_DISPARO_VOADOR / velocidadeProgressiva));
    } else if (inimigo.tipo === 'corredor' || inimigo.tipo === 'suicida') {
      inimigo.velocidade = (inimigo.tipo === 'corredor' ? VELOCIDADE_CORREDOR : VELOCIDADE_SUICIDA) * velocidadeProgressiva;
    }
    return inimigo;
  }

  // Nenhum candidato seguro: não coloca o inimigo dentro de uma plataforma.
  console.warn('Nao foi possivel encontrar uma posicao segura para gerar um inimigo nesta fase.');
  return null;
}

function posicaoAereaSegura(inimigo, ignorar, verificarFila) {
  const tamanho = INIMIGO_TAMANHOS.voador;
  const largura = inimigo.largura || tamanho.largura;
  const altura = inimigo.altura || tamanho.altura;
  if (inimigo.x < 0 || inimigo.x + largura > LARGURA_TELA ||
      inimigo.y < 0 || inimigo.y + altura > ALTURA_TELA / 2) return false;

  const inicio = fase.inicio || { x: 40 };
  const porta = fase.porta || { x: LARGURA_TELA - 70, largura: 30 };
  const centroX = inimigo.x + largura / 2;
  if (Math.abs(centroX - (inicio.x + 12)) < SPAWN_DISTANCIA_MINIMA_INICIO ||
      Math.abs(centroX - (porta.x + (porta.largura || 30) / 2)) < SPAWN_DISTANCIA_MINIMA_PORTA) return false;

  const margem = MARGEM_SEGURANCA_VOADOR;
  for (let i = 0; i < fase.plataformas.length; i++) {
    const plataforma = fase.plataformas[i];
    const areaProibida = {
      x: plataforma.x - margem,
      y: plataforma.y - margem,
      largura: plataforma.largura + margem * 2,
      altura: plataforma.altura + margem * 2
    };
    if (colidiu(inimigo, areaProibida)) return false;
  }

  const existentes = verificarFila
    ? fase.inimigos.concat(fase.filaInimigos)
    : fase.inimigos;
  for (let i = 0; i < existentes.length; i++) {
    const outro = existentes[i];
    if (outro === ignorar || outro.x === undefined || outro.y === undefined) continue;
    if (colidiu(inimigo, {
      x: outro.x,
      y: outro.y,
      largura: outro.largura || 30,
      altura: outro.altura || 28
    })) return false;
  }
  return true;
}

function prepararInimigos() {
  EFEITOS_MORTE.length = 0;     // começou a fase (ou o gato renasceu): somem as animações de morte que sobraram
  tentarSpawnInimigo();
}

function tentarSpawnInimigo() {
  const limite = fase.limiteInimigosAtivos === undefined
    ? LIMITE_INIMIGOS_ATIVOS
    : Math.max(0, Math.floor(fase.limiteInimigosAtivos));

  while (fase.inimigos.length < limite && fase.filaInimigos.length > 0) {
    const inimigo = fase.filaInimigos.shift();
    const tipo = TIPOS_INIMIGO[inimigo.tipo];

    if (tipo === undefined) {
      console.warn('Tipo de inimigo desconhecido: "' + inimigo.tipo + '" (confira se o arquivo está no index.html)');
      continue;
    }

    if (inimigo.tipo === 'voador' && !inimigo.spawnValidado &&
        !posicaoAereaSegura(inimigo, inimigo, true)) {
      if (!reposicionarVoador(inimigo)) continue;
    }

    delete inimigo.spawnValidado;
    if (tipo.preparar) tipo.preparar(inimigo);
    fase.inimigos.push(inimigo);
  }
}

function reposicionarVoador(inimigo) {
  const tamanho = INIMIGO_TAMANHOS.voador;
  const largura = inimigo.largura || tamanho.largura;
  const altura = inimigo.altura || tamanho.altura;
  const margem = MARGEM_SEGURANCA_VOADOR;
  const maxY = Math.floor(ALTURA_TELA / 2) - altura;

  for (let tentativa = 0; tentativa < 40; tentativa++) {
    const candidato = {
      x: margem + Math.random() * (LARGURA_TELA - margem * 2 - largura),
      y: margem + Math.random() * Math.max(0, maxY - margem),
      largura: largura,
      altura: altura
    };
    if (posicaoAereaSegura(candidato, inimigo, true)) {
      inimigo.x = candidato.x;
      inimigo.y = candidato.y;
      inimigo.spawnValidado = true;
      return true;
    }
  }

  console.warn('Voador removido da fila: a fase nao tem uma posicao aerea segura.');
  return false;
}