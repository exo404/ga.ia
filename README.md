# ga.ia
Ctrl/Shift Hackaton 2026 project. Intelligent monitoring system for landslides and natural hazards powered by blockchain and machine learning.

## Struttura del Progetto

Il progetto attualmente contiene l'MVP per il monitoraggio dei tralicci Terna, suddiviso in due componenti principali:
1. **Frontend**: Dashboard Web per la visualizzazione dei rischi in tempo reale.
2. **Agent AI**: Agente autonomo basato su Solana per la valutazione del livello di rischio.

---

## Come Avviare il Progetto in Locale

### 1. Avvio della Dashboard Frontend
La web app è costruita con React e Vite.

Apri un terminale nella root del progetto ed esegui:
```bash
cd frontend
npm run dev
```
La dashboard sarà accessibile all'indirizzo [http://localhost:5173](http://localhost:5173).

### 2. Avvio dell'Agente AI
L'agente AI si basa sul framework `solana-agent-kit`.

Apri un **secondo** terminale nella root del progetto ed esegui:
```bash
cd agent
npx ts-node index.ts
```
L'agente inizierà a simulare l'ascolto della rete locale Solana per intercettare gli allarmi di frana ed emettere valutazioni.
