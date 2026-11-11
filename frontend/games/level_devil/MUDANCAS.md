# O que mudou nesta versão

## De onde veio cada coisa
O seu repositório tinha duas linhas de trabalho separadas:
- `main` (commit "Ataques"): a **espada** (clique esquerdo, direções) e o **dash**.
- commit `654e2ab` ("Inimigos"): os **inimigos** (voador, corredor, suicida), o spawn aleatório com fila e um ataque circular simples.

Esta versão junta as duas: **os inimigos são os seus** (mesmo código, mesmos números, mesmo sorteio)
e a **espada** da `main` agora acerta eles.

## Espada x inimigos (o que você pediu)
- Novo `js/combate/combate.js`: golpe de espada que encosta num inimigo remove ele na hora (1 de vida, como no seu código).
- Voador some junto com os tiros dele. Suicida morto antes de explodir não explode (nem na contagem).
- Inimigo removido abre vaga e o próximo da fila entra (igual ao seu `atacarInimigosNaArea`).
- Ordem no frame: o golpe é resolvido **antes** de checar se o gato morreu, então acertar a tempo salva o gato.
- Golpe pra baixo acertando inimigo com o gato no ar dá um quique (`ESPADA_FATOR_POGO`, 0 desliga).
- O **ataque circular** do commit "Inimigos" foi substituído pela espada (os dois usavam o mesmo clique).
  O código dele (`RAIO_ATAQUE_JOGADOR`, `atacarInimigosNaArea`, `tempoAtaque`) saiu.

## Quantidade de inimigos e tiros (segunda rodada)
- **Quantidade sorteada**: a cada vez que a fase carrega, nascem de `INIMIGOS_MINIMO_POR_FASE` (1) a `INIMIGOS_MAXIMO_POR_FASE` (5) inimigos.
  Antes a quantidade crescia com o nível (1 a cada 3 fases, até 7).
- **Teto de 5 por fase**: vale pro total (os escritos à mão também). Como o total da fase não passa de 5, acabou o fluxo "infinito" de inimigos entrando da fila.
- Na **fase 1** tirei só a linha `quantidadeInimigos: 1000` do seu commit (com o teto ela daria sempre 5). O resto da config de teste continua.
- **A espada destrói os tiros dos voadores**: golpe que encosta no tiro faz ele sumir antes de acertar o gato (`destruirProjeteisAtingidos` no `combate.js`).
  Funciona pra qualquer inimigo que guarde tiros em `inimigo.projeteis`.

## Tiro do voador (terceira rodada)
- Voador solta **um tiro por vez, mirado no gato** (`direcaoDisparo: 'jogador'`, que já era o padrão).
  O que espalhava tiros era a linha `direcaoDisparoInimigos: 'lequeBaixo'` da fase 1 (do seu commit): tirei ela.
  O modo `lequeBaixo` continua existindo no `voador.js`, mas só aparece se alguma fase pedir.

## Alcance da espada e fase parada (quarta rodada)
- **Alcance maior** (`config.js`, seção Espada): pro lado 58 -> **90** (altura 34 -> 50); pra cima/baixo 58 -> **80** (largura 34 -> 44).
  O desenho da espada estica sozinho pra acompanhar, então o que você vê é o que acerta.
- **A fase só começa quando o gato se mexer**: ao carregar a fase (e depois de morrer ou apertar R) inimigos, tiros e armadilhas ficam parados
  e o relógio não anda; aparece "Mexa-se para começar". Contam como "se mexer": andar, pular, dash, agachar e bater com a espada.
  O tempo parado não entra nos pontos. `CONGELAR_AO_RENASCER = false` faz só a primeira vez parar.
  As armadilhas também ficam paradas (não só os mobs), porque senão a fase "começaria" sem o gato.

## No máximo 2 do mesmo mob por fase (quinta rodada)
- Novo `INIMIGOS_MAXIMO_DO_MESMO_TIPO = 2` no `config.js`. Vale pros sorteados e pros escritos à mão na fase (os primeiros da lista ficam).
- Consequência: fases com poucos tipos de mob têm menos inimigos. Só corredor (fases 1-2) = no máximo 2; corredor + voador (3-5) = no máximo 4;
  a partir da 6 (três tipos) chega ao teto de 5. A fase 1 (só voador) = no máximo 2.
- Em fases pequenas, como a 8, às vezes não cabe um inimigo a mais com segurança: o jogo avisa no console e a fase nasce com menos.
  (Isso já existia no seu código, só aparece mais porque agora o sorteio vai até 5.)

## Seus inimigos, organizados
O `personagens/inimigos.js` (363 linhas) foi dividido em `js/inimigos/`:
- `_registro.js`: registrar tipos, atualizar, desenhar, remover, resetar, "inimigo matou o gato".
- `geracao.js`: gerar inimigos aleatórios, fila, limite de ativos, posição segura do voador.
- `corredor.js`, `voador.js`, `suicida.js`: um arquivo por tipo (antes `inimigoCorredor.js` etc. dentro de `personagens/`).
A lógica de cada tipo não mudou. Na primeira rodada conferi rodando o seu commit e esta versão lado a lado com o mesmo sorteio:
10 fases x 3 sorteios x 400 frames, posição, tiros, contagem de explosão e fila idênticos (antes de eu trocar a regra de quantidade).
- Todo número solto virou constante no `config.js`: `INIMIGO_TAMANHOS`, `VELOCIDADE_VOADOR/CORREDOR/SUICIDA`,
  `INTERVALO_DISPARO_*`, `INIMIGOS_MAXIMO_POR_FASE`, `NIVEL_VOADOR_APARECE`, `NIVEL_SUICIDA_APARECE`, `SPAWN_*`...

