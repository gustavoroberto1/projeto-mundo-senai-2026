# SENAI Arcade

Plataforma de jogos para visitantes do evento Mundo SENAI: identificação por nickname, menu com quatro jogos, simulação de partida, pontuações persistidas em PostgreSQL e um dashboard em tempo real (Socket.IO) para exibição em telão.

## Stack

- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem frameworks), servido pelo próprio backend.
- **Backend:** NestJS + TypeScript + Prisma ORM + PostgreSQL + Socket.IO + Swagger. Roda direto no host (Node.js), fora de container.
- **Infra:** Docker Compose só para o PostgreSQL.

O frontend é servido pelo NestJS na mesma origem da API (sem CORS, sem problemas de `sessionStorage` entre páginas).

## Estrutura do projeto

```text
PROJETO_MUNDO_SENAI/
├── frontend/
│   ├── index.html          # Menu principal (identificação + seleção de jogo)
│   ├── dashboard.html       # Painel em tempo real
│   ├── css/
│   ├── js/
│   │   ├── config.js        # URL base da API
│   │   ├── arcade-sdk.js    # SDK compartilhado para os jogos dos alunos
│   │   ├── app.js           # Lógica do menu
│   │   └── dashboard.js      # Lógica do dashboard + Socket.IO
│   └── games/demo/          # Simulação de jogo para validar a integração
│       ├── index.html / demo.js
│       └── exemplo-integracao.html  # Exemplo para os alunos
├── backend/
│   ├── src/{players,games,scores,dashboard,events,prisma}/
│   └── prisma/{schema.prisma, migrations, seed.ts}
├── docker-compose.yml   # só o PostgreSQL
├── .env.example
└── README.md
```

## Pré-requisitos

- Docker e Docker Compose (só para o PostgreSQL).
- Node.js 20+ e npm (para rodar o backend).

## Como executar

1. Suba apenas o banco de dados via Docker Compose:

```bash
cp .env.example .env
docker compose up -d postgres
```

Isso inicia só o PostgreSQL, com os dados persistidos no volume `senai_arcade_pgdata` (não são perdidos ao reiniciar ou parar o container).

2. Rode o backend direto no host:

```bash
cd backend
cp ../.env.example .env   # ajuste DATABASE_URL/PORT se necessário
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

O backend sobe em `http://localhost:3000` (ou na porta definida em `PORT`) e já serve o frontend a partir de `../frontend` — sem precisar de outro servidor para a parte estática.

Acesse:

- **Arcade (menu):** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard.html
- **Swagger (documentação da API):** http://localhost:3000/api/docs

Para parar o banco: `docker compose down` (sem `-v`, para manter os dados no volume).

> Se a porta `5432` já estiver em uso na sua máquina, defina `POSTGRES_PORT` no `.env` (e ajuste `DATABASE_URL` de acordo) antes de subir o compose.

## Acessar o dashboard pela rede local (no evento)

1. Descubra o IP da máquina que está rodando o backend na rede local (ex.: `ipconfig` no Windows, procure por "Endereço IPv4").
2. Em outro dispositivo na mesma rede, acesse `http://<IP-DA-MAQUINA>:3000/dashboard.html` (ou a porta configurada em `PORT`).
3. O mesmo vale para o menu do Arcade: `http://<IP-DA-MAQUINA>:3000`.

Não é necessária nenhuma configuração extra de CORS, pois tudo é servido pela mesma origem.

## Fluxo de uso

1. O visitante abre o Arcade e informa um nickname (único, sem distinção de maiúsculas/minúsculas ou espaços).
2. O menu mostra os quatro jogos e o melhor resultado do jogador em cada um (ou "Ainda não jogou").
3. Ao clicar em "Jogar agora", abre a simulação de partida (`frontend/games/demo`), que acumula uma pontuação fictícia por alguns segundos.
4. Ao finalizar, a pontuação é enviada para o backend (`POST /api/scores`), persistida no PostgreSQL e o dashboard é atualizado em tempo real via Socket.IO.
5. O jogador volta ao menu e vê o recorde atualizado; pode jogar outro jogo mantendo a mesma sessão.
6. Ao clicar em "Sair / Próximo jogador", a sessão do navegador é limpa e o modal de nickname volta a aparecer (os dados no banco não são apagados).

## Integração dos jogos dos estudantes

Veja [`frontend/games/demo/exemplo-integracao.html`](frontend/games/demo/exemplo-integracao.html) para um exemplo completo e comentado.

Resumo: cada jogo dos alunos deve ser servido a partir da mesma origem do Arcade (ex.: em `frontend/games/<nome-do-jogo>/`) e incluir:

```html
<script>
  window.SENAI_ARCADE_GAME_ID = "LIMBO"; // ID do jogo cadastrado no Arcade
</script>
<script src="../../js/config.js"></script>
<script src="../../js/arcade-sdk.js"></script>
```

E, ao final da partida:

```javascript
await salvarPontuacao(pontuacao, duracaoEmSegundos);
```

A função `salvarPontuacao` recupera automaticamente o jogador identificado no menu (via `sessionStorage`) e envia a pontuação para a API. Os alunos não precisam implementar cadastro, login, banco de dados ou WebSocket — apenas desenvolver o jogo e chamar essa função ao final.

## API (resumo)

Documentação interativa completa em `/api/docs` (Swagger).

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/players/identify` | Busca ou cria um jogador pelo nickname |
| GET | `/api/players/:id` | Consulta um jogador |
| GET | `/api/players/:id/records` | Melhor resultado do jogador em cada jogo |
| GET | `/api/games` | Lista os jogos disponíveis |
| GET | `/api/games/:id` | Consulta um jogo |
| GET | `/api/games/:id/leaderboard` | Ranking do jogo (melhor resultado de cada jogador) |
| POST | `/api/scores` | Registra uma nova partida |
| GET | `/api/scores` | Lista partidas (filtros: `gameId`, `playerId`; paginação: `page`, `pageSize`) |
| GET | `/api/dashboard/summary` | Indicadores gerais |
| GET | `/api/dashboard/rankings` | Top 10 de cada jogo |
| GET | `/api/dashboard/recent-scores` | Últimas partidas |

### Eventos Socket.IO (emitidos pelo backend)

- `score:created` — toda vez que uma partida é registrada.
- `record:updated` — quando a partida registrada é um novo recorde pessoal do jogador naquele jogo.

## Testes

```bash
cd backend
npm test
```

Cobrem os fluxos principais: identificação/normalização de nickname, registro de pontuação (jogador/jogo inexistente, detecção de novo recorde) e cálculo do leaderboard.

## Banco de dados

- Entidades: `Player`, `Game`, `GameScore` (ver `backend/prisma/schema.prisma`).
- Migrations: `backend/prisma/migrations`.
- Seed: `backend/prisma/seed.ts` — cadastra os quatro jogos e algumas pontuações fictícias (idempotente, pode rodar várias vezes).
- Cada partida gera um novo registro em `GameScore`; o recorde do jogador é sempre a maior pontuação entre seus registros (calculado em tempo real, nunca sobrescrito).
