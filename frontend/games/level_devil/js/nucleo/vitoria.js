// =====================================================================
//  CONFETE da tela de vitória
//  iniciarConfete() começa a chuva de confete; pararConfete() para e esconde.
//  (o texto e o gato da tela de vitória ficam no index.html e no telas.js)
// =====================================================================
const CONFETE_QUANTIDADE = 140; // quantidade de pedaços desenhados por vez
const CONFETE_CORES = ['#ffd60a', '#e63946', '#4cc9f0', '#80ed99', '#ff70a6', '#ffffff'];

// Canvas sobreposto à tela final e seu contexto de desenho.
const telaConfete = document.getElementById('confete');
const pincelConfete = telaConfete.getContext('2d');
let confetes = []; // estado individual de cada pedaço de confete
let confeteRodando = false; // impede que a animação continue após sair da tela final

// Cria um pedaço com posição, tamanho, velocidade, oscilação, rotação e cor aleatórios.
// Se noTopo for true, ele nasce acima da tela para voltar à chuva.
function criarConfete(noTopo) {
  return {
    x: Math.random() * telaConfete.width,
    y: noTopo ? -20 : Math.random() * telaConfete.height,         // no começo já espalhados pela tela
    tamanho: 6 + Math.random() * 8,
    velocidade: 1.5 + Math.random() * 3,
    balanco: Math.random() * Math.PI * 2,                         // fase do balanço de lado
    giro: Math.random() * Math.PI * 2,
    velocidadeGiro: (Math.random() - 0.5) * 0.25,
    cor: CONFETE_CORES[Math.floor(Math.random() * CONFETE_CORES.length)]
  };
}

// Atualiza a posição e desenha todos os pedaços; agenda outro frame enquanto ativa.
function atualizarConfete() {
  if (!confeteRodando) return;
  pincelConfete.clearRect(0, 0, telaConfete.width, telaConfete.height);

  for (let i = 0; i < confetes.length; i++) {
    const confete = confetes[i];
    confete.y += confete.velocidade;
    confete.balanco += 0.04;
    confete.x += Math.sin(confete.balanco) * 1.2;
    confete.giro += confete.velocidadeGiro;
    if (confete.y > telaConfete.height + 20) {
      confetes[i] = criarConfete(true); // saiu por baixo: reaparece acima da tela
    }

    pincelConfete.save();
    pincelConfete.translate(confete.x, confete.y);
    pincelConfete.rotate(confete.giro);
    pincelConfete.fillStyle = confete.cor;
    pincelConfete.fillRect(
      -confete.tamanho / 2,
      -confete.tamanho / 4,
      confete.tamanho,
      confete.tamanho / 2
    );
    pincelConfete.restore();
  }
  requestAnimationFrame(atualizarConfete);
}

// Dimensiona o canvas, cria a primeira leva e inicia a animação se ainda não roda.
function iniciarConfete() {
  telaConfete.width = window.innerWidth;
  telaConfete.height = window.innerHeight;
  telaConfete.style.display = 'block';
  confetes = [];
  for (let i = 0; i < CONFETE_QUANTIDADE; i++) confetes.push(criarConfete(false));
  if (!confeteRodando) {
    confeteRodando = true;
    atualizarConfete();
  }
}

// Interrompe a atualização e oculta o canvas da chuva de confete.
function pararConfete() {
  confeteRodando = false;
  telaConfete.style.display = 'none';
}