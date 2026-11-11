const API_BASE = window.SENAI_ARCADE_CONFIG.API_BASE;
const ICONS = {
  HUMANS_VS_IA: "🤖",
  TOMB_OF_THE_MASK: "🗿",
  LIMBO: "🌘",
  LEVEL_DEVIL: "😈",
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao consultar " + url);
  return res.json();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR");
}

function renderBoards(rankings) {
  document.getElementById("boards").innerHTML = rankings
    .map((board) => {
      const rows = board.top.length
        ? board.top
            .map(
              (row) => `
          <li class="${row.rank === 1 ? "leader" : ""}" data-game="${board.gameId}" data-player="${row.playerId}">
            <span class="rank">#${row.rank}</span>
            <span class="nick">${row.nickname}</span>
            <span class="pts">${row.score.toLocaleString("pt-BR")}</span>
          </li>`,
            )
            .join("")
        : '<div class="empty">Nenhuma partida registrada ainda.</div>';

      return `
      <div class="board" id="board-${board.gameId}">
        <h3>${ICONS[board.gameId] || "🎮"} ${board.gameName}</h3>
        <div class="matches">TOP ${board.top.length || 0}</div>
        <ol>${rows}</ol>
        <a class="view-full" href="ranking.html?game=${encodeURIComponent(board.gameId)}">VER RANKING COMPLETO →</a>
      </div>`;
    })
    .join("");
}

function renderRecent(scores) {
  document.getElementById("recentBody").innerHTML = scores
    .map(
      (s) => `
      <tr data-score-id="${s.id}">
        <td>${s.nickname}</td>
        <td>${ICONS[s.gameId] || ""} ${s.gameName}</td>
        <td>${s.score.toLocaleString("pt-BR")}</td>
        <td>${formatTime(s.createdAt)}</td>
        <td></td>
      </tr>`,
    )
    .join("");
}

function prependRecent(score, isNewRecord) {
  const tbody = document.getElementById("recentBody");
  const row = document.createElement("tr");
  row.className = "new-row";
  row.dataset.scoreId = score.id;
  row.innerHTML = `
    <td>${score.nickname}</td>
    <td>${ICONS[score.gameId] || ""} ${score.gameName}</td>
    <td>${score.score.toLocaleString("pt-BR")}</td>
    <td>${formatTime(score.createdAt)}</td>
    <td>${isNewRecord ? '<span class="badge">NOVO RECORDE</span>' : ""}</td>
  `;
  tbody.prepend(row);
  while (tbody.rows.length > 10) {
    tbody.deleteRow(tbody.rows.length - 1);
  }
}

async function loadAll() {
  const [rankings, recent] = await Promise.all([
    fetchJSON(`${API_BASE}/dashboard/rankings?limit=5`),
    fetchJSON(`${API_BASE}/dashboard/recent-scores?limit=10`),
  ]);
  renderBoards(rankings);
  renderRecent(recent);
}

let refreshTimer = null;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    fetchJSON(`${API_BASE}/dashboard/rankings?limit=5`)
      .then((rankings) => renderBoards(rankings))
      .catch((e) => console.error("Falha ao atualizar dashboard:", e));
  }, 500);
}

function setConnectionStatus(connected) {
  const pill = document.getElementById("connectionPill");
  pill.classList.toggle("offline", !connected);
  pill.innerHTML = connected
    ? '<span class="live-dot"></span>CONECTADO'
    : '<span class="live-dot"></span>RECONECTANDO...';
}

const socket = io();

socket.on("connect", () => {
  setConnectionStatus(true);
  loadAll().catch((e) => console.error("Falha ao sincronizar dashboard:", e));
});

socket.on("disconnect", () => setConnectionStatus(false));

socket.on("score:created", (payload) => {
  prependRecent(payload, payload.isNewRecord);
  scheduleRefresh();
});

socket.on("record:updated", () => {
  scheduleRefresh();
});

loadAll().catch((e) => console.error("Falha ao carregar dashboard:", e));
