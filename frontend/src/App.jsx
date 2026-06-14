import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import './index.css';

// Mock data generation
const MOCK_TRUSSES = [
  { id: 101, name: 'Traliccio Nord-Ovest', lat: 45.07, lng: 7.68, risk: 1, consumed: true },
  { id: 102, name: 'Traliccio Appennino', lat: 44.49, lng: 11.34, risk: 3, consumed: false },
  { id: 103, name: 'Traliccio Sud-Est', lat: 41.11, lng: 16.87, risk: 2, consumed: false },
  { id: 104, name: 'Traliccio Alpi', lat: 46.07, lng: 11.13, risk: 4, consumed: false },
];

function App() {
  const [trusses, setTrusses] = useState(MOCK_TRUSSES);
  const [theme, setTheme] = useState('light');

  // Toggle light/dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Simulate incoming on-chain events via polling
  useEffect(() => {
    const interval = setInterval(() => {
      setTrusses(current => {
        const idx = Math.floor(Math.random() * current.length);
        const newRisk = Math.floor(Math.random() * 4) + 1; // 1 to 4
        
        const updated = [...current];
        if (updated[idx].risk !== newRisk) {
          updated[idx] = { ...updated[idx], risk: newRisk, consumed: false };
        }
        return updated;
      });
    }, 15000); // New event every 15s

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 1: return 'badge-low';
      case 2: return 'badge-medium';
      case 3: return 'badge-high';
      case 4: return 'badge-critical';
      default: return 'badge-low';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch(riskLevel) {
      case 1: return 'Normale';
      case 2: return 'Attenzione';
      case 3: return 'Allarme Frana';
      case 4: return 'Emergenza Critica';
      default: return 'Sconosciuto';
    }
  };

  const handleSimulateAgent = (id) => {
    // Mock the agent consumption
    setTrusses(current => 
      current.map(t => t.id === id ? { ...t, consumed: true } : t)
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <Zap size={28} color="var(--accent-primary)" />
          <span>Terna Landslide Monitor</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }} className={theme === 'dark' ? 'animate-pulse' : ''}>
            <Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
            Solana Localnet Active
          </span>
          <button 
            className="btn btn-icon"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <h2>Monitoraggio Asset</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Visione in tempo reale del rischio frane per i tralicci della rete elettrica Terna. 
          I dati sono simulati come eventi della blockchain Solana.
        </p>

        <div className="grid-layout">
          {trusses.map((truss) => (
            <div key={truss.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {truss.name}
                </h3>
                <span className={`badge ${getRiskColor(truss.risk)}`}>
                  {getRiskLabel(truss.risk)}
                </span>
              </div>
              
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>ID:</strong> #{truss.id}</div>
                <div><strong>Posizione:</strong> {truss.lat}, {truss.lng}</div>
                <div>
                  <strong>Stato Valutazione:</strong>{' '}
                  {truss.consumed ? (
                    <span style={{ color: 'var(--risk-low)' }}>
                      <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Valutato dall'Agente AI
                    </span>
                  ) : (
                    <span style={{ color: 'var(--risk-high)' }}>
                      <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> In attesa di analisi
                    </span>
                  )}
                </div>
              </div>

              {!truss.consumed && (
                <button 
                  className="btn" 
                  style={{ width: '100%' }}
                  onClick={() => handleSimulateAgent(truss.id)}
                >
                  <ShieldAlert size={16} />
                  Simula Trigger Agente AI
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
