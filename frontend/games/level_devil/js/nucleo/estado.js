// =====================================================================
//  VARIÁVEIS DO JOGO (mudam enquanto o jogo roda)
// =====================================================================
let fase;                   // cópia mutável das configurações da fase atual
let numeroFase;             // índice da fase em FASES; começa em 0 para a fase 1
let jogador;                // estado do gato: posição, tamanho, velocidades e estados de movimento
let apelido;                // nome informado pelo jogador na tela inicial
let pontosTotais;           // pontuação acumulada durante a partida
let pontosInimigosPendentes = 0; // pontos por inimigos derrotados, somados ao concluir a fase
let mortesTotais;           // mortes acumuladas durante a partida
let mortesNaFase;           // mortes na fase atual, usadas no cálculo da pontuação dela
let inicioDaFase;           // instante de início usado para calcular o tempo da fase
let jogando = false;        // indica se a partida está ativa
let faseIniciada = false;   // fase em andamento; false mantém inimigos e armadilhas congelados
let congeladoDesde = 0;     // instante em que a fase congelou, para excluir essa pausa do tempo


// Estado de cada tecla: true enquanto pressionada e false ao soltar.
const teclas = {};