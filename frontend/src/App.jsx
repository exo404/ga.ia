import { useState, useEffect, useRef } from 'react';
import './index.css';

const API_BASE = 'http://localhost:3001/api';

const TOWERS = [
  { id: 'T-014', name: 'Traliccio Alpi SO',     region:'Piemonte', lat: 45.82, lng: 7.32,  risk: 4, prob: 89, lastTs: '2026-06-14 19:41', txHash: '0x3a4f...e91c' },
  { id: 'T-027', name: 'Traliccio Appennino C.', region:'Toscana',  lat: 44.11, lng: 11.12, risk: 3, prob: 67, lastTs: '2026-06-14 19:38', txHash: '0x7b2d...a33f' },
  { id: 'T-033', name: 'Traliccio Calabria NE',  region:'Calabria', lat: 39.22, lng: 16.49, risk: 3, prob: 72, lastTs: '2026-06-14 19:35', txHash: '0x9c1e...b77a' },
  { id: 'T-041', name: 'Traliccio Liguria',       region:'Liguria',  lat: 44.41, lng: 8.93,  risk: 2, prob: 45, lastTs: '2026-06-14 19:30', txHash: '0x1f8a...d20b' },
  { id: 'T-058', name: 'Traliccio Dolomiti',      region:'Veneto',   lat: 46.51, lng: 11.35, risk: 2, prob: 38, lastTs: '2026-06-14 19:22', txHash: '0x4e7c...f55d' },
  { id: 'T-066', name: 'Traliccio Sicilia O.',    region:'Sicilia',  lat: 37.82, lng: 13.21, risk: 1, prob: 11, lastTs: '2026-06-14 19:11', txHash: '0x6a3b...c89e' },
];

const MAP_LAT = { min: 36.5, max: 47.5 };
const MAP_LNG = { min: 6.5,  max: 18.5 };
function latlngToPercent(lat, lng) {
  return {
    x: ((lng - MAP_LNG.min) / (MAP_LNG.max - MAP_LNG.min)) * 100,
    y: ((MAP_LAT.max - lat) / (MAP_LAT.max - MAP_LAT.min)) * 100,
  };
}

const RISK_META = {
  1: { label: 'Low',      cls: 'pill-low',  color: '#00e5a0', fill: 'fill-green',  icon: '🟢', nodeIcon:'🗼' },
  2: { label: 'Moderate', cls: 'pill-mod',  color: '#f4c430', fill: 'fill-yellow', icon: '🟡', nodeIcon:'📡' },
  3: { label: 'High',     cls: 'pill-high', color: '#ff8c30', fill: 'fill-orange', icon: '🟠', nodeIcon:'⚠️' },
  4: { label: 'Critical', cls: 'pill-crit', color: '#ff3b55', fill: 'fill-red',    icon: '🔴', nodeIcon:'⚡' },
};

const MOCK_HISTORY = [89, 85, 77, 81, 84, 88, 89];

/* ──────────────────────────────────────────────────────────────────
   POPUP COMPONENT
────────────────────────────────────────────────────────────────── */
function Popup({ popup, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, [popup]);
  if (!popup) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className={`popup-window ${popup.wide ? 'popup-wide' : ''}`}
        ref={ref}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.key === 'Escape' && onClose()}
      >
        {/* Window bar */}
        <div className="popup-bar">
          <div className="mac-dots">
            <div className="mac-dot r" onClick={onClose} style={{cursor:'pointer'}}/>
            <div className="mac-dot y"/>
            <div className="mac-dot g"/>
          </div>
          <span className="popup-title mono">{popup.title}</span>
          <button className="popup-close" onClick={onClose}>✕</button>
        </div>
        {/* Body */}
        <div className="popup-body">
          {popup.content}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   POPUP CONTENT BUILDERS
────────────────────────────────────────────────────────────────── */

