const images = [
  { jogo: "TOMB_OF_THE_MASK", img: "./assets/run-frog.jpeg" },
  { jogo: "HUMANS_VS_IA", img: "./assets/plants-vs-zombie.jpeg" },
  { jogo: "LIMBO", img: "./assets/limbo.jpg" },
  { jogo: "LEVEL_DEVIL", img: "./assets/troll-cat.png" },
];

const API_BASE = window.SENAI_ARCADE_CONFIG.API_BASE;

const ICONS = {
  HUMANS_VS_IA: "🤖",
  TOMB_OF_THE_MASK: "🗿",
  LIMBO: "🌘",
  LEVEL_DEVIL: "😈",
};

let player = JSON.parse(sessionStorage.getItem("senaiArcadePlayer") || "null");
let games = [];
let records = {};

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erro na requisição ao servidor.");
  }
  return res.json();
}

async function loadGames() {
  games = await fetchJSON(`${API_BASE}/games`);
}

async function loadRecords() {
  records = {};
  if (!player) return;
  const list = await fetchJSON(`${API_BASE}/players/${player.id}/records`);
  list.forEach((r) => {
    records[r.gameId] = r;
  });
}
function renderGames() {
  document.getElementById("games").innerHTML = games
    .map((g) => {
      const rec = records[g.id];

      const imagem = images.find((img) => img.jogo === g.id);

      const progress =
        rec && rec.played
          ? "★ SEU RECORDE: " + rec.bestScore.toLocaleString("pt-BR")
          : "○ AINDA NÃO JOGOU";

      return `
      <article class="game">
        <div class="art" role="img" aria-label="${g.name}" ${
          imagem
            ? `style="background-image: url('${imagem.img}'); background-size: cover; background-position: center;"`
            : ""
        }>
          ${imagem ? "" : `<div class="symbol">${ICONS[g.id] || "🎮"}</div>`}
        </div>

        <div class="game-content">
          <button class="play" onclick="startGame('${g.id}')">▶ JOGAR AGORA</button>
          <div class="progress">${progress}</div>
        </div>
      </article>`;
    })
    .join("");
}

async function syncPlayer() {
  document.getElementById("loginOverlay").classList.toggle("hidden", !!player);
  document.getElementById("playerPill").textContent = player
    ? "● JOGADOR: " + player.nickname
    : "● AGUARDANDO JOGADOR";
  document.getElementById("exitBtn").hidden = !player;

  try {
    await loadRecords();
  } catch (e) {
    console.error("Falha ao carregar recordes:", e);
  }
  renderGames();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nicknameInput = document.getElementById("nickname");
  const errorEl = document.getElementById("error");
  const submitBtn = e.target.querySelector("button[type=submit]");
  const nickname = nicknameInput.value.trim();

  errorEl.textContent = "";
  if (nickname.length < 2) {
    errorEl.textContent = "Informe pelo menos 2 caracteres.";
    return;
  }

  submitBtn.disabled = true;
  try {
    const { player: identifiedPlayer } = await fetchJSON(
      `${API_BASE}/players/identify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      },
    );
    player = { id: identifiedPlayer.id, nickname: identifiedPlayer.nickname };
    sessionStorage.setItem("senaiArcadePlayer", JSON.stringify(player));
    await syncPlayer();
  } catch (err) {
    errorEl.textContent =
      err.message || "Não foi possível identificar o jogador.";
  } finally {
    submitBtn.disabled = false;
  }
});

function startGame(gameId) {
  if (!player) return;
  var teste = gameId.toLowerCase();
  window.location.href = `games/${teste}/index.html?game=${encodeURIComponent(gameId)}`;
}

function sair() {
  player = null;
  records = {};
  sessionStorage.removeItem("senaiArcadePlayer");
  document.getElementById("loginForm").reset();
  document.getElementById("error").textContent = "";
  syncPlayer();
  document.getElementById("nickname").focus();
}

(async function init() {
  try {
    await loadGames();
  } catch (e) {
    console.error("Falha ao carregar jogos:", e);
  }
  await syncPlayer();
})();
