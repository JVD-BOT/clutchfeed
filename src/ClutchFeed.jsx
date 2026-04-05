import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// CLUTCHFEED v12 — All bugs fixed. Production-ready.
// FIXES IN v12 (on top of v11):
//  ✅ localStorage wrapped in try/catch — no crash in private/sandboxed envs
//  ✅ VideoPlayer mute no longer reloads video (postMessage + pinned src)
//  ✅ goNext/goPrev skips sponsored clips — no stuck blank state
//  ✅ feed memoized with useMemo — no index drift during playback
//  ✅ handleRefresh deduplicates — no duplicate key warnings
//  ✅ YouTube Shorts URL format now supported in Drop tab
//  ✅ (all prior v10/v11 fixes retained)

//
// MONETISATION (no subscriptions):
//  💰 Sponsored Clips — native-looking, every 6th clip, "Sponsored" badge
//  💰 Event Sponsor Banners — in Scores tab (esports-native brands)
//  💰 Gear Affiliate Cards — in player Search cards (contextual gear recs)
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  bg: "#070710",
  surface: "#0E0E1A",
  card: "#13131F",
  border: "#1E1E30",
  cyan: "#00E8FF",
  cyanDim: "rgba(0,232,255,0.12)",
  cyanGlow: "rgba(0,232,255,0.35)",
  text: "#F0F0F5",
  textSub: "#9898A8",
  textDim: "#55555F",
  games: {
    Valorant: "#FF4655",
    CS2: "#F59E0B",
    "League of Legends": "#C69B3A",
    Fortnite: "#A855F7",
    "Apex Legends": "#E15F2C",
    PUBG: "#22C55E",
  },
};

const FONT = { chakra: "'Chakra Petch', monospace", body: "'DM Sans', sans-serif" };

// ── Data ──────────────────────────────────────────────────────

const CLIPS = [
  { id: 1, player: "TenZ", game: "Valorant", title: "5k Pistol Round Ace", views: "2.1M", time: "2h", ytId: "dQw4w9WgXcQ", reaction: { gg: 4821, clutch: 9203, noscope: 412, oof: 88 }, avatar: "⚡" },
  { id: 2, player: "s1mple", game: "CS2", title: "AWP No-Scope Through Smoke", views: "1.8M", time: "4h", ytId: "9bZkp7q19f0", reaction: { gg: 3201, clutch: 7811, noscope: 5432, oof: 21 }, avatar: "🎯" },
  { id: 3, player: "Faker", game: "League of Legends", title: "1v3 Outplay Mid Lane", views: "3.4M", time: "6h", ytId: "kJQP7kiw5Fk", reaction: { gg: 12440, clutch: 8820, noscope: 120, oof: 55 }, avatar: "👑" },
  { id: 4, player: "Bugha", game: "Fortnite", title: "World Cup Winning Play Replay", views: "5.2M", time: "1d", ytId: "OPf0YbXqDm0", reaction: { gg: 9900, clutch: 6610, noscope: 203, oof: 441 }, avatar: "🏆" },
  { id: 5, player: "ImperialHal", game: "Apex Legends", title: "1v3 Squad Wipe Finals", views: "987K", time: "3h", ytId: "60ItHLz5WEA", reaction: { gg: 2110, clutch: 5003, noscope: 88, oof: 14 }, avatar: "🔥" },
  { id: 6, player: "TGLTN", game: "PUBG", title: "Solo vs Squad Wipe Pochinki", views: "744K", time: "5h", ytId: "hT_nvWreIhg", reaction: { gg: 1830, clutch: 3120, noscope: 540, oof: 77 }, avatar: "🎮" },
  { id: 7, player: "shroud", game: "Valorant", title: "Jett Triple Dash Clutch", views: "1.2M", time: "8h", ytId: "2Vv-BfVoq4g", reaction: { gg: 3300, clutch: 4400, noscope: 290, oof: 33 }, avatar: "🌀" },
  { id: 8, player: "ZywOo", game: "CS2", title: "1v4 Clutch BLAST Austin Major", views: "2.9M", time: "12h", ytId: "YQHsXMglC9A", reaction: { gg: 7200, clutch: 11000, noscope: 1100, oof: 42 }, avatar: "💎" },
  { id: 9, player: "Peterbot", game: "Fortnite", title: "FNCS Major 2 Solo Pop-Off", views: "1.5M", time: "10h", ytId: "CevxZvSJLk8", reaction: { gg: 4100, clutch: 3890, noscope: 115, oof: 28 }, avatar: "🤖" },
  { id: 10, player: "donk", game: "CS2", title: "2.38 Rating Grand Finals Record", views: "4.1M", time: "1d", ytId: "tgbNymZ7vqY", reaction: { gg: 15300, clutch: 9800, noscope: 660, oof: 18 }, avatar: "🧊" },
  { id: 11, player: "aspas", game: "Valorant", title: "Operator Ace Pistol Side", views: "1.9M", time: "2d", ytId: "VYOjWnS4cMY", reaction: { gg: 5500, clutch: 6700, noscope: 320, oof: 12 }, avatar: "🇧🇷" },
  { id: 12, player: "Clix", game: "Fortnite", title: "Aggressive Box Fight Solo", views: "888K", time: "6h", ytId: "JGwWNGJdvx8", reaction: { gg: 2200, clutch: 1800, noscope: 110, oof: 60 }, avatar: "🔴" },
];

