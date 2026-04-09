# SupaChat — Conversational Analytics Platform

> Query your PostgreSQL analytics database using natural language. Get results as charts, tables, and summaries — all in a chatbot UI.

![Architecture](./docs/architecture.png)

---

## 🏗️ Architecture

```
                        ┌─────────────────────┐
                        │     User Browser     │
                        └──────────┬──────────┘
                                   │ :80
                        ┌──────────▼──────────┐
                        │    Nginx (Proxy)     │ gzip · caching · websocket
                        └──────┬──────┬───────┘
                     /         │      │        /api
            ┌────────▼──┐  ┌───▼──────▼──────┐
            │  Frontend  │  │    Backend API   │
            │  Next.js   │  │    Node.js       │
            │   :3000    │  │    :3001         │
            └────────────┘  └───────┬─────────┘
                                    │
                   ┌────────────────┤
                   │                │
          ┌────────▼──────┐  ┌──────▼────────┐
          │  OpenAI API   │  │  PostgreSQL    │
          │  (NL → SQL)   │  │  (Your DB URL) │
          └───────────────┘  └───────────────┘

Monitoring Stack:
  Prometheus → scrapes backend /metrics
  Grafana    → dashboards (port 4000)
  Loki       → centralized logs (port 3100)
  DevOps Agent → AI-powered health + RCA (port 4001)
```

---

## 📁 Repository Structure

```
TCS2/
├── .github/workflows/ # GitHub Actions CI/CD
├── backend/          # Node.js Express API
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/        chat.js, health.js
│   │   ├── services/      db.js, nlToSql.js, formatter.js
│   │   ├── middleware/    metrics.js
│   │   └── utils/         logger.js
│   └── Dockerfile
├── frontend/         # Next.js 14 + Recharts
│   ├── src/
│   │   ├── app/           page.tsx, layout.tsx, globals.css
│   │   ├── components/    ChatInterface, MessageBubble, ChartPanel, ResultsTable, QueryHistory
│   │   └── lib/           api.ts
│   └── Dockerfile
├── nginx/            # Reverse proxy
│   ├── nginx.conf
│   └── Dockerfile
├── prometheus/       # Metrics collection
│   ├── prometheus.yml
│   └── Dockerfile
├── grafana/          # Dashboards (pre-provisioned)
│   ├── provisioning/
│   │   ├── datasources/   datasources.yml (Prometheus + Loki)
│   │   └── dashboards/    supachat.json
│   └── Dockerfile
├── loki/             # Log aggregation
│   ├── loki-config.yaml
│   └── Dockerfile
├── devops-agent/     # 🤖 AI DevOps Agent (Bonus)
│   ├── src/agent.js
│   └── Dockerfile
├── promtail/         # Log collection agent
│   └── Dockerfile
├── docker-compose.yml  # Local testing
└── .env.example
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- PostgreSQL connection URL from your platform
- OpenAI-compatible API key

### 1. Clone & Configure

```bash
git clone <your-repo-url>
cd TCS2
cp .env.example .env
```

Edit `.env` with your real values:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 2. Run Everything

```bash
docker compose up --build
```

### 3. Access Services

| Service | URL | Notes |
|---------|-----|-------|
| **SupaChat App** | http://localhost | Main UI via Nginx |
| **Frontend** | http://localhost:3000 | Direct Next.js |
| **Backend API** | http://localhost:3001 | Direct Express |
| **Health Check** | http://localhost/health | JSON status |
| **Prometheus** | http://localhost:9090 | Metrics explorer |
| **Grafana** | http://localhost:4000 | admin / supachat123 |
| **Loki** | http://localhost:3100 | Log aggregation |
| **DevOps Agent** | http://localhost:4001 | AI diagnostics |

---

## 🧠 How It Works

### Natural Language → SQL Flow

```
User Query
    ↓
Backend /api/chat
    ↓
1. nlToSql.js → introspects DB schema dynamically
                → sends schema + query to OpenAI
                → receives SQL + chart type in JSON
    ↓
2. db.js → executes SQL via node-postgres (DATABASE_URL)
    ↓
3. formatter.js → routes result to text / table / chart format
    ↓
Frontend → renders MessageBubble with ChartPanel or ResultsTable
```

### Example Queries

```
"Show top trending topics in last 30 days"
"Compare article engagement by topic"
"Plot daily views trend for AI articles"
"Which articles have the highest read time?"
"Show total views per month this year"
```

---

## 🐳 Docker Images

Each service builds independently and pushes to GHCR via GitHub Actions workflows in `.github/workflows/`:

| Service | GHCR Image |
|---------|-----------|
| Backend | `ghcr.io/<owner>/supachat-backend` |
| Frontend | `ghcr.io/<owner>/supachat-frontend` |
| Nginx | `ghcr.io/<owner>/supachat-nginx` |
| Prometheus | `ghcr.io/<owner>/supachat-prometheus` |
| Grafana | `ghcr.io/<owner>/supachat-grafana` |
| Loki | `ghcr.io/<owner>/supachat-loki` |
| Promtail | `ghcr.io/<owner>/supachat-promtail` |
| DevOps Agent | `ghcr.io/<owner>/supachat-devops-agent` |

Tags: `latest` (main branch) + short SHA (every push)

---

## 🔁 CI/CD Pipeline

Each service has a dedicated workflow in `.github/workflows/` that triggers on changes to its folder:

```yaml
on:
  push:
    paths: ['backend/**']   # (or frontend/**, nginx/**, etc.)
    branches: [main]
