var W = 1672, H = 941;
var X0 = 251, Y0 = 372, CW = 99, CH = 94, COLS = 14, ROWS = 5; // grade alinhada aos quadrados do cenário (99x94)
var TAM = {"bruxo": [336, 478], "destruida": [336, 374], "fazendeiro": [336, 447], "nadador": [336, 418], "padrao": [336, 368], "pirata": [320, 368], "professor": [336, 368]}; // tamanho (px) de cada PNG de robô já recortado

var ESCALA_ROBO = 0.35; // mesma escala para todos os robôs (corpo do robô padrão com ~129px)
var RAIO_DANO = 100, DANO_AREA = 0.5; // tiro também fere robôs a até 100px do ponto de impacto (50% do dano)

// defensores (dano do tiro = custo / 25); a ordem aqui é a ordem dos cards
var tipos = {
  sucateiro:  { nome: 'Sucateiro',  custo: 50,  vida: 0, w: 135, h: 150, tempo: 5,   modo: 'sol' },
  escudo:     { nome: 'Escudo',     custo: 75,  vida: 0, w: 122, h: 150, tempo: 0,   modo: 'escudo' },
  pistoleiro: { nome: 'Pistoleiro', custo: 100, vida: 0, w: 145, h: 150, tempo: 1.4, modo: 'tiro', dano: 4, alcance: 9999,  vel: 520 },
  cqb:        { nome: 'Pist. CQB',  custo: 125, vida: 0, w: 145, h: 150, tempo: 1.1, modo: 'tiro', dano: 5, alcance: 9999,  vel: 540 },
  sniper:     { nome: 'Sniper',     custo: 150, vida: 0, w: 250, h: 124,  tempo: 3.2, modo: 'tiro', dano: 6, alcance: 9999, vel: 1100, forte: true },
  minigunner: { nome: 'Minigunner', custo: 175, vida: 0, w: 167, h: 150, tempo: 0.6, modo: 'tiro', dano: 7, alcance: 9999,  vel: 560 }
};
var ordem = Object.keys(tipos);
// resistência: quanto mais caro, mais vida (custo x 0,4). O escudo é a muralha e tem o triplo.
for (var kk in tipos) tipos[kk].vida = Math.round(tipos[kk].custo * 0.4 * (tipos[kk].modo == 'escudo' ? 3 : 1));

// skins dos robôs (os pesos somam 100)
var skins = [
  { nome: 'padrao', peso: 35, vida: 30 }, { nome: 'destruida', peso: 25, vida: 20 },
  { nome: 'bruxo', peso: 8, vida: 30 }, { nome: 'nadador', peso: 8, vida: 30 }, { nome: 'pirata', peso: 8, vida: 30 },
  { nome: 'professor', peso: 8, vida: 30 }, { nome: 'fazendeiro', peso: 8, vida: 30 }
];

var jogo = document.getElementById('jogo'), campo = document.getElementById('campo'), aviso = document.getElementById('aviso');
var sois = 100, abates = 0, pontos = 0, recorde = 0, vel = 1, selecionado = '';
var pausado = false, fim = false, proxSol = 1.5, proxRobo = 10;
var onda = 1, restam = 0, pausaOnda = 0, PONTOS_ONDA = 100; // ondas: robôs ainda por aparecer, pausa entre ondas
// dificuldade por onda: cada uma é mais rápida, com robôs mais frequentes, mais numerosos e mais resistentes
// ondas infinitas: a dificuldade nunca para de subir (os limites só evitam valores absurdos)
function velRobo() { return Math.min(220, 22 + (onda - 1) * 4.5); }         // px/s
function intervaloRobo() { return Math.max(0.5, 7 / (1 + (onda - 1) * 0.12)); } // s entre levas (cai sem chegar a zero)
function tamanhoLeva() { return Math.min(12, 1 + Math.floor((onda - 1) / 2)); }
function totalOnda(n) { return 4 + n * 2 + Math.floor(n * n / 8); }          // robôs da onda
function vidaExtra() { return 1 + (onda - 1) * 0.08; }                       // +8% de vida por onda
var grade = [], defensores = [], robos = [], tiros = [], solList = [], cardEls = {};
try { recorde = parseInt(localStorage.getItem('recordeHumansVsIA')) || 0; } catch (e) {}

