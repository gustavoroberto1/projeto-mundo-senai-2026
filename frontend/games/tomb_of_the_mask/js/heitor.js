// =====================================================================
// heitor.js
// Ranking (salvar e mostrar) e as telas de menu (tela inicial, ranking,
// fase completa).
// =====================================================================

// ---------- RANKING SALVO NO NAVEGADOR ----------
const CHAVE_RANKING = "gruta_rank"; // nome sob o qual o ranking fica guardado

function lerRankingLocal() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_RANKING) || "[]");
    } catch (erro) {
        return [];
    }
}

function gravarListaRankingLocal(lista) {
    try {
        localStorage.setItem(CHAVE_RANKING, JSON.stringify(lista));
    } catch (erro) {}
}

// Transforma o apelido numa chave simples ("Ana Luz!" vira "n_analuz"),
// para "ana luz" e "ANALUZ" contarem como o mesmo jogador.
function chaveDoApelido(nome) {
    const simples = String(nome).toLowerCase().replace(/[^a-z0-9]/g, "");
    return "n_" + (simples || "anon");
}

// ---------- SALVAR E BUSCAR PONTUAÇÃO ----------

let arcadeTempoInicio = 0; // valor de "tempo" quando a partida começou, para calcular a duração

// Envia a pontuação final para o dashboard do Arcade (backend oficial) e também
// guarda uma cópia local (compatibilidade com o ranking antigo do navegador).
async function salvarResultadoArcade() {
    await salvarRankingLocal();

    const duracao = Math.max(0, Math.round(tempo - arcadeTempoInicio));
    try {
        await ArcadeShell.reportScore("TOMB_OF_THE_MASK", pontos, duracao);
    } catch (erro) {
        console.warn("Não foi possível enviar a pontuação ao dashboard do Arcade.", erro);
    }
}

// Guarda a pontuação final, mas só se for melhor que a anterior do mesmo apelido.
async function salvarRankingLocal() {

    const registro = {
        nick: apelido,
        score: pontos,
        deaths: mortes,
        coins: moedasPegas,
        stars: moscasPegas,
        ts: Date.now()
    };

    // 1) No navegador
    const lista = lerRankingLocal();
    const posicao = lista.findIndex(r => chaveDoApelido(r.nick) === chaveDoApelido(apelido));

    if (posicao < 0) {
        lista.push(registro);
    } else if (lista[posicao].score < pontos) {
        lista[posicao] = registro;
    }

    gravarListaRankingLocal(lista);

    // 2) No banco compartilhado (se existir)
    if (banco) {
        try {
            const doc = banco.collection("ranking").doc(chaveDoApelido(apelido));
            const atual = await doc.get();

            if (!atual.exists || (atual.data().score || 0) < pontos) {
                await doc.set(registro);
            }
        } catch (erro) {}
    }
}

// Busca os 10 melhores. "compartilhado" diz se veio do dashboard do Arcade (todos os jogadores)
// ou só do ranking salvo neste navegador (quando o backend não responde).
async function buscarRanking() {
    try {
        const lista = await ArcadeShell.fetchLeaderboard("TOMB_OF_THE_MASK", 10);
        return {
            lista: lista.map(r => ({ nick: r.nickname, score: r.score, deaths: null })),
            compartilhado: true,
        };
    } catch (erro) {}

    return { lista: lerRankingLocal(), compartilhado: false };
}

// ---------- DESENHAR O RANKING NA TELA ----------

// Cria um elemento HTML com classe e texto (ajuda a não repetir código).
function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    el.className = classe;
    el.textContent = texto;
    return el;
}

function mostrarRanking(caixa, { lista, compartilhado }) {

    // Ordena por pontos (mais pontos primeiro); empate: menos mortes ganha
    lista = lista
        .slice()
        .sort((a, b) => b.score - a.score || a.deaths - b.deaths)
        .slice(0, 10);

    caixa.textContent = "";

    if (!lista.length) {
        caixa.textContent = "Ninguém jogou ainda. Seja o primeiro!";
        return;
    }

    // Destaque do primeiro lugar
    caixa.append(criarElemento(
        "div", "top",
        "👑 Maior pontuação: " + lista[0].nick + " (" + lista[0].score + " pts)"
    ));

    // Uma linha por jogador
    lista.forEach((r, i) => {
        const souEu = apelido && chaveDoApelido(r.nick) === chaveDoApelido(apelido);
        const linha = criarElemento("div", "row" + (souEu ? " me" : ""), "");

        const posicao = ["🥇", "🥈", "🥉"][i] || (i + 1) + "º";

        [posicao, String(r.nick), r.score + " pts", r.deaths != null ? "💀" + r.deaths : ""].forEach(texto => {
            linha.append(criarElemento("span", "", texto));
        });

        caixa.append(linha);
    });

    caixa.append(criarElemento(
        "div", "note",
        compartilhado
            ? "Ranking compartilhado entre os jogadores"
            : "Ranking salvo somente neste aparelho"
    ));
}

