const API_BASE = window.SENAI_ARCADE_CONFIG.API_BASE;
const ICONS = {
  HUMANS_VS_IA: "🤖",
  TOMB_OF_THE_MASK: "🗿",
  LIMBO: "🌘",
  LEVEL_DEVIL: "😈",
};

const gameId = new URLSearchParams(window.location.search).get("game");
const boardEl = document.getElementById("boardFull");

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao consultar " + url);
  return res.json();
}

function renderBoard(game, leaderboard) {
  const rows = leaderboard.length
    ? leaderboard
        .map(
          (row) => `
      <li class="${row.rank === 1 ? "leader" : ""}" data-player="${row.playerId}">
        <span class="rank">#${row.rank}</span>
        <span class="nick">${row.nickname}</span>
        <span class="pts">${row.score.toLocaleString("pt-BR")}</span>
      </li>`,
        )
        .join("")
    : '<div class="empty">Nenhuma partida registrada ainda.</div>';

  boardEl.innerHTML = `
    <h3>${ICONS[game.id] || "🎮"} ${game.name}</h3>
    <div class="matches">TOP ${leaderboard.length || 0}</div>
    <ol>${rows}</ol>
  `;
}

async function loadBoard() {
  const [game, leaderboard] = await Promise.all([
    fetchJSON(`${API_BASE}/games/${gameId}`),
    fetchJSON(`${API_BASE}/games/${gameId}/leaderboard?limit=100`),
  ]);
  renderBoard(game, leaderboard);
}

if (!gameId) {
  window.location.href = "dashboard.html";
} else {
  loadBoard().catch((e) => {
    boardEl.innerHTML = `<div class="empty">${e.message}</div>`;
  });

  const socket = io();
  socket.on("score:created", (payload) => {
    if (payload.gameId === gameId) loadBoard().catch(() => {});
  });
  socket.on("record:updated", (payload) => {
    if (!payload || payload.gameId === gameId) loadBoard().catch(() => {});
  });
}
