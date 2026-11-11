/*
 * SENAI Arcade SDK — script compartilhado para os jogos dos estudantes.
 *
 * Como usar no seu jogo:
 *   1. Inclua este arquivo e o config.js na sua página.
 *   2. Defina window.SENAI_ARCADE_GAME_ID com o ID do seu jogo (ex: "LIMBO").
 *   3. Ao finalizar a partida, chame: salvarPontuacao(pontuacao, duracaoEmSegundos)
 *
 * O jogador já identificado no menu do Arcade é recuperado automaticamente.
 */
(function () {
  const API_BASE = (window.SENAI_ARCADE_CONFIG && window.SENAI_ARCADE_CONFIG.API_BASE) || '/api';

  function getJogadorArcade() {
    try {
      return JSON.parse(sessionStorage.getItem('senaiArcadePlayer') || 'null');
    } catch (e) {
      return null;
    }
  }

  async function salvarPontuacao(score, duration) {
    const player = getJogadorArcade();
    const gameId = window.SENAI_ARCADE_GAME_ID;

    if (!player) {
      throw new Error('Nenhum jogador identificado. Volte ao menu do Arcade e informe um nickname.');
    }
    if (!gameId) {
      throw new Error('Defina window.SENAI_ARCADE_GAME_ID com o ID do seu jogo antes de chamar salvarPontuacao().');
    }

    const response = await fetch(`${API_BASE}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, playerId: player.id, score, duration }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || 'Não foi possível registrar a pontuação. Tente novamente.');
    }

    return response.json();
  }

  window.getJogadorArcade = getJogadorArcade;
  window.salvarPontuacao = salvarPontuacao;
})();
