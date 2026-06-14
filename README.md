# ga.ia

> Intelligent landslide risk monitoring system for Terna's electrical grid infrastructure.
> Powered by Solana, Solana Agent Kit, and OpenAI.

by NapulETH 2025 3-voting creators:
Simone Montella, Alberto Petillo, Valerio Conte

**Ctrl/Shift Hackathon 2026** 

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10 | bundled with Node |
| Solana CLI | latest | `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` |

---

### 1. Configure the AI Agent

```bash
cd agent
cp .env.example .env
```

Open `agent/.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-...your-key-here...
RPC_URL=http://127.0.0.1:8899
```

Install dependencies (already done if you cloned fresh):

```bash
npm install
```

---

### 2. Run — three terminals

#### Terminal 1 — Solana localnet *(optional, for on-chain mode)*

```bash
solana-test-validator
```

> Skip this if you only want to use mock data mode.

#### Terminal 2 — ga.ia AI Agent API

```bash
cd agent
npm start
```

You should see:

```
🚀 ga.ia Agent API — http://localhost:3001
📡 Solana RPC:   http://127.0.0.1:8899 — ✔ reachable (slot #xxxx)
🔑 OpenAI:       ✔ loaded
⚙️  Mode:         MOCK (set USE_MOCK=false to use Solana)
```

#### Terminal 3 — Frontend Dashboard

```bash
cd frontend
npm run dev
```

Open **[http://localhost:5174](http://localhost:5174)** in your browser.

---

## Agent API Reference

Base URL: `http://localhost:3001`

```
GET  /api/status              → Solana + OpenAI health check
GET  /api/towers              → Tower list from active source
POST /api/mode                → { mode: "mock" | "onchain" }
GET  /api/summarize           → AI executive summary of all towers
POST /api/explain             → { towerId: "T-014" }
POST /api/report              → { towerId: "T-014" }
POST /api/chat                → { message: "Which towers are critical?" }
```