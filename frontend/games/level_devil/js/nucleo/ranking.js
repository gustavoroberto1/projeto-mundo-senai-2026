// =====================================================================
//  RANKING (salvo no localStorage do navegador)
// =====================================================================
function pegarRanking() {
  try {
    const texto = localStorage.getItem('trollDevilRanking');
    if (texto === null) return [];
    const ranking = JSON.parse(texto);
    if (!Array.isArray(ranking)) throw new TypeError('Os dados do ranking não são uma lista.');
    return ranking;
  } catch (erro) {
    // null distingue um ranking ilegível de um ranking válido, porém vazio.
    console.warn('Não foi possível carregar o ranking salvo.', erro);
    return null;
  }
}

// Envia a pontuação final para o dashboard do Arcade (backend oficial) e também
// guarda uma cópia no ranking local do navegador (usado como fallback se o backend cair).
let arcadeInicioTs = 0; // Date.now() no momento em que a partida começou (comecarJogo)

async function salvarResultadoArcade() {
  const resultadoLocal = salvarRankingLocal();

  const duracao = Math.max(0, Math.round((Date.now() - arcadeInicioTs) / 1000));
  try {
    const resultado = await ArcadeShell.reportScore('LEVEL_DEVIL', pontosTotais, duracao);
    return { enviado: true, isNewRecord: !!(resultado && resultado.isNewRecord), local: resultadoLocal };
  } catch (erro) {
    console.warn('Não foi possível enviar a pontuação ao dashboard do Arcade.', erro);
    return { enviado: false, isNewRecord: false, local: resultadoLocal };
  }
}

// Registra a pontuação atual no armazenamento local. O retorno informa
// a posição entre os dez melhores (ou 0, se não entrou no top 10) e se salvou.
function salvarRankingLocal() {
  const ranking = pegarRanking();
  if (ranking === null) return { posicao: 0, salva: false };

  const novaPontuacao = { nick: apelido, pontos: pontosTotais, mortes: mortesTotais };
  ranking.push(novaPontuacao);

  // ordena do maior pro menor
  ranking.sort(function (pontuacaoA, pontuacaoB) {
    return pontuacaoB.pontos - pontuacaoA.pontos;
  });

  // guarda só os 10 melhores
  try {
    localStorage.setItem('trollDevilRanking', JSON.stringify(ranking.slice(0, 10)));
  } catch (erro) {
    console.warn('Não foi possível salvar a pontuação no ranking.', erro);
    return { posicao: 0, salva: false };
  }

  // devolve em que lugar o jogador ficou (1 = primeiro), ou 0 se ficou fora dos 10 melhores
  const indice = ranking.indexOf(novaPontuacao);
  return {
    posicao: indice >= 0 && indice < 10 ? indice + 1 : 0,
    salva: true
  };
}

// Renderiza o ranking (até 10 colocados) dentro do elemento <ol> identificado por idLista.
// Busca o ranking compartilhado do dashboard do Arcade; se o backend não responder,
// cai de volta para o ranking salvo neste navegador.
async function mostrarRanking(idLista) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = '<li>Carregando...</li>';

  try {
    const top = await ArcadeShell.fetchLeaderboard('LEVEL_DEVIL', 10);
    lista.innerHTML = '';
    if (top.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Ninguém jogou ainda';
      lista.appendChild(item);
      return;
    }
    for (const r of top) {
      const item = document.createElement('li');
      item.textContent = r.nickname + ' — ' + r.score + ' pts';
      lista.appendChild(item);
    }
    return;
  } catch (erro) {
    console.warn('Não foi possível carregar o ranking do dashboard, usando o local.', erro);
  }

  const ranking = pegarRanking();
  lista.innerHTML = '';

  if (ranking === null) {
    const item = document.createElement('li');
    item.textContent = 'Ranking indisponível neste navegador.';
    lista.appendChild(item);
    return;
  }

  if (ranking.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Ninguém jogou ainda';
    lista.appendChild(item);
    return;
  }

  for (let i = 0; i < ranking.length && i < 10; i++) {
    const item = document.createElement('li');
    item.textContent = ranking[i].nick + ' — ' + ranking[i].pontos + ' pts (' + ranking[i].mortes + ' mortes)';
    lista.appendChild(item);
  }
}