function TowerDetailContent({ tower, onAction, loading }) {
  const m = RISK_META[tower.risk];
  return (
    <div className="popup-tower-detail">
      {/* Header row */}
      <div className="popup-detail-header">
        <span className="popup-tower-id mono">{tower.id}</span>
        <span className={`pill ${m.cls}`}>{m.label}</span>
      </div>
      <span className="dim small">{tower.name} · {tower.region}</span>

      {/* Probability bar */}
      <div className="popup-prob-block">
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <span className="stat-label">Landslide Probability</span>
          <span className="mono" style={{color:m.color,fontWeight:700,fontSize:20}}>{tower.prob}%</span>
        </div>
        <div className="progress-bar" style={{height:8,borderRadius:4}}>
          <div className={`progress-fill ${m.fill}`} style={{width:`${tower.prob}%`, borderRadius:4}}/>
        </div>
      </div>

      {/* Historical trend */}
      <div className="popup-section-label">Risk trend (last 7 readings)</div>
      <div className="popup-sparkline">
        {MOCK_HISTORY.map((v, i) => (
          <div key={i} className="spark-bar" style={{
            height: `${v}%`,
            background: v > 80 ? 'var(--red)' : v > 60 ? 'var(--orange)' : 'var(--yellow)',
            boxShadow: `0 0 4px ${v > 80 ? 'var(--red)' : v > 60 ? 'var(--orange)' : 'var(--yellow)'}`,
          }}>
            <span className="spark-label">{v}</span>
          </div>
        ))}
      </div>

      {/* Metadata grid */}
      <div className="popup-meta-grid">
        <div className="popup-meta-item">
          <span className="dim xs">LAST UPDATE</span>
          <span className="mono small">{tower.lastTs}</span>
        </div>
        <div className="popup-meta-item">
          <span className="dim xs">TX HASH</span>
          <span className="hash-pill">{tower.txHash}</span>
        </div>
        <div className="popup-meta-item">
          <span className="dim xs">BLOCKCHAIN STATUS</span>
          <span style={{color:'var(--green)',fontSize:11}}>✔ Certified</span>
        </div>
        <div className="popup-meta-item">
          <span className="dim xs">COORDINATES</span>
          <span className="mono small">{tower.lat}° N, {tower.lng}° E</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="popup-action-row">
        {['explain','report','actions'].map(a => (
          <button key={a} className="popup-action-btn" onClick={() => onAction(a, tower)} disabled={loading}>
            {a === 'explain' ? '🧠 Explain Risk' : a === 'report' ? '📄 Emergency Report' : '🔧 Suggest Actions'}
          </button>
        ))}
      </div>
    </div>
  );
}

function AIResponseContent({ title, content, loading }) {
  return (
    <div className="popup-ai-response">
      <div className="popup-ai-header">
        <span className="popup-ai-badge">// ga.ia · AI Output</span>
        <span className="pill pill-low" style={{fontSize:9}}>Read-only Agent</span>
      </div>
      {loading ? (
        <div className="popup-thinking">
          <div className="thinking-dots"><span/><span/><span/></div>
          <span className="dim small">ga.ia is processing on-chain data</span>
        </div>
      ) : (
        <div className="popup-ai-body mono">{content}</div>
      )}
    </div>
  );
}