## Única diferença de comportamento nos inimigos
O suicida era **sorteado** como se tivesse 20px de largura (`TAMANHOS_INIMIGOS`), mas **nascia** com 26px (`preparar`).
Agora os dois usam 26px (`INIMIGO_TAMANHOS.suicida`). Na prática: ele pode nascer uns pixels mais longe da borda das plataformas.
Se preferir como era, troque pra 20 no config (mas aí ele nasce com 20px de largura).

## Bugs corrigidos
- A **hitbox da espada pro lado ficava ~12px mais baixa** que o desenho dela. Agora as duas usam a mesma altura (`ESPADA_ALTURA_CENTRO`).
- O golpe em andamento **não era cancelado** quando o gato morria ou a fase reiniciava.
- Comentários/docs erravam valores: "anda a 70%" (é 40%), "18px agachado" (é 22px), e "S ou seta pra baixo pra agachar" (é **Shift**).
- `README.md` estava em UTF-16 (quebrado no GitHub): agora é UTF-8.
- O menu não falava de Shift, Q (dash) nem espada: agora fala.

## Organização geral
- `config.js` dividido em seções (tela, física, pontuação, gato, dash, espada, inimigos). Dash virou `DASH_*`, espada `ESPADA_*`.
- O dash saiu de dentro do `moverJogador` e virou a função `atualizarDash` (mesmo comportamento).
- `ataqueEspada` virou `espada`; `qAnterior` virou `dashTeclaAnterior`.
- Novas pastas `js/combate/` e `js/inimigos/`. O `index.html` está numerado na ordem de carregamento.

## O que mantive igual ao seu commit "Inimigos" (confira se é isso mesmo que quer)
- **Fase 1** com só voadores, sobreposição liberada e porta fugindo: parece configuração de teste.
- Atalho **Ctrl+F1** que passa de fase (`teclado.js`).
- Inimigos derrotados **não voltam** quando o gato morre (só os que sobraram voltam ao começo).
- Fases 24-26 que eu tinha criado com inimigos inventados foram **removidas**.

## A bomba (inimigo suicida) com o personagem novo
- O inimigo que explode (`suicida`) agora usa o personagem do vídeo: **bomba com pavio**. Os desenhos saíram do vídeo e ficaram em
  `img/inimigos/bomba/` (`pavio1..4.png` = dormindo, perseguindo e pavio queimando; `explosao.png` = a explosão).
- **Não atravessa mais paredes**: ela se move com colisão (`moverInimigoComColisao`, no `suicida.js`) contra plataformas e armadilhas sólidas
  (chão que some, parede...), escorregando nelas. Se o caminho estiver fechado, ela fica presa do outro lado.
- **Ativa pela distância**: fica parada e dormindo até o gato chegar a `BOMBA_RAIO_ATIVACAO` px dela (centro a centro, padrão 180);
  aí o desenho muda e ela começa a perseguir. Pode mudar por inimigo com `raioDeteccao`.
- **Só explode depois de encostar no gato**: o gatilho por proximidade (`distanciaExplosao`) foi removido. Ao encostar, o pavio queima por
  `BOMBA_TEMPO_PAVIO` frames (30) e então explode; `0` explode na hora. Dá pra fugir correndo ou acertar ela com a espada nesse intervalo.
- **Bug corrigido**: a explosão era removida no mesmo frame em que acontecia, então o flash nunca aparecia. Agora o desenho da explosão
  dura `BOMBA_DURACAO_EXPLOSAO` frames (14) e a bomba some depois (novo gancho `animar` no `_registro.js`, que roda até com o gato morrendo).
  A espada ignora a bomba que já explodiu (`ignorarEspada`).
- Tamanho da caixa de colisão da bomba: 26 -> 28 px (`INIMIGO_TAMANHOS.suicida`), pra bater com o corpo redondo do desenho.
- Novas constantes no `config.js`: `BOMBA_RAIO_ATIVACAO`, `BOMBA_TEMPO_PAVIO`, `BOMBA_DURACAO_EXPLOSAO`.
- Testado no Chromium (Playwright): dormir longe, acordar no raio, pavio só acende ao encostar, parede e plataforma bloqueiam,
  explosão mata uma vez só, dá pra fugir e dar espada durante o pavio, reset ao morrer; e as 23 fases x 3 rodadas sem erro nem imagem faltando.

## Como foi testado
Rodei o jogo sem navegador (Node com DOM falso): as 23 fases rodam 400 frames com entradas aleatórias (andar, pular, dash, espada) sem erro;
testes automáticos de espada x corredor/voador/suicida (golpe de lado, cima, baixo/quique, suicida na contagem, tiros, fila, respawn, golpe cancelado ao morrer);
a comparação com o seu commit descrita acima, a contagem de inimigos (3450 cargas de fase: nunca passou de 5 no total nem de 2 do mesmo tipo, variou de 1 a 5, nem toda fase com 5)
um teste em todas as fases (parado 90 frames = nada muda), o alcance novo da espada e um teste em que o gato fica parado levando tiro: sem espada morre em ~1,4s, rebatendo com a espada sobrevive 400 frames. **Não abri no navegador de verdade**: vale jogar e ajustar os números do `config.js`.
