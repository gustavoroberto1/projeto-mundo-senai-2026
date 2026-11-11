// =====================================================
// JOGO: lógica (atualizar) e desenho (desenhar)
// =====================================================

// Chama uma função de outro arquivo só se ela existir (menu, casa...).
// Assim o jogo abre mesmo que algum desses arquivos ainda não esteja carregado.
function chamar(nome) {
  if (typeof window[nome] === "function") return window[nome]();
}
function emMenu() {
  return !!chamar("noMenu");
}

// Hitbox de um espinho: um pouco menor que o desenho, cortando a ponta.
// Em pé a ponta fica em cima; invertido, a ponta fica embaixo.
function caixaEspinho(e) {
  if (e.suporte) return { x: e.x + 3, y: e.y, w: e.w - 6, h: e.h - 3 };
  if (e.invertido) return { x: e.x + 4, y: e.y, w: e.w - 8, h: e.h - 6 };
  return { x: e.x + 4, y: e.y + 6, w: e.w - 8, h: e.h - 6 };
}

function atualizar(dt) {
  if (emMenu()) return;

  // jumpscare do Rush: o jogo congela e só o susto anda
  if (estado === "susto") { atualizarRush(dt); return; }

  if (estado === "morto") {
    contador -= dt;
    if (contador <= 0) reiniciar();
    return;
  }
  if (estado === "venceu") {
    if (teclas["Enter"]) {
      if (numeroFase < FASES.length - 1) {
        carregarFase(numeroFase + 1);
        reiniciar();
      } else {
        if (window.ArcadeShell) {
          ArcadeShell.gameOver(pontuacaoAtual(), { title: "Você escapou do Limbo!" });
        }
        mortes = 0;
        faseMaisAlta = 0;
        carregarFase(0);
        reiniciar();
      }
    }
    return;
  }

  const agachar = teclas["ShiftLeft"] || teclas["ShiftRight"];

  // --- esconder no armário: segure Shift na frente dele (só nas fases com rush) ---
  const armario = faseAtual.rush ? armarioPerto() : null;
  jogador.escondido = !!(armario && agachar && jogador.noChao);
  const livre = !jogador.escondido;      // escondido: não anda, não pula e não agacha

  const esquerda = livre && (teclas["ArrowLeft"] || teclas["KeyA"]);
  const direita  = livre && (teclas["ArrowRight"] || teclas["KeyD"]);
  const pular    = livre && (teclas["Space"] || teclas["ArrowUp"] || teclas["KeyW"]);

  // --- agachar / levantar ---
  if (agachar && livre && jogador.noChao && !jogador.agachado) {
    jogador.agachado = true;
    jogador.y += ALTURA_EM_PE - ALTURA_AGACHADO;   // desce, para os pés continuarem no chão
    jogador.h = ALTURA_AGACHADO;
  }
  if (!agachar && jogador.agachado) {
    // só levanta se não houver nada em cima da cabeça (beiradas atravessáveis não contam)
    const emPe = { x: jogador.x, y: jogador.y + jogador.h - ALTURA_EM_PE, w: jogador.w, h: ALTURA_EM_PE };
    if (!plataformas.some((p) => !p.passavel && colide(emPe, p))) {
      jogador.agachado = false;
      jogador.y = emPe.y;
      jogador.h = ALTURA_EM_PE;
    }
  }

  // plataformas que andam (vagonete e elevador da mina) levam o jogador junto
  if (typeof atualizarMoveisMina === "function") atualizarMoveisMina(dt);

  // --- movimento horizontal ---
  const velocidade = jogador.agachado ? VELOCIDADE * 0.4 : VELOCIDADE;   // agachado anda devagar
  jogador.vx = 0;
  if (esquerda) { jogador.vx = -velocidade; jogador.olhaEsquerda = true; }
  if (direita)  { jogador.vx =  velocidade; jogador.olhaEsquerda = false; }
  if (pular && jogador.noChao && !jogador.agachado) {
    jogador.vy = FORCA_PULO;
    jogador.noChao = false;
  }

  jogador.x += jogador.vx * dt;
  if (jogador.x < 0) jogador.x = 0;
  for (const p of plataformas) {          // bateu de lado numa parede?
    if (p.passavel) continue;             // beirada: dá para atravessar pelo lado
    if (colide(jogador, p)) {
      if (jogador.vx > 0) jogador.x = p.x - jogador.w;
      else if (jogador.vx < 0) jogador.x = p.x + p.w;
    }
  }

  // --- movimento vertical (gravidade) ---
  const baseAntes = jogador.y + jogador.h;      // onde estavam os pés antes de mover
  jogador.vy += GRAVIDADE * dt;
  if (faseAtual.velMax && jogador.vy > faseAtual.velMax) jogador.vy = faseAtual.velMax;   // queda não passa disto
  jogador.y += jogador.vy * dt;
  jogador.noChao = false;
  for (const p of plataformas) {
    if (p.passavel) {
      // beirada: só segura quem está caindo e veio de cima. De baixo e dos lados, atravessa
      const base = jogador.y + jogador.h;
      if (jogador.vy > 0 && baseAntes <= p.y + 1 && base >= p.y &&
          jogador.x < p.x + p.w && jogador.x + jogador.w > p.x) {
        jogador.y = p.y - jogador.h;
        jogador.vy = 0;
        jogador.noChao = true;
      }
      continue;
    }
    if (colide(jogador, p)) {
      if (jogador.vy > 0) {               // caindo: pousou em cima
        jogador.y = p.y - jogador.h;
        jogador.noChao = true;
      } else if (jogador.vy < 0) {        // subindo: bateu a cabeça
        jogador.y = p.y + p.h;
      }
      jogador.vy = 0;
    }
  }

  // --- perigos ---
  for (const e of espinhos) {
    if (colide(jogador, caixaEspinho(e))) morrer();
  }
  if (jogador.y > (faseAtual.limiteQueda || ALTURA + 80)) morrer();   // caiu no buraco

  // --- chegou na luz? ---
  if (colide(jogador, luz) && estado !== "venceu") {
    estado = "venceu";
    faseMaisAlta = Math.max(faseMaisAlta, numeroFase + 1); // conta a fase que acabou de terminar, não a próxima
  }

  // --- animação e câmera ---
  if (jogador.vx !== 0) jogador.anim += dt;
  camera = Math.max(0, Math.min(jogador.x - LARGURA / 3, FIM_DO_MUNDO - LARGURA));

  // câmera vertical: segue o jogador suavemente, só nas fases com "vertical: true"
  // (a âncora pode ser um número ou uma função: onde o boneco aparece na tela)
  if (faseAtual.vertical) {
    const anc = typeof faseAtual.ancora === "function" ? faseAtual.ancora() : (faseAtual.ancora || ALTURA * 0.55);
    const alvo = Math.max(faseAtual.topo, Math.min(faseAtual.base || 0, jogador.y + jogador.h / 2 - anc));
    cameraY += (alvo - cameraY) * Math.min(1, (faseAtual.camVel || 0.15) * dt);
  } else {
    cameraY = 0;
  }

  // o olho só existe nas fases que não têm "monstro: false"
  if (faseAtual.monstro !== false) {
    atualizarMonstro(dt);
    if (estado === "jogando" && olhoPegouJogador()) morrer();
  }

  // o Rush (fases com "rush: true"): luzes piscam, escurece e ele passa correndo
  if (faseAtual.rush && typeof atualizarRush === "function") atualizarRush(dt);
  if (typeof atualizarFalsos === "function") atualizarFalsos(dt);   // chão falso e pontes podres
  if (faseAtual.aranha && typeof atualizarAranha === "function") atualizarAranha(dt);
  if (typeof atualizarMina === "function") atualizarMina(dt);       // checkpoints, queda e pingentes da fase 5
}