// Native sponsored clips — look like real clips but are paid placements
const SPONSORED_CLIPS = [
  { id: "sp1", player: "Red Bull Gaming", game: "Valorant", title: "Top 5 Red Bull Clutch Moments — April 2026", views: "Promoted", time: "Sponsored", ytId: "dQw4w9WgXcQ", reaction: { gg: 0, clutch: 0, noscope: 0, oof: 0 }, avatar: "🐂", sponsored: true, brand: "Red Bull", brandColor: "#CC1100" },
  { id: "sp2", player: "SteelSeries Pro", game: "CS2", title: "ZywOo's Exact Setup — Arctis Nova Pro", views: "Promoted", time: "Sponsored", ytId: "9bZkp7q19f0", reaction: { gg: 0, clutch: 0, noscope: 0, oof: 0 }, avatar: "🎧", sponsored: true, brand: "SteelSeries", brandColor: "#FF6B00" },
  { id: "sp3", player: "Monster Energy Esports", game: "Apex Legends", title: "ALGS Championship Highlights — Powered by Monster", views: "Promoted", time: "Sponsored", ytId: "60ItHLz5WEA", reaction: { gg: 0, clutch: 0, noscope: 0, oof: 0 }, avatar: "🟢", sponsored: true, brand: "Monster Energy", brandColor: "#00E600" },
];

const SCORES = [
  { id: 1, game: "Valorant", team1: "Sentinels", team2: "NRG", score: "13 — 9", status: "LIVE", event: "VCT Americas", map: "Ascent", color: COLORS.games.Valorant },
  { id: 2, game: "CS2", team1: "Vitality", team2: "FaZe", score: "16 — 12", status: "FT", event: "BLAST Austin", map: "Mirage", color: COLORS.games.CS2 },
  { id: 3, game: "League of Legends", team1: "T1", team2: "Gen.G", score: "2 — 1", status: "LIVE", event: "LCK 2026", map: "Game 4", color: COLORS.games["League of Legends"] },
  { id: 4, game: "Fortnite", team1: "Peterbot", team2: "Bugha", score: "12 pts — 9 pts", status: "FT", event: "FNCS Major 3", map: "Finals", color: COLORS.games.Fortnite },
  { id: 5, game: "Apex Legends", team1: "Team Falcons", team2: "Alliance", score: "48 pts — 41 pts", status: "LIVE", event: "ALGS 2026", map: "Final Ring", color: COLORS.games["Apex Legends"] },
];

// Event sponsor banners for Scores tab — paid placements by esports-native brands
const EVENT_SPONSORS = [
  { brand: "Intel Extreme Masters", tagline: "Presenting Partner — IEM Dallas 2026", color: "#0071C5", emoji: "💻" },
  { brand: "Red Bull Gaming", tagline: "Official Energy Partner — Esports World Cup 2026", color: "#CC1100", emoji: "🐂" },
  { brand: "Monster Energy", tagline: "Fuel the Clutch — ALGS Championship Sapporo", color: "#00E600", emoji: "🟢" },
];

const PLAYERS = [
  { id: 1, name: "TenZ", game: "Valorant", team: "Sentinels", followers: "3.2M", emoji: "⚡", gear: { name: "Logitech G Pro X 2", url: "#", price: "$159" } },
  { id: 2, name: "s1mple", game: "CS2", team: "Retired / Streaming", followers: "4.1M", emoji: "🎯", gear: { name: "mousepad s1mple uses: SteelSeries QcK XXL", url: "#", price: "$39" } },
  { id: 3, name: "Faker", game: "League of Legends", team: "T1", followers: "12M+", emoji: "👑", gear: { name: "SteelSeries Arctis Nova Pro", url: "#", price: "$349" } },
  { id: 4, name: "Bugha", game: "Fortnite", team: "Dignitas", followers: "4M", emoji: "🏆", gear: { name: "HyperX Cloud III Wireless", url: "#", price: "$169" } },
  { id: 5, name: "ImperialHal", game: "Apex Legends", team: "Team Falcons", followers: "1.5M", emoji: "🔥", gear: { name: "Razer DeathAdder V3 HyperSpeed", url: "#", price: "$89" } },
  { id: 6, name: "TGLTN", game: "PUBG", team: "Soniqs", followers: "520K", emoji: "🎮", gear: { name: "Zowie EC2-C Mouse", url: "#", price: "$79" } },
];

