## 🚀 Desafio Full-Stack GDASH 2025/02

Este repositório contém a solução proposta para o desafio GDASH, que consiste em uma aplicação *full-stack* moderna e distribuída para monitoramento climático em tempo real, incluindo coleta de dados, processamento via fila, persistência em banco de dados, API de insights (via sistema de regras) e um dashboard interativo.

<br>

-----

## 🧭 Arquitetura do Sistema

A arquitetura é dividida em seis serviços principais orquestrados pelo Docker Compose, implementando o pipeline de dados:

**Python (Collector) → RabbitMQ (Fila) → Go (Worker) → NestJS (API) → MongoDB (DB) → React (Frontend)**

| Serviço | Tecnologia | Função |
| :--- | :--- | :--- |
| `collector` | Python | Coleta dados climáticos (temperatura, umidade, vento) da Open-Meteo e envia para a fila RabbitMQ. |
| `rabbitmq` | RabbitMQ | Message broker para desacoplar a coleta do processamento. |
| `worker` | Go | Consome dados da fila, realiza validação básica e envia via `POST` para o endpoint da API NestJS. Implementa retry na conexão inicial. |
| `api` | NestJS (TS) | Backend do sistema. Armazena dados no MongoDB, gerencia autenticação (JWT) e fornece endpoints para logs, insights e exportação. |
| `mongodb` | MongoDB | Banco de dados NoSQL para persistir os logs de clima e dados de usuário. |
| `frontend` | React + TS | Interface do usuário (Dashboard) para exibir dados em tempo real, insights e gerenciar a autenticação. |
| `mongo-express` | Node.js | Interface web para gerenciar o MongoDB. |

<br>

-----

## ✅ Status da Implementação

O projeto implementa o fluxo completo de dados e as funcionalidades de autenticação e dashboard.

| Requisito | Status | Detalhes da Implementação |
| :--- | :--- | :--- |
| **Pipeline de Dados** | ✅ Completo | **Python** coleta dados a cada **30 segundos** e envia para a fila `weather_data`. **Worker em Go** consome e persiste em `POST /weather`. |
| **API: Armazenamento** | ✅ Completo | NestJS + Mongoose salva no MongoDB na coleção `weather_logs`. |
| **API: Autenticação** | ✅ Completo | JWT implementado com `admin / admin123` como usuário padrão (criado em `UsersService.onModuleInit`). |
| **API: Insights de IA** | ⚠️ Parcial | Implementado em `GET /weather/insights` como um **Sistema de Regras (Expert System)** simples, que analisa os dados mais recentes (ex: `temp_c > 30` -\> "Calor extremo detectado\!") para gerar alertas e resumos. |
| **API: Exportação** | ✅ CSV | `GET /weather/export` exporta os últimos 1000 logs em formato CSV. **XLSX não implementado.** |
| **Frontend** | ✅ Completo | Dashboard em React/Tailwind/TS com login/logout, cards de dados em tempo real, tabela dos últimos logs e botão de download CSV. |
| **CRUD de Usuários** | ❌ Não implementado | Apenas a criação do usuário padrão e a lógica de autenticação estão prontas. As rotas para CRUD (listar, criar, editar, remover) de usuários não foram criadas. |
| **API Pública Paginada (Opcional)** | ❌ Não implementado | Este requisito opcional foi deixado de lado para focar nos pilares obrigatórios. |

<br>

-----

## 🛠️ Configuração e Execução

O projeto é configurado para ser executado integralmente com Docker Compose.

### Pré-requisitos

1.  **Docker** (Engine e Daemon)
2.  **Docker Compose**

### 1\. Iniciar a Aplicação

1.  Na raiz do projeto (`miguelma3/desafio-gdash-2025-02/desafio-gdash-2025-02-dev/`), execute o comando:

    ```bash
    docker-compose up --build -d
    ```

    > O comando `--build` garante que as imagens locais do `api`, `worker`, `collector` e `frontend` serão construídas corretamente.

2.  Acompanhe os logs iniciais para verificar o startup dos serviços (pode demorar um pouco, especialmente o worker Go aguardando o RabbitMQ).

    ```bash
    docker-compose logs -f
    ```

### 2\. Verificar Status e Acesso

Os serviços estarão acessíveis nas seguintes URLs:

