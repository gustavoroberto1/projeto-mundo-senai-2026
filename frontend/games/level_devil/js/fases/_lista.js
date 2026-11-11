// =====================================================================
//  LISTA DE FASES  (carregue este arquivo ANTES dos arquivos faseXX.js)
//
//  COMO CRIAR UMA FASE NOVA:
//   1) copie um arquivo faseXX.js e dê outro nome (ex: fase21.js)
//   2) mude o conteúdo dentro do FASES.push({ ... });
//   3) adicione a linha <script src="js/fases/fase21.js"></script> no index.html
//      (a ordem das linhas no index.html é a ordem das fases no jogo)
//
//  Campos da fase (todos opcionais, menos "nome"):
//    nome        texto que aparece no topo da tela
//    inicio      { x, y } onde o jogador nasce            (padrão: x 40, y 350)
//    porta       { x, y, foge }                           (padrão: x 730, y 350)
//                  foge = lista de lugares pra onde a porta pula
//                  quando o jogador chega perto. Ex: [ { x: 150, y: 350 } ]
//    plataformas lista de { x, y, largura, altura }       (padrão: chão inteiro)
//    armadilhas  lista de armadilhas (cada tipo está explicado na pasta js/armadilhas)
//    inimigos    lista de { tipo, x, y } com tipo 'voador', 'corredor' ou 'suicida'
//                x e y sao o canto superior esquerdo do inimigo.
//                Voador: distanciaPatrulha, limiteEsquerdo, limiteDireito,
//                        intervaloDisparo, velocidadeProjetil e direcaoDisparo
//                        ('jogador' ou 'frenteBaixo').
//                Corredor: velocidade e direcao (-1 ou 1); y deve alinhar os pes
//                          do inimigo ao topo da plataforma.
//                Suicida (a bomba): raioDeteccao (ela acorda quando o gato chega a esta distancia),
//                         tempoExplosao (frames de pavio depois de ENCOSTAR no gato) e
//                         tamanhoBloco (padrao 40px; a explosao tem 2 blocos de raio).
//                         Ela nao atravessa paredes e so explode depois de encostar no gato.
//    quantidadeInimigos total de inimigos da fase (padrao: sorteado entre INIMIGOS_MINIMO_POR_FASE e
//                     INIMIGOS_MAXIMO_POR_FASE; nunca passa de INIMIGOS_MAXIMO_POR_FASE = 5, mesmo se escrever mais;
//                     e nunca mais que INIMIGOS_MAXIMO_DO_MESMO_TIPO = 2 do mesmo tipo)
//    limiteInimigosAtivos máximo simultâneo (padrão: LIMITE_INIMIGOS_ATIVOS = 5)
//    tiposInimigos lista opcional de tipos permitidos na geracao procedural
//                     (ex.: ['voador']); por padrao depende da progressao da fase.
//    spawnAleatorioInimigos false desativa geracao; habilitada, quantidade,
//                              tipos e posicoes dos inimigos sao sorteados
//                              a cada fase, limitados ao teto de 5 inimigos.
//                Voadores ficam na metade superior, afastados de plataformas.
//    permitirSobreposicaoInimigos true permite sobrepor inimigos (use com cautela).
//    invertida   true = setas invertidas
//    escuro      true = só dá pra ver perto do jogador
//    gravidade   (padrão 0.6)      pulo   (padrão 11)
//    velocidade  quão rápido o jogador anda (padrão 4)
//    agachado    true = o gato fica agachado a fase inteira (hitbox menor)
//    podeAgachar true = o jogador agacha segurando Shift (TECLA_AGACHAR no config.js)
//    cenario     imagem de fundo desta fase (padrão: CENARIO_PADRAO do config.js)
//                Ex: cenario: 'img/cenario/caverna.jpg'
//
//    Nas plataformas, estilo: 'pedra' desenha um bloco de pedra em vez de terra com grama
//    (bom pra tetos baixos). Ex: { x: 300, y: 300, largura: 220, altura: 78, estilo: 'pedra' }
//
//  Dica de física: o pulo normal alcança uns 95px de altura e 144px de distância.
// =====================================================================
const FASES = [];