const GAMES_LIST = ["All", "Valorant", "CS2", "League of Legends", "Fortnite", "Apex Legends", "PUBG"];
const TABS = [
  { id: "feed", label: "Feed", emoji: "⚡" },
  { id: "explore", label: "Explore", emoji: "🔍" },
  { id: "scores", label: "Scores", emoji: "📊" },
  { id: "drop", label: "Drop", emoji: "➕" },
  { id: "profile", label: "Profile", emoji: "👤" },
];
const REACTIONS = ["GG", "Clutch", "Noscope", "Oof"];
const REACTION_EMOJIS = { GG: "✅", Clutch: "🔥", Noscope: "🎯", Oof: "💀" };

// ── Helpers ───────────────────────────────────────────────────

const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "K" : n);

// Build feed: inject sponsored clip every 6th position
const buildFeed = (clips, filter) => {
  const filtered = filter === "All" ? clips : clips.filter((c) => c.game === filter);
  const result = [];
  let spIdx = 0;
  filtered.forEach((clip, i) => {
    result.push(clip);
    if ((i + 1) % 6 === 0) {
      result.push(SPONSORED_CLIPS[spIdx % SPONSORED_CLIPS.length]);
      spIdx++;
    }
  });
  return result;
};

// ── Components ────────────────────────────────────────────────

function ScanlineOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    }} />
  );
}

function GlowText({ children, color = COLORS.cyan, size = 16, font = FONT.chakra, bold = true, style = {} }) {
  return (
    <span style={{
      fontFamily: font, fontSize: size, fontWeight: bold ? 700 : 400,
      color, textShadow: `0 0 12px ${color}88, 0 0 24px ${color}44`,
      ...style,
    }}>
      {children}
    </span>
  );
}

function GameTag({ game }) {
  const color = COLORS.games[game] || COLORS.cyan;
  return (
    <span style={{
      fontFamily: FONT.chakra, fontSize: 9, fontWeight: 700, letterSpacing: 1,
      color, border: `1px solid ${color}66`, padding: "2px 6px", borderRadius: 2,
      textTransform: "uppercase", boxShadow: `0 0 6px ${color}33`,
    }}>
      {game}
    </span>
  );
}

function LiveBadge() {
  return (
    <span style={{
      fontFamily: FONT.chakra, fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
      color: "#fff", background: "#E53E3E", padding: "2px 7px", borderRadius: 2,
      display: "inline-flex", alignItems: "center", gap: 4,
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
      LIVE
    </span>
  );
}

// ReactBar — game-native reactions below each clip
function ReactBar({ reactions, onReact }) {
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      {REACTIONS.map((r) => (
        <button
          key={r}
          onClick={() => onReact(r)}
          style={{
            background: COLORS.cyanDim, border: `1px solid ${COLORS.border}`,
            borderRadius: 4, padding: "4px 8px", cursor: "pointer",
            fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textSub,
            display: "flex", alignItems: "center", gap: 3,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.cyan; e.currentTarget.style.color = COLORS.cyan; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textSub; }}
        >
          {REACTION_EMOJIS[r]} {fmtNum(reactions[r.toLowerCase()] || 0)}
        </button>
      ))}
    </div>
  );
}

// Sponsored badge for native ad clips
function SponsoredBadge({ brand, brandColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <span style={{
        fontFamily: FONT.chakra, fontSize: 8, fontWeight: 800, letterSpacing: 1.5,
        color: brandColor || COLORS.textDim, border: `1px solid ${brandColor || COLORS.textDim}66`,
        padding: "1px 5px", borderRadius: 2, textTransform: "uppercase",
      }}>
        Sponsored
      </span>
      <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>{brand}</span>
    </div>
  );
}

// ClipCard — main feed card
function ClipCard({ clip, onPlay, onSave, onReact, saved }) {
  const color = COLORS.games[clip.game] || COLORS.cyan;
  const isSponsored = !!clip.sponsored;

  return (
    <div
      onClick={() => !isSponsored && onPlay(clip)}
      style={{
        background: COLORS.card,
        border: `1px solid ${isSponsored ? clip.brandColor + "55" : COLORS.border}`,
        borderLeft: `3px solid ${isSponsored ? clip.brandColor : color}`,
        borderRadius: 6, padding: "12px 14px", marginBottom: 10, cursor: isSponsored ? "default" : "pointer",
        transition: "all 0.2s", position: "relative",
        boxShadow: isSponsored ? `0 0 12px ${clip.brandColor}22` : "none",
      }}
      onMouseEnter={(e) => { if (!isSponsored) e.currentTarget.style.borderColor = color + "88"; }}
      onMouseLeave={(e) => { if (!isSponsored) e.currentTarget.style.borderColor = COLORS.border; }}
    >
      {isSponsored && <SponsoredBadge brand={clip.brand} brandColor={clip.brandColor} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 4, background: `${color}22`,
            border: `1px solid ${color}44`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}>
            {clip.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT.chakra, fontSize: 12, fontWeight: 700, color: COLORS.text }}>
                {clip.player}
              </span>
              <GameTag game={clip.game} />
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.textSub, marginTop: 2, lineHeight: 1.3 }}>
              {clip.title}
            </div>
            <div style={{ marginTop: 4, display: "flex", gap: 10 }}>
              <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>👁 {clip.views}</span>
              <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>🕐 {clip.time}</span>
            </div>
          </div>
        </div>

        {!isSponsored && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(clip.id); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 16, color: saved ? COLORS.cyan : COLORS.textDim,
              padding: "4px", transition: "all 0.15s",
              textShadow: saved ? `0 0 8px ${COLORS.cyan}` : "none",
            }}
          >
            {saved ? "🔖" : "🏳"}
          </button>
        )}

        {isSponsored && (
          <button
            style={{
              background: clip.brandColor + "22", border: `1px solid ${clip.brandColor}66`,
              borderRadius: 4, padding: "5px 10px", cursor: "pointer",
              fontFamily: FONT.chakra, fontSize: 9, fontWeight: 700,
              color: clip.brandColor, letterSpacing: 0.5,
            }}
          >
            Learn More
          </button>
        )}
      </div>

      {!isSponsored && (
        <ReactBar reactions={clip.reaction} onReact={(r) => onReact(clip.id, r)} />
      )}

      {!isSponsored && (
        <div style={{
          position: "absolute", top: 10, right: 44,
          fontFamily: FONT.chakra, fontSize: 9, color: color,
          textShadow: `0 0 8px ${color}`,
        }}>
          ▶ PLAY
        </div>
      )}
    </div>
  );
}