// Vinheta escura nas bordas da tela.
const vinheta = ctx.createRadialGradient(LARGURA / 2, ALTURA / 2, 150, LARGURA / 2, ALTURA / 2, 480);
vinheta.addColorStop(0, "rgba(0,0,0,0)");
vinheta.addColorStop(1, "rgba(0,0,0,0.65)");

function desenhar() {
  // ===== 1) FUNDO (tudo aqui fica ATRÁS de todo o resto) =====
  if (faseAtual.cenario === "casa" || faseAtual.cenario === "mina") {
    ctx.fillStyle = "#050308";           // dentro da casa/mina não tem céu (assim o tremor não mostra faixa)
  } else {
    const ceu = ctx.createLinearGradient(0, 0, 0, ALTURA);
    ceu.addColorStop(0, paleta.ceuCima);
    ceu.addColorStop(1, paleta.ceuBaixo);
    ctx.fillStyle = ceu;
  }
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // Imagem de fundo opcional (só na floresta)
  if (faseAtual.cenario === "floresta" && fundo.complete && fundo.naturalWidth > 0) {
    const escalaFundo = Math.max(ALTURA / fundo.height, (LARGURA * 1.3) / fundo.width);
    const larguraFundo = fundo.width * escalaFundo;
    const alturaFundo = fundo.height * escalaFundo;
    const progresso = camera / (FIM_DO_MUNDO - LARGURA);
    ctx.drawImage(fundo, -progresso * (larguraFundo - LARGURA), (ALTURA - alturaFundo) / 2, larguraFundo, alturaFundo);
  }

  if (faseAtual.cenario === "cidade") {
    camadaPredios(0.15, 0.4, 170, 190);   // prédios lá longe
    desenharFumaca();
    camadaPredios(0.45, 0.9, 130, 130);   // prédios mais perto
  } else if (faseAtual.cenario === "floresta") {
    camadaGalhos(0.3, 0.45, 100, 220);    // árvores lá longe
    camadaGalhos(0.6, 0.85, 130, 200);    // árvores mais perto

    // névoa rente ao chão
    const nev = ctx.createLinearGradient(0, 200, 0, 400);
    nev.addColorStop(0, rgba(paleta.ceuBaixo, 0));
    nev.addColorStop(1, rgba(paleta.ceuBaixo, 0.45));
    ctx.fillStyle = nev;
    ctx.fillRect(0, 200, LARGURA, 250);
  } else if (faseAtual.cenario === "mina") {
    chamar("desenharFundoMina");          // colunas de pedra, madeira ao longe e névoa
  }

  // ===== 2) MUNDO (acompanha a câmera, por cima do fundo) =====
  ctx.save();
  const tr = chamar("tremorRush") || { x: 0, y: 0 };    // tremor da tela (Rush, aranha e queda da mina)
  const ta = chamar("tremorAranha") || { x: 0, y: 0 };
  const tm = chamar("tremorMina") || { x: 0, y: 0 };
  ctx.translate(-Math.round(camera) + tr.x + ta.x + tm.x, -Math.round(cameraY) + tr.y + ta.y + tm.y);

  if (faseAtual.cenario === "casa") chamar("desenharCasa");   // paredes, janelas e telhado
  if (faseAtual.caverna) chamar("desenharCaverna");           // o vazio do poço e do túnel
  if (faseAtual.cenario === "mina") chamar("desenharAbismoMina");   // o desfiladeiro

  // plataformas lisas (as com "estilo" e as "invisivel" se desenham sozinhas)
  ctx.fillStyle = "#050505";
  for (const p of plataformas) {
    if (p.estilo) continue;
    if (p.invisivel && p.h !== 100) continue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  chamar("desenharEntulho");

  // perigos: cones na cidade, ferros enferrujados na mina, espinhos nas outras fases
  for (const e of espinhos) {
    if (e.suporte) continue;                        // os triângulos das beiradas já vêm do casa.js
    if (faseAtual.cenario === "cidade") {
      desenharCones(e);
    } else if (faseAtual.cenario === "mina") {
      desenharPuasMina(e);
    } else {
      ctx.fillStyle = "#050505";
      for (let x = e.x; x < e.x + e.w; x += 20) {   // um triângulo a cada 20 de largura
        ctx.beginPath();
        if (e.invertido) {                          // ponta para baixo
          ctx.moveTo(x, e.y);
          ctx.lineTo(x + 10, e.y + e.h);
          ctx.lineTo(x + 20, e.y);
        } else {
          ctx.moveTo(x, e.y + e.h);
          ctx.lineTo(x + 10, e.y);
          ctx.lineTo(x + 20, e.y + e.h);
        }
        ctx.fill();
      }
    }
  }

  if (faseAtual.cenario === "casa") chamar("desenharDetalhesCasa");   // detalhes das tábuas e móveis

  desenharBlocos();                                  // blocos estilizados, antes do chão/grama
  if (faseAtual.cenario === "cidade") {
    desenharChao();
  } else if (faseAtual.cenario !== "casa" && faseAtual.cenario !== "mina") {
    desenharGrama();                                 // na casa e na mina não tem grama
  }

  desenharObjetos();
  desenharObjetosCidade();
  if (faseAtual.cenario === "mina") chamar("desenharMundoMina");      // bordas de pedra, pontes, objetos, pingentes
  if (faseAtual.cenario === "casa") chamar("desenharDecoracaoCasa");   // abóboras, quadros, armários...
  if (!emMenu()) desenharInstrucoes();

  // Luz que marca o fim da fase
  ctx.save();
  ctx.shadowColor = paleta.luz;
  ctx.shadowBlur = 40;
  ctx.fillStyle = paleta.luz;
  ctx.fillRect(luz.x, luz.y, luz.w, luz.h);
  ctx.restore();

  if (faseAtual.cenario !== "casa" && faseAtual.cenario !== "mina") desenharLanterna(75);
  if (!jogador.escondido) desenharBoneco();          // escondido no armário: o boneco some
  desenharAbrigos();
  chamar(typeof desenharAranhaCaverna === "function" ? "desenharAranhaCaverna" : "desenharAranha");   // a aranha da fase 4 (aceita os dois nomes)
  desenharFrenteCidade();
  if (faseAtual.monstro !== false) desenharMonstro();
  if (typeof depurar !== "undefined" && depurar) desenharHitboxes();
  ctx.restore();

  // ===== 3) POR CIMA DE TUDO (fixo na tela) =====
  if (estado !== "venceu") {
    chamar("desenharEscuridaoRush");   // escurece tudo (sobra uma luz em volta do jogador)
    chamar("desenharDicasRush");       // armários brilham no escuro e mostram a dica do Shift
    chamar("desenharRush");            // o monstro por cima do escuro
  }
  if (faseAtual.cenario === "mina") {
    chamar("desenharEscuridaoMina");   // a escuridão da mina, com as luzes abertas nela
    chamar("desenharQuedaMina");       // vento da queda, clarão do impacto e título
  }
  if (faseAtual.cenario === "cidade") desenharCinzas();

  ctx.fillStyle = vinheta;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  chamar("desenharTensaoAranha");      // bordas vermelhas quando a aranha está perto
  chamar("desenharSustoRush");         // o jumpscare, por cima de tudo

  if (emMenu()) { chamar("desenharMenu"); return; }

  if (estado !== "susto") {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "16px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("Mortes: " + mortes, 16, 28);
    ctx.fillText("Fase " + (numeroFase + 1), 16, 48);
    ctx.fillText("Pontos: " + pontuacaoAtual(), 16, 68);
  }

  if (estado === "morto") {
    const preto = typeof rush !== "undefined" && rush.preto;   // depois do susto: preto direto
    ctx.fillStyle = "rgba(0,0,0," + (preto ? 1 : Math.min(1, 1.2 - contador / 50)) + ")";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
  }
  if (estado === "venceu") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
    textoCentral("Você chegou à luz.", ALTURA / 2 - 6, 34);
    textoCentral(
      numeroFase < FASES.length - 1 ? "Aperte Enter para a próxima fase" : "Aperte Enter para jogar de novo",
      ALTURA / 2 + 30, 18
    );
  }
}


// Aperte H para ver as hitboxes: azul = plataformas, vermelho = espinhos, verde = jogador, amarelo = luz final
function desenharHitboxes() {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#4af";
  for (const p of plataformas) ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = "#f33";
  for (const e of espinhos) {
    const c = caixaEspinho(e);
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }
  ctx.strokeStyle = "#3f3";
  ctx.strokeRect(jogador.x, jogador.y, jogador.w, jogador.h);
  ctx.strokeStyle = "#fd3";
  ctx.strokeRect(luz.x, luz.y, luz.w, luz.h);
  ctx.restore();
}