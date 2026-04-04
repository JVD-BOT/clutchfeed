import { useState, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const GAME_COLORS = { all:"#00F5FF", valorant:"#FF2D55", cs2:"#FF6B00", lol:"#FFD700", fortnite:"#BF00FF" };
const GAME_LABELS = { valorant:"VALORANT", cs2:"CS2", lol:"LEAGUE", fortnite:"FORTNITE" };
const GAMES       = [{id:"all",label:"All"},{id:"valorant",label:"VALORANT"},{id:"cs2",label:"CS2"},{id:"lol",label:"LEAGUE"},{id:"fortnite",label:"FORTNITE"}];
const CATEGORIES  = [{id:"all",label:"All"},{id:"clutch",label:"Clutch"},{id:"play",label:"Plays"},{id:"pro",label:"Pro"},{id:"funny",label:"Funny"}];
const GAME_ICON   = { all:"grid", valorant:"xhair", cs2:"gun", lol:"sword", fortnite:"llama" };
const CAT_ICON    = { all:"diamond", clutch:"flame", play:"bolt", pro:"crown", funny:"skull" };

const YT_POOL = {
  valorant: ["HmRlCaFvFzI","3DVl4-jXSkA","JQGRg8XcHRY","vBPFDIOQ9FU","NzHkK4smhOM"],
  cs2:      ["pEiDA59MFSk","WYSTgLFMN28","FkJ3NMhRFmc","Bw9P_ZXWDJU","q5yjqVxTJiU"],
  lol:      ["FRTiIWZKoSo","4Wy_OIXMi_c","AoV0xZfDFGE","FpX-gm84GGI","LXcYBSnbYoU"],
  fortnite: ["2iLPQEYBqzE","mMfngLQXqWc","iC9P4-5Bpqk","8hFBCgBJDus","nTquXN3HTUE"],
};
const pickYt = (game) => {
  const pool = YT_POOL[game] || Object.values(YT_POOL).flat();
  return pool[Math.floor(Math.random() * pool.length)];
};

const mkClip = (id, game, cat, title, player, views, likes, time, seed) => ({
  id, game, category: cat, title, player, views, likes,
  liked: false, saved: false, time, thumbSeed: seed, ytId: pickYt(game), isNew: false,
  reactions: { gg:0, clutch:0, noscope:0, oof:0, mine:null },
});

const SEED_CLIPS = [
  mkClip(1,"valorant","clutch","1v5 Ace on Icebox — Zero Armor, Zero Fear","TenZ","2.4M",89400,"1h ago",40),
  mkClip(2,"cs2","pro","s1mple Deagle Triple — ESL Pro League Finals","s1mple","5.1M",211000,"3h ago",21),
  mkClip(3,"lol","play","Faker Pentakill — Worlds 2026 Grand Final","Faker","8.7M",412000,"6h ago",67),
  mkClip(4,"fortnite","funny","400IQ Edit Outplays Entire Lobby in 8 Seconds","NinjaDubs","980K",43200,"8h ago",88),
  mkClip(5,"valorant","play","aspas Neon Sprint 4K — Champions São Paulo","aspas","3.2M",127000,"12h ago",33),
  mkClip(6,"cs2","clutch","ZywOo Blind Peek Ace — Through Double Smoke","ZywOo","1.8M",76500,"1d ago",55),
  mkClip(7,"lol","pro","BeryL 5-Man Engage — Perfect Teamfight Read","BeryL","660K",28100,"1d ago",15),
  mkClip(8,"fortnite","clutch","Solo vs Squad — 14 Elims, 0 Heals Used","FazeKay","1.1M",52300,"2d ago",72),
];

const fmt = (n) => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"K" : String(n);

// ─── LIVE SCORES DATA ─────────────────────────────────────────────────────────
// Replace with live data from Riot, ESL, Liquipedia APIs in production
const LIVE_SCORES = [
  { id:1, game:"valorant", t1:"Sentinels",  t2:"LOUD",       s1:1,  s2:2,  status:"LIVE", event:"VCT Americas",  bo:"BO3" },
  { id:2, game:"cs2",      t1:"NAVI",       t2:"Astralis",   s1:16, s2:12, status:"FT",   event:"ESL Pro League", bo:"Map 2" },
  { id:3, game:"lol",      t1:"T1",         t2:"G2 Esports", s1:1,  s2:0,  status:"LIVE", event:"MSI 2026",       bo:"BO5" },
  { id:4, game:"fortnite", t1:"FaZe Clan",  t2:"NRG",        s1:245,s2:218,status:"FT",   event:"FNCS Major",     bo:"Finals" },
  { id:5, game:"valorant", t1:"Team Liquid",t2:"Cloud9",     s1:0,  s2:0,  status:"SOON", event:"VCT Masters",    bo:"BO3" },
  { id:6, game:"cs2",      t1:"Vitality",   t2:"FaZe",       s1:2,  s2:1,  status:"LIVE", event:"BLAST Spring",   bo:"BO3" },
  { id:7, game:"lol",      t1:"Gen.G",      t2:"JDG",        s1:0,  s2:0,  status:"SOON", event:"Worlds 2026",    bo:"BO5" },
];

// ─── TRENDING DATA ─────────────────────────────────────────────────────────────
const TRENDING = [
  { id:1, game:"valorant", label:"Valorant",  viewers:"142K", hot:true  },
  { id:2, game:"lol",      label:"MSI 2026",  viewers:"890K", hot:true  },
  { id:3, game:"cs2",      label:"BLAST",     viewers:"67K",  hot:false },
  { id:4, game:"fortnite", label:"FNCS",      viewers:"51K",  hot:false },
  { id:5, game:"lol",      label:"T1 vs G2",  viewers:"1.2M", hot:true  },
];



// ─── AI REFRESH ───────────────────────────────────────────────────────────────

async function fetchAIClips(game, count = 5) {
  const label = game === "all" ? "mixed esports (valorant, cs2, lol, fortnite)" : (GAME_LABELS[game] || game);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        messages: [{
          role: "user",
          content: `Generate ${count} fresh trending esports clip entries for ${label} in April 2026.
Return ONLY a raw JSON array — no markdown, no explanation.
Each object: title (string), player (pro name), views (like "1.4M"), likes (number),
time (like "22m ago"), category ("clutch"|"pro"|"play"|"funny"), game ("valorant"|"cs2"|"lol"|"fortnite").`,
        }],
      }),
    });
    const data = await res.json();
    const raw = (data.content?.[0]?.text || "[]").replace(/```[\w]*|```/g, "").trim();
    const parsed = JSON.parse(raw);
    return parsed.slice(0, count).map((c, i) => ({
      ...c, id: Date.now() + i, liked: false, saved: false,
      thumbSeed: Math.floor(Math.random() * 96) + 2,
      ytId: pickYt(c.game || game), isNew: true,
    }));
  } catch (e) {
    console.warn("AI refresh failed:", e);
    return [];
  }
}

// ─── PIXEL ICONS ──────────────────────────────────────────────────────────────

const ICONS = {
  home:    [[1,1,8,1],[1,1,1,5],[8,1,1,5],[2,6,6,3],[4,6,2,3,0.5]],
  search:  [[3,0,4,1],[1,1,1,4],[8,1,1,4],[0,2,1,2],[9,2,1,2],[3,5,4,1],[5,5,1,1],[6,6,1,1],[7,7,2,1],[8,8,1,1]],
  plus:    [[4,1,2,3],[1,4,8,2],[4,6,2,3]],
  clips:   [[0,0,4,4],[5,0,4,4],[0,5,4,4],[5,5,4,4]],
  profile: [[3,0,4,4],[1,4,8,2],[0,6,10,4]],
  heart:   [[1,1,3,1],[6,1,3,1],[0,2,4,3],[6,2,4,3],[0,5,10,2],[1,7,8,1],[2,8,6,1],[3,9,4,1]],
  share:   [[6,0,3,1],[7,1,2,1],[5,1,2,1],[3,2,3,1],[1,3,2,1],[0,4,2,3],[2,7,7,1],[9,4,1,3],[5,3,4,1],[4,2,1,1]],
  save:    [[2,0,6,1],[2,0,1,7],[8,0,1,7],[2,5,3,1],[7,5,1,1],[3,6,1,1],[6,6,1,1],[4,7,2,1]],
  eye:     [[3,2,4,1],[1,3,2,1],[7,3,2,1],[0,4,10,2],[1,6,2,1],[7,6,2,1],[3,7,4,1],[4,4,2,2]],
  trophy:  [[3,0,4,1],[2,1,6,3],[1,1,1,2],[8,1,1,2],[4,4,2,3],[3,7,4,1],[1,8,8,1]],
  play:    [[2,1,1,8],[3,2,1,6],[4,3,1,4],[5,3,1,4],[6,4,1,2],[7,4,1,2]],
  prev:    [[7,1,1,8],[6,2,1,6],[5,3,1,4],[4,4,1,2],[3,4,1,2],[2,3,1,4],[1,2,1,6],[0,1,1,8]],
  next:    [[2,1,1,8],[3,2,1,6],[4,3,1,4],[5,4,1,2],[6,4,1,2],[7,3,1,4],[8,2,1,6],[9,1,1,8]],
  mute:    [[1,3,3,4],[4,1,3,8],[7,3,3,4]],
  unmute:  [[1,3,3,4],[4,1,3,8],[8,2,2,1],[8,7,2,1],[9,4,2,2]],
  refresh: [[3,0,4,1],[7,1,2,1],[8,2,2,2],[2,0,1,1],[1,1,1,2],[0,3,1,4],[1,7,2,2],[3,9,6,1],[7,8,2,1],[8,6,2,2],[9,3,1,4]],
  close:   [[0,0,2,2],[8,0,2,2],[4,4,2,2],[0,8,2,2],[8,8,2,2],[2,2,2,2],[6,2,2,2],[2,6,2,2],[6,6,2,2]],
  xhair:   [[4,0,2,2],[4,8,2,2],[0,4,2,2],[8,4,2,2],[4,4,2,2,0.4]],
  gun:     [[0,3,6,2],[6,2,2,3],[8,3,1,1],[2,5,3,3],[5,5,1,1]],
  sword:   [[4,0,2,6],[2,3,6,2],[4,6,2,4]],
  llama:   [[3,0,4,1],[2,1,6,2],[1,3,8,2],[0,5,10,1],[2,6,2,4],[6,6,2,4]],
  grid:    [[0,0,4,4],[6,0,4,4],[0,6,4,4],[6,6,4,4]],
  flame:   [[4,0,2,1],[3,1,4,1],[2,2,6,1],[1,3,8,2],[0,5,10,3],[1,8,8,1],[2,9,6,1]],
  bolt:    [[5,0,3,4],[2,3,6,4],[1,7,4,3]],
  crown:   [[0,3,2,5],[4,0,2,3],[8,3,2,5],[1,8,8,1],[2,3,6,5,0.4]],
  skull:   [[2,0,6,1],[1,1,8,4],[0,2,1,3],[9,2,1,3],[1,5,2,2],[7,5,2,2],[2,7,2,1],[6,7,2,1],[3,8,4,1],[1,9,8,1]],
  diamond: [[4,0,2,1],[2,1,6,2],[0,3,10,3],[2,6,6,2],[4,8,2,1]],
};