```

**Pipeline steps:**
1. Checkout code
2. Set up Docker Buildx (multi-platform support)
3. Log in to GHCR with `GITHUB_TOKEN`
4. Extract metadata (SHA tag + `latest`)
5. Build & push with layer caching (`type=gha`)

**To trigger a manual build with custom tag:**
```
workflow_dispatch → input: tag = "v1.2.3"
```

---

## 🌐 Nginx Configuration

```nginx
location /api  →  backend:3001   # API proxy
location /     →  frontend:3000  # Frontend SPA
```

**Features enabled:**
- `gzip on` — compresses text, JSON, JS, CSS
- Static asset cache headers (`expires 1y`)
- WebSocket upgrade headers (`Connection: upgrade`)
- Security headers (X-Frame-Options, X-Content-Type-Options)
- `/nginx-health` endpoint for load balancer checks

---

## 📊 Monitoring & Dashboards

### Prometheus Metrics (from backend)
| Metric | Description |
|--------|-------------|
| `supachat_chat_requests_total` | Total chats, labelled by status |
| `supachat_chat_duration_seconds` | Histogram of query latency |
| `supachat_http_request_duration_seconds` | Per-route HTTP latency |
| `process_cpu_seconds_total` | Node.js CPU |
| `process_resident_memory_bytes` | Node.js memory |

### Grafana Dashboard (auto-provisioned)
- Chat request rate (req/s)
- Query latency p50 / p95
- CPU & memory usage
- Live backend logs from Loki

**Login:** http://localhost:4000 → `admin` / `supachat123`

---

## 🤖 DevOps Agent (Bonus)

The AI-powered DevOps agent runs on port 4001 and:

- **Polls health** of all services every 60s
- **Fetches Loki logs** on failure
- **Runs OpenAI RCA** — root cause + remediation steps
- **Stores incident history** in memory

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/status` | GET | Health of all services |
| `/agent/incidents` | GET | Last 20 AI-analyzed incidents |
| `/agent/diagnose` | POST `{"service":"backend"}` | On-demand diagnosis |
| `/agent/logs/:service` | GET | Recent Loki logs for a service |

---

## 🌐 Wrexer.com Deployment

This guide outlines how to deploy the 8 SupaChat services to Wrexer.com using their internal IPs for connectivity and public URLs for entry points.

### How Networking Works on Wrexer (Traefik)

Wrexer uses **Traefik** to handle incoming internet traffic. Here is the deal with ports:

1. **Public/External (Internet)**: Traefik automatically maps your apps to **443 (HTTPS)** and **80 (HTTP)**. You don't have to do anything here.
2. **Internal (Service-to-Service)**: Within the Wrexer network, your containers still listen on their "original" ports (the ones in the `EXPOSE` line of the Dockerfiles).
    - **Backend**: `3001`
    - **Loki**: `3100`
    - **Prometheus**: `9090`
    - **Grafana**: `3000`
    - **DevOps Agent**: `4001`
3. **The "Basically Nothing" Part**: For the public internet, you don't need to configure anything. But for the **internal connections**, you must set the environment variables so the services can discover each other.

### Deployment Step-by-Step

#### 1. PostgreSQL (Wrexer Managed)
- **Status**: Launch first or use existing.
- **Connection String**: `postgres://u_...`
- **Action**: Note the full connection string and set `DATABASE_SSL=false` in the Backend.

#### 2. Loki & Prometheus
- **Status**: Early dependencies.
- **Action**: Note internal IPs (e.g., `10.43.x.x`).

#### 3. Backend & Frontend
- **Backend Env**: `DATABASE_URL`, `DATABASE_SSL=false`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`.
- **Frontend**: Standard deployment.

#### 4. Nginx (Entry Point)
- **Env Vars**: `FRONTEND_UPSTREAM`, `BACKEND_UPSTREAM` (Use internal IPs).
- **Public URL**: Point your domain here.

#### 5. Grafana & DevOps Agent
- **Grafana Env**: `PROMETHEUS_URL`, `LOKI_URL`.
- **Agent Env**: URLs for all services, `OPENAI_API_KEY`.

---

## 🔁 CI/CD Pipeline

---

## 🛠️ AI Tools Used

| Tool | Usage |
|------|-------|
| **Antigravity (Google DeepMind)** | Full project scaffolding, code generation, architecture design |
| **OpenAI GPT-4o-mini** | NL→SQL translation at runtime |
| **OpenAI GPT-4o-mini** | DevOps agent log summarization & RCA |

---

## 🗄️ Database Setup

SupaChat introspects your database schema automatically via:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
```

For a **demo blog analytics schema**, run this in your database:

```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT,
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  read_time_minutes INT
);

CREATE TABLE article_views (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES articles(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  device TEXT
);

CREATE TABLE article_engagement (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES articles(id),
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sample data
INSERT INTO articles (title, topic, author, read_time_minutes)
VALUES
  ('Getting Started with AI', 'AI', 'Alice', 5),
  ('Docker Deep Dive', 'DevOps', 'Bob', 8),
  ('React Performance Tips', 'Frontend', 'Carol', 4),
  ('PostgreSQL Indexing', 'Database', 'Dave', 6),
  ('Kubernetes vs Docker Swarm', 'DevOps', 'Eve', 10);
```

---

## 📝 License

MIT