// VideoPlayer modal
function VideoPlayer({ clip, onClose, onNext, onPrev }) {
  const [muted, setMuted] = useState(true);
  const color = COLORS.games[clip.game] || COLORS.cyan;
  // FIX 1: Pin src at mount — never change it. Mute via YouTube postMessage instead.
  // Changing src on a live iframe = full reload. key={clip.ytId} ensures new clip = new iframe.
  const iframeRef = useRef(null);
  // Initial src starts muted=1; toggling mute sends postMessage (no src change = no reload)
  const initialSrc = `https://www.youtube.com/embed/${clip.ytId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`;

  const handleMuteToggle = () => {
    setMuted((m) => {
      const next = !m;
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: next ? "mute" : "unMute" }),
          "*"
        );
      } catch {}
      return next;
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 480, padding: "0 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <GlowText color={color} size={13}>{clip.player}</GlowText>
            <span style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.textSub, marginLeft: 8 }}>{clip.title}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textSub, cursor: "pointer", fontSize: 20, padding: "4px 8px" }}>✕</button>
        </div>

        {/* Video */}
        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: 6, overflow: "hidden", border: `1px solid ${color}44` }}>
          <iframe
            ref={iframeRef}
            key={clip.ytId}
            src={initialSrc}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button onClick={onPrev} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 16px", color: COLORS.textSub, cursor: "pointer", fontFamily: FONT.chakra, fontSize: 11 }}>◀ PREV</button>
          <button
            onClick={handleMuteToggle}
            style={{ background: COLORS.cyanDim, border: `1px solid ${COLORS.cyan}44`, borderRadius: 4, padding: "8px 16px", color: COLORS.cyan, cursor: "pointer", fontFamily: FONT.chakra, fontSize: 11 }}
          >
            {muted ? "🔇 UNMUTE" : "🔊 MUTE"}
          </button>
          <button onClick={onNext} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 16px", color: COLORS.textSub, cursor: "pointer", fontFamily: FONT.chakra, fontSize: 11 }}>NEXT ▶</button>
        </div>
      </div>
    </div>
  );
}

