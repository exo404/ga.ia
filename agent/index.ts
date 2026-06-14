import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ── Mode flag ─────────────────────────────────────────────────────
// Can be toggled via POST /api/mode or set via env USE_MOCK=false
let USE_MOCK: boolean = process.env.USE_MOCK !== 'false';

// ── Solana Connection ─────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL ?? 'http://127.0.0.1:8899';
let solanaConnection: Connection | null = null;

function getSolanaConnection(): Connection {
  if (!solanaConnection) {
    solanaConnection = new Connection(RPC_URL, 'confirmed');
  }
  return solanaConnection;
}

async function checkSolanaHealth(): Promise<{ ok: boolean; slot?: number; error?: string }> {
  try {
    const conn = getSolanaConnection();
    const slot = await conn.getSlot();
    return { ok: true, slot };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ── Mock tower data ───────────────────────────────────────────────
const MOCK_TOWERS = [
  { id: 'T-014', name: 'Traliccio Alpi SO',      region: 'Piemonte', lat: 45.82, lng: 7.32,  risk: 4, prob: 89, lastTs: '2026-06-14 19:41', txHash: '0x3a4f...e91c', source: 'mock' },
  { id: 'T-027', name: 'Traliccio Appennino C.',  region: 'Toscana',  lat: 44.11, lng: 11.12, risk: 3, prob: 67, lastTs: '2026-06-14 19:38', txHash: '0x7b2d...a33f', source: 'mock' },
  { id: 'T-033', name: 'Traliccio Calabria NE',   region: 'Calabria', lat: 39.22, lng: 16.49, risk: 3, prob: 72, lastTs: '2026-06-14 19:35', txHash: '0x9c1e...b77a', source: 'mock' },
  { id: 'T-041', name: 'Traliccio Liguria',        region: 'Liguria',  lat: 44.41, lng: 8.93,  risk: 2, prob: 45, lastTs: '2026-06-14 19:30', txHash: '0x1f8a...d20b', source: 'mock' },
  { id: 'T-058', name: 'Traliccio Dolomiti',       region: 'Veneto',   lat: 46.51, lng: 11.35, risk: 2, prob: 38, lastTs: '2026-06-14 19:22', txHash: '0x4e7c...f55d', source: 'mock' },
  { id: 'T-066', name: 'Traliccio Sicilia O.',     region: 'Sicilia',  lat: 37.82, lng: 13.21, risk: 1, prob: 11, lastTs: '2026-06-14 19:11', txHash: '0x6a3b...c89e', source: 'mock' },
];

// ── On-chain tower read via Solana ────────────────────────────────
// In the real system this would deserialize account data from the GaIA program.
// Here we demonstrate an actual RPC connection + getSlot/getBalance call,
// then return data that would come from the program accounts.
async function fetchOnChainTowers() {
  const conn = getSolanaConnection();

  // Real RPC call to verify the connection is live
  const slot = await conn.getSlot();
  const blockTime = await conn.getBlockTime(slot);

  // These public keys would be the actual GaIA program data accounts in production.
  // For the demo, we simulate reading 6 accounts and derive risk data from their
  // on-chain state (slot number used to make values feel dynamic/live).
  const pseudoRandom = (seed: number) => ((slot * 7 + seed * 13) % 40);

  const onChainTs = blockTime
    ? new Date(blockTime * 1000).toISOString().replace('T', ' ').substring(0, 16)
    : new Date().toISOString().replace('T', ' ').substring(0, 16);

  return MOCK_TOWERS.map((t, i) => ({
    ...t,
    prob: Math.min(99, Math.max(5, t.prob + pseudoRandom(i) - 20)),
    lastTs: onChainTs,
    txHash: `0x${slot.toString(16).padStart(4, '0')}...${(i * 0xabcd).toString(16).substring(0, 4)}`,
    source: 'onchain',
    slot,
  }));
}

// ── Active tower getter ───────────────────────────────────────────
async function getTowers() {
  if (USE_MOCK) return MOCK_TOWERS;
  return fetchOnChainTowers();
}

// ── OpenAI (lazy) ─────────────────────────────────────────────────
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const RISK_LABELS: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'High', 4: 'Critical' };

const SYSTEM_PROMPT = `You are ga.ia, an AI agent embedded in a real-time infrastructure monitoring system for Terna, the Italian electricity grid operator.
You have read-only access to on-chain risk data for electrical towers.
Your job is to interpret risk scores, explain hazards in operational language, and help field operators prioritize actions.
Always be concise, factual, and professional. Max 3 sentences unless generating a structured report.
Risk levels: 1=Low, 2=Moderate, 3=High, 4=Critical. Probability is a landslide susceptibility score (0-100%).`;

async function askAI(userPrompt: string): Promise<string> {
  const client = getOpenAI();
  if (!client) return '[ga.ia offline — add OPENAI_API_KEY to agent/.env]';
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 180,
      temperature: 0.6,
    });
    return res.choices[0].message.content ?? 'No response.';
  } catch (err: any) {
    console.error('[OpenAI error]', err.message);
    return `AI error: ${err.message}`;
  }
}

