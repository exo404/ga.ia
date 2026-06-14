import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "solana-agent-kit";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize Solana Agent Kit
// Using a dummy private key for localnet mock if OPENAI_API_KEY is not set
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const DUMMY_KEY = "4a1r1H1xXkZ3yR3hH2xT9zK4xP6aM8gN1xK3rL4qF6zW1tR2gV3pM7xY8zB1sV2eR8zN9xP5wT3yK6aX1bJ2";

// Set up agent
const agent = new SolanaAgentKit(
  process.env.PRIVATE_KEY || DUMMY_KEY,
  RPC_URL,
  process.env.OPENAI_API_KEY || "dummy-key"
);

console.log("🟢 Solana Agent Kit Initialized.");
console.log(`📡 Connecting to Solana Localnet: ${RPC_URL}`);

// Mock Tralicci data structure matching the frontend
const TRUSSES_DB = new Map([
  [101, { name: 'Traliccio Nord-Ovest', lat: 45.07, lng: 7.68 }],
  [102, { name: 'Traliccio Appennino', lat: 44.49, lng: 11.34 }],
  [103, { name: 'Traliccio Sud-Est', lat: 41.11, lng: 16.87 }],
  [104, { name: 'Traliccio Alpi', lat: 46.07, lng: 11.13 }],
]);

/**
 * Mocks a Solana Event Listener for new 'RiskData'
 */
function mockListenForRiskEvents() {
  console.log("🎧 Listening for Risk Events on Solana...");

  // Simulate an event being emitted by the blockchain every 20 seconds
  setInterval(async () => {
    const trussIds = Array.from(TRUSSES_DB.keys());
    const randomTruss = trussIds[Math.floor(Math.random() * trussIds.length)];
    const randomRiskLevel = Math.floor(Math.random() * 4) + 1;

    console.log(`\n🚨 [EVENT DETECTED] New Risk Data on-chain for Truss #${randomTruss} | Level: ${randomRiskLevel}`);
    
    await evaluateRiskEvent(randomTruss, randomRiskLevel);
  }, 20000);
}

/**
 * AI Evaluation Logic using the Agent
 */
async function evaluateRiskEvent(trussId: number, riskLevel: number) {
  const trussData = TRUSSES_DB.get(trussId);
  if (!trussData) return;

  console.log(`🧠 AI Agent is evaluating the risk...`);
  
  // Here we would normally call:
  // const prompt = `Evaluate landslide risk level ${riskLevel} for tower at lat ${trussData.lat}, lng ${trussData.lng}.`;
  // const response = await agent.generateText(prompt);
  
  // Mocking the LLM analysis for the MVP demo without a real API key:
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate thinking

  let analysis = "";
  if (riskLevel === 1) {
    analysis = "Risk is Low (Level 1). No immediate geological anomalies detected. Continuing routine monitoring.";
  } else if (riskLevel === 2) {
    analysis = "Risk is Medium (Level 2). Minor soil displacement noticed. Scheduling drone inspection for next week.";
  } else if (riskLevel === 3) {
    analysis = "Risk is High (Level 3). Significant rainfall in the area correlation with structural stress. Issuing warning to maintenance team.";
  } else {
    analysis = "Risk is CRITICAL (Level 4). Immediate danger of landslide affecting the tower foundation! Emergency protocols activated.";
  }

  console.log(`✅ [ANALYSIS COMPLETE]: ${analysis}`);
  console.log(`📢 Emitting off-chain alert. (Agent is in read-only mode, skipping on-chain update)\n`);
}

// Start the listener
mockListenForRiskEvents();