function SummarizeContent({ towers }) {
  const crits = towers.filter(t => t.risk === 4);
  const highs = towers.filter(t => t.risk === 3);
  return (
    <div className="popup-summarize">
      <div className="popup-ai-header">
        <span className="popup-ai-badge">// ga.ia · Critical Risk Summary</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
        {[...crits,...highs].map(t => {
          const m = RISK_META[t.risk];
          return (
            <div key={t.id} className="popup-sum-row">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:16}}>{m.nodeIcon}</span>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="mono" style={{color:'var(--cyan)',fontSize:13,fontWeight:600}}>{t.id}</span>
                    <span className={`pill ${m.cls}`}>{m.label}</span>
                  </div>
                  <span className="dim xs">{t.name} · {t.region}</span>
                </div>
              </div>
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                <div className="mono" style={{color:m.color,fontWeight:700,fontSize:18}}>{t.prob}%</div>
                <div className="dim xs">probability</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Tower List Modal */
function TowerListContent({ towers, onSelect }) {
  return (
    <div className="popup-tower-detail">
      <div className="popup-ai-header">
        <span className="popup-ai-badge">// Tower Registry · On-Chain · {towers.length} assets</span>
        <span className="pill pill-low" style={{fontSize:9}}>Live</span>
      </div>
      <table className="tower-table" style={{marginTop:12}}>
        <thead><tr>
          <th>ID</th><th>Name</th><th>Region</th><th>Prob.</th><th>Risk</th><th>Tx Hash</th><th>Verified</th>
        </tr></thead>
        <tbody>
          {towers.map(t => {
            const m = RISK_META[t.risk];
            return (
              <tr key={t.id} onClick={() => onSelect(t)} style={{cursor:'pointer'}}>
                <td className="mono" style={{color:'var(--cyan)',fontSize:11}}>{t.id}</td>
                <td style={{fontSize:10,color:'var(--white)'}}>{t.name}</td>
                <td className="dim" style={{fontSize:10}}>{t.region}</td>
                <td>
                  <div className="prob-cell">
                    <span className="mono" style={{fontSize:11}}>{t.prob}%</span>
                    <div className="progress-bar" style={{width:60}}><div className={`progress-fill ${m.fill}`} style={{width:`${t.prob}%`}}/></div>
                  </div>
                </td>
                <td><span className={`pill ${m.cls}`}>{m.label}</span></td>
                <td><span className="hash-pill">{t.txHash}</span></td>
                <td><span style={{color:'var(--green)',fontSize:10}}>✔</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Chat Modal — full standalone chat with ga.ia */
function ChatModalContent({ history, onSend, loading, inputVal, setInputVal }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [history, loading]);
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:12}}>
      <div className="popup-ai-header">
        <span className="popup-ai-badge">// ga.ia · Conversational AI Agent</span>
        <span className="pill pill-low" style={{fontSize:9}}>Read-only · Solana Agent Kit</span>
      </div>
      <div className="chat-history" style={{flex:1,maxHeight:360,overflowY:'auto'}}>
        {history.map((m,i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-label">{m.role==='ai'?'// ga.ia':'// operator'}</div>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="thinking">
            <span>ga.ia is thinking</span>
            <span className="thinking-dots"><span/><span/><span/></span>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{display:'flex',gap:8,flexDirection:'column',gap:8}}>
        <div className="stat-label" style={{marginBottom:4}}>Quick prompts:</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['Which towers are critical?','Explain tower T-014','Generate report for highest risk','What should the operator do first?','Show risks above 70%'].map(p => (
            <button key={p} className="popup-action-btn" style={{flex:'none',padding:'5px 10px',fontSize:9}}
              onClick={() => onSend(p)} disabled={loading}>{p}</button>
          ))}
        </div>
      </div>
      <form onSubmit={e => { e.preventDefault(); onSend(inputVal); }} className="chat-input-row" style={{paddingTop:0,borderTop:'1px solid var(--border-faint)'}}>
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          placeholder="Ask ga.ia anything about the risk data..." disabled={loading}
          style={{fontSize:12}}/>
        <button type="submit" className="send-btn" disabled={loading || !inputVal.trim()}>↑</button>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   MAIN APP
────────────────────────────────────────────────────────────────── */
export default function App() {
  const [selected, setSelected] = useState(TOWERS[0]);
  const [popup, setPopup] = useState(null);

  // ── Data mode: 'mock' | 'onchain' | 'mock_fallback' ──────────────
  const [dataMode, setDataMode] = useState('mock');
  const [towers, setTowers]     = useState(TOWERS);
  const [solanaStatus, setSolanaStatus] = useState({ ok: false, slot: null });
  const [modeLoading, setModeLoading]   = useState(false);

  // Fetch towers from agent and check Solana status
  async function fetchTowers(mode) {
    setModeLoading(true);
    try {
      // Tell agent to switch mode
      await fetch(`${API_BASE}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      // Fetch towers from active source
      const res  = await fetch(`${API_BASE}/towers`);
      const data = await res.json();
      setTowers(data.towers ?? TOWERS);
      setDataMode(data.mode);
      // Fetch Solana health
      const sRes  = await fetch(`${API_BASE}/status`);
      const sData = await sRes.json();
      setSolanaStatus(sData.solana ?? { ok: false });
    } catch {
      setTowers(TOWERS);
      setDataMode('mock_fallback');
    } finally {
      setModeLoading(false);
    }
  }

  // Poll status every 15s when in onchain mode
  useEffect(() => {
    if (dataMode === 'onchain') {
      const id = setInterval(() => fetchTowers('onchain'), 15000);
      return () => clearInterval(id);
    }
  }, [dataMode]);

  async function toggleMode() {
    const next = dataMode === 'mock' ? 'onchain' : 'mock';
    await fetchTowers(next);
  }

  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'ga.ia online. Read-only access to on-chain risk registry. Select a tower or ask anything.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, loading]);

  const riskDistrib   = [1,2,3,4].map(r => ({ r, meta: RISK_META[r], count: towers.filter(t=>t.risk===r).length }));
  const criticalCount = towers.filter(t=>t.risk>=3).length;
  const avgProb       = Math.round(towers.reduce((a,t)=>a+t.prob,0)/towers.length);

  /* open popup helpers */
  function openTowerDetail(tower) {
    setPopup({
      title: `// ${tower.id} · Risk Detail`,
      content: <TowerDetailContent tower={tower} onAction={handleQuickActionPopup} loading={loading}/>
    });
  }

  function openAIResult(title, content, isLoading) {
    setPopup({
      title,
      content: <AIResponseContent title={title} content={content} loading={isLoading}/>
    });
  }

  function openSummarize() {
    setPopup({
      title: '// ga.ia · Critical Assets Summary',
      content: <SummarizeContent towers={towers}/>,
    });
  }

  /* agent calls */
  async function callAgent(endpoint, body = null) {
    setLoading(true);
    try {
      const opts = body
        ? { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }
        : {};
      const res = await fetch(`${API_BASE}/${endpoint}`, opts);
      const data = await res.json();
      return data.result || 'No response.';
    } catch {
      return '⚠ Could not reach ga.ia agent API. Ensure it is running on port 3001.';
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickActionPopup(action, tower) {
    const titles = {
      explain:   `// ga.ia · Risk Explanation · ${tower.id}`,
      report:    `// ga.ia · Emergency Report · ${tower.id}`,
      actions:   `// ga.ia · Suggested Actions · ${tower.id}`,
      summarize: '// ga.ia · Critical Summary',
    };
    openAIResult(titles[action], '', true);
    let result;
    if (action === 'summarize') result = await callAgent('summarize');
    else if (action === 'explain') result = await callAgent('explain', { towerId: tower.id });
    else if (action === 'report')  result = await callAgent('report',  { towerId: tower.id });
    else result = await callAgent('chat', { message: `What actions should the operator take for tower ${tower.id} with risk probability ${tower.prob}%?` });

    setPopup({
      title: titles[action],
      content: <AIResponseContent title={titles[action]} content={result} loading={false}/>
    });
  }

  async function handleSidebarAction(action, tower) {
    if (action === 'summarize') { openSummarize(); return; }
    await handleQuickActionPopup(action, tower);
  }

  /* open Tower List modal */
  function openTowerList() {
    setPopup({
      title: `// Tower Registry · ${dataMode === 'onchain' ? 'Solana On-Chain' : 'Mock'} · ga.ia`,
      wide: true,
      content: <TowerListContent towers={towers} onSelect={t => { setSelected(t); openTowerDetail(t); }}/>,
    });
  }

  /* open Chat modal */
  function openChatModal() {
    setPopup({
      title: '// ga.ia · AI Chat Assistant',
      wide: true,
      content: (
        <ChatModalContent
          history={chatHistory}
          loading={loading}
          inputVal={chatInput}
          setInputVal={setChatInput}
          onSend={async (msg) => {
            if (!msg.trim() || loading) return;
            setChatInput('');
            setChatHistory(h => [...h, { role:'user', text:msg }]);
            setLoading(true);
            const result = await callAgent('chat', { message: msg });
            setChatHistory(h => [...h, { role:'ai', text:result }]);
          }}
        />
      )
    });
  }

  /* sidebar chat */
  async function handleChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatHistory(h => [...h, { role:'user', text:msg }]);
    setLoading(true);
    const result = await callAgent('chat', { message: msg });
    setChatHistory(h => [...h, { role:'ai', text:result }]);
  }

  return (
    <>
      <Popup popup={popup} onClose={() => setPopup(null)}/>

      <div className="root-layout">
        {/* HEADER */}
        <header className="header">
          <div className="mac-dots">
            <div className="mac-dot r"/><div className="mac-dot y"/><div className="mac-dot g"/>
          </div>
          <div className="header-sep"/>
          <span className="header-brand">ga.ia</span>
          <div className="header-sep"/>
          <span className="header-sub mono">Intelligent Landslide Risk Monitor · Terna</span>

          {/* Quick-action toolbar buttons + Mode toggle */}
          <div className="header-toolbar">
            {/* Mode toggle */}
            <button
              className={`toolbar-btn ${dataMode === 'onchain' ? 'toolbar-btn-onchain' : 'toolbar-btn-mock'}`}
              onClick={toggleMode}
              disabled={modeLoading}
              title={dataMode === 'mock' ? 'Switch to Solana On-Chain data' : 'Switch to Mock data'}
            >
              <span className="toolbar-icon">{modeLoading ? '⏳' : dataMode === 'onchain' ? '🔗' : '🧪'}</span>
              <span>{modeLoading ? 'Switching...' : dataMode === 'onchain' ? `ON-CHAIN${solanaStatus.slot ? ` #${solanaStatus.slot}` : ''}` : 'MOCK DATA'}</span>
            </button>

            <div className="header-sep"/>

            <button className="toolbar-btn" onClick={openTowerList} title="Open full tower registry">
              <span className="toolbar-icon">🗼</span>
              <span>Tower List</span>
            </button>
            <button className="toolbar-btn toolbar-btn-cyan" onClick={openChatModal} title="Open ga.ia AI chat">
              <span className="toolbar-icon">🤖</span>
              <span>Ask ga.ia</span>
            </button>
          </div>

          <div className="header-right">
            <span className="live-badge mono"><span className="live-dot"/>On-Chain Sync Active</span>
            <div className="header-sep"/>
            <span className="chain-badge mono">Last block: <span>#7,841,329</span></span>
            <div className="header-sep"/>
            <span style={{fontSize:10,color:'#3a6080'}} className="mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="main-grid">

          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
            <div className="panel" style={{flexShrink:0}}>
              <div className="panel-head"><span className="panel-head-dot"/>Risk Overview</div>
              <div className="panel-body" style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:8}}>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Critical Assets</span>
                    <span className="pill pill-crit">{criticalCount} active</span>
                  </div>
                  <span className={`stat-value v-${criticalCount>=2?'crit':'warn'}`}>{criticalCount}</span>
                  <div style={{marginTop:6}}><div className="progress-bar"><div className="progress-fill fill-red" style={{width:`${(criticalCount/TOWERS.length)*100}%`}}/></div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Total Monitored</span>
                    <span className="pill pill-low">Online</span>
                  </div>
                  <span className="stat-value v-cyan">{TOWERS.length}</span>
                  <div style={{marginTop:6}}><div className="progress-bar"><div className="progress-fill fill-green" style={{width:'100%'}}/></div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Avg. Probability</span>
                  </div>
                  <span className={`stat-value ${avgProb>60?'v-warn':'v-ok'}`}>{avgProb}%</span>
                  <div style={{marginTop:6}}><div className="progress-bar"><div className={`progress-fill ${avgProb>60?'fill-orange':'fill-green'}`} style={{width:`${avgProb}%`}}/></div></div>
                </div>
                <div style={{marginTop:4}}>
                  <div className="stat-label" style={{marginBottom:8}}>Risk Distribution</div>
                  <div className="risk-distrib">
                    {riskDistrib.map(({r,meta,count})=>(
                      <div className="risk-row" key={r}>
                        <span className="risk-row-label" style={{color:meta.color}}>{meta.label}</span>
                        <div className="risk-row-bar"><div className="progress-fill" style={{background:meta.color,boxShadow:`0 0 4px ${meta.color}`,width:`${(count/TOWERS.length)*100}%`}}/></div>
                        <span className="risk-row-count" style={{color:meta.color}}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel" style={{flex:1}}>
              <div className="panel-head"><span className="panel-head-dot"/>Tower Registry · On-Chain</div>
              <div className="panel-body" style={{padding:0}}>
                <table className="tower-table">
                  <thead><tr><th>ID</th><th>Region</th><th>Prob.</th><th>Risk</th></tr></thead>
                  <tbody>
                    {TOWERS.map(t=>{
                      const m=RISK_META[t.risk];
                      return (
                        <tr key={t.id} className={selected?.id===t.id?'active':''} onClick={()=>{setSelected(t);openTowerDetail(t);}}>
                          <td className="mono" style={{color:'var(--cyan)',fontSize:11}}>{t.id}</td>
                          <td className="dim" style={{fontSize:10}}>{t.region}</td>
                          <td>
                            <div className="prob-cell">
                              <span className="mono" style={{fontSize:11}}>{t.prob}%</span>
                              <div className="progress-bar" style={{width:60}}><div className={`progress-fill ${m.fill}`} style={{width:`${t.prob}%`}}/></div>
                            </div>
                          </td>
                          <td><span className={`pill ${m.cls}`}>{m.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CENTER MAP */}
          <div className="panel glow" style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div className="panel-head"><span className="panel-head-dot"/>Asset Map · Italy Grid</div>
            <div className="map-container" style={{flex:1,position:'relative'}}>
              <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{opacity:0.15}}>
                <polyline fill="none" stroke="#00dcff" strokeWidth="0.3"
                  points="40,8 38,10 36,12 34,14 32,17 31,21 30,25 29,30 30,34 32,37 35,40 37,44 38,49 37,54 36,58 33,63 30,68 27,73 26,78 28,82 30,85 33,87 36,86 38,84 40,81 42,79 44,77 46,78 48,80 50,81 52,79 54,76 56,73 57,68 56,64 55,60 56,56 58,52 60,48 62,44 63,40 62,36 60,32 59,27 58,22 57,18 55,14 52,11 50,9 47,8 44,8 40,8"/>
              </svg>
              <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {TOWERS.map((t,i)=>{
                  const a=latlngToPercent(t.lat,t.lng);
                  const b=latlngToPercent(TOWERS[(i+1)%TOWERS.length].lat,TOWERS[(i+1)%TOWERS.length].lng);
                  return <line key={i} className="map-conn" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,180,255,0.15)" strokeWidth="0.4"/>;
                })}
              </svg>
              {TOWERS.map(t=>{
                const {x,y}=latlngToPercent(t.lat,t.lng);
                const m=RISK_META[t.risk];
                const isSel=selected?.id===t.id;
                return (
                  <div key={t.id} className={`map-node ${isSel?'node-selected':''}`} style={{left:`${x}%`,top:`${y}%`}}
                    onClick={()=>{setSelected(t);openTowerDetail(t);}}>
                    <div className="node-ring" style={{color:m.color}}>
                      {(t.risk>=3||isSel)&&<div className="node-pulse" style={{color:m.color,borderColor:m.color,animationDuration:t.risk===4?'1.2s':'2s'}}/>}
                      <div className="node-icon-wrap" style={{color:m.color,borderColor:m.color}}>{m.nodeIcon}</div>
                    </div>
                    <div className="node-label" style={{color:isSel?'var(--cyan)':'var(--muted)'}}>{t.id}</div>
                  </div>
                );
              })}
              <div style={{position:'absolute',bottom:10,left:10,display:'flex',flexDirection:'column',gap:4}}>
                {Object.entries(RISK_META).map(([k,v])=>(
                  <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:v.color,boxShadow:`0 0 4px ${v.color}`}}/>
                    <span className="mono xs" style={{color:'var(--muted)'}}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
            {selected&&(
              <div className="panel" style={{flexShrink:0}}>
                <div className="panel-head">
                  <span className="panel-head-dot"/>
                  {selected.id} · Detail
                  <span className={`pill ${RISK_META[selected.risk].cls}`} style={{marginLeft:'auto'}}>{RISK_META[selected.risk].label}</span>
                </div>
                <div className="panel-body" style={{padding:'10px 12px'}}>
                  <div className="detail-rows">
                    <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val" style={{fontSize:10}}>{selected.name}</span></div>
                    <div className="detail-row"><span className="detail-key">Region</span><span className="detail-val">{selected.region}</span></div>
                    <hr className="detail-sep"/>
                    <div className="detail-row">
                      <span className="detail-key">Risk Prob.</span>
                      <span className="detail-val" style={{color:RISK_META[selected.risk].color,fontWeight:700}}>{selected.prob}%</span>
                    </div>
                    <div style={{marginBottom:4}}><div className="progress-bar"><div className={`progress-fill ${RISK_META[selected.risk].fill}`} style={{width:`${selected.prob}%`}}/></div></div>
                    <div className="detail-row"><span className="detail-key">Timestamp</span><span className="detail-val mono small">{selected.lastTs}</span></div>
                    <div className="detail-row"><span className="detail-key">Chain Tx</span><span className="hash-pill">{selected.txHash}</span></div>
                    <div className="detail-row" style={{marginTop:2}}><span className="detail-key">Verified</span><span style={{fontSize:10,color:'var(--green)'}}>✔ Blockchain Certified</span></div>
                  </div>
                  <div style={{marginTop:12}}>
                    <div className="stat-label" style={{marginBottom:8}}>AI Quick Actions</div>
                    <div className="action-grid">
                      {[
                        {label:'🧠 Explain Risk', action:'explain'},
                        {label:'📄 Emergency Report', action:'report'},
                        {label:'🔧 Suggest Actions', action:'actions'},
                        {label:'📊 Summarize All', action:'summarize'},
                      ].map(a=>(
                        <button key={a.action} className="action-btn" onClick={()=>handleSidebarAction(a.action,selected)} disabled={loading}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="panel glow" style={{flex:1,overflow:'hidden'}}>
              <div className="panel-head"><span className="panel-head-dot"/>ga.ia · AI Agent</div>
              <div className="panel-body" style={{display:'flex',flexDirection:'column',gap:0,padding:'10px 12px'}}>
                <div className="chat-history" style={{flex:1}}>
                  {chatHistory.map((m,i)=>(
                    <div key={i} className={`msg ${m.role}`}>
                      <div className="msg-label">{m.role==='ai'?'// ga.ia':'// operator'}</div>
                      {m.text}
                    </div>
                  ))}
                  {loading&&(
                    <div className="thinking">
                      <span>ga.ia is thinking</span>
                      <span className="thinking-dots"><span/><span/><span/></span>
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>
                <form onSubmit={handleChat} className="chat-input-row">
                  <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask ga.ia anything..." disabled={loading}/>
                  <button type="submit" className="send-btn" disabled={loading||!chatInput.trim()}>↑</button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