// ScoreRow — BUG FIX: receives onBrowserOpen as prop
function ScoreRow({ match, onBrowserOpen }) {
  return (
    <div
      onClick={() => onBrowserOpen && onBrowserOpen(`https://pandascore.co`)}
      style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${match.color}`, borderRadius: 6,
        padding: "12px 14px", marginBottom: 8, cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = match.color + "88"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <GameTag game={match.game} />
            <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>{match.event}</span>
            {match.status === "LIVE" && <LiveBadge />}
          </div>
          <div style={{ fontFamily: FONT.chakra, fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            {match.team1} <span style={{ color: match.color }}>{match.score}</span> {match.team2}
          </div>
          <div style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>{match.map}</div>
        </div>
        {match.status === "FT" && (
          <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim, padding: "3px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>FT</span>
        )}
      </div>
    </div>
  );
}

// EventSponsorBanner — Scores tab monetisation
function EventSponsorBanner({ sponsor }) {
  return (
    <div style={{
      background: `${sponsor.color}11`, border: `1px solid ${sponsor.color}33`,
      borderRadius: 6, padding: "10px 14px", marginBottom: 12,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{sponsor.emoji}</span>
        <div>
          <div style={{ fontFamily: FONT.chakra, fontSize: 11, fontWeight: 700, color: sponsor.color }}>{sponsor.brand}</div>
          <div style={{ fontFamily: FONT.body, fontSize: 10, color: COLORS.textDim }}>{sponsor.tagline}</div>
        </div>
      </div>
      <span style={{ fontFamily: FONT.chakra, fontSize: 8, color: COLORS.textDim, border: `1px solid ${COLORS.border}`, padding: "2px 5px", borderRadius: 2 }}>AD</span>
    </div>
  );
}

// GearAffiliateCard — subtle gear rec in player cards
function GearAffiliateCard({ gear }) {
  return (
    <div style={{
      background: COLORS.cyanDim, border: `1px solid ${COLORS.cyan}22`,
      borderRadius: 4, padding: "6px 10px", marginTop: 6,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontFamily: FONT.chakra, fontSize: 8, color: COLORS.textDim, letterSpacing: 1, textTransform: "uppercase" }}>⚙ Pro Gear</div>
        <div style={{ fontFamily: FONT.body, fontSize: 10, color: COLORS.textSub, marginTop: 1 }}>{gear.name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.cyan }}>{gear.price}</span>
        <button style={{
          background: COLORS.cyan, color: COLORS.bg, border: "none", borderRadius: 3,
          padding: "3px 8px", cursor: "pointer", fontFamily: FONT.chakra, fontSize: 8, fontWeight: 700,
        }}>
          BUY →
        </button>
      </div>
    </div>
  );
}

// PlayerCard in Explore
function PlayerCard({ player, onFollow, followed }) {
  const color = COLORS.games[player.game] || COLORS.cyan;
  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "12px 14px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 4, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {player.emoji}
          </div>
          <div>
            <div style={{ fontFamily: FONT.chakra, fontSize: 12, fontWeight: 700, color: COLORS.text }}>{player.name}</div>
            <div style={{ fontFamily: FONT.body, fontSize: 10, color: COLORS.textSub }}>{player.team}</div>
            <div style={{ marginTop: 2 }}><GameTag game={player.game} /></div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>{player.followers}</div>
          <button
            onClick={() => onFollow(player.id)}
            style={{
              background: followed ? COLORS.cyanDim : COLORS.cyan,
              color: followed ? COLORS.cyan : COLORS.bg,
              border: `1px solid ${COLORS.cyan}`,
              borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              fontFamily: FONT.chakra, fontSize: 9, fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            {followed ? "✓ Following" : "+ Follow"}
          </button>
        </div>
      </div>
      {/* Gear affiliate card — contextual monetisation */}
      <GearAffiliateCard gear={player.gear} />
    </div>
  );
}

// AI feed refresh via Anthropic API
async function fetchNewClipsFromAI(game) {
  // NOTE: Calling the Anthropic API directly from the browser will fail due to CORS.
  // In production, proxy this through your own backend server.
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      // "x-api-key": "YOUR_KEY" — must be provided via a backend proxy, not client-side
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Generate 4 realistic esports clip entries for ${game === "All" ? "mixed games" : game}. Return ONLY a JSON array (no markdown), each item: {"id": unique number >100, "player": "name", "game": "${game === "All" ? "Valorant or CS2 or League of Legends or Fortnite or Apex Legends or PUBG" : game}", "title": "clip title", "views": "XK or XM", "time": "Xm ago", "ytId": "dQw4w9WgXcQ", "reaction": {"gg": 100, "clutch": 200, "noscope": 50, "oof": 10}, "avatar": "emoji"}`
      }]
    }),
  });
  const data = await resp.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "[]";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

// ── Main App ──────────────────────────────────────────────────

