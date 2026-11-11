/*
 * SENAI Arcade — Game Shell
 *
 * Camada compartilhada usada pelos jogos para:
 *   - mostrar uma tela inicial (Jogar / Recordes / Voltar à plataforma);
 *   - consultar o ranking (top 10) direto do backend;
 *   - enviar a pontuação final para o dashboard (via arcade-sdk.js);
 *   - voltar para a tela de seleção de jogos.
 *
 * Jogos que já têm seu próprio menu (ex: tomb_of_the_mask, level_devil) podem
 * usar só os helpers (fetchLeaderboard, reportScore, player, backToPlatform).
 * Jogos sem menu próprio (ex: humans_vs_ia, limbo) usam a tela completa
 * (init/play/gameOver).
 */
(function () {
  const API_BASE = (window.SENAI_ARCADE_CONFIG && window.SENAI_ARCADE_CONFIG.API_BASE) || '/api';

  let config = { gameId: null, gameName: 'Jogo' };
  let startedAt = null;
  let scoreProvider = null;
  let root = null;

  function player() {
    return (window.getJogadorArcade && window.getJogadorArcade()) || null;
  }

  function backToPlatform() {
    window.location.href = '../../index.html';
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  async function fetchLeaderboard(gameId, limit) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(gameId)}/leaderboard?limit=${limit || 10}`);
    if (!res.ok) throw new Error('Não foi possível carregar os recordes.');
    return res.json();
  }

  async function reportScore(gameId, score, duration) {
    window.SENAI_ARCADE_GAME_ID = gameId;
    if (!window.salvarPontuacao) throw new Error('arcade-sdk.js não foi carregado.');
    return window.salvarPontuacao(Math.max(0, Math.round(score || 0)), Math.max(0, Math.round(duration || 0)));
  }

  function leaderboardRowsHTML(lista, meuNome) {
    if (!lista.length) return '<p class="as-empty">Ninguém jogou ainda. Seja o primeiro!</p>';
    const medalhas = ['🥇', '🥈', '🥉'];
    return lista.map((r, i) => {
      const souEu = meuNome && r.nickname && r.nickname.toLowerCase() === meuNome.toLowerCase();
      return `<div class="as-row${souEu ? ' as-me' : ''}">
        <span class="as-rank">${medalhas[i] || (i + 1) + 'º'}</span>
        <span class="as-nick">${escapeHtml(r.nickname)}</span>
        <span class="as-score">${Number(r.score).toLocaleString('pt-BR')} pts</span>
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------
  // Tela completa (usada por jogos sem menu próprio)
  // ---------------------------------------------------------------
  function montarDom() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'arcade-shell-root';
    root.innerHTML = `
      <div class="as-overlay as-screen-start">
        <div class="as-modal">
          <div class="as-tag">★ SENAI ARCADE ★</div>
          <h2 class="as-title"></h2>
          <p class="as-desc"></p>
          <p class="as-player">Jogador: <b class="as-player-name"></b></p>
          <button class="as-btn as-primary as-btn-play">▶ JOGAR</button>
          <button class="as-btn as-btn-records">🏆 RECORDES (TOP 10)</button>
          <button class="as-btn as-back as-btn-exit">↩ VOLTAR À PLATAFORMA</button>
        </div>
      </div>
      <div class="as-overlay as-screen-records" style="display:none">
        <div class="as-modal">
          <div class="as-tag">🏆 TOP 10</div>
          <h2 class="as-title-records"></h2>
          <div class="as-leaderboard"><p class="as-empty">Carregando...</p></div>
          <button class="as-btn as-primary as-btn-records-back">◀ VOLTAR</button>
        </div>
      </div>
      <div class="as-overlay as-screen-gameover" style="display:none">
        <div class="as-modal">
          <div class="as-tag as-gameover-tag">FIM DE JOGO</div>
          <h2 class="as-title-go"></h2>
          <div class="as-score"></div>
          <p class="as-save-status">Salvando pontuação...</p>
          <button class="as-btn as-primary as-btn-replay">🔁 JOGAR DE NOVO</button>
          <button class="as-btn as-btn-go-records">🏆 RECORDES</button>
          <button class="as-btn as-back as-btn-go-exit">↩ VOLTAR À PLATAFORMA</button>
        </div>
      </div>
      <div class="as-overlay as-screen-confirm" style="display:none">
        <div class="as-modal">
          <div class="as-tag">⚠ CONFIRMAR</div>
          <p class="as-confirm-msg"></p>
          <button class="as-btn as-primary as-btn-confirm-yes"></button>
          <button class="as-btn as-back as-btn-confirm-no">Cancelar</button>
        </div>
      </div>
      <button class="as-exit-floating" style="display:none">⏹ SAIR</button>
    `;
    document.body.appendChild(root);

    root.querySelector('.as-btn-play').onclick = () => startPlaying();
    root.querySelector('.as-btn-records').onclick = () => showRecords();
    root.querySelector('.as-btn-exit').onclick = () => sairComPontuacao();
    root.querySelector('.as-btn-records-back').onclick = () => showStart();
    root.querySelector('.as-btn-replay').onclick = () => window.location.reload();
    root.querySelector('.as-btn-go-records').onclick = () => showRecords();
    root.querySelector('.as-btn-go-exit').onclick = () => backToPlatform();
    root.querySelector('.as-exit-floating').onclick = () => sairComPontuacao();
  }

  // Modal de confirmação com o mesmo visual da tela inicial (substitui window.confirm).
  // Devolve uma Promise<boolean>. Não esconde a tela que já estiver visível por trás.
  function confirmar(mensagem, opts) {
    montarDom();
    const tela = root.querySelector('.as-screen-confirm');
    const telaAnterior = [...root.querySelectorAll('.as-overlay')].find((s) => s !== tela && s.style.display !== 'none');
    root.querySelector('.as-confirm-msg').textContent = mensagem;
    const botaoSim = root.querySelector('.as-btn-confirm-yes');
    botaoSim.textContent = (opts && opts.confirmLabel) || 'Confirmar';
    tela.style.display = 'grid';

    return new Promise((resolve) => {
      function finalizar(resultado) {
        tela.style.display = 'none';
        if (telaAnterior) telaAnterior.style.display = 'grid';
        botaoSim.onclick = null;
        root.querySelector('.as-btn-confirm-no').onclick = null;
        resolve(resultado);
      }
      botaoSim.onclick = () => finalizar(true);
      root.querySelector('.as-btn-confirm-no').onclick = () => finalizar(false);
    });
  }

  async function sairComPontuacao() {
    const score = typeof scoreProvider === 'function' ? scoreProvider() : null;
    if (score == null) { backToPlatform(); return; }
    const ok = await confirmar('Sair e salvar sua pontuação atual (' + Math.round(score).toLocaleString('pt-BR') + ' pts)?', { confirmLabel: 'Sair e salvar' });
    if (!ok) return;
    const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    reportScore(config.gameId, score, duration).catch(() => {}).finally(backToPlatform);
  }

  function hideAllScreens() {
    root.querySelectorAll('.as-overlay').forEach((s) => (s.style.display = 'none'));
  }

  function showStart() {
    montarDom();
    hideAllScreens();
    root.querySelector('.as-screen-start').style.display = 'grid';
  }

  async function showRecords() {
    montarDom();
    hideAllScreens();
    root.querySelector('.as-screen-records').style.display = 'grid';
    const box = root.querySelector('.as-leaderboard');
    box.innerHTML = '<p class="as-empty">Carregando...</p>';
    const jog = player();
    try {
      const lista = await fetchLeaderboard(config.gameId, 10);
      box.innerHTML = leaderboardRowsHTML(lista, jog && jog.nickname);
    } catch (e) {
      box.innerHTML = '<p class="as-empty">Não foi possível carregar os recordes.</p>';
    }
  }

  function init(opts) {
    config = Object.assign({ gameName: 'Jogo' }, opts);
    montarDom();
    root.style.setProperty('--as-accent', config.accentColor || '#29f4e1');
    root.querySelector('.as-title').textContent = config.gameName;
    root.querySelector('.as-title-records').textContent = config.gameName;
    root.querySelector('.as-desc').textContent = config.description || '';
    const jog = player();
    root.querySelector('.as-player-name').textContent = jog ? jog.nickname : 'Desconhecido';
    if (!jog) {
      root.querySelector('.as-btn-play').disabled = true;
      root.querySelector('.as-desc').textContent = 'Volte à plataforma e informe um nickname antes de jogar.';
    }
    showStart();
  }

  // Chamada pelo botão "Jogar" da tela inicial: esconde a tela e inicia a partida.
  function startPlaying() {
    if (!player()) { showStart(); return; }
    scoreProvider = (config.getScore) || null;
    startedAt = Date.now();
    hideAllScreens();
    root.querySelector('.as-exit-floating').style.display = 'block';
    if (typeof config.onPlay === 'function') config.onPlay();
  }

  async function gameOver(score, opts) {
    montarDom();
    hideAllScreens();
    root.querySelector('.as-exit-floating').style.display = 'none';
    const screen = root.querySelector('.as-screen-gameover');
    screen.style.display = 'grid';
    root.querySelector('.as-title-go').textContent = (opts && opts.title) || 'Partida encerrada';
    root.querySelector('.as-score').textContent = Math.round(score).toLocaleString('pt-BR') + ' pts';
    const status = root.querySelector('.as-save-status');
    status.textContent = 'Salvando pontuação...';
    const duration = (opts && opts.duration != null) ? opts.duration : (startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0);
    try {
      const resultado = await reportScore(config.gameId, score, duration);
      status.textContent = resultado && resultado.isNewRecord
        ? '🏆 Novo recorde salvo no dashboard!'
        : 'Pontuação salva no dashboard.';
    } catch (e) {
      status.textContent = 'Não foi possível salvar: ' + (e.message || 'erro desconhecido.');
    }
  }

  function setScoreProvider(fn) {
    scoreProvider = fn;
  }

  window.ArcadeShell = {
    player,
    backToPlatform,
    fetchLeaderboard,
    reportScore,
    leaderboardRowsHTML,
    setScoreProvider,
    confirm: confirmar,
    init,
    gameOver,
    showStart,
    showRecords,
  };
})();