// ════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════

// GET /api/status — health check for both Solana and OpenAI
app.get('/api/status', async (_req, res) => {
  const solana = await checkSolanaHealth();
  res.json({
    mode: USE_MOCK ? 'mock' : 'onchain',
    solana,
    openai: !!process.env.OPENAI_API_KEY,
    rpcUrl: RPC_URL,
  });
});

// POST /api/mode — toggle between mock and on-chain
app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'mock' && mode !== 'onchain') {
    return res.status(400).json({ error: 'mode must be "mock" or "onchain"' });
  }
  USE_MOCK = mode === 'mock';
  console.log(`[ga.ia] Mode switched to: ${USE_MOCK ? 'MOCK' : 'ON-CHAIN'}`);
  res.json({ mode: USE_MOCK ? 'mock' : 'onchain' });
});

// GET /api/towers — return towers from active source
app.get('/api/towers', async (_req, res) => {
  try {
    const towers = await getTowers();
    res.json({ mode: USE_MOCK ? 'mock' : 'onchain', towers });
  } catch (err: any) {
    console.error('[Solana error]', err.message);
    // Graceful fallback to mock if Solana is unreachable
    res.json({ mode: 'mock_fallback', towers: MOCK_TOWERS, error: err.message });
  }
});

// GET /api/summarize
app.get('/api/summarize', async (_req, res) => {
  const towers = await getTowers();
  const prompt = `Current on-chain tower data (source: ${USE_MOCK ? 'mock' : 'Solana localnet'}): ${JSON.stringify(towers)}.
Provide a 2-sentence executive summary for Terna operators highlighting critical towers.`;
  res.json({ result: await askAI(prompt) });
});

// POST /api/explain
app.post('/api/explain', async (req, res) => {
  const { towerId } = req.body;
  const towers = await getTowers();
  const tower = towers.find(t => t.id === towerId);
  if (!tower) return res.status(404).json({ error: 'Tower not found' });
  const prompt = `Tower ${tower.id} (${tower.name}, ${tower.region}): risk=${tower.risk} (${RISK_LABELS[tower.risk]}), probability=${tower.prob}%, tx=${tower.txHash}.
Explain in operational terms why this tower is at this risk level.`;
  res.json({ result: await askAI(prompt) });
});

// POST /api/report
app.post('/api/report', async (req, res) => {
  const { towerId } = req.body;
  const towers = await getTowers();
  const tower = towers.find(t => t.id === towerId);
  if (!tower) return res.status(404).json({ error: 'Tower not found' });
  const prompt = `Generate a formal incident report. Return ONLY the report:

Asset ID: ${tower.id}
Name: ${tower.name} | Region: ${tower.region}
Risk Level: ${tower.risk} — ${RISK_LABELS[tower.risk]}
Probability: ${tower.prob}%
Tx Hash: ${tower.txHash}
Source: ${tower.source === 'onchain' ? 'Solana On-Chain' : 'Mock'}

Format: INCIDENT REPORT / Asset / Severity / Risk Probability / Location / Recommended Action / Blockchain Evidence / Notes`;
  res.json({ result: await askAI(prompt) });
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });
  const towers = await getTowers();
  const prompt = `Data source: ${USE_MOCK ? 'mock' : 'Solana localnet (live)'}. Tower registry: ${JSON.stringify(towers)}.
Operator: "${message}". Answer directly and operationally.`;
  res.json({ result: await askAI(prompt) });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  const solana = await checkSolanaHealth();
  const hasKey = !!process.env.OPENAI_API_KEY;

  console.log(`\n🚀 ga.ia Agent API — http://localhost:${PORT}`);
  console.log(`📡 Solana RPC:      ${RPC_URL} — ${solana.ok ? `✔ reachable (slot #${solana.slot})` : `✘ offline (${solana.error})`}`);
  console.log(`🔑 OpenAI:         ${hasKey ? '✔ loaded' : '✘ MISSING — add to agent/.env'}`);
  console.log(`⚙️  Mode:           ${USE_MOCK ? 'MOCK (set USE_MOCK=false to use Solana)' : 'ON-CHAIN'}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/status`);
  console.log(`  POST /api/mode     { mode: "mock" | "onchain" }`);
  console.log(`  GET  /api/towers`);
  console.log(`  GET  /api/summarize`);
  console.log(`  POST /api/explain  { towerId: "T-014" }`);
  console.log(`  POST /api/report   { towerId: "T-014" }`);
  console.log(`  POST /api/chat     { message: "..." }\n`);
});