// ---------- utilitários ----------
function criar(classe) {
  var e = document.createElement('div');
  e.className = classe;
  campo.appendChild(e);
  return e;
}
function mover(el, x, y) { el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
function aleatorio(a, b) { return a + Math.random() * (b - a); }
function remover(lista, i) { campo.removeChild(lista[i].el); lista.splice(i, 1); }
function escalar() { // palco fixo, escalado para caber na janela
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  jogo.style.transform = 'translate(' + (-W * s / 2) + 'px,' + (-H * s / 2) + 'px) scale(' + s + ')';
}
window.onresize = escalar;
escalar();

// ---------- grade clicável e cards ----------
for (var r = 0; r < ROWS; r++) {
  grade[r] = [];
  for (var c = 0; c < COLS; c++) {
    var cel = criar('cel');
    cel.style.left = X0 + c * CW + 'px';
    cel.style.top = Y0 + r * CH + 'px';
    cel.style.width = CW + 'px';
    cel.style.height = CH + 'px';
    cel.r = r;
    cel.c = c;
    cel.onclick = colocar;
  }
}
for (var i = 0; i < ordem.length; i++) {
  var k = ordem[i], card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<img src="img/' + k + '.png"><span>' + tipos[k].nome + '</span><b>' + tipos[k].custo + '</b>';
  card.k = k;
  card.onclick = escolher;
  document.getElementById('cards').appendChild(card);
  cardEls[k] = card;
}
function escolher() {
  if (pausado || fim) return;
  if (selecionado == this.k) selecionado = '';
  else if (sois >= tipos[this.k].custo) selecionado = this.k;
  atualizarUI();
}
function atualizarUI() {
  document.getElementById('solTexto').textContent = sois;
  document.getElementById('abates').textContent = abates;
  document.getElementById('pontosTexto').textContent = pontos;
  document.getElementById('recorde').textContent = 'Recorde: ' + recorde;
  document.getElementById('ondaTexto').textContent = onda;  for (var i = 0; i < ordem.length; i++) {
    var k = ordem[i], semSol = sois < tipos[k].custo;
    if (semSol && selecionado == k) selecionado = '';
    cardEls[k].className = 'card' + (semSol ? ' off' : '') + (selecionado == k ? ' sel' : '');
  }
  campo.className = selecionado ? 'plantando' : '';
}

// ---------- criação ----------
function colocar() {
  var r = this.r, c = this.c, t = tipos[selecionado];
  if (pausado || fim || !selecionado || grade[r][c] || sois < t.custo) return;
  sois -= t.custo;
  var el = criar('ent def');
  el.style.width = t.w + 'px';
  el.style.height = t.h + 'px';
  el.style.zIndex = 10 + r;
  el.innerHTML = '<div class="sombra"></div><img src="img/' + selecionado + '.png">';
  var x = X0 + c * CW + (CW - t.w) / 2, y = Y0 + r * CH + CH - t.h - 4; // pés na base do quadrado, centrado na horizontal
  mover(el, x, y);
  var d = { t: t, row: r, col: c, hp: t.vida, el: el, x: x, y: y, tempo: t.modo == 'sol' ? 5 : 0.5 };
  grade[r][c] = d;
  defensores.push(d);
  selecionado = '';
  atualizarUI();
}

function criarSol(x, y, chao) {
  var s = { el: criar('sol-obj'), x: x, y: y, chao: chao, vida: 12 };
  mover(s.el, x, y);
  s.el.onpointerdown = function (e) { // pode coletar caindo ou no chão, com toque ou mouse
    e.stopPropagation();
    if (pausado || fim || s.vida <= 0) return;
    s.vida = 0;
    sois += 25;
    atualizarUI();
  };
  solList.push(s);
}

function somarPontos(n) {
  pontos += n;
  if (pontos > recorde) {
    recorde = pontos;
    try { localStorage.setItem('recordeHumansVsIA', recorde); } catch (e) {}
  }
}
function banner(txt, sub) { // aviso grande no centro (não interfere no pause)
  var b = document.getElementById('bannerOnda');
  b.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  b.className = '';
  void b.offsetWidth; // reinicia a animação
  b.className = 'mostrar';
}
function iniciarOnda(n) {
  onda = n;
  restam = totalOnda(n);
  proxRobo = n == 1 ? 10 : 3;
  banner('ONDA ' + n);
}

function criarRobo() {
  var n = Math.random() * (onda < 3 ? 60 : 100), i = 0; // ondas 1-2: só robôs comuns (padrão e destruído)
  while (n >= skins[i].peso) { n -= skins[i].peso; i++; } // sorteio com pesos
  var row = Math.floor(Math.random() * ROWS), el = criar('ent robo');
  var tm = TAM[skins[i].nome], sc = ESCALA_ROBO, rw = Math.round(tm[0] * sc), rh = Math.round(tm[1] * sc); // todos os robôs usam a mesma escala (podem passar para outros quadrados)
  el.style.width = rw + 'px';
  el.style.height = rh + 'px';
  el.style.zIndex = 10 + row;
  el.style.setProperty('--fase', -Math.random() * 0.8 + 's'); // cada robô começa num ponto diferente da passada
  el.innerHTML = '<div class="sombra"></div><div class="corpo"><img src="img/robo_' + skins[i].nome + '.png"></div>';
  var y = Y0 + row * CH + CH - rh - 4; // pés na base do quadrado, centrado na horizontal
  mover(el, W, y);
  robos.push({ w: rw, row: row, x: W, y: y, hp: Math.round(skins[i].vida * vidaExtra()), el: el, corpo: el.lastChild, img: el.lastChild.firstChild, ataque: 0 });
}

function temAlvo(d) { // há robô na linha, à frente e dentro do alcance?
  var cx = d.x + d.t.w / 2;
  for (var j = 0; j < robos.length; j++) {
    var dist = robos[j].x + robos[j].w / 2 - cx;
    if (robos[j].row == d.row && robos[j].x < W - 20 && dist > 0 && dist < d.t.alcance) return true;
  }
  return false;
}

function atirar(d) {
  var forte = d.t.forte, w = forte ? 44 : 22, el = criar('tiro' + (forte ? ' forte' : ''));
  var x = d.x + d.t.w * 0.85, y = d.y + d.t.h * 0.38;
  el.style.width = w + 'px';
  mover(el, x, y);
  tiros.push({ el: el, x: x, y: y, row: d.row, w: w, t: d.t, acertou: [] });
}

// reação ao dano: recuo curto + clarão que some + faíscas (o sniper reage mais forte)
function acertar(o, b) {
  var k = b.t.forte ? 1.7 : 1, i;
  o.corpo.animate([
    { transform: 'none' },
    { transform: 'translateX(' + 5 * k + 'px) rotate(' + 3 * k + 'deg) scale(' + (1 - 0.035 * k) + ',' + (1 + 0.03 * k) + ')', offset: 0.35 },
    { transform: 'none' }
  ], { duration: 260, easing: 'ease-out' });
  o.img.animate([{ filter: 'brightness(2.1) saturate(.5)' }, { filter: 'none' }], { duration: 190, easing: 'ease-out' });
  for (i = 0; i < (b.t.forte ? 5 : 3); i++) {
    var f = criar('fagulha'), ang = Math.PI + aleatorio(-1.1, 1.1), dist = aleatorio(12, 28) * k;
    f.style.left = o.x + 20 + 'px';
    f.style.top = b.y + 2 + 'px';
    f.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    f.style.setProperty('--dy', Math.sin(ang) * dist * 0.8 - 6 + 'px');
    f.style.animationDuration = aleatorio(0.24, 0.38) + 's';
    if (i % 2) f.style.background = '#ffb300';
    f.onanimationend = function () { campo.removeChild(this); };
  }
}

// ---------- atualização ----------
function atualizar(dt) {
  var i, j;

  // sóis caindo do céu
  proxSol -= dt;
  if (proxSol <= 0) {
    proxSol = 4;
    criarSol(aleatorio(X0, X0 + COLS * CW - 60), -60, Y0 + Math.floor(Math.random() * ROWS) * CH + aleatorio(20, 50));
  }
  // ondas: pausa curta entre elas; depois os robôs aparecem em levas até acabar a cota da onda
  if (pausaOnda > 0) {
    pausaOnda -= dt;
    if (pausaOnda <= 0) iniciarOnda(onda + 1);
  } else if (restam > 0) {
    proxRobo -= dt;
    if (proxRobo <= 0) {
      var leva = Math.min(tamanhoLeva(), restam);
      for (i = 0; i < leva; i++) criarRobo();
      restam -= leva;
      proxRobo = intervaloRobo();
    }
  }

  // defensores
  for (i = defensores.length - 1; i >= 0; i--) {
    var d = defensores[i];
    if (d.hp <= 0) {
      grade[d.row][d.col] = null;
      remover(defensores, i);
      continue;
    }
    d.tempo -= dt;
    if (d.t.modo == 'escudo' || d.tempo > 0) continue;
    if (d.t.modo == 'sol') {
      d.tempo = d.t.tempo;
      criarSol(d.x + d.t.w / 2 - 28, d.y - 40, d.y + d.t.h - 50);
    } else if (temAlvo(d)) {
      d.tempo = d.t.tempo;
      atirar(d);
    }
  }

  // tiros
  for (i = tiros.length - 1; i >= 0; i--) {
    var b = tiros[i], antes = b.x, usado = false;
    b.x += b.t.vel * dt;
    for (j = 0; j < robos.length; j++) {
      var o = robos[j];
      if (o.row != b.row || o.hp <= 0 || o.x > W - 10 || b.acertou.indexOf(o) >= 0) continue;
      if (b.x + b.w >= o.x + 14 && antes <= o.x + o.w - 10) { // área de acerto cobre quase o robô todo
        o.hp -= b.t.dano;
        b.acertou.push(o);
        acertar(o, b);
        for (var m = 0; m < robos.length; m++) { // dano em área: robôs próximos ao impacto
          var p = robos[m];
          if (p === o || p.hp <= 0 || p.x > W - 10 || b.acertou.indexOf(p) >= 0) continue;
          var ddx = (p.x + p.w / 2) - (o.x + o.w / 2), ddy = p.y - o.y;
          if (ddx * ddx + ddy * ddy <= RAIO_DANO * RAIO_DANO) { p.hp -= b.t.dano * DANO_AREA; b.acertou.push(p); acertar(p, b); }
        }
        if (!b.t.forte) { usado = true; break; } // o sniper atravessa os robôs
      }
    }
    if (b.x > W || usado) remover(tiros, i);
    else mover(b.el, b.x, b.y);
  }

  // robôs
  for (i = robos.length - 1; i >= 0; i--) {
    var rb = robos[i];
    if (rb.hp <= 0) {
      remover(robos, i);
      abates++;
      somarPontos(10);
      continue;
    }
    var cx = rb.x + rb.w / 2, col = Math.floor((cx - X0) / CW), alvo = null, parar = false;
    if (col >= 0 && col < COLS) {
      var centro = X0 + col * CW + CW / 2;
      if (grade[rb.row][col]) { alvo = grade[rb.row][col]; parar = true; } // já dentro da casa de um defensor
      else if (col > 0 && grade[rb.row][col - 1] && cx <= centro + 1) { alvo = grade[rb.row][col - 1]; parar = true; rb.x = centro - rb.w / 2; } // para no centro da casa à direita do defensor
    }
    rb.el.className = parar ? 'ent robo parado' : 'ent robo'; // parado = atacando
    if (alvo) {
      rb.ataque -= dt;
      if (rb.ataque <= 0) { alvo.hp -= 4; rb.ataque = 1; }
    } else {
      var nx = rb.x - velRobo() * dt; // acelera a cada onda
      var ncx = nx + rb.w / 2, ncol = Math.floor((ncx - X0) / CW);
      if (ncol >= 1 && ncol < COLS && grade[rb.row][ncol - 1] && !grade[rb.row][ncol]) { // não passa do centro da casa ao lado do defensor
        var cc = X0 + ncol * CW + CW / 2;
        if (ncx < cc) nx = cc - rb.w / 2;
      }
      rb.x = nx;
    }
    mover(rb.el, rb.x, rb.y);
    if (rb.x + rb.w / 2 < X0 - 20) terminar(); // chegou na base
  }

  // onda concluída: todos os robôs apareceram e foram abatidos
  if (!fim && pausaOnda <= 0 && restam == 0 && robos.length == 0) {
    somarPontos(PONTOS_ONDA);
    pausaOnda = 5;
    banner('ONDA ' + onda + ' CONCLUÍDA', '+' + PONTOS_ONDA + ' pontos');
  }

  // sóis: caem, ficam no chão e somem se ninguém pegar
  for (i = solList.length - 1; i >= 0; i--) {
    var s = solList[i];
    if (s.y < s.chao) s.y = Math.min(s.chao, s.y + 100 * dt);
    else s.vida -= dt;
    mover(s.el, s.x, s.y);
    if (s.vida <= 0) remover(solList, i);
  }
}

function terminar() {
  fim = true;
  aviso.style.display = 'flex';
  aviso.innerHTML = 'OS ROBÔS INVADIRAM!<div style="font-size:30px">Onda: ' + onda + ' | Abates: ' + abates + ' | Pontos: ' + pontos + '</div><button id="btnReiniciar">Jogar de novo</button>';
  document.getElementById('btnReiniciar').onclick = function () { location.reload(); };
}

// ---------- botões ----------
document.getElementById('btnVel').onclick = function () {
  vel = (vel == 1) ? 2 : 1;
  this.className = vel == 2 ? 'ativo' : '';
};
document.getElementById('btnPausa').onclick = function () {
  if (fim) return;
  pausado = !pausado;
  this.textContent = pausado ? 'Continuar' : 'Pausar';
  jogo.className = pausado ? 'pausado' : '';
  aviso.style.display = pausado ? 'flex' : 'none';
  aviso.textContent = pausado ? 'PAUSADO' : '';
};

// ---------- laço principal ----------
var ultimo = 0;
function laco(t) {
  var dt = Math.min((t - ultimo) / 1000, 0.05);
  ultimo = t;
  if (!pausado && !fim) {
    atualizar(dt * vel);
    atualizarUI();
  }
  requestAnimationFrame(laco);
}
iniciarOnda(1);
atualizarUI();
requestAnimationFrame(laco);