// ---------- TELAS (a janela por cima do jogo) ----------

// Mostra a janela por cima do jogo. "opcoes" pode ter:
//   campoApelido - mostra o campo para digitar o apelido
//   ranking      - mostra a lista do ranking
//   botao, acao  - texto e ação do botão principal
//   botao2, acao2 - texto e ação do botão secundário (opcional)
function mostrarTela(titulo, mensagemHtml, opcoes) {

    porId("titulo").textContent = titulo;
    porId("mensagem").innerHTML = mensagemHtml;

    porId("campo-apelido").classList.toggle("hidden", !opcoes.campoApelido);
    porId("lista-ranking").classList.toggle("hidden", !opcoes.ranking);

    porId("botao-principal").textContent = opcoes.botao;
    acaoBotao1 = opcoes.acao;

    porId("botao-secundario").classList.toggle("hidden", !opcoes.botao2);
    if (opcoes.botao2) porId("botao-secundario").textContent = opcoes.botao2;
    acaoBotao2 = opcoes.acao2;

    porId("sobreposicao").classList.remove("hidden");
}

// A tela inicial usa o ArcadeShell (mesmo visual dos outros jogos do Arcade).
// As telas de "fase completa" e "ranking" continuam com o visual próprio do jogo.
function mostrarTelaInicial() {
    estado = "menu";
    porId("sobreposicao").classList.add("hidden");

    ArcadeShell.init({
        gameId: "TOMB_OF_THE_MASK",
        gameName: "Run Frog",
        description: "Você é um sapo engolido por uma cobra! Deslize pelas paredes do estômago, pegue todas as moedas e moscas, desvie dos espinhos e fuja pelo portal antes que o ácido suba! Setas / WASD ou deslize o dedo.",
        accentColor: "#ff3b91",
        onPlay: comecarJogo,
        getScore: () => pontos,
    });
}

// "final" = true quando o jogador acabou de terminar o jogo.
async function mostrarTelaRanking(final) {
    if (final) {
        // A partida já acabou e foi salva: esconde o botão flutuante "Sair" do
        // ArcadeShell para não oferecer salvar a mesma pontuação de novo.
        const botaoSair = document.querySelector('#arcade-shell-root .as-exit-floating');
        if (botaoSair) botaoSair.style.display = 'none';
    }

    mostrarTela(
        final ? "Você escapou!" : "🏆 Ranking",
        final
            ? "Você fez <b>" + pontos + "</b> pontos com <b>" + mortes + "</b> mortes."
            : "Melhores fugitivos",
        {
            ranking: true,
            botao: final ? "Jogar de novo" : "Voltar",
            acao: mostrarTelaInicial
        }
    );

    porId("lista-ranking").textContent = "Carregando...";
    mostrarRanking(porId("lista-ranking"), await buscarRanking());
}

function comecarJogo() {
    const jogadorArcade = window.ArcadeShell && ArcadeShell.player();
    apelido = (jogadorArcade && jogadorArcade.nickname) || "Anônimo";

    fase = 1;
    pontos = 0;
    moedasPegas = 0;
    moscasPegas = 0;
    mortes = 0;
    arcadeTempoInicio = tempo;

    porId("sobreposicao").classList.add("hidden");
    carregarFase();
}

// ---------- BOTÕES ----------
porId("botao-principal").onclick = () => {
    if (acaoBotao1) acaoBotao1();
};

porId("botao-secundario").onclick = () => {
    if (acaoBotao2) acaoBotao2();
};

// Apertar Enter no campo do apelido também começa o jogo
porId("campo-apelido").addEventListener("keydown", e => {
    if (e.key === "Enter") comecarJogo();
});