| Serviço | URL | Notas |
| :--- | :--- | :--- |
| **Frontend (Dashboard)** | `http://localhost:5173` | Interface principal para monitoramento. |
| **API Backend (NestJS)** | `http://localhost:3000` | Base para as rotas de dados. |
| **RabbitMQ Management** | `http://localhost:15672` | Interface web do RabbitMQ. (User: `user`, Pass: `password`) |
| **Mongo Express** | `http://localhost:8081` | Interface web para o MongoDB. |

### 3\. Credenciais de Acesso

Use as seguintes credenciais para acessar o Dashboard:

| Tipo | Usuário | Senha |
| :--- | :--- | :--- |
| **Usuário Padrão (API/Frontend)** | `admin` | `admin123` |
| **RabbitMQ** | `user` | `password` |

> 💡 O usuário padrão (`admin`/`admin123`) é criado automaticamente no serviço `api` na primeira inicialização, se não existir.

<br>

-----

## 💻 Detalhes por Serviço

### Weather Collector (Python)

  * **Arquivo Principal:** `weather-collector/main.py`
  * **Ação:** Busca dados de clima para Latitude `-25.52` e Longitude `-48.51` (Paranaguá - PR) a cada **30 segundos** e envia para a fila RabbitMQ (`weather_data`).
  * **Dependências:** `requests`, `pika`, `python-dotenv`.
  * **Variáveis de Ambiente (ver `weather-collector/.env.example`):**
    ```env
    RABBITMQ_HOST=rabbitmq # Host do serviço Docker
    RABBITMQ_PORT=5672
    RABBITMQ_USER=user
    RABBITMQ_PASS=password
    QUEUE_NAME=weather_data
    LATITUDE=-25.52
    LONGITUDE=-48.51
    ```

### Weather Worker (Go)

  * **Arquivo Principal:** `weather-worker/main.go`
  * **Ação:** Conecta-se ao RabbitMQ (`rabbitmq:5672`), consome mensagens da fila `weather_data` e faz uma requisição `POST` para a API NestJS em `http://weather-api:3000/weather` com o JSON do payload. Inclui 5 tentativas de conexão ao RabbitMQ.
  * **Dependências:** `github.com/rabbitmq/amqp091-go`
  * **Variáveis de Ambiente:**
    ```env
    RABBITMQ_URL=amqp://user:password@rabbitmq:5672/
    ```

### Weather API (NestJS)

  * **Tecnologia:** NestJS (TypeScript).
  * **Porta:** `3000`.
  * **Rotas Implementadas:**
      * `POST /weather`: Recebe dados do worker Go e salva no MongoDB. (Não requer autenticação).
      * `GET /weather`: Lista os últimos 100 logs de clima. (Não requer autenticação).
      * `POST /auth/login`: Autenticação, retorna um JWT.
      * `GET /weather/insights`: **Protegido por JWT**. Retorna insights de IA (Sistema de Regras).
      * `GET /weather/export`: Exporta dados em CSV. (Não requer autenticação - **Ver observação abaixo**).

### Frontend (React)

  * **Tecnologia:** React + Vite + Tailwind CSS.
  * **Porta:** `5173`.
  * **Ação:** Apresenta o Dashboard, com atualização em **polling a cada 5 segundos** para os dados e insights, utilizando o token JWT do usuário logado para as requisições protegidas.

<br>

-----

## ⚠️ Observação sobre o Endpoint CSV

O endpoint de exportação de CSV (`GET /weather/export`) está atualmente **sem proteção JWT** no `weather.controller.ts`:

```typescript
// weather.controller.ts
// ...
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clima_log.csv"')
  async exportCsv(@Res() res: Response) {
// ...
```

**Para corrigir a falha de segurança e proteger a rota**, seria necessário adicionar o guard JWT, como feito na rota `/insights`:

```typescript
// Correção Sugerida:
// ...
  @UseGuards(AuthGuard('jwt')) // Adicionar proteção JWT
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="clima_log.csv"')
  async exportCsv(@Res() res: Response) {
// ...
```

Isso mostra a necessidade de testes de segurança e validação para garantir que todas as rotas de dados sensíveis (que não sejam abertas para o coletor/worker) estejam devidamente protegidas pela autenticação do usuário.