// ─── SCORE ROW ────────────────────────────────────────────────────────────────
function ScoreRow({ activeGame }) {
  const scores = activeGame === "all" ? LIVE_SCORES : LIVE_SCORES.filter(s => s.game === activeGame);
  if (scores.length === 0) return null;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", flexShrink:0 }}>
          <rect x="2" y="0" width="3" height="1" fill="#00F5FF"/>
          <rect x="1" y="1" width="1" height="1" fill="#00F5FF"/>
          <rect x="0" y="2" width="1" height="3" fill="#00F5FF"/>
          <rect x="1" y="5" width="1" height="1" fill="#00F5FF"/>
          <rect x="2" y="6" width="3" height="1" fill="#00F5FF"/>
        </svg>
        <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:11, letterSpacing:3, color:"#00F5FF", textShadow:"0 0 8px #00F5FF88" }}>LIVE SCORES</span>
        <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", transform:"scaleX(-1)", flexShrink:0 }}>
          <rect x="2" y="0" width="3" height="1" fill="#00F5FF"/>
          <rect x="1" y="1" width="1" height="1" fill="#00F5FF"/>
          <rect x="0" y="2" width="1" height="3" fill="#00F5FF"/>
          <rect x="1" y="5" width="1" height="1" fill="#00F5FF"/>
          <rect x="2" y="6" width="3" height="1" fill="#00F5FF"/>
        </svg>
        <div style={{ flex:1, height:1, background:"linear-gradient(to right,#00F5FF44,transparent)" }} />
      </div>
      <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
        {scores.map(s => {
          const gc = GAME_COLORS[s.game] || "#00F5FF";
          const isLive = s.status === "LIVE";
          const isSoon = s.status === "SOON";
          return (
            <div key={s.id} style={{ flexShrink:0, width:160, borderRadius:12, background:"linear-gradient(145deg,#141424,#0E0E1E)", border:`1px solid ${gc}35`, padding:"10px 12px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:`linear-gradient(to bottom,${gc},${gc}44)`, borderRadius:"12px 0 0 12px" }} />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <Icon name={GAME_ICON[s.game] || "grid"} size={10} color={gc} />
                  <span style={{ fontSize:8, fontFamily:"'Chakra Petch',sans-serif", color:`${gc}CC`, letterSpacing:1 }}>{s.event}</span>
                </div>
                {isLive && (
                  <div style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(255,0,40,0.15)", border:"1px solid rgba(255,0,40,0.4)", borderRadius:10, padding:"2px 6px" }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:"#FF0040", animation:"pulse 1s infinite" }} />
                    <span style={{ fontSize:7, fontFamily:"'Chakra Petch',sans-serif", color:"#FF0040", letterSpacing:1 }}>LIVE</span>
                  </div>
                )}
                {isSoon && <span style={{ fontSize:7, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>SOON</span>}
                {!isLive && !isSoon && <span style={{ fontSize:7, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(255,255,255,0.35)", letterSpacing:1 }}>FT</span>}
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#fff", fontFamily:"'DM Sans',sans-serif", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.t1}</span>
                <span style={{ fontSize:16, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", color: isLive ? gc : "rgba(255,255,255,0.7)", margin:"0 6px", textShadow: isLive ? `0 0 8px ${gc}` : "none" }}>
                  {isSoon ? "VS" : `${s.s1}–${s.s2}`}
                </span>
                <span style={{ fontSize:11, fontWeight:600, color:"#fff", fontFamily:"'DM Sans',sans-serif", flex:1, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.t2}</span>
              </div>
              <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", fontFamily:"'Chakra Petch',sans-serif", marginTop:5, letterSpacing:0.5 }}>{s.bo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRENDING ROW ─────────────────────────────────────────────────────────────
function TrendingRow({ activeGame, onGameClick }) {
  const items = activeGame === "all" ? TRENDING : TRENDING.filter(t => t.game === activeGame);
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <span style={{ fontSize:12 }}>🔥</span>
        <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.5)" }}>TRENDING NOW</span>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
        {items.map(t => {
          const gc = GAME_COLORS[t.game] || "#00F5FF";
          return (
            <button key={t.id} onClick={() => onGameClick(t.game)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background: t.hot ? `${gc}18` : "rgba(255,255,255,0.04)", border:`1px solid ${t.hot ? gc+"55" : "rgba(255,255,255,0.1)"}`, cursor:"pointer", flexShrink:0, boxShadow: t.hot ? `0 0 10px ${gc}30` : "none" }}>
              {t.hot && <span style={{ fontSize:10 }}>🔥</span>}
              <Icon name={GAME_ICON[t.game] || "grid"} size={10} color={t.hot ? gc : "rgba(255,255,255,0.4)"} />
              <span style={{ fontSize:11, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif", color: t.hot ? gc : "rgba(255,255,255,0.5)", letterSpacing:0.5 }}>{t.label}</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Sans',sans-serif" }}>{t.viewers}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── REACT BAR ────────────────────────────────────────────────────────────────
// Game-native reactions per the research doc: GG, Clutch!, Noscope, Oof
const REACTION_CONFIG = [
  { key:"gg",      label:"GG",      emoji:"✅", color:"#00F5FF"  },
  { key:"clutch",  label:"CLUTCH!", emoji:"🔥", color:"#FF00CC"  },
  { key:"noscope", label:"NOSCOPE", emoji:"🎯", color:"#FF6B00"  },
  { key:"oof",     label:"OOF",     emoji:"💀", color:"#BF00FF"  },
];

function ReactBar({ clip, onReact }) {
  return (
    <div style={{ display:"flex", gap:6, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8 }}>
      {REACTION_CONFIG.map(r => {
        const active = clip.reactions?.mine === r.key;
        const count  = clip.reactions?.[r.key] || 0;
        return (
          <button key={r.key} onClick={e => { e.stopPropagation(); onReact(clip.id, r.key); }}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:3, padding:"5px 2px", borderRadius:20, background: active ? `${r.color}1E` : "rgba(255,255,255,0.04)", border:`1px solid ${active ? r.color+"88" : "rgba(255,255,255,0.08)"}`, cursor:"pointer", transition:"all 0.15s", boxShadow: active ? `0 0 8px ${r.color}44` : "none" }}>
            <span style={{ fontSize:11 }}>{r.emoji}</span>
            <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color: active ? r.color : "rgba(255,255,255,0.38)", letterSpacing:0.3 }}>
              {active ? r.label : count > 0 ? fmt(count) : r.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


// ─── ONBOARDING ───────────────────────────────────────────────────────────────
// Research doc: "5-step max. Pick games, follow 3+ accounts, see feed in 60s"
const ONBOARD_PROS = ["TenZ","s1mple","Faker","ZywOo","aspas","NinjaDubs","FazeKay","BeryL"];

function Onboarding({ onComplete }) {
  const [step, setStep]         = useState(0);
  const [games, setGames]       = useState([]);
  const [cats, setCats]         = useState([]);
  const [follows, setFollows]   = useState([]);

  const toggleGame   = (id) => setGames(g  => g.includes(id)  ? g.filter(x=>x!==id)  : [...g,id]);
  const toggleCat    = (id) => setCats(c  => c.includes(id)  ? c.filter(x=>x!==id)  : [...c,id]);
  const toggleFollow = (p)  => setFollows(f => f.includes(p) ? f.filter(x=>x!==p) : [...f,p]);

  const canNext = [
    true,
    games.length > 0,
    cats.length > 0,
    follows.length >= 1,
    true,
  ][step];

  const next = () => step < 4 ? setStep(s => s+1) : onComplete({ games, cats, follows });

  const STEPS = ["WELCOME","GAMES","VIBE","FOLLOW","READY"];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#07001A", display:"flex", flexDirection:"column", animation:"fadeIn 0.3s ease" }}>
      {/* BG grid */}
      <div style={{ position:"absolute", inset:0, background:`repeating-linear-gradient(0deg,rgba(0,245,255,0.018) 0px,rgba(0,245,255,0.018) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(0,245,255,0.018) 0px,rgba(0,245,255,0.018) 1px,transparent 1px,transparent 48px)`, pointerEvents:"none" }} />

      {/* Progress dots */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, padding:"52px 20px 20px", position:"relative", zIndex:1 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i===step?24:8, height:8, borderRadius:4, background: i<=step?"#00F5FF":"rgba(255,255,255,0.15)", transition:"all 0.3s", boxShadow: i===step?"0 0 8px #00F5FF":""  }} />
        ))}
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 20px", position:"relative", zIndex:1, overflowY:"auto" }}>

        {/* ── STEP 0: WELCOME ── */}
        {step === 0 && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", gap:20 }}>
            <div style={{ width:88, height:88, borderRadius:22, background:"linear-gradient(135deg,#00F5FF,#0044FF,#7700FF)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 40px rgba(0,245,255,0.5),0 0 80px rgba(0,245,255,0.2)", marginBottom:8 }}>
              <svg viewBox="0 0 10 10" width={52} height={52} style={{ imageRendering:"pixelated", shapeRendering:"crispEdges" }}>
                <rect x="1" y="1" width="4" height="1" fill="#fff"/><rect x="1" y="2" width="1" height="3" fill="#fff"/>
                <rect x="1" y="4" width="3" height="1" fill="#fff"/><rect x="6" y="1" width="1" height="7" fill="#fff"/>
                <rect x="7" y="1" width="2" height="1" fill="#fff"/><rect x="7" y="4" width="2" height="1" fill="#fff"/>
                <rect x="7" y="7" width="2" height="1" fill="#fff"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:28, letterSpacing:3, color:"#fff", textShadow:"0 0 20px rgba(0,245,255,0.4)", lineHeight:1.2 }}>CLUTCH<span style={{ color:"#FF00CC" }}>FEED</span></div>
              <div style={{ fontSize:12, letterSpacing:4, color:"rgba(0,245,255,0.6)", fontFamily:"'Chakra Petch',sans-serif", marginTop:6 }}>ESPORTS HIGHLIGHTS</div>
            </div>
            <div style={{ fontSize:16, color:"rgba(255,255,255,0.65)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, maxWidth:300 }}>
              The only place that puts your <span style={{ color:"#00F5FF", fontWeight:700 }}>clips</span>, <span style={{ color:"#FF00CC", fontWeight:700 }}>live scores</span>, and <span style={{ color:"#FFD700", fontWeight:700 }}>esports community</span> in one feed.
            </div>
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              {["640M+ FANS","10M+ CLIPS","LIVE SCORES"].map(s => (
                <div key={s} style={{ padding:"6px 12px", borderRadius:20, background:"rgba(0,245,255,0.08)", border:"1px solid rgba(0,245,255,0.2)", fontSize:10, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(0,245,255,0.8)", letterSpacing:1 }}>{s}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: PICK GAMES ── */}
        {step === 1 && (
          <div style={{ flex:1 }}>
            <div style={{ marginBottom:24, marginTop:8 }}>
              <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:22, color:"#fff", letterSpacing:2, marginBottom:8 }}>PICK YOUR GAMES</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", fontFamily:"'DM Sans',sans-serif" }}>Your feed will be tailored to these titles</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {Object.entries(GAME_LABELS).map(([key, label]) => {
                const c = GAME_COLORS[key];
                const sel = games.includes(key);
                return (
                  <button key={key} onClick={() => toggleGame(key)}
                    style={{ padding:"20px 14px", borderRadius:16, background: sel?`${c}1E`:"rgba(255,255,255,0.04)", border:`2px solid ${sel?c:"rgba(255,255,255,0.1)"}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10, boxShadow: sel?`0 0 20px ${c}40`:"none", transition:"all 0.2s", position:"relative" }}>
                    {sel && <div style={{ position:"absolute", top:10, right:10, width:18, height:18, borderRadius:"50%", background:c, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>✓</div>}
                    <Icon name={GAME_ICON[key]} size={28} color={sel?c:"rgba(255,255,255,0.4)"} />
                    <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:13, color:sel?c:"rgba(255,255,255,0.5)", letterSpacing:1, textShadow: sel?`0 0 8px ${c}`:""  }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: PICK VIBE ── */}
        {step === 2 && (
          <div style={{ flex:1 }}>
            <div style={{ marginBottom:24, marginTop:8 }}>
              <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:22, color:"#fff", letterSpacing:2, marginBottom:8 }}>PICK YOUR VIBE</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", fontFamily:"'DM Sans',sans-serif" }}>What kind of clips do you want to see?</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { id:"clutch", label:"CLUTCH MOMENTS", desc:"1v5 aces, last-second wins, insane plays", emoji:"🔥", color:"#FF00CC" },
                { id:"pro",    label:"PRO ONLY",       desc:"Official tournament highlights",         emoji:"👑", color:"#FFD700" },
                { id:"play",   label:"BEST PLAYS",     desc:"Top mechanical plays and highlights",    emoji:"⚡", color:"#00F5FF" },
                { id:"funny",  label:"FUNNY MOMENTS",  desc:"Fails, trolls, and comedy clips",        emoji:"💀", color:"#BF00FF" },
              ].map(v => {
                const sel = cats.includes(v.id);
                return (
                  <button key={v.id} onClick={() => toggleCat(v.id)}
                    style={{ padding:"16px", borderRadius:14, background: sel?`${v.color}18`:"rgba(255,255,255,0.04)", border:`1.5px solid ${sel?v.color:"rgba(255,255,255,0.1)"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:14, boxShadow: sel?`0 0 14px ${v.color}35`:"none", transition:"all 0.2s" }}>
                    <span style={{ fontSize:24 }}>{v.emoji}</span>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:13, color: sel?v.color:"rgba(255,255,255,0.8)", letterSpacing:1 }}>{v.label}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif", marginTop:3 }}>{v.desc}</div>
                    </div>
                    {sel && <div style={{ width:22, height:22, borderRadius:"50%", background:v.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#000", fontWeight:800 }}>✓</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: FOLLOW PROS ── */}
        {step === 3 && (
          <div style={{ flex:1 }}>
            <div style={{ marginBottom:20, marginTop:8 }}>
              <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:22, color:"#fff", letterSpacing:2, marginBottom:8 }}>FOLLOW PLAYERS</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", fontFamily:"'DM Sans',sans-serif" }}>Follow at least 1 to personalise your feed</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {ONBOARD_PROS.map((p, i) => {
                const gameKey = ["valorant","valorant","cs2","cs2","valorant","fortnite","fortnite","lol"][i];
                const c = GAME_COLORS[gameKey];
                const sel = follows.includes(p);
                return (
                  <button key={p} onClick={() => toggleFollow(p)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, background: sel?"rgba(0,245,255,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${sel?"rgba(0,245,255,0.35)":"rgba(255,255,255,0.08)"}`, cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${c}60,rgba(0,0,0,0.85))`, border:`1.5px solid ${c}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:c, fontFamily:"'Chakra Petch',sans-serif", flexShrink:0 }}>{p[0]}</div>
                    <div style={{ flex:1, textAlign:"left" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{p}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:500, marginTop:1 }}>{GAME_LABELS[gameKey]} Pro</div>
                    </div>
                    <div style={{ width:28, height:28, borderRadius:"50%", background: sel?"#00F5FF":"rgba(255,255,255,0.08)", border:`1px solid ${sel?"#00F5FF":"rgba(255,255,255,0.15)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color: sel?"#000":"rgba(255,255,255,0.4)", fontWeight:800, transition:"all 0.15s" }}>
                      {sel ? "✓" : "+"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 4: READY ── */}
        {step === 4 && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", gap:20 }}>
            <div style={{ fontSize:64, animation:"pulse 1.5s ease-in-out infinite" }}>⚡</div>
            <div>
              <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:24, color:"#00F5FF", textShadow:"0 0 20px #00F5FF", letterSpacing:2, marginBottom:10 }}>YOU'RE ALL SET!</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.55)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.7, maxWidth:300 }}>
                Your ClutchFeed is personalised and ready. {follows.length} player{follows.length!==1?"s":""} followed. {games.length} game{games.length!==1?"s":""} selected.
              </div>
            </div>
            <div style={{ padding:"14px 20px", background:"rgba(0,245,255,0.08)", border:"1px solid rgba(0,245,255,0.25)", borderRadius:14, maxWidth:300 }}>
              <div style={{ fontSize:11, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(0,245,255,0.7)", letterSpacing:2, marginBottom:6 }}>YOUR FEED INCLUDES</div>
              {games.length > 0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif" }}>🎮 {games.map(g => GAME_LABELS[g]).join(", ")}</div>}
              {cats.length > 0  && <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>⚡ {cats.map(c => c.charAt(0).toUpperCase()+c.slice(1)).join(", ")}</div>}
              {follows.length > 0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>👤 Following: {follows.join(", ")}</div>}
            </div>
          </div>
        )}

      </div>

      {/* CTA Button */}
      <div style={{ padding:"0 24px 44px", position:"relative", zIndex:1 }}>
        {step > 0 && step < 4 && (
          <button onClick={() => setStep(s => s-1)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", fontFamily:"'Chakra Petch',sans-serif", fontSize:12, letterSpacing:1, marginBottom:12, display:"block" }}>← BACK</button>
        )}
        <button onClick={next} disabled={!canNext}
          style={{ width:"100%", padding:"16px", background: canNext?"linear-gradient(135deg,#00F5FF,#0044FF)":"rgba(255,255,255,0.06)", border:`1.5px solid ${canNext?"#00F5FF":"rgba(255,255,255,0.08)"}`, borderRadius:14, color: canNext?"#000":"rgba(255,255,255,0.2)", fontSize:15, fontWeight:800, cursor: canNext?"pointer":"not-allowed", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:3, boxShadow: canNext?"0 0 24px rgba(0,245,255,0.4)":"none", transition:"all 0.2s" }}>
          {["GET STARTED →", "NEXT: PICK VIBE →", "NEXT: FOLLOW PROS →", "ALMOST THERE →", "LAUNCH MY FEED ⚡"][step]}
        </button>
        {step === 0 && (
          <button onClick={() => onComplete({ games:[], cats:[], follows:[] })} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.25)", fontFamily:"'Chakra Petch',sans-serif", fontSize:11, letterSpacing:1, marginTop:14, display:"block", width:"100%", textAlign:"center" }}>SKIP SETUP</button>
        )}
      </div>
    </div>
  );
}


// ─── WEEKLY LEADERBOARD ───────────────────────────────────────────────────────
function WeeklyLeaderboard({ clips, onPlay }) {
  const top = [...clips].sort((a,b) => b.likes - a.likes).slice(0,3);
  if (top.length < 3) return null;
  const medals = ["🥇","🥈","🥉"];
  const medalColors = ["#FFD700","#C0C0C0","#CD7F32"];
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", flexShrink:0 }}>
          <rect x="2" y="0" width="3" height="1" fill="#FFD700"/>
          <rect x="1" y="1" width="1" height="1" fill="#FFD700"/>
          <rect x="0" y="2" width="1" height="3" fill="#FFD700"/>
          <rect x="1" y="5" width="1" height="1" fill="#FFD700"/>
          <rect x="2" y="6" width="3" height="1" fill="#FFD700"/>
        </svg>
        <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:11, letterSpacing:3, color:"#FFD700", textShadow:"0 0 8px #FFD70088" }}>TOP THIS WEEK</span>
        <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", transform:"scaleX(-1)", flexShrink:0 }}>
          <rect x="2" y="0" width="3" height="1" fill="#FFD700"/>
          <rect x="1" y="1" width="1" height="1" fill="#FFD700"/>
          <rect x="0" y="2" width="1" height="3" fill="#FFD700"/>
          <rect x="1" y="5" width="1" height="1" fill="#FFD700"/>
          <rect x="2" y="6" width="3" height="1" fill="#FFD700"/>
        </svg>
        <div style={{ flex:1, height:1, background:"linear-gradient(to right,#FFD70044,transparent)" }} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {top.map((clip, i) => {
          const gc = GAME_COLORS[clip.game] || "#00F5FF";
          return (
            <button key={clip.id} onClick={() => onPlay(clip.id)}
              style={{ flex:1, borderRadius:12, overflow:"hidden", background:"linear-gradient(145deg,#141424,#0E0E1E)", border:`1px solid ${medalColors[i]}44`, cursor:"pointer", padding:0, textAlign:"left", boxShadow:`0 4px 16px ${medalColors[i]}18` }}>
              <div style={{ position:"relative", aspectRatio:"16/9", overflow:"hidden" }}>
                <Thumb seed={clip.thumbSeed} game={clip.game} extraStyle={{ width:"100%", height:"100%" }}>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0E0E1E,transparent 60%)" }} />
                  <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.14) 3px,rgba(0,0,0,0.14) 4px)", pointerEvents:"none" }} />
                </Thumb>
                <div style={{ position:"absolute", top:5, left:6, fontSize:16 }}>{medals[i]}</div>
                <div style={{ position:"absolute", bottom:5, right:5, background:"rgba(0,0,0,0.8)", padding:"2px 5px", borderRadius:5 }}>
                  <span style={{ fontSize:8, fontFamily:"'Chakra Petch',sans-serif", color:"#00F5FF" }}>{fmt(clip.likes)}</span>
                </div>
              </div>
              <div style={{ padding:"7px 8px" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#fff", fontFamily:"'DM Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.3 }}>{clip.title}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                  <Icon name={GAME_ICON[clip.game] || "grid"} size={9} color={gc} />
                  <span style={{ fontFamily:"'Chakra Petch',sans-serif", letterSpacing:0.5, color:gc, fontSize:9 }}>{GAME_LABELS[clip.game]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ─── CLIP CHALLENGE (ORIGINAL FEATURE) ───────────────────────────────────────
// Merges "live ops events", "seasonal modes", and "first 24hr challenge wins
// featured placement" from both research docs into one reusable feature
const ACTIVE_CHALLENGE = {
  game: "valorant",
  title: "POST YOUR BEST CLUTCH",
  subtitle: "Most-reacted clip wins featured placement on the feed",
  reward: "Featured on ClutchFeed for 48 hours",
  entries: 847,
  endsIn: "3d 14h",
  event: "VCT Americas 2026",
};

function ClipChallenge({ onSubmit, activeGame }) {
  const ch = ACTIVE_CHALLENGE;
  const gc = GAME_COLORS[ch.game] || "#00F5FF";
  const show = activeGame === "all" || activeGame === ch.game;
  if (!show) return null;
  return (
    <div style={{ marginBottom:16, borderRadius:14, overflow:"hidden", background:`linear-gradient(135deg,${gc}14,rgba(255,0,204,0.08),#0E0E1E)`, border:`1px solid ${gc}40`, boxShadow:`0 4px 24px ${gc}18`, position:"relative" }}>
      {/* Animated corner accent */}
      <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right,${gc}22,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(to right,${gc},#FF00CC,${gc})`, animation:"shimmer 3s linear infinite", backgroundSize:"200% 100%" }} />
      <div style={{ padding:"14px 14px 12px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <span style={{ fontSize:14 }}>⚔️</span>
              <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:gc, letterSpacing:2 }}>WEEKLY CHALLENGE</span>
              <div style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(255,0,40,0.15)", border:"1px solid rgba(255,0,40,0.3)", borderRadius:10, padding:"2px 6px" }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"#FF0040", animation:"pulse 1s infinite" }} />
                <span style={{ fontSize:7, fontFamily:"'Chakra Petch',sans-serif", color:"#FF0040", letterSpacing:1 }}>LIVE</span>
              </div>
            </div>
            <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", color:"#fff", letterSpacing:1, textShadow:`0 0 10px ${gc}55` }}>{ch.title}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, marginTop:3 }}>{ch.event}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1 }}>ENDS IN</div>
            <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", color:"#FF00CC", textShadow:"0 0 8px #FF00CC88" }}>{ch.endsIn}</div>
          </div>
        </div>

        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Sans',sans-serif", marginBottom:12, lineHeight:1.5 }}>{ch.subtitle}</div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", background:"rgba(0,0,0,0.3)", borderRadius:10, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>🏆</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{ch.reward}</span>
          </div>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onSubmit}
            style={{ flex:2, padding:"11px", background:`linear-gradient(135deg,${gc},${gc}88)`, border:"none", borderRadius:10, color:"#000", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:2 }}>
            SUBMIT CLIP
          </button>
          <button style={{ flex:1, padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"rgba(255,255,255,0.55)", fontSize:11, cursor:"pointer", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1 }}>
            {ch.entries} ENTRIES
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── COMMENTS SHEET ───────────────────────────────────────────────────────────
const MOCK_COMMENTS = [
  { id:1, user:"xSentinel_",  text:"That ace was absolutely insane bro 🔥",     time:"2m ago",  likes:14 },
  { id:2, user:"ProViewer99", text:"How did he even hit that through smoke??",   time:"5m ago",  likes:8  },
  { id:3, user:"ValorantFan", text:"GG this guy is built different",             time:"12m ago", likes:22 },
  { id:4, user:"CS2Watcher",  text:"@ProViewer99 practice, pure practice lol",   time:"14m ago", likes:3  },
  { id:5, user:"ClutchKing_", text:"This needs to be on the leaderboard ASAP",   time:"31m ago", likes:17 },
];

function CommentsSheet({ clip, onClose }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const gc = GAME_COLORS[clip?.game] || "#00F5FF";

  const submit = () => {
    if (!text.trim()) return;
    setComments(c => [{ id:Date.now(), user:"You", text:text.trim(), time:"just now", likes:0 }, ...c]);
    setText("");
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:350, background:"rgba(0,0,20,0.88)", display:"flex", alignItems:"flex-end", animation:"fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:430, margin:"0 auto", background:"linear-gradient(180deg,#0F0030,#0A0B10)", borderRadius:"22px 22px 0 0", borderTop:`2px solid ${gc}55`, maxHeight:"75vh", display:"flex", flexDirection:"column", animation:"slideUpModal 0.28s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:13, color:gc, letterSpacing:2 }}>COMMENTS</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'Chakra Petch',sans-serif" }}>{comments.length}</span>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"50%", width:30, height:30, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${gc}44,rgba(0,0,0,0.8))`, border:`1px solid ${gc}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:gc, fontFamily:"'Chakra Petch',sans-serif", flexShrink:0 }}>{c.user[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{c.user}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>{c.time}</span>
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.45 }}>{c.text}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                  <Icon name="heart" size={10} color="rgba(255,255,255,0.3)" /> {c.likes}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"10px 16px 34px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submit()}
            placeholder="Add a comment... @mention someone"
            style={{ flex:1, padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${gc}30`, borderRadius:22, color:"#fff", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }} />
          <button onClick={submit} style={{ padding:"10px 16px", background: text.trim()?`${gc}22`:"rgba(255,255,255,0.04)", border:`1px solid ${text.trim()?gc:"rgba(255,255,255,0.08)"}`, borderRadius:22, color: text.trim()?gc:"rgba(255,255,255,0.3)", fontSize:12, cursor: text.trim()?"pointer":"default", fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, transition:"all 0.15s" }}>POST</button>
        </div>
      </div>
    </div>
  );
}


function Icon({ name, size = 18, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"
      style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", display:"block", flexShrink:0 }}>
      {(ICONS[name] || ICONS.grid).map(([x,y,w,h,o], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={color} opacity={o || 1} />
      ))}
    </svg>
  );
}

// ─── PILL ─────────────────────────────────────────────────────────────────────
function Pill({ active, color = "#00F5FF", onClick, icon, label, small }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap: small ? 5 : 6,
      padding: small ? "5px 11px" : "7px 14px", borderRadius:50,
      border: `1.5px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
      background: active ? `${color}1E` : "rgba(255,255,255,0.04)",
      color: active ? color : "rgba(255,255,255,0.42)",
      cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
      boxShadow: active ? `0 0 14px ${color}50,inset 0 0 10px ${color}10` : "none",
      transition:"all 0.18s",
    }}>
      {icon && <Icon name={icon} size={small ? 11 : 13} color={active ? color : "rgba(255,255,255,0.38)"} />}
      <span style={{
        fontFamily:"'Chakra Petch',sans-serif", fontWeight:700,
        fontSize: small ? 11 : 12, letterSpacing:0.8,
        textShadow: active ? `0 0 8px ${color}80` : "none",
      }}>{label}</span>
    </button>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ label, accent = "#00F5FF" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", flexShrink:0 }}>
        <rect x="2" y="0" width="3" height="1" fill={accent}/>
        <rect x="1" y="1" width="1" height="1" fill={accent}/>
        <rect x="0" y="2" width="1" height="3" fill={accent}/>
        <rect x="1" y="5" width="1" height="1" fill={accent}/>
        <rect x="2" y="6" width="3" height="1" fill={accent}/>
      </svg>
      <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:11, letterSpacing:3, color:accent, textShadow:`0 0 8px ${accent}88` }}>{label}</span>
      <svg width={10} height={14} viewBox="0 0 5 7" style={{ imageRendering:"pixelated", shapeRendering:"crispEdges", transform:"scaleX(-1)", flexShrink:0 }}>
        <rect x="2" y="0" width="3" height="1" fill={accent}/>
        <rect x="1" y="1" width="1" height="1" fill={accent}/>
        <rect x="0" y="2" width="1" height="3" fill={accent}/>
        <rect x="1" y="5" width="1" height="1" fill={accent}/>
        <rect x="2" y="6" width="3" height="1" fill={accent}/>
      </svg>
      <div style={{ flex:1, height:1, background:`linear-gradient(to right,${accent}44,transparent)` }} />
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ marginBottom:14, borderRadius:14, overflow:"hidden", background:"#141424" }}>
      <div style={{ aspectRatio:"16/9", background:"linear-gradient(90deg,#1a1a2e 0%,#2a1a4e 50%,#1a1a2e 100%)", backgroundSize:"200% 100%", animation:"shimmer 1.6s infinite" }} />
      <div style={{ padding:"12px 14px" }}>
        <div style={{ height:15, background:"linear-gradient(90deg,#1a1a2e,#2a1a4e,#1a1a2e)", backgroundSize:"200% 100%", borderRadius:8, marginBottom:8, animation:"shimmer 1.6s infinite 0.1s" }} />
        <div style={{ height:12, background:"linear-gradient(90deg,#141424,#1a1a2e,#141424)", backgroundSize:"200% 100%", borderRadius:8, width:"55%", animation:"shimmer 1.6s infinite 0.2s" }} />
      </div>
    </div>
  );
}

// ─── THUMBNAIL ────────────────────────────────────────────────────────────────
function Thumb({ seed, game, extraStyle, children }) {
  const [failed, setFailed] = useState(false);
  const gc = GAME_COLORS[game] || "#00F5FF";
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background: failed ? `linear-gradient(135deg,${gc}22,#0a0020)` : "#0a0020",
      ...(extraStyle || {}),
    }}>
      {failed && (
        <>
          <div style={{ position:"absolute", inset:0, background:`repeating-linear-gradient(0deg,${gc}08 0px,${gc}08 1px,transparent 1px,transparent 22px),repeating-linear-gradient(90deg,${gc}08 0px,${gc}08 1px,transparent 1px,transparent 22px)` }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
            <Icon name={GAME_ICON[game] || "grid"} size={36} color={`${gc}55`} />
            <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontSize:9, color:`${gc}44`, letterSpacing:2 }}>{GAME_LABELS[game] || "CLUTCHFEED"}</span>
          </div>
        </>
      )}
      <img src={`https://picsum.photos/seed/${seed}/800/450`} alt="" onError={() => setFailed(true)}
        style={{ width:"100%", height:"100%", objectFit:"cover", display: failed ? "none" : "block", filter:"brightness(0.55) saturate(1.3) hue-rotate(8deg)" }} />
      {children}
    </div>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = "md" }) {
  const h = size === "lg" ? 48 : size === "sm" ? 28 : 36;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <div style={{ width:h, height:h, borderRadius:Math.round(h*0.25), background:"linear-gradient(135deg,#00F5FF,#0044FF,#7700FF)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 ${h*0.5}px rgba(0,245,255,0.5)`, flexShrink:0 }}>
        <svg viewBox="0 0 10 10" width={h*0.6} height={h*0.6} style={{ imageRendering:"pixelated", shapeRendering:"crispEdges" }}>
          <rect x="1" y="1" width="4" height="1" fill="#fff"/>
          <rect x="1" y="2" width="1" height="3" fill="#fff"/>
          <rect x="1" y="4" width="3" height="1" fill="#fff"/>
          <rect x="6" y="1" width="1" height="7" fill="#fff"/>
          <rect x="7" y="1" width="2" height="1" fill="#fff"/>
          <rect x="7" y="4" width="2" height="1" fill="#fff"/>
          <rect x="7" y="7" width="2" height="1" fill="#fff"/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize: size==="lg" ? 26 : size==="sm" ? 16 : 20, letterSpacing:3, lineHeight:1, color:"#fff", textShadow:"0 0 16px rgba(0,245,255,0.5)" }}>
          CLUTCH<span style={{ color:"#FF00CC", textShadow:"0 0 12px rgba(255,0,204,0.7)" }}>FEED</span>
        </div>
        {size !== "sm" && <div style={{ fontSize:9, letterSpacing:4, color:"rgba(0,245,255,0.6)", fontFamily:"'Chakra Petch',sans-serif", marginTop:1 }}>ESPORTS</div>}
      </div>
    </div>
  );
}

// ─── ARENA HERO ───────────────────────────────────────────────────────────────
function ArenaHero() {
  return (
    <div style={{ position:"relative", height:200, overflow:"hidden", background:"#04000E" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%,#1a0040 0%,#0a0020 45%,#04000E 100%)" }} />
      {[...Array(28)].map((_, i) => (
        <div key={i} style={{ position:"absolute", left:`${(i*41+7)%100}%`, top:`${(i*29+3)%55}%`, width: i%5===0?2:1, height: i%5===0?2:1, background:"#fff", opacity: 0.1+(i%6)*0.08, borderRadius:"50%", animation:`twinkle ${2.5+(i%4)*0.5}s ease-in-out infinite`, animationDelay:`${(i*0.4)%3}s` }} />
      ))}
      {[[12,-20,"rgba(255,0,204,0.5)"],[20,-12,"rgba(0,245,255,0.4)"],[7,-28,"rgba(255,214,0,0.25)"]].map(([l,r,c],i) => (
        <div key={i} style={{ position:"absolute", bottom:0, left:`${l}%`, width: i===0?2:1, height:`${55+i*5}%`, background:`linear-gradient(to top,${c},transparent)`, transform:`rotate(${r}deg)`, transformOrigin:"bottom center" }} />
      ))}
      {[[88,20,"rgba(255,0,204,0.5)"],[80,12,"rgba(0,245,255,0.4)"],[93,28,"rgba(191,0,255,0.25)"]].map(([l,r,c],i) => (
        <div key={i} style={{ position:"absolute", bottom:0, left:`${l}%`, width: i===0?2:1, height:`${55+i*5}%`, background:`linear-gradient(to top,${c},transparent)`, transform:`rotate(${r}deg)`, transformOrigin:"bottom center" }} />
      ))}
      <svg viewBox="0 0 430 70" preserveAspectRatio="none" style={{ position:"absolute", bottom:0, left:0, width:"100%", height:70, imageRendering:"pixelated" }}>
        <defs>
          <linearGradient id="cgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#200050" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#0a0020"/>
          </linearGradient>
        </defs>
        {[[0,40,14,30],[14,48,10,22],[24,38,18,32],[42,52,10,18],[52,42,14,28],[66,46,18,24],[84,36,14,34],[98,50,10,20],[108,40,18,30],[126,48,14,22],[140,38,18,32],[158,52,10,18],[168,44,14,26],[182,48,18,22],[200,38,14,32],[214,50,10,20],[224,42,18,28],[242,48,14,22],[256,38,18,32],[274,52,10,18],[284,44,14,26],[298,46,18,24],[316,38,14,32],[330,50,10,20],[340,42,18,28],[358,46,14,24],[372,38,18,32],[390,52,10,18],[400,44,14,26],[414,48,16,22]].map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="url(#cgGrad)"/>
        ))}
        {[18,38,60,82,108,135,162,188,215,242,268,295,322,348,375,402,25,55,90,120,150].map((x,i) => (
          <rect key={`g${i}`} x={x} y={36+(i%5)*5} width={2} height={2} fill={["#FF00CC","#00F5FF","#FFD700","#BF00FF","#FF2D55"][i%5]} opacity={0.5+(i%3)*0.2}/>
        ))}
      </svg>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"linear-gradient(to right,transparent,#FF00CC 30%,#00F5FF 50%,#FF00CC 70%,transparent)", boxShadow:"0 0 16px #FF00CC,0 0 30px rgba(0,245,255,0.5)" }} />
      <div style={{ position:"absolute", top:"14%", left:0, right:0, display:"flex", justifyContent:"center" }}><Logo size="lg" /></div>
      <div style={{ position:"absolute", bottom:14, left:0, right:0, display:"flex", justifyContent:"center", gap:20 }}>
        {[["640M+","FANS"],["10M+","CLIPS"],["2026","WORLDS"]].map(([v,l]) => (
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:11, color:"#00F5FF", textShadow:"0 0 8px #00F5FF" }}>{v}</div>
            <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontSize:7, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:5, background:"rgba(255,0,40,0.15)", border:"1px solid rgba(255,0,40,0.5)", borderRadius:20, padding:"4px 11px", backdropFilter:"blur(8px)" }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:"#FF0040", animation:"pulse 1s infinite" }} />
        <span style={{ fontSize:10, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:"#FF0040", letterSpacing:2 }}>LIVE</span>
      </div>
      <div style={{ position:"absolute", top:14, left:14, width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <span style={{ fontSize:15 }}>🔔</span>
      </div>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,#04000E 0%,transparent 20%,transparent 75%,#0A0B10 100%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)", pointerEvents:"none" }} />
    </div>
  );
}

// ─── VIDEO PLAYER ─────────────────────────────────────────────────────────────
function VideoPlayer({ clips, startIndex, onClose, onLike }) {
  const [idx, setIdx]                 = useState(startIndex);
  const [muted, setMuted]             = useState(true);
  const [loading, setLoading]         = useState(true);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => { setLoading(true); setEmbedFailed(false); }, [idx]);

  const clip    = clips[idx] || clips[0];
  const gc      = GAME_COLORS[clip.game] || "#00F5FF";
  const hasPrev = idx > 0;
  const hasNext = idx < clips.length - 1;
  const ytSrc   = clip.ytId
    ? `https://www.youtube-nocookie.com/embed/${clip.ytId}?autoplay=1&mute=${muted?1:0}&rel=0&modestbranding=1`
    : null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(2,0,10,0.98)", display:"flex", flexDirection:"column", animation:"fadeIn 0.2s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:"rgba(0,245,255,0.7)", letterSpacing:2 }}>NOW PLAYING</span>
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", background:`${gc}1A`, border:`1px solid ${gc}`, color:gc, fontFamily:"'Chakra Petch',sans-serif", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}>
            <Icon name={GAME_ICON[clip.game] || "grid"} size={10} color={gc} />
            {GAME_LABELS[clip.game] || clip.game.toUpperCase()}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'Chakra Petch',sans-serif" }}>{idx+1}/{clips.length}</span>
          <button onClick={onClose} style={{ background:"rgba(255,0,204,0.12)", border:"1px solid rgba(255,0,204,0.35)", borderRadius:"50%", width:34, height:34, cursor:"pointer", color:"#FF00CC", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="close" size={14} color="#FF00CC" />
          </button>
        </div>
      </div>

      <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#000", flexShrink:0 }}>
        {loading && !embedFailed && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#000", zIndex:5 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:48, height:48, border:`3px solid ${gc}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
              <span style={{ fontSize:10, fontFamily:"'Chakra Petch',sans-serif", color:`${gc}88`, letterSpacing:2 }}>LOADING</span>
            </div>
          </div>
        )}

        {!embedFailed && ytSrc ? (
          <iframe key={`${idx}-${muted}`} src={ytSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen onLoad={() => setLoading(false)} onError={() => { setEmbedFailed(true); setLoading(false); }}
            style={{ width:"100%", height:"100%", border:"none", display:"block" }} />
        ) : (
          <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${gc}18,#0a0020)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)" }} />
            <div style={{ width:64, height:64, borderRadius:16, background:"rgba(0,0,0,0.7)", border:`2px solid ${gc}`, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
              <Icon name="play" size={28} color={gc} />
            </div>
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(clip.title+" esports")}`}
              target="_blank" rel="noreferrer"
              style={{ background:`linear-gradient(135deg,${gc},${gc}88)`, borderRadius:20, padding:"10px 22px", color:"#000", fontSize:12, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", letterSpacing:2, textDecoration:"none", zIndex:1 }}>
              WATCH ON YOUTUBE ↗
            </a>
          </div>
        )}

        {!embedFailed && !loading && (
          <button onClick={() => setMuted(m => !m)} style={{ position:"absolute", bottom:10, right:10, background:"rgba(0,0,0,0.7)", border:`1px solid ${gc}60`, borderRadius:8, padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name={muted ? "mute" : "unmute"} size={12} color={gc} />
            <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", color:gc, letterSpacing:1 }}>{muted ? "TAP TO UNMUTE" : "MUTED"}</span>
          </button>
        )}
      </div>

      <div style={{ padding:"14px 16px", flex:1, overflowY:"auto" }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:10, lineHeight:1.35, fontFamily:"'DM Sans',sans-serif" }}>{clip.title}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:`${gc}1A`, border:`1.5px solid ${gc}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", color:gc }}>
              {(clip.player || "?")[0]}
            </div>
            <span style={{ fontSize:14, fontWeight:600 }}>{clip.player}</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>· {clip.time}</span>
          </div>
          <button onClick={() => onLike(clip.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color: clip.liked?"#FF2D55":"rgba(255,255,255,0.45)", fontSize:13, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif" }}>
            <Icon name="heart" size={14} color={clip.liked?"#FF2D55":"rgba(255,255,255,0.4)"} />
            {fmt(clip.likes)}
          </button>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <button onClick={() => hasPrev && setIdx(i => i-1)} disabled={!hasPrev}
            style={{ flex:1, padding:"12px", background: hasPrev?"rgba(0,245,255,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${hasPrev?"rgba(0,245,255,0.3)":"rgba(255,255,255,0.06)"}`, borderRadius:12, cursor: hasPrev?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8, color: hasPrev?"#00F5FF":"rgba(255,255,255,0.2)", fontFamily:"'Chakra Petch',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1 }}>
            <Icon name="prev" size={12} color={hasPrev?"#00F5FF":"rgba(255,255,255,0.2)"} /> PREV
          </button>
          <button onClick={() => hasNext && setIdx(i => i+1)} disabled={!hasNext}
            style={{ flex:1, padding:"12px", background: hasNext?"rgba(255,0,204,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${hasNext?"rgba(255,0,204,0.3)":"rgba(255,255,255,0.06)"}`, borderRadius:12, cursor: hasNext?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8, color: hasNext?"#FF00CC":"rgba(255,255,255,0.2)", fontFamily:"'Chakra Petch',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1 }}>
            NEXT <Icon name="next" size={12} color={hasNext?"#FF00CC":"rgba(255,255,255,0.2)"} />
          </button>
        </div>

        {hasNext && (
          <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(255,255,255,0.3)", letterSpacing:1, flexShrink:0 }}>UP NEXT</span>
            <Thumb seed={clips[idx+1].thumbSeed} game={clips[idx+1].game} extraStyle={{ width:50, height:32, borderRadius:6, flexShrink:0 }} />
            <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{clips[idx+1].title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ClutchFeed() {
  const [activeGame, setActiveGame]         = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [feedTab, setFeedTab]               = useState("foryou");
  const [clips, setClips]                   = useState(SEED_CLIPS);
  const [playerOpen, setPlayerOpen]         = useState(false);
  const [playerStart, setPlayerStart]       = useState(0);
  const [activeNav, setActiveNav]           = useState("feed");
  const [showSubmit, setShowSubmit]         = useState(false);
  const [submitGame, setSubmitGame]         = useState(null);
  const [submitUrl, setSubmitUrl]           = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [newCount, setNewCount]             = useState(0);
  const [showBanner, setShowBanner]         = useState(false);
  const [streak]                              = useState(7); // days - will come from backend
  const [showOnboarding, setShowOnboarding]   = useState(true);
  const [showComments, setShowComments]       = useState(false);
  const [commentClip, setCommentClip]         = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const filtered = clips.filter(c => {
    const gameMatch = activeGame === "all" || c.game === activeGame;
    const catMatch  = activeCategory === "all" || c.category === activeCategory;
    const tabMatch  = feedTab === "following" ? c.category === "pro" : true;
    return gameMatch && catMatch && tabMatch;
  });

  const toggleLike = (id) =>
    setClips(p => p.map(c => c.id===id ? { ...c, liked:!c.liked, likes: c.liked ? c.likes-1 : c.likes+1 } : c));

  const toggleSave = (id, e) => {
    e?.stopPropagation();
    setClips(p => p.map(c => c.id===id ? { ...c, saved:!c.saved } : c));
  };

  const toggleReaction = (clipId, reactionKey) => {
    setClips(p => p.map(c => {
      if (c.id !== clipId) return c;
      const prev = c.reactions?.mine;
      const reactions = { ...c.reactions };
      // Remove previous reaction
      if (prev) reactions[prev] = Math.max(0, (reactions[prev] || 0) - 1);
      // Set new reaction (toggle off if same)
      if (prev === reactionKey) {
        reactions.mine = null;
      } else {
        reactions[reactionKey] = (reactions[reactionKey] || 0) + 1;
        reactions.mine = reactionKey;
      }
      return { ...c, reactions };
    }));
  };

  const openPlayer = (clipId) => {
    const idx = filtered.findIndex(c => c.id === clipId);
    setPlayerStart(Math.max(0, idx));
    setPlayerOpen(true);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const fresh = await fetchAIClips(activeGame, 5);
    if (fresh.length > 0) {
      setClips(prev => [...fresh, ...prev.map(c => ({ ...c, isNew:false }))]);
      setNewCount(fresh.length);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    }
    setRefreshing(false);
  };

  const handleSubmit = () => {
    if (!submitUrl || !submitGame) return;
    const match = submitUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/);
    const ytId  = match?.[1] || pickYt(submitGame);
    setClips(p => [{
      id: Date.now(), game: submitGame, category:"play",
      title: `Community Clip — ${GAME_LABELS[submitGame]}`,
      player:"You", views:"0", likes:0, liked:false, saved:false,
      time:"just now", thumbSeed: Math.floor(Math.random()*96)+2, ytId, isNew:true,
    }, ...p]);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowSubmit(false); setSubmitUrl(""); setSubmitGame(null); }, 2000);
  };

  const savedClips = clips.filter(c => c.saved);

  const completeOnboarding = ({ games, cats }) => {
    setShowOnboarding(false);
    if (games.length > 0) setActiveGame(games[0]);
    if (cats.length > 0) setActiveCategory(cats[0]);
  };

  const openComments = (clip, e) => { e?.stopPropagation(); setCommentClip(clip); setShowComments(true); };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0A0B10", minHeight:"100vh", maxWidth:430, margin:"0 auto", color:"#fff", overflowX:"hidden", position:"relative" }}>
      <style>{`
        *{box-sizing:border-box;} ::-webkit-scrollbar{display:none;}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUpModal{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes twinkle{0%,100%{opacity:0.15}50%{opacity:0.85}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{transform:translateY(-100px)}100%{transform:translateY(100vh)}}
        .card{transition:transform 0.15s;cursor:pointer;} .card:active{transform:scale(0.982);}
        .nbtn{background:none;border:none;cursor:pointer;transition:all 0.15s;padding:0;} .nbtn:active{transform:scale(0.88);}
        .pill-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;}
        input::placeholder{color:rgba(0,245,255,0.22);} input{caret-color:#00F5FF;} iframe{display:block;}
      `}</style>

      {/* ONBOARDING */}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      {/* COMMENTS */}
      {showComments && commentClip && <CommentsSheet clip={commentClip} onClose={() => setShowComments(false)} />}

      {/* BG */}
      <div style={{ position:"fixed", inset:0, maxWidth:430, margin:"0 auto", pointerEvents:"none", zIndex:0, background:`repeating-linear-gradient(0deg,rgba(0,245,255,0.018) 0px,rgba(0,245,255,0.018) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(0,245,255,0.018) 0px,rgba(0,245,255,0.018) 1px,transparent 1px,transparent 48px)` }} />
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, height:80, background:"linear-gradient(to bottom,transparent,rgba(0,245,255,0.02),transparent)", zIndex:1, pointerEvents:"none", animation:"scanline 12s linear infinite" }} />
      <div style={{ position:"fixed", inset:0, maxWidth:430, margin:"0 auto", pointerEvents:"none", zIndex:2, background:"repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)" }} />

      <div style={{ position:"relative", zIndex:10 }}><ArenaHero /></div>

      {/* Sticky header */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(8,6,18,0.97)", backdropFilter:"blur(18px)", borderBottom:"1px solid rgba(0,245,255,0.07)" }}>
        {activeNav === "feed" && (
          <>
            <div style={{ display:"flex", gap:4, padding:"10px 16px 8px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {[{id:"foryou",label:"FOR YOU"},{id:"following",label:"FOLLOWING"}].map(t => (
                <button key={t.id} onClick={() => setFeedTab(t.id)} style={{ flex:1, padding:"8px 0", background:"none", border:"none", cursor:"pointer", color: feedTab===t.id?"#00F5FF":"rgba(255,255,255,0.35)", fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:12, letterSpacing:2, borderBottom:`2px solid ${feedTab===t.id?"#00F5FF":"transparent"}`, transition:"all 0.18s" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="pill-row" style={{ padding:"10px 14px 6px" }}>
              {GAMES.map(g => <Pill key={g.id} active={activeGame===g.id} color={GAME_COLORS[g.id]} onClick={() => setActiveGame(g.id)} icon={GAME_ICON[g.id]} label={g.label} />)}
            </div>
            <div className="pill-row" style={{ padding:"6px 14px 12px" }}>
              {CATEGORIES.map(c => <Pill key={c.id} active={activeCategory===c.id} color="#FF00CC" onClick={() => setActiveCategory(c.id)} icon={CAT_ICON[c.id]} label={c.label} small />)}
            </div>
          </>
        )}
        {activeNav !== "feed" && (
          <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <Logo size="sm" />
            <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:14, color:"#00F5FF", textShadow:"0 0 10px #00F5FF", letterSpacing:3 }}>
              {{ search:"SEARCH", saved:"SAVED", profile:"PROFILE" }[activeNav]}
            </span>
          </div>
        )}
      </div>

      {/* FEED */}
      {activeNav === "feed" && (
        <div style={{ padding:"12px 14px", paddingBottom:110, position:"relative", zIndex:3 }}>
          {showBanner && (
            <div style={{ marginBottom:12, padding:"10px 14px", background:"linear-gradient(135deg,rgba(0,245,255,0.15),rgba(255,0,204,0.1))", border:"1px solid rgba(0,245,255,0.35)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", animation:"slideDown 0.3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Icon name="bolt" size={14} color="#00F5FF" />
                <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:12, color:"#00F5FF", letterSpacing:1 }}>{newCount} NEW CLIPS ADDED</span>
              </div>
              <button className="nbtn" onClick={() => setShowBanner(false)} style={{ color:"rgba(255,255,255,0.4)", fontSize:16 }}>✕</button>
            </div>
          )}

          <button onClick={handleRefresh} disabled={refreshing} style={{ width:"100%", marginBottom:14, padding:"11px", background: refreshing?"rgba(255,255,255,0.03)":"rgba(0,245,255,0.07)", border:`1px solid ${refreshing?"rgba(255,255,255,0.08)":"rgba(0,245,255,0.25)"}`, borderRadius:12, cursor: refreshing?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, color: refreshing?"rgba(255,255,255,0.3)":"#00F5FF", fontFamily:"'Chakra Petch',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, transition:"all 0.2s" }}>
            <Icon name="refresh" size={13} color={refreshing?"rgba(255,255,255,0.3)":"#00F5FF"} />
            {refreshing ? "LOADING NEW CLIPS..." : "⚡ AI REFRESH FEED"}
          </button>

          {activeCategory === "all" && feedTab === "foryou" && <WeeklyLeaderboard clips={filtered} onPlay={openPlayer} />}
          <ClipChallenge onSubmit={() => setShowSubmit(true)} activeGame={activeGame} />
          <ScoreRow activeGame={activeGame} />
          <TrendingRow activeGame={activeGame} onGameClick={setActiveGame} />

          {refreshing && [1,2,3].map(i => <SkeletonCard key={i} />)}

          {!refreshing && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}><Icon name="clips" size={44} color="#FF00CC" /></div>
              <SectionHeader label="NO CLIPS FOUND" accent="#FF00CC" />
            </div>
          )}

          {feedTab === "following" && !refreshing && (
            <div style={{ marginBottom:16, padding:"12px 14px", background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.15)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
              <Icon name="profile" size={14} color="#00F5FF" />
              <span style={{ fontSize:12, fontFamily:"'Chakra Petch',sans-serif", color:"rgba(0,245,255,0.8)", fontWeight:600, letterSpacing:1 }}>SHOWING PRO CLIPS FROM TOP PLAYERS</span>
            </div>
          )}

          {!refreshing && filtered.map((clip, i) => {
            const gc = GAME_COLORS[clip.game] || "#00F5FF";
            const isFeatured = i === 0;
            return (
              <div key={clip.id}>
                {i === 0 && <SectionHeader label={activeCategory==="all" ? "TOP CLIPS" : activeCategory.toUpperCase()+" MOMENTS"} accent="#00F5FF" />}
                {clip.isNew && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginBottom:6, padding:"3px 8px", background:"rgba(0,245,255,0.1)", border:"1px solid rgba(0,245,255,0.3)", borderRadius:20 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:"#00F5FF", animation:"pulse 1s infinite" }} />
                    <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", color:"#00F5FF", letterSpacing:1 }}>NEW</span>
                  </div>
                )}
                <div className="card" onClick={() => openPlayer(clip.id)}
                  style={{ marginBottom:14, borderRadius:14, overflow:"hidden", background:"linear-gradient(145deg,#141424,#0E0E1E)", border:`1px solid ${isFeatured?gc+"70":gc+"30"}`, boxShadow: isFeatured?`0 4px 28px ${gc}25`:"0 2px 16px rgba(0,0,0,0.5)", animation:`slideUp 0.3s ease ${i*0.04}s both`, position:"relative" }}>
                  {isFeatured && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px 6px", background:`${gc}12`, borderBottom:`1px solid ${gc}28` }}>
                      <Icon name="trophy" size={12} color={gc} />
                      <span style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, fontSize:9, color:gc, letterSpacing:2 }}>CLIP OF THE DAY</span>
                    </div>
                  )}
                  {!isFeatured && <div style={{ height:2, background:`linear-gradient(to right,${gc},${gc}33,transparent)`, boxShadow:`0 0 6px ${gc}88` }} />}

                  <Thumb seed={clip.thumbSeed} game={clip.game} extraStyle={{ aspectRatio:"16/9" }}>
                    <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg,${gc}14,rgba(70,0,150,0.15),transparent)` }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0E0E1E 0%,transparent 55%)" }} />
                    <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.14) 3px,rgba(0,0,0,0.14) 4px)", pointerEvents:"none" }} />
                    <div style={{ position:"absolute", top:10, left:11, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(6px)", border:`1px solid ${gc}`, color:gc, fontSize:10, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif", padding:"3px 10px", borderRadius:20, boxShadow:`0 0 10px ${gc}55`, display:"flex", alignItems:"center", gap:5 }}>
                      <Icon name={GAME_ICON[clip.game] || "grid"} size={10} color={gc} />
                      {GAME_LABELS[clip.game] || clip.game.toUpperCase()}
                    </div>
                    <div style={{ position:"absolute", bottom:10, right:11, background:"rgba(0,0,0,0.82)", border:"1px solid rgba(0,245,255,0.28)", color:"#00F5FF", fontSize:11, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif", padding:"2px 8px", borderRadius:6 }}>
                      {clip.duration || "0:45"}
                    </div>
                    <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:52, height:52, borderRadius:13, background:"rgba(0,0,0,0.7)", border:`2px solid ${gc}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 22px ${gc}99` }}>
                      <Icon name="play" size={22} color={gc} />
                    </div>
                  </Thumb>

                  <div style={{ padding:"11px 13px 13px" }}>
                    <div style={{ fontSize:15, fontWeight:600, lineHeight:1.35, marginBottom:9, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>{clip.title}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${gc}50,rgba(0,0,0,0.8))`, border:`1.5px solid ${gc}70`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:gc, fontFamily:"'Chakra Petch',sans-serif", flexShrink:0 }}>
                          {(clip.player || "?")[0]}
                        </div>
                        <span style={{ fontSize:13, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>{clip.player}</span>
                        <span style={{ fontSize:12, color:"rgba(255,0,204,0.35)" }}>·</span>
                        <span style={{ fontSize:12, color:"rgba(255,255,255,0.28)", fontWeight:500 }}>{clip.time}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>
                        <Icon name="eye" size={12} color="rgba(255,255,255,0.3)" />{clip.views}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:9 }}>
                      <svg width={6} height={6} viewBox="0 0 3 3" style={{ imageRendering:"pixelated", flexShrink:0 }}>
                        <rect x="1" y="0" width="1" height="1" fill={gc} opacity="0.5"/>
                        <rect x="0" y="1" width="1" height="1" fill={gc} opacity="0.5"/>
                        <rect x="2" y="1" width="1" height="1" fill={gc} opacity="0.5"/>
                        <rect x="1" y="2" width="1" height="1" fill={gc} opacity="0.5"/>
                      </svg>
                      <div style={{ flex:1, height:1, background:`linear-gradient(to right,${gc}35,transparent)` }} />
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", gap:14 }}>
                        <button className="nbtn" onClick={e => { e.stopPropagation(); toggleLike(clip.id); }}
                          style={{ display:"flex", alignItems:"center", gap:5, color: clip.liked?"#FF2D55":"rgba(255,255,255,0.38)", fontSize:13, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif" }}>
                          <Icon name="heart" size={13} color={clip.liked?"#FF2D55":"rgba(255,255,255,0.35)"} />
                          {fmt(clip.likes)}
                        </button>
                        <button className="nbtn" onClick={e => openComments(clip, e)} style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,0.28)", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                          <Icon name="share" size={13} color="rgba(255,255,255,0.28)" /> Comments
                        </button>
                      </div>
                      <button className="nbtn" onClick={e => toggleSave(clip.id, e)}
                        style={{ display:"flex", alignItems:"center", gap:6, background: clip.saved?"rgba(0,245,255,0.12)":"rgba(255,0,204,0.05)", border:`1.5px solid ${clip.saved?"#00F5FF":"rgba(255,0,204,0.22)"}`, borderRadius:20, padding:"5px 13px", color: clip.saved?"#00F5FF":"rgba(255,255,255,0.32)", fontSize:11, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, transition:"all 0.15s" }}>
                        <Icon name="save" size={11} color={clip.saved?"#00F5FF":"rgba(255,255,255,0.3)"} />
                        {clip.saved ? "SAVED" : "SAVE"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEARCH */}
      {activeNav === "search" && (
        <div style={{ padding:"14px 16px", paddingBottom:110, position:"relative", zIndex:3 }}>
          <div style={{ position:"relative", marginBottom:22 }}>
            <input placeholder="Search clips, players, games..." style={{ width:"100%", padding:"13px 16px 13px 46px", background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.2)", borderRadius:12, color:"#fff", fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:500, outline:"none" }} />
            <div style={{ position:"absolute", left:15, top:"50%", transform:"translateY(-50%)" }}><Icon name="search" size={18} color="rgba(0,245,255,0.4)" /></div>
          </div>
          <SectionHeader label="BROWSE GAMES" accent="#00F5FF" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:26 }}>
            {Object.entries(GAME_LABELS).map(([key, label]) => {
              const c = GAME_COLORS[key];
              return (
                <div key={key} onClick={() => { setActiveGame(key); setActiveNav("feed"); }}
                  style={{ padding:"16px 14px", borderRadius:14, background:`${c}0C`, border:`1px solid ${c}40`, cursor:"pointer", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${c}15`, filter:"blur(14px)" }} />
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <Icon name={GAME_ICON[key]} size={16} color={c} />
                    <span style={{ fontSize:14, fontWeight:800, color:c, fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1 }}>{label}</span>
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.32)", fontWeight:500 }}>{clips.filter(x => x.game===key).length} clips</div>
                </div>
              );
            })}
          </div>
          <SectionHeader label="TOP PLAYERS" accent="#FF00CC" />
          {["TenZ","s1mple","Faker","ZywOo","aspas"].map((p, i) => {
            const clip = clips.find(c => c.player===p);
            const c = clip ? GAME_COLORS[clip.game] : "#FF00CC";
            return (
              <div key={p} onClick={() => clip && openPlayer(clip.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, marginBottom:8, cursor:"pointer", animation:`slideUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${c}60,rgba(0,0,0,0.85))`, border:`1.5px solid ${c}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, fontFamily:"'Chakra Petch',sans-serif", color:c, flexShrink:0 }}>
                  {clip?.avatar || p[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{p}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", fontWeight:500, marginTop:1 }}>{clip ? GAME_LABELS[clip.game] : "Pro Player"}</div>
                </div>
                {clip && <Icon name={GAME_ICON[clip.game]} size={14} color={c} />}
                <span style={{ color:"rgba(0,245,255,0.4)", fontSize:22 }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {/* SAVED */}
      {activeNav === "saved" && (
        <div style={{ padding:"14px 16px", paddingBottom:110, position:"relative", zIndex:3 }}>
          <SectionHeader label={`${savedClips.length} CLIP${savedClips.length!==1?"S":""} SAVED`} accent="#00F5FF" />
          {savedClips.length === 0 ? (
            <div style={{ textAlign:"center", padding:"70px 0" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:18 }}><Icon name="save" size={44} color="rgba(255,0,204,0.4)" /></div>
              <SectionHeader label="NO SAVED CLIPS" accent="#FF00CC" />
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.28)", fontWeight:500, marginTop:8 }}>Save clips from the feed</div>
            </div>
          ) : savedClips.map((clip, i) => {
            const c = GAME_COLORS[clip.game];
            return (
              <div key={clip.id} onClick={() => openPlayer(clip.id)}
                style={{ display:"flex", gap:12, padding:"11px 12px", background:`${c}09`, border:`1px solid ${c}2A`, borderRadius:14, marginBottom:10, cursor:"pointer", animation:`slideUp 0.3s ease ${i*0.05}s both` }}>
                <div style={{ position:"relative", width:92, height:58, flexShrink:0, overflow:"hidden", borderRadius:10, border:`1px solid ${c}44` }}>
                  <Thumb seed={clip.thumbSeed} game={clip.game} extraStyle={{ width:"100%", height:"100%" }}>
                    <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)" }} />
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="play" size={18} color={c} /></div>
                  </Thumb>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:7, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{clip.title}</div>
                  <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", background:`${c}1A`, border:`1px solid ${c}55`, color:c, fontFamily:"'Chakra Petch',sans-serif", borderRadius:20, display:"flex", alignItems:"center", gap:4 }}>
                      <Icon name={GAME_ICON[clip.game]} size={9} color={c} />{GAME_LABELS[clip.game]}
                    </span>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.38)", fontWeight:500 }}>{clip.player}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROFILE */}
      {activeNav === "profile" && (
        <div style={{ padding:"14px 16px", paddingBottom:110, position:"relative", zIndex:3 }}>
          <div style={{ textAlign:"center", padding:"22px 0 26px" }}>
            <div style={{ width:84, height:84, borderRadius:20, background:"linear-gradient(135deg,#00F5FF,#0033FF,#FF00CC)", margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 0 30px rgba(0,245,255,0.45),0 0 60px rgba(255,0,204,0.22)" }}>🎮</div>
            <div style={{ fontSize:20, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, letterSpacing:2, marginBottom:4 }}>PLAYER_ONE</div>
            <div style={{ fontSize:11, fontFamily:"'Chakra Petch',sans-serif", fontWeight:600, color:"rgba(0,245,255,0.5)", letterSpacing:2 }}>MEMBER SINCE APR 2026</div>
          </div>

          {/* Daily Streak */}
          <div style={{ marginBottom:18, padding:"14px 16px", background:"linear-gradient(135deg,rgba(255,100,0,0.12),rgba(255,0,204,0.06))", border:"1px solid rgba(255,100,0,0.3)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:28, animation:"pulse 2s ease-in-out infinite" }}>🔥</span>
              <div>
                <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:800, fontSize:22, color:"#FF6B00", textShadow:"0 0 12px rgba(255,107,0,0.6)", lineHeight:1 }}>{streak} DAY STREAK</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, marginTop:3 }}>CHECK IN DAILY TO KEEP IT</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, marginBottom:4 }}>NEXT BADGE</div>
              <div style={{ display:"flex", gap:4 }}>
                {[7,30,100].map(n => (
                  <div key={n} style={{ width:28, height:28, borderRadius:7, background: streak >= n ? "rgba(255,107,0,0.3)" : "rgba(255,255,255,0.05)", border:`1px solid ${streak >= n ? "#FF6B00" : "rgba(255,255,255,0.1)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:9, fontFamily:"'Chakra Petch',sans-serif", color: streak >= n ? "#FF6B00" : "rgba(255,255,255,0.3)", fontWeight:700 }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionHeader label="STATS" accent="#00F5FF" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
            {[
              {label:"SAVED",  value:savedClips.length,                        col:"#00F5FF", icon:"save"  },
              {label:"LIKED",  value:clips.filter(x=>x.liked).length,          col:"#FF2D55", icon:"heart" },
              {label:"DROPS",  value:clips.filter(x=>x.player==="You").length, col:"#FF00CC", icon:"clips" },
            ].map(s => (
              <div key={s.label} style={{ background:`${s.col}09`, border:`1px solid ${s.col}2A`, borderRadius:14, padding:"16px 10px", textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}><Icon name={s.icon} size={18} color={s.col} /></div>
                <div style={{ fontSize:24, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:s.col, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.32)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ClutchFeed Pro */}
          <div style={{ marginTop:18, borderRadius:14, overflow:"hidden", background:"linear-gradient(135deg,rgba(191,0,255,0.12),rgba(255,0,204,0.08))", border:"1px solid rgba(191,0,255,0.35)", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(to right,#BF00FF,#FF00CC,#BF00FF)" }} />
            <div style={{ padding:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"'Chakra Petch',sans-serif", fontWeight:800, fontSize:16, color:"#fff", letterSpacing:2 }}>CLUTCHFEED <span style={{ color:"#BF00FF", textShadow:"0 0 10px #BF00FF" }}>PRO</span></div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, marginTop:3 }}>$4.99 / MONTH</div>
                </div>
                <div style={{ fontSize:28 }}>👑</div>
              </div>
              {[["No clip watermark","Upload clips without the ClutchFeed watermark"],["Profile customisation","Custom colours, badges, and profile themes"],["Early access","Get new features before everyone else"],["Extended storage","500 clips vs 50 on free tier"]].map(([f,d]) => (
                <div key={f} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                  <span style={{ color:"#BF00FF", fontSize:14, flexShrink:0, marginTop:1 }}>◈</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{f}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Sans',sans-serif", marginTop:1 }}>{d}</div>
                  </div>
                </div>
              ))}
              <button style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#BF00FF,#FF00CC)", border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:2, marginTop:6, boxShadow:"0 0 20px rgba(191,0,255,0.4)" }}>
                UPGRADE TO PRO
              </button>
            </div>
          </div>
          <SectionHeader label="FAVOURITE GAMES" accent="#FF00CC" />
          <div style={{ display:"flex", gap:8 }}>
            {["valorant","cs2","lol"].map(g => (
              <div key={g} style={{ flex:1, padding:"14px 8px", borderRadius:14, background:`${GAME_COLORS[g]}0E`, border:`1px solid ${GAME_COLORS[g]}40`, textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><Icon name={GAME_ICON[g]} size={18} color={GAME_COLORS[g]} /></div>
                <div style={{ fontSize:10, fontWeight:700, color:GAME_COLORS[g], fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1 }}>{GAME_LABELS[g]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIDEO PLAYER */}
      {playerOpen && (
        <VideoPlayer
          clips={filtered.length > 0 ? filtered : clips}
          startIndex={playerStart}
          onClose={() => setPlayerOpen(false)}
          onLike={toggleLike}
        />
      )}

      {/* SUBMIT MODAL */}
      {showSubmit && (
        <div onClick={() => { setShowSubmit(false); setSubmitted(false); }}
          style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,20,0.9)", display:"flex", alignItems:"flex-end", animation:"fadeIn 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:"100%", maxWidth:430, margin:"0 auto", background:"linear-gradient(180deg,#0F0030,#0A0B10)", borderRadius:"22px 22px 0 0", borderTop:"2px solid #FF00CC", padding:"24px 20px 44px", animation:"slideUpModal 0.28s ease" }}>
            {submitted ? (
              <div style={{ textAlign:"center", padding:"24px 0" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><Icon name="trophy" size={44} color="#00F5FF" /></div>
                <SectionHeader label="CLIP SUBMITTED!" accent="#00F5FF" />
                <div style={{ fontSize:14, color:"rgba(255,0,204,0.6)", fontWeight:500, marginTop:8 }}>Live in your feed now</div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <SectionHeader label="DROP A CLIP" accent="#FF00CC" />
                  <button onClick={() => setShowSubmit(false)} style={{ background:"rgba(255,0,204,0.1)", border:"1px solid rgba(255,0,204,0.32)", borderRadius:"50%", width:34, height:34, cursor:"pointer", color:"#FF00CC", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
                <div style={{ fontSize:11, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:"rgba(0,245,255,0.4)", letterSpacing:2, marginBottom:8 }}>YOUTUBE OR TWITCH URL</div>
                <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="Paste link — plays inline in the app"
                  style={{ width:"100%", padding:"13px 16px", background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.25)", borderRadius:12, color:"#fff", fontSize:14, fontFamily:"'DM Sans',sans-serif", fontWeight:500, outline:"none", marginBottom:18 }} />
                <div style={{ fontSize:11, fontFamily:"'Chakra Petch',sans-serif", fontWeight:700, color:"rgba(0,245,255,0.4)", letterSpacing:2, marginBottom:12 }}>SELECT GAME</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:22 }}>
                  {Object.entries(GAME_LABELS).map(([key, label]) => {
                    const c = GAME_COLORS[key];
                    const active = submitGame === key;
                    return (
                      <button key={key} onClick={() => setSubmitGame(key)}
                        style={{ padding:"12px 8px", borderRadius:12, background: active?`${c}1E`:"rgba(255,255,255,0.03)", border:`1.5px solid ${active?c:"rgba(255,255,255,0.08)"}`, color: active?c:"rgba(255,255,255,0.38)", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <Icon name={GAME_ICON[key]} size={13} color={active?c:"rgba(255,255,255,0.3)"} />{label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleSubmit} disabled={!submitUrl||!submitGame}
                  style={{ width:"100%", padding:"15px", background:(!submitUrl||!submitGame)?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#FF00CC,#7700FF)", border:`1.5px solid ${(!submitUrl||!submitGame)?"rgba(255,255,255,0.07)":"#FF00CC"}`, borderRadius:14, color:(!submitUrl||!submitGame)?"rgba(255,255,255,0.22)":"#fff", fontSize:15, fontWeight:800, cursor:(!submitUrl||!submitGame)?"not-allowed":"pointer", fontFamily:"'Chakra Petch',sans-serif", letterSpacing:3, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <Icon name="play" size={16} color={(!submitUrl||!submitGame)?"rgba(255,255,255,0.22)":"#fff"} />
                  SUBMIT CLIP
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(4,2,14,0.97)", borderTop:"1px solid rgba(0,245,255,0.08)", backdropFilter:"blur(20px)", padding:"10px 0 24px", zIndex:200, display:"flex", justifyContent:"space-around", alignItems:"center" }}>
        {[
          {id:"feed",    icon:"home",    label:"FEED"},
          {id:"search",  icon:"search",  label:"SEARCH"},
          {id:"submit",  icon:"plus",    label:"DROP",   special:true},
          {id:"saved",   icon:"save",    label:"SAVED"},
          {id:"profile", icon:"profile", label:"PROFILE"},
        ].map(nav => {
          const isActive  = activeNav === nav.id;
          const iconColor = nav.special ? "#fff" : isActive ? "#00F5FF" : "rgba(255,255,255,0.3)";
          return (
            <button key={nav.id} className="nbtn"
              onClick={() => nav.id === "submit" ? setShowSubmit(true) : setActiveNav(nav.id)}
              style={{ background: nav.special?"linear-gradient(135deg,#FF00CC,#7700FF)":"none", border: nav.special?"1.5px solid #FF00CC":"none", borderRadius: nav.special?14:0, padding: nav.special?"10px 20px":"4px 10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5, marginTop: nav.special?-14:0, boxShadow: nav.special?"0 0 22px rgba(255,0,204,0.55)":"none" }}>
              <Icon name={nav.icon} size={nav.special?20:18} color={iconColor} />
              <span style={{ fontSize:9, fontWeight:700, fontFamily:"'Chakra Petch',sans-serif", letterSpacing:1, color: nav.special?"#fff":isActive?"#00F5FF":"rgba(255,255,255,0.28)" }}>{nav.label}</span>
              {isActive && !nav.special && <div style={{ width:4, height:4, borderRadius:"50%", background:"#00F5FF", boxShadow:"0 0 6px #00F5FF", marginTop:-2 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