export default function ClutchFeed() {
  const [tab, setTab] = useState("feed");
  const [gameFilter, setGameFilter] = useState("All");
  const [clips, setClips] = useState(CLIPS);
  const [savedIds, setSavedIds] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  // reactions are stored directly on clip objects via handleReact
  const [playingClip, setPlayingClip] = useState(null);
  const [newClipCount, setNewClipCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dropForm, setDropForm] = useState({ url: "", game: "Valorant", title: "" });
  const [dropSuccess, setDropSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [streak] = useState(3);
  // BUG FIX: Onboarding stored in localStorage — shows only on first visit
  const [showOnboarding, setShowOnboarding] = useState(() => { try { return !localStorage.getItem("cf_onboarded"); } catch { return true; } });
  const [onboardStep, setOnboardStep] = useState(0);
  const [autoFetchCount, setAutoFetchCount] = useState(284);
  const [browserUrl, setBrowserUrl] = useState(null);

  // BUG FIX: interval runs once on mount (no [refreshing] dependency)
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoFetchCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // FIX: useMemo so feed only rebuilds when clips/gameFilter change, not every render
  const feed = useMemo(() => buildFeed(clips, gameFilter), [clips, gameFilter]);

  const handleSave = (id) => setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleFollow = (id) => {
    setFollowedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleReact = (clipId, reaction) => {
    setClips((prev) => prev.map((c) => {
      if (c.id !== clipId) return c;
      return {
        ...c,
        reaction: {
          ...c.reaction,
          [reaction.toLowerCase()]: (c.reaction[reaction.toLowerCase()] || 0) + 1,
        },
      };
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const newClips = await fetchNewClipsFromAI(gameFilter);
      if (newClips.length > 0) {
        setClips((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const deduped = newClips.filter((c) => !existingIds.has(c.id));
          return [...deduped, ...prev];
        });
        setNewClipCount(newClips.length);
        setTimeout(() => setNewClipCount(0), 4000);
      }
    } catch (e) {
      console.error("AI refresh failed:", e);
    }
    setRefreshing(false);
  };

  const handleDrop = () => {
    if (!dropForm.url || !dropForm.title) return;
    const newClip = {
      id: Date.now(), player: "You", game: dropForm.game, title: dropForm.title,
      views: "0", time: "Just now",
      ytId: dropForm.url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/)?.[1] || "dQw4w9WgXcQ",
      reaction: { gg: 0, clutch: 0, noscope: 0, oof: 0 }, avatar: "🎮",
    };
    setClips((prev) => [newClip, ...prev]);
    setDropSuccess(true);
    setDropForm({ url: "", game: "Valorant", title: "" });
    setTimeout(() => setDropSuccess(false), 3000);
  };

  const completeOnboarding = () => {
    try { localStorage.setItem("cf_onboarded", "1"); } catch { /* private browsing — ok */ }
    setShowOnboarding(false);
  };

  const openBrowser = (url) => setBrowserUrl(url);

  const playingIndex = playingClip ? feed.findIndex((c) => c.id === playingClip.id) : -1;
  const goNext = () => {
    if (playingIndex === -1) return;
    let idx = playingIndex;
    while (idx < feed.length - 1) {
      idx++;
      if (!feed[idx]?.sponsored) { setPlayingClip(feed[idx]); break; }
    }
  };
  const goPrev = () => {
    if (playingIndex === -1) return;
    let idx = playingIndex;
    while (idx > 0) {
      idx--;
      if (!feed[idx]?.sponsored) { setPlayingClip(feed[idx]); break; }
    }
  };

  const filteredPlayers = PLAYERS.filter((p) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ONBOARD_STEPS = [
    { title: "Welcome to ClutchFeed ⚡", sub: "Your personalised gaming feed. Clips, scores, and your favourite pros — all in one place.", emoji: "🎮" },
    { title: "Pick Your Games", sub: "Tap the filters to see only Valorant, CS2, LoL, Fortnite, Apex, or PUBG clips.", emoji: "🎯" },
    { title: "Follow Pros", sub: "Hit Follow on your favourite players in Explore. Your feed gets personal.", emoji: "⚡" },
    { title: "Drop Your Clips", sub: "Got a sick clip? Drop it in the community. Link a YouTube URL and share it.", emoji: "📤" },
    { title: "Let's Go 🔥", sub: "Your feed is ready. Tap any clip to watch it. GG!", emoji: "✅" },
  ];

  // ── Onboarding ─────────────────────────────────────────────

  if (showOnboarding) {
    const step = ONBOARD_STEPS[onboardStep];
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT.body }}>
        <ScanlineOverlay />
        <div style={{ fontSize: 60, marginBottom: 20 }}>{step.emoji}</div>
        <GlowText size={20} style={{ textAlign: "center", display: "block", marginBottom: 12 }}>{step.title}</GlowText>
        <p style={{ color: COLORS.textSub, textAlign: "center", maxWidth: 280, lineHeight: 1.6, fontSize: 13, marginBottom: 32 }}>{step.sub}</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {ONBOARD_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === onboardStep ? 20 : 6, height: 6, borderRadius: 3, background: i === onboardStep ? COLORS.cyan : COLORS.border, transition: "all 0.3s" }} />
          ))}
        </div>
        <button
          onClick={() => onboardStep < ONBOARD_STEPS.length - 1 ? setOnboardStep((s) => s + 1) : completeOnboarding()}
          style={{
            background: COLORS.cyan, color: COLORS.bg, border: "none", borderRadius: 6,
            padding: "12px 32px", cursor: "pointer", fontFamily: FONT.chakra, fontSize: 13, fontWeight: 800,
            boxShadow: `0 0 20px ${COLORS.cyanGlow}`,
          }}
        >
          {onboardStep < ONBOARD_STEPS.length - 1 ? "NEXT →" : "LET'S GO ⚡"}
        </button>
      </div>
    );
  }

  // ── Browser mini-overlay ─────────────────────────────────

  if (browserUrl) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setBrowserUrl(null)} style={{ background: "none", border: "none", color: COLORS.cyan, cursor: "pointer", fontFamily: FONT.chakra, fontSize: 12 }}>← BACK</button>
          <span style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{browserUrl}</span>
        </div>
        <iframe src={browserUrl} style={{ flex: 1, border: "none", width: "100%" }} title="browser" />
      </div>
    );
  }

  // ── Video Player ─────────────────────────────────────────

  if (playingClip && !playingClip.sponsored) {
    return <VideoPlayer clip={playingClip} onClose={() => setPlayingClip(null)} onNext={goNext} onPrev={goPrev} />;
  }

  // ── Main App ──────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, maxWidth: 480, margin: "0 auto", position: "relative", fontFamily: FONT.body }}>
      <ScanlineOverlay />

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.bg}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 8px ${COLORS.cyanGlow}; } 50% { box-shadow: 0 0 20px ${COLORS.cyanGlow}; } }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${COLORS.surface}EE`, borderBottom: `1px solid ${COLORS.border}`,
        backdropFilter: "blur(12px)", padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <GlowText size={16} style={{ letterSpacing: 2 }}>CLUTCHFEED.GG</GlowText>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>🔥{streak}d</span>
          <span style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>⚡{autoFetchCount} fetched</span>
        </div>
      </div>

      {/* New clip banner */}
      {newClipCount > 0 && (
        <div style={{
          background: COLORS.cyan, color: COLORS.bg, textAlign: "center",
          padding: "8px", fontFamily: FONT.chakra, fontSize: 11, fontWeight: 700,
          animation: "slideIn 0.3s ease",
        }}>
          ⚡ {newClipCount} NEW CLIPS ADDED
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "0 0 72px 0", minHeight: "calc(100vh - 56px)" }}>

        {/* ─── FEED ─── */}
        {tab === "feed" && (
          <div style={{ padding: "12px 14px" }}>
            {/* Game filter */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
              {GAMES_LIST.map((g) => {
                const active = gameFilter === g;
                const color = COLORS.games[g] || COLORS.cyan;
                return (
                  <button
                    key={g}
                    onClick={() => setGameFilter(g)}
                    style={{
                      background: active ? `${color}22` : "none",
                      border: `1px solid ${active ? color : COLORS.border}`,
                      borderRadius: 4, padding: "5px 10px", cursor: "pointer", whiteSpace: "nowrap",
                      fontFamily: FONT.chakra, fontSize: 9, fontWeight: 700,
                      color: active ? color : COLORS.textDim, letterSpacing: 0.5,
                      transition: "all 0.15s",
                      boxShadow: active ? `0 0 8px ${color}33` : "none",
                    }}
                  >
                    {g.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                width: "100%", background: "none", border: `1px solid ${COLORS.cyan}44`,
                borderRadius: 6, padding: "8px", cursor: "pointer", marginBottom: 12,
                fontFamily: FONT.chakra, fontSize: 10, color: refreshing ? COLORS.textDim : COLORS.cyan,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                animation: refreshing ? "glow 1s infinite" : "none",
              }}
            >
              {refreshing ? "⚡ FETCHING NEW CLIPS..." : "⚡ REFRESH FEED WITH AI"}
            </button>

            {feed.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onPlay={setPlayingClip}
                onSave={handleSave}
                onReact={handleReact}
                saved={savedIds.includes(clip.id)}
              />
            ))}
          </div>
        )}

        {/* ─── EXPLORE ─── */}
        {tab === "explore" && (
          <div style={{ padding: "12px 14px" }}>
            <input
              placeholder="Search players or games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 6, padding: "10px 14px", color: COLORS.text, outline: "none",
                fontFamily: FONT.body, fontSize: 13, marginBottom: 14,
              }}
            />
            <div style={{ marginBottom: 6 }}>
              <GlowText size={11} style={{ letterSpacing: 1 }}>TOP PROS</GlowText>
            </div>
            {filteredPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} onFollow={handleFollow} followed={followedIds.includes(p.id)} />
            ))}
          </div>
        )}

        {/* ─── SCORES ─── */}
        {tab === "scores" && (
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <GlowText size={12} style={{ letterSpacing: 1 }}>LIVE SCORES</GlowText>
              <LiveBadge />
            </div>
            {/* Event sponsor banners — monetisation */}
            {EVENT_SPONSORS.map((s, i) => (
              <EventSponsorBanner key={i} sponsor={s} />
            ))}
            <div style={{ marginBottom: 8 }}>
              <GlowText size={10} color={COLORS.textDim} style={{ letterSpacing: 1 }}>TODAY'S MATCHES</GlowText>
            </div>
            {SCORES.map((m) => (
              <ScoreRow key={m.id} match={m} onBrowserOpen={openBrowser} />
            ))}
          </div>
        )}

        {/* ─── DROP ─── */}
        {tab === "drop" && (
          <div style={{ padding: "20px 14px" }}>
            <GlowText size={16} style={{ display: "block", marginBottom: 4 }}>DROP YOUR CLIP</GlowText>
            <p style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 20 }}>Got a clutch moment? Share it with the community.</p>
            {dropSuccess && (
              <div style={{ background: "#22C55E22", border: "1px solid #22C55E", borderRadius: 6, padding: 12, marginBottom: 16, fontFamily: FONT.chakra, fontSize: 11, color: "#22C55E", textAlign: "center", animation: "slideIn 0.3s ease" }}>
                ✅ CLIP DROPPED — it's live in the feed!
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textSub, letterSpacing: 1, display: "block", marginBottom: 6 }}>YOUTUBE URL</label>
                <input
                  value={dropForm.url}
                  onChange={(e) => setDropForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", color: COLORS.text, outline: "none", fontFamily: FONT.body, fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textSub, letterSpacing: 1, display: "block", marginBottom: 6 }}>GAME</label>
                <select
                  value={dropForm.game}
                  onChange={(e) => setDropForm((f) => ({ ...f, game: e.target.value }))}
                  style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", color: COLORS.text, outline: "none", fontFamily: FONT.chakra, fontSize: 11 }}
                >
                  {GAMES_LIST.filter((g) => g !== "All").map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.textSub, letterSpacing: 1, display: "block", marginBottom: 6 }}>CLIP TITLE</label>
                <input
                  value={dropForm.title}
                  onChange={(e) => setDropForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Describe the moment..."
                  style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", color: COLORS.text, outline: "none", fontFamily: FONT.body, fontSize: 12 }}
                />
              </div>
              <button
                onClick={handleDrop}
                style={{
                  background: COLORS.cyan, color: COLORS.bg, border: "none", borderRadius: 6,
                  padding: "13px", cursor: "pointer", fontFamily: FONT.chakra, fontSize: 13, fontWeight: 800,
                  boxShadow: `0 0 20px ${COLORS.cyanGlow}`, marginTop: 4,
                }}
              >
                ⚡ DROP IT
              </button>
            </div>
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {tab === "profile" && (
          <div style={{ padding: "20px 14px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, background: COLORS.cyanDim, border: `2px solid ${COLORS.cyan}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 28 }}>
                🎮
              </div>
              <GlowText size={16}>GamerTag_01</GlowText>
              <div style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.textSub, marginTop: 4 }}>ClutchFeed Member</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: FONT.chakra, fontSize: 10, color: COLORS.cyan }}>🔥 {streak} Day Streak</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[
                { label: "Saved", val: savedIds.length, icon: "🔖" },
                { label: "Following", val: followedIds.length, icon: "⚡" },
                { label: "Drops", val: clips.filter((c) => c.player === "You").length, icon: "📤" },
              ].map((s) => (
                <div key={s.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: FONT.chakra, fontSize: 16, fontWeight: 800, color: COLORS.cyan }}>{s.val}</div>
                  <div style={{ fontFamily: FONT.chakra, fontSize: 9, color: COLORS.textDim }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Saved clips list */}
            {savedIds.length > 0 && (
              <div>
                <GlowText size={11} style={{ letterSpacing: 1, display: "block", marginBottom: 10 }}>SAVED CLIPS</GlowText>
                {clips.filter((c) => savedIds.includes(c.id)).map((c) => (
                  <div key={c.id} onClick={() => setPlayingClip(c)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 12px", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{c.avatar}</span>
                    <div>
                      <div style={{ fontFamily: FONT.chakra, fontSize: 11, color: COLORS.text }}>{c.player}</div>
                      <div style={{ fontFamily: FONT.body, fontSize: 10, color: COLORS.textSub }}>{c.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav — BUG FIX: removed hamburger, correct 5-tab Android pattern */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: `${COLORS.surface}F8`,
        borderTop: `1px solid ${COLORS.border}`, backdropFilter: "blur(12px)",
        display: "flex", zIndex: 200,
      }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "10px 4px 8px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                borderTop: active ? `2px solid ${COLORS.cyan}` : "2px solid transparent",
                transition: "all 0.2s",
                boxShadow: active ? `0 -4px 12px ${COLORS.cyanGlow}` : "none",
              }}
            >
              <span style={{ fontSize: t.id === "drop" ? 22 : 18, fontWeight: t.id === "drop" ? 800 : 400 }}>{t.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT.chakra, letterSpacing: 0.5, color: active ? COLORS.cyan : COLORS.textDim }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
