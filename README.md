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

## Contract deploy prerequisites
- Foundry (`forge`, `cast`, `anvil`)
- EVM wallet with NEON for Neon deployments
- NEON from the faucet for Neon devnet


### Configuration

```bash
cp .env.example .env
```

For local Anvil deploys, `.env.example` already includes the default Anvil private key as `PRIVATE_KEY_LOCAL`.

For Neon deploys, modify `.env` and set `PRIVATE_KEY` with the deployer wallet private key.

```bash
source .env
```

Endpoints:

- Local Anvil: `http://127.0.0.1:8545`, chain id `31337`
- Devnet: `https://devnet.neonevm.org`, chain id `245022926`
- Mainnet: `https://neon-proxy-mainnet.solana.p2p.org`, chain id `245022934`

### Build and test

```bash
forge build
forge test
```

### Deploy local with Anvil

Start Anvil in one terminal:

```bash
anvil
```

In another terminal, deploy using the default funded Anvil account:

```bash
source .env
PRIVATE_KEY=$PRIVATE_KEY_LOCAL forge script contracts/script/DeployGaIA.s.sol:DeployGaIA \
  --broadcast \
  --rpc-url local
```

### Deploy devnet

```bash
forge script contracts/script/DeployGaIA.s.sol:DeployGaIA \
  --broadcast \
  --rpc-url neon_devnet \
  --legacy \
  --skip-simulation
```

### Deploy mainnet

```bash
forge script contracts/script/DeployGaIA.s.sol:DeployGaIA \
  --broadcast \
  --rpc-url neon_mainnet \
  --legacy \
  --skip-simulation
```

`--legacy` e `--skip-simulation` are necessary with Neon EVM when using `forge script`.

### Verify on Blockscout devnet

```bash
forge verify-contract \
  --chain-id $CHAIN_ID_DEVNET \
  <CONTRACT_ADDRESS> \
  contracts/src/GaIA.sol:GaIA \
  --verifier-url $VERIFIER_URL_BLOCKSCOUT \
  --verifier blockscout
```
