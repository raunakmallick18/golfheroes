import { useState, useEffect, useCallback } from "react";

// ─── INITIAL DATA ───────────────────────────────────────────────────────────

const CHARITIES = [
  { id: "c1", name: "Golf for Good", desc: "Bringing golf to underserved youth communities across the country.", img: "⛳", raised: 12400, events: ["Charity Golf Day – June 14", "Junior Golf Camp – July 3"] },
  { id: "c2", name: "Greens & Hearts", desc: "Funding cardiac research through the power of sport.", img: "💚", raised: 8900, events: ["Spring Tournament – May 18"] },
  { id: "c3", name: "Fairways Foundation", desc: "Environmental conservation of golf courses and natural habitats.", img: "🌿", raised: 15200, events: ["Tree Planting Drive – April 22", "Clean Course Day – May 5"] },
  { id: "c4", name: "Par for Parkinson's", desc: "Supporting Parkinson's patients through therapeutic golf programs.", img: "🎗️", raised: 6750, events: ["Awareness Walk – June 1"] },
];

const CURRENCY = "₹";
const PLANS = {
  monthly: { id: "monthly", label: "Monthly", price: 1699, savings: null },
  yearly:  { id: "yearly",  label: "Yearly",  price: 1299, savings: "Save 24%" },
};

const ADMIN_CREDS = { email: "admin@golfheroes.com", password: "admin123" };

function seedUsers() {
  return [
    { id: "u1", name: "Raunak Mallick", email: "raunak.m@test.com", password: "test123", plan: "monthly", active: true, charity: "c1", charityPct: 10, scores: [
      { id: "s1", score: 32, date: "2024-03-10" }, { id: "s2", score: 28, date: "2024-03-17" },
      { id: "s3", score: 35, date: "2024-03-24" }, { id: "s4", score: 30, date: "2024-03-31" },
      { id: "s5", score: 33, date: "2024-04-07" },
    ], draws: [{ month: "March 2024", matched: 3, prize: 45 }], joined: "2024-01-15" },
    { id: "u2", name: "Priya Sharma", email: "priya@test.com", password: "test123", plan: "yearly", active: true, charity: "c2", charityPct: 15, scores: [
      { id: "s6", score: 22, date: "2024-04-01" }, { id: "s7", score: 25, date: "2024-04-08" },
      { id: "s8", score: 19, date: "2024-04-15" },
    ], draws: [], joined: "2024-02-01" },
  ];
}

function seedDraws() {
  return [
    { id: "d1", month: "March 2024", numbers: [28, 30, 33, 35, 32], status: "published", winners: [
      { userId: "u1", tier: "5-match", prize: 320, verified: true, paid: true },
    ]},
    { id: "d2", month: "April 2024", numbers: [], status: "pending", winners: [] },
  ];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 9); }

function calcPool(users, jackpot = 0) {
  const active = users.filter(u => u.active);
  const total = active.reduce((s, u) => s + (PLANS[u.plan]?.price || 1699) * 0.5, 0);
  return {
    total: total + jackpot,
    tier5: (total * 0.4) + jackpot,
    tier4: total * 0.35,
    tier3: total * 0.25,
    jackpot,
  };
}

function runDraw(users, mode = "random") {
  const active = users.filter(u => u.active && u.scores.length >= 3);
  const allScores = active.flatMap(u => u.scores.map(s => s.score));
  if (!allScores.length) return [1, 2, 3, 4, 5];
  
  if (mode === "algorithm") {
    const freq = {};
    allScores.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
    const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
    return sorted.slice(0, 5).map(Number).sort((a, b) => a - b);
  } else {
    const pool = [...new Set(allScores)];
    const picked = [];
    while (picked.length < 5 && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(i, 1)[0]);
    }
    while (picked.length < 5) picked.push(Math.floor(Math.random() * 44) + 1);
    return picked.sort((a, b) => a - b);
  }
}

function matchCount(userScores, drawNumbers) {
  const s = new Set(userScores.map(x => x.score));
  return drawNumbers.filter(n => s.has(n)).length;
}

// ─── FONTS & GLOBAL STYLE ───────────────────────────────────────────────────

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0e1a;
      --bg2: #111827;
      --bg3: #1a2235;
      --accent: #c8f751;
      --accent2: #4af0b8;
      --text: #f4f6fb;
      --muted: #7a8aaa;
      --border: rgba(255,255,255,0.08);
      --card: rgba(255,255,255,0.04);
      --radius: 16px;
      --radius-sm: 8px;
    }
    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
    h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }
    button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
    input, select, textarea { font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg2); } ::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 3px; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: 100px; font-size: 14px; font-weight: 600; border: none; transition: all 0.2s; }
    .btn-primary { background: var(--accent); color: #0a0e1a; }
    .btn-primary:hover { background: #d4fc6a; transform: translateY(-1px); }
    .btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
    .btn-outline:hover { border-color: rgba(255,255,255,0.25); background: var(--card); }
    .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
    .btn-success { background: rgba(74,240,184,0.15); color: var(--accent2); border: 1px solid rgba(74,240,184,0.25); }
    .btn-sm { padding: 6px 14px; font-size: 13px; }

    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
    .card-sm { padding: 16px; }
    .input { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; color: var(--text); font-size: 14px; outline: none; transition: border-color 0.2s; }
    .input:focus { border-color: var(--accent2); }
    .label { font-size: 12px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; display: block; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
    .badge-green { background: rgba(74,240,184,0.15); color: var(--accent2); }
    .badge-yellow { background: rgba(200,247,81,0.15); color: var(--accent); }
    .badge-red { background: rgba(239,68,68,0.12); color: #f87171; }
    .badge-gray { background: rgba(255,255,255,0.07); color: var(--muted); }
    .stat-card { background: var(--bg2); border-radius: var(--radius); padding: 20px 24px; }
    .stat-val { font-size: 28px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .stat-label { font-size: 13px; color: var(--muted); margin-top: 4px; }
    .nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); color: var(--muted); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; background: none; width: 100%; }
    .nav-link:hover, .nav-link.active { background: var(--card); color: var(--text); }
    .nav-link.active { color: var(--accent); }
    .section-title { font-size: 22px; margin-bottom: 6px; }
    .section-sub { color: var(--muted); font-size: 14px; margin-bottom: 24px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    .flex { display: flex; align-items: center; }
    .flex-between { display: flex; align-items: center; justify-content: space-between; }
    .gap8 { gap: 8px; } .gap12 { gap: 12px; } .gap16 { gap: 16px; }
    .mb8 { margin-bottom: 8px; } .mb12 { margin-bottom: 12px; } .mb16 { margin-bottom: 16px; }
    .mb24 { margin-bottom: 24px; } .mb32 { margin-bottom: 32px; }
    .divider { height: 1px; background: var(--border); margin: 20px 0; }
    .toast { position: fixed; bottom: 32px; right: 32px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 20px; font-size: 14px; z-index: 9999; animation: slideUp 0.3s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.35s ease forwards; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 12px; border-bottom: 1px solid var(--border); }
    td { padding: 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    tr:last-child td { border-bottom: none; }
    .score-ball { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--bg3); font-weight: 700; font-size: 15px; border: 2px solid var(--border); }
    .score-ball.matched { background: rgba(200,247,81,0.15); border-color: var(--accent); color: var(--accent); }
    .draw-ball { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: #0a0e1a; font-weight: 700; font-size: 18px; }
    .progress-bar { height: 4px; background: var(--bg3); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 0.5s; }
    @media (max-width: 768px) {
      .grid2, .grid3, .grid4 { grid-template-columns: 1fr; }
      .sidebar { display: none; }
    }
  `}</style>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return <div className="toast">{msg}</div>;
}

// ─── PUBLIC: HOMEPAGE ────────────────────────────────────────────────────────

function HomePage({ onSubscribe, onLogin }) {
  const [heroAnimated] = useState(true);
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "rgba(10,14,26,0.9)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>GolfHeroes</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={onLogin}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={onSubscribe}>Join Now</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: "100px 48px 80px", maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 60, alignItems: "center" }}>
        <div className="fade-in">
          <div className="badge badge-green mb16" style={{ marginBottom: 20 }}>🌍 Every round. Every cause.</div>
          <h1 style={{ fontSize: "clamp(42px, 5vw, 68px)", lineHeight: 1.1, marginBottom: 20 }}>
            Play Golf.<br />
            <span style={{ color: "var(--accent)" }}>Win Big.</span><br />
            Change Lives.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 18, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Enter your scores, join the monthly draw, and direct real money to the charity that matters most to you.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ fontSize: 16, padding: "14px 32px" }} onClick={onSubscribe}>
              Start for ₹1,299/mo →
            </button>
            <button className="btn btn-outline" onClick={() => document.getElementById("how-it-works").scrollIntoView({ behavior: "smooth" })}>
              How it works
            </button>
          </div>
        </div>

        {/* LIVE STATS PANEL */}
        <div className="fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="card" style={{ background: "var(--bg2)", border: "1px solid rgba(200,247,81,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.5s infinite" }}></div>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Live prize pool</span>
            </div>
            <div style={{ fontSize: 48, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "var(--accent)", marginBottom: 4 }}>₹4,05,000</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>April 2024 draw · 312 participants</div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["40%", "Jackpot"], ["35%", "4-Match"], ["25%", "3-Match"]].map(([pct, label]) => (
                <div key={label} style={{ textAlign: "center", padding: "12px 8px", background: "var(--bg3)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{pct}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(74,240,184,0.08)", borderRadius: 10, border: "1px solid rgba(74,240,184,0.15)" }}>
              <span style={{ fontSize: 18 }}>💚</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>₹15,42,000 donated to charities this year</span>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" style={{ padding: "80px 48px", background: "var(--bg2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>How it works</h2>
          <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: 56, fontSize: 16 }}>Three steps to meaningful play</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { n: "01", icon: "📋", title: "Subscribe & choose", body: "Pick your plan, choose a charity to support, and set how much of your subscription goes to good causes." },
              { n: "02", icon: "⛳", title: "Enter your scores", body: "Log up to 5 Stableford scores. Your rolling history auto-updates — most recent scores always kept fresh." },
              { n: "03", icon: "🎯", title: "Enter the draw", body: "Monthly numbers are drawn from player scores. Match 3, 4, or all 5 to win your share of the prize pool." },
            ].map(step => (
              <div key={step.n} className="fade-in">
                <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>{step.n}</div>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARITIES */}
      <div style={{ padding: "80px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 36, marginBottom: 8 }}>Causes we champion</h2>
        <p style={{ color: "var(--muted)", marginBottom: 40, fontSize: 15 }}>Choose where your subscription goes</p>
        <div className="grid2" style={{ gap: 20 }}>
          {CHARITIES.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{c.img}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</div>
                <div style={{ fontSize: 12, color: "var(--accent2)" }}>₹{c.raised.toLocaleString()} raised</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "80px 48px", textAlign: "center", background: "var(--bg2)" }}>
        <h2 style={{ fontSize: 42, marginBottom: 16 }}>Ready to play with purpose?</h2>
        <p style={{ color: "var(--muted)", marginBottom: 36, fontSize: 16, maxWidth: 480, margin: "0 auto 36px" }}>Join thousands of golfers making every round count.</p>
        <button className="btn btn-primary" style={{ fontSize: 16, padding: "16px 40px" }} onClick={onSubscribe}>
          Get started — 14-day free trial
        </button>
      </div>

      <footer style={{ padding: "32px 48px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700 }}>GolfHeroes</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>© 2024 GolfHeroes · digitalheroes.co.in</span>
      </footer>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

// ─── AUTH MODALS ──────────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg2)", borderRadius: 20, padding: 40, width: "100%", maxWidth: 440, border: "1px solid var(--border)" }} className="fade-in">
        {children}
      </div>
    </div>
  );
}

function LoginModal({ users, onLogin, onClose, toast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) { onLogin("admin", null); return; }
    const u = users.find(x => x.email === email && x.password === password);
    if (u) { onLogin("user", u.id); }
    else setErr("Invalid credentials. Try jamie@test.com / test123");
  };
  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Sign in to your GolfHeroes account</p>
      <label className="label">Email</label>
      <input className="input mb16" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      <label className="label">Password</label>
      <input className="input mb16" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      {err && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handle}>Sign In</button>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
        Test: raunak.m@test.com / test123 · Admin: admin@golfheroes.com / admin123
      </div>
    </Modal>
  );
}

function SignupModal({ onSignup, onClose }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("monthly");
  const [charity, setCharity] = useState("c1");
  const [charityPct, setCharityPct] = useState(10);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [card, setCard] = useState("");

  const finish = () => {
    if (!name || !email || !password) return;
    onSignup({ id: genId(), name, email, password, plan, active: true, charity, charityPct, scores: [], draws: [], joined: new Date().toISOString().slice(0, 10) });
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ height: 3, flex: 1, borderRadius: 2, background: s <= step ? "var(--accent)" : "var(--bg3)", transition: "background 0.3s" }} />
        ))}
      </div>

      {step === 1 && <>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Choose your plan</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>You can cancel anytime</p>
        {Object.values(PLANS).map(p => (
          <div key={p.id} onClick={() => setPlan(p.id)} style={{ padding: "16px 20px", border: `2px solid ${plan === p.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, cursor: "pointer", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.label}</div>
              {p.savings && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>{p.savings}</div>}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>₹{p.price.toLocaleString("en-IN")}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>/mo</span></div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => setStep(2)}>Continue →</button>
      </>}

      {step === 2 && <>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Choose your cause</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>Min 10% of your subscription</p>
        {CHARITIES.map(c => (
          <div key={c.id} onClick={() => setCharity(c.id)} style={{ padding: "12px 16px", border: `2px solid ${charity === c.id ? "var(--accent2)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", marginBottom: 8, display: "flex", gap: 12, alignItems: "center", transition: "border-color 0.2s" }}>
            <span style={{ fontSize: 20 }}>{c.img}</span>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</span>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <label className="label">Charity contribution: {charityPct}%</label>
          <input type="range" min="10" max="50" value={charityPct} onChange={e => setCharityPct(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(1)}>Back</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => setStep(3)}>Continue →</button>
        </div>
      </>}

      {step === 3 && <>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Create your account</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>Almost there!</p>
        <label className="label">Full Name</label>
        <input className="input mb12" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        <label className="label">Email</label>
        <input className="input mb12" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <label className="label">Password</label>
        <input className="input mb12" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
        <label className="label">Card Number (demo)</label>
        <input className="input mb20" value={card} onChange={e => setCard(e.target.value)} placeholder="4242 4242 4242 4242" />
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(2)}>Back</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={finish}>Subscribe 🎉</button>
        </div>
      </>}
    </Modal>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────

function UserDashboard({ user, users, draws, charities, onUpdateUser, onLogout, toast }) {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", icon: "⊞", label: "Overview" },
    { id: "scores", icon: "📊", label: "My Scores" },
    { id: "draws", icon: "🎯", label: "Draw History" },
    { id: "charity", icon: "💚", label: "My Charity" },
    { id: "profile", icon: "⚙️", label: "Settings" },
  ];

  const charity = charities.find(c => c.id === user.charity);
  const latestDraw = draws.filter(d => d.status === "published").slice(-1)[0];
  const myMatches = latestDraw ? matchCount(user.scores, latestDraw.numbers) : 0;
  const pool = calcPool(users);
  const monthlyFee = PLANS[user.plan].price;
  const charityAmt = Math.round(monthlyFee * user.charityPct / 100);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width: 240, background: "var(--bg2)", borderRight: "1px solid var(--border)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>GolfHeroes</span>
        </div>
        {tabs.map(t => (
          <button key={t.id} className={`nav-link ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg3)", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.email}</div>
          <div className="badge badge-green" style={{ marginTop: 6, fontSize: 11 }}>● {user.plan}</div>
        </div>
        <button className="nav-link" onClick={onLogout}><span>↩</span> Sign out</button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {tab === "overview" && <UserOverview user={user} charity={charity} pool={pool} myMatches={myMatches} latestDraw={latestDraw} charityAmt={charityAmt} toast={toast} />}
        {tab === "scores" && <ScoreManager user={user} onUpdateUser={onUpdateUser} toast={toast} />}
        {tab === "draws" && <DrawHistory user={user} draws={draws} />}
        {tab === "charity" && <CharityTab user={user} charity={charity} charities={charities} onUpdateUser={onUpdateUser} toast={toast} />}
        {tab === "profile" && <ProfileSettings user={user} onUpdateUser={onUpdateUser} toast={toast} />}
      </main>
    </div>
  );
}

function UserOverview({ user, charity, pool, myMatches, latestDraw, charityAmt, toast }) {
  const totalWon = user.draws.reduce((sum, d) => sum + (d.prize || 0), 0);
  return (
    <div className="fade-in">
      <h2 className="section-title">Good to see you, {user.name.split(" ")[0]} 👋</h2>
      <p className="section-sub">Here's your at-a-glance summary</p>

      <div className="grid4 mb24">
        {[
          { label: "Subscription", val: user.active ? "Active" : "Inactive", accent: user.active ? "var(--accent2)" : "#f87171" },
          { label: "Scores entered", val: user.scores.length + " / 5" },
          { label: "Monthly charity", val: "₹" + charityAmt },
          { label: "Total won", val: "₹" + totalWon },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-val" style={s.accent ? { color: s.accent } : {}}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {latestDraw && (
        <div className="card mb24" style={{ background: "linear-gradient(135deg, rgba(200,247,81,0.06) 0%, var(--card) 100%)", borderColor: "rgba(200,247,81,0.15)" }}>
          <div className="flex-between mb16">
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Last draw · {latestDraw.month}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Numbers drawn</div>
            </div>
            {myMatches >= 3 && <div className="badge badge-yellow">🏆 {myMatches} matched!</div>}
            {myMatches < 3 && myMatches > 0 && <div className="badge badge-gray">{myMatches} matched</div>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {latestDraw.numbers.map(n => (
              <div key={n} className={`score-ball ${user.scores.some(s => s.score === n) ? "matched" : ""}`}>{n}</div>
            ))}
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Prize pool breakdown</div>
          {[["Jackpot (5-match)", pool.tier5], ["4-match tier", pool.tier4], ["3-match tier", pool.tier3]].map(([label, val]) => (
            <div key={label} className="flex-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{label}</span>
              <span style={{ fontWeight: 600 }}>₹{Math.round(val).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Your cause</div>
          {charity && <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>{charity.img}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{charity.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.charityPct}% of your subscription</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((charity.raised / 20000) * 100, 100)}%` }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>₹{charity.raised.toLocaleString()} raised total</div>
          </>}
        </div>
      </div>
    </div>
  );
}

function ScoreManager({ user, onUpdateUser, toast }) {
  const [score, setScore] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState(null);
  const [editScore, setEditScore] = useState("");

  const addScore = () => {
    const s = parseInt(score);
    if (!s || s < 1 || s > 45) { toast("Score must be between 1 and 45"); return; }
    if (!date) { toast("Please pick a date"); return; }
    if (user.scores.some(x => x.date === date)) { toast("Score for this date already exists — edit or delete instead"); return; }
    const newScores = [...user.scores, { id: genId(), score: s, date }].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    onUpdateUser({ ...user, scores: newScores });
    setScore(""); toast("Score added ✓");
  };

  const deleteScore = (id) => {
    onUpdateUser({ ...user, scores: user.scores.filter(s => s.id !== id) });
    toast("Score removed");
  };

  const saveEdit = (id) => {
    const s = parseInt(editScore);
    if (!s || s < 1 || s > 45) { toast("Score must be between 1 and 45"); return; }
    onUpdateUser({ ...user, scores: user.scores.map(x => x.id === id ? { ...x, score: s } : x) });
    setEditing(null); toast("Score updated ✓");
  };

  const sorted = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fade-in">
      <h2 className="section-title">My Scores</h2>
      <p className="section-sub">Stableford format · Latest 5 kept · One per date</p>

      <div className="card mb24" style={{ maxWidth: 480 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Add a score</div>
        <div className="grid2 mb12">
          <div>
            <label className="label">Stableford score (1–45)</label>
            <input className="input" type="number" min="1" max="45" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 32" />
          </div>
          <div>
            <label className="label">Date played</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={addScore}>+ Add Score</button>
        {user.scores.length === 5 && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>⚠ 5 scores stored — adding a new one will remove the oldest</div>}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Score history <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>({sorted.length}/5)</span></div>
        {sorted.length === 0 && <div style={{ color: "var(--muted)", fontSize: 14, padding: "20px 0", textAlign: "center" }}>No scores yet — add your first round above</div>}
        {sorted.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="score-ball">{s.score}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Round {sorted.length - i}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
            {editing === s.id ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" type="number" min="1" max="45" value={editScore} onChange={e => setEditScore(e.target.value)} style={{ width: 72 }} />
                <button className="btn btn-success btn-sm" onClick={() => saveEdit(s.id)}>Save</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditing(s.id); setEditScore(s.score); }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteScore(s.id)}>Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawHistory({ user, draws }) {
  const published = draws.filter(d => d.status === "published");
  return (
    <div className="fade-in">
      <h2 className="section-title">Draw History</h2>
      <p className="section-sub">Your participation in monthly draws</p>
      {published.length === 0 && <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No published draws yet</div>}
      {published.map(draw => {
        const matched = matchCount(user.scores, draw.numbers);
        const userWin = draw.winners.find(w => w.userId === user.id);
        return (
          <div className="card mb16" key={draw.id}>
            <div className="flex-between mb16">
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{draw.month}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Matched {matched} number{matched !== 1 ? "s" : ""}</div>
              </div>
              {userWin ? <div className="badge badge-yellow">Won ₹{Math.round(userWin.prize).toLocaleString("en-IN")}</div> : matched >= 3 ? <div className="badge badge-green">Winner</div> : <div className="badge badge-gray">No win</div>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {draw.numbers.map(n => (
                <div key={n} className={`score-ball ${user.scores.some(s => s.score === n) ? "matched" : ""}`}>{n}</div>
              ))}
            </div>
            {userWin && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(200,247,81,0.08)", borderRadius: 10, fontSize: 13 }}>
                Prize: ₹{Math.round(userWin.prize).toLocaleString("en-IN")} · Status: <span style={{ color: userWin.paid ? "var(--accent2)" : "var(--accent)" }}>{userWin.paid ? "Paid ✓" : "Pending verification"}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CharityTab({ user, charity, charities, onUpdateUser, toast }) {
  const [newCharity, setNewCharity] = useState(user.charity);
  const [pct, setPct] = useState(user.charityPct);
  const [donateAmt, setDonateAmt] = useState("");
  const save = () => { onUpdateUser({ ...user, charity: newCharity, charityPct: pct }); toast("Charity preferences saved ✓"); };
  return (
    <div className="fade-in">
      <h2 className="section-title">My Charity</h2>
      <p className="section-sub">Manage your charitable giving</p>
      <div className="grid2">
        <div>
          <div className="card mb16">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Change your cause</div>
            {charities.map(c => (
              <div key={c.id} onClick={() => setNewCharity(c.id)} style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${newCharity === c.id ? "var(--accent2)" : "var(--border)"}`, cursor: "pointer", marginBottom: 8, display: "flex", gap: 12, alignItems: "center", transition: "border-color 0.2s" }}>
                <span style={{ fontSize: 20 }}>{c.img}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>₹{c.raised.toLocaleString()} raised</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <label className="label">Contribution: {pct}% of subscription</label>
              <input type="range" min="10" max="50" step="1" value={pct} onChange={e => setPct(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)", marginBottom: 12 }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={save}>Save preferences</button>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>One-off donation</div>
            <label className="label">Amount (₹)</label>
            <input className="input mb12" type="number" min="1" value={donateAmt} onChange={e => setDonateAmt(e.target.value)} placeholder="e.g. 25" />
            <button className="btn btn-success btn-sm" onClick={() => { setDonateAmt(""); toast("Thank you for your donation! 💚"); }}>Donate now</button>
          </div>
        </div>

        {charity && (
          <div className="card">
            <div style={{ fontSize: 40, marginBottom: 12 }}>{charity.img}</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{charity.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{charity.desc}</div>
            <div className="divider" />
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Upcoming events</div>
            {charity.events.map(ev => (
              <div key={ev} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--accent)", fontSize: 16 }}>→</span>
                <span>{ev}</span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Total raised</div>
            <div style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", color: "var(--accent2)" }}>₹{charity.raised.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSettings({ user, onUpdateUser, toast }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const save = () => { onUpdateUser({ ...user, name, email }); toast("Profile updated ✓"); };
  const cancel = () => { onUpdateUser({ ...user, active: false }); toast("Subscription cancelled"); };
  return (
    <div className="fade-in">
      <h2 className="section-title">Account Settings</h2>
      <p className="section-sub">Manage your profile and subscription</p>
      <div style={{ maxWidth: 480 }}>
        <div className="card mb16">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Profile details</div>
          <label className="label">Full name</label>
          <input className="input mb12" value={name} onChange={e => setName(e.target.value)} />
          <label className="label">Email</label>
          <input className="input mb16" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={save}>Save changes</button>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Subscription</div>
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            Plan: <strong style={{ color: "var(--text)" }}>{PLANS[user.plan].label}</strong> · ₹{PLANS[user.plan].price.toLocaleString("en-IN")}/mo · Status: <span style={{ color: user.active ? "var(--accent2)" : "#f87171" }}>{user.active ? "Active" : "Inactive"}</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={cancel}>Cancel subscription</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

function AdminDashboard({ users, setUsers, draws, setDraws, charities, setCharities, onLogout, toast }) {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", icon: "⊞", label: "Overview" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "draws", icon: "🎯", label: "Draws" },
    { id: "charities", icon: "💚", label: "Charities" },
    { id: "winners", icon: "🏆", label: "Winners" },
    { id: "reports", icon: "📈", label: "Reports" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sidebar" style={{ width: 240, background: "var(--bg2)", borderRight: "1px solid var(--border)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>Admin</span>
        </div>
        {tabs.map(t => (
          <button key={t.id} className={`nav-link ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="nav-link" onClick={onLogout}><span>↩</span> Sign out</button>
      </aside>
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {tab === "overview" && <AdminOverview users={users} draws={draws} charities={charities} />}
        {tab === "users" && <AdminUsers users={users} setUsers={setUsers} toast={toast} />}
        {tab === "draws" && <AdminDraws users={users} draws={draws} setDraws={setDraws} toast={toast} />}
        {tab === "charities" && <AdminCharities charities={charities} setCharities={setCharities} toast={toast} />}
        {tab === "winners" && <AdminWinners users={users} draws={draws} setDraws={setDraws} toast={toast} />}
        {tab === "reports" && <AdminReports users={users} draws={draws} charities={charities} />}
      </main>
    </div>
  );
}

function AdminOverview({ users, draws, charities }) {
  const active = users.filter(u => u.active);
  const pool = calcPool(users);
  const totalCharity = users.reduce((s, u) => s + PLANS[u.plan]?.price * (u.charityPct / 100), 0);
  const published = draws.filter(d => d.status === "published");
  return (
    <div className="fade-in">
      <h2 className="section-title">Admin Overview</h2>
      <p className="section-sub">Platform-wide snapshot</p>
      <div className="grid4 mb24">
        {[
          { label: "Active subscribers", val: active.length },
          { label: "Total prize pool", val: "₹" + Math.round(pool.total).toLocaleString("en-IN") },
          { label: "Monthly charity total", val: "₹" + Math.round(totalCharity).toLocaleString("en-IN") },
          { label: "Draws published", val: published.length },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Subscribers by plan</div>
          {["monthly", "yearly"].map(p => {
            const count = users.filter(u => u.plan === p && u.active).length;
            const pct = active.length ? (count / active.length) * 100 : 0;
            return (
              <div key={p} style={{ marginBottom: 14 }}>
                <div className="flex-between mb8">
                  <span style={{ fontSize: 14, textTransform: "capitalize" }}>{p}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{count}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Charity distribution</div>
          {charities.map(c => {
            const chosen = users.filter(u => u.charity === c.id).length;
            const pct = users.length ? (chosen / users.length) * 100 : 0;
            return (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div className="flex-between mb8">
                  <span style={{ fontSize: 14 }}>{c.img} {c.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{chosen}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: "var(--accent2)" }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ users, setUsers, toast }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const toggleActive = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, active: !u.active } : u));
    toast("User status updated");
  };
  const saveName = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, name: editName } : u));
    setEditId(null); toast("User updated");
  };
  const deleteUser = (id) => { setUsers(users.filter(u => u.id !== id)); toast("User removed"); };

  return (
    <div className="fade-in">
      <h2 className="section-title">User Management</h2>
      <p className="section-sub">{users.length} total users</p>
      <input className="input mb16" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      <div className="card">
        <table>
          <thead><tr><th>User</th><th>Plan</th><th>Charity %</th><th>Scores</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  {editId === u.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: 160 }} />
                      <button className="btn btn-success btn-sm" onClick={() => saveName(u.id)}>✓</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}</div>
                    </div>
                  )}
                </td>
                <td><div className="badge badge-gray">{u.plan}</div></td>
                <td>{u.charityPct}%</td>
                <td>{u.scores.length}/5</td>
                <td><div className={`badge ${u.active ? "badge-green" : "badge-red"}`}>{u.active ? "Active" : "Inactive"}</div></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditId(u.id); setEditName(u.name); }}>Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u.id)}>{u.active ? "Suspend" : "Activate"}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDraws({ users, draws, setDraws, toast }) {
  const [mode, setMode] = useState("random");
  const [sim, setSim] = useState(null);
  const pendingDraw = draws.find(d => d.status === "pending");
  const pool = calcPool(users);

  const simulate = () => {
    const nums = runDraw(users, mode);
    setSim(nums); toast("Simulation complete — preview below");
  };

  const publish = () => {
    if (!sim) { toast("Run a simulation first"); return; }
    const winners = [];
    users.filter(u => u.active).forEach(u => {
      const matched = matchCount(u.scores, sim);
      if (matched >= 3) {
        winners.push({ userId: u.id, tier: `${matched}-match`, prize: matched === 5 ? pool.tier5 : matched === 4 ? pool.tier4 : pool.tier3, verified: false, paid: false });
      }
    });
    setDraws(draws.map(d => d.id === pendingDraw?.id ? { ...d, numbers: sim, status: "published", winners } : d).concat(pendingDraw ? [] : []));
    setSim(null); toast("Draw published! " + (winners.length ? winners.length + " winner(s) found" : "No winners this month"));
  };

  const addMonth = () => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const now = new Date();
    setDraws([...draws, { id: genId(), month: months[now.getMonth()] + " " + now.getFullYear(), numbers: [], status: "pending", winners: [] }]);
    toast("New draw month added");
  };

  return (
    <div className="fade-in">
      <h2 className="section-title">Draw Management</h2>
      <p className="section-sub">Configure and publish monthly draws</p>

      <div className="card mb24" style={{ maxWidth: 560 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Draw engine</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["random", "algorithm"].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-outline"}`} style={{ textTransform: "capitalize" }}>{m}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          {mode === "random" ? "Standard lottery — numbers randomly selected from all player scores" : "Weighted by score frequency — most common player scores get higher probability"}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={simulate}>▶ Run simulation</button>
          <button className="btn btn-primary btn-sm" onClick={publish} disabled={!sim}>Publish draw</button>
          <button className="btn btn-outline btn-sm" onClick={addMonth}>+ Add draw month</button>
        </div>
        {sim && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Simulation preview:</div>
            <div style={{ display: "flex", gap: 10 }}>{sim.map(n => <div key={n} className="draw-ball">{n}</div>)}</div>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>All draws</div>
        <table>
          <thead><tr><th>Month</th><th>Status</th><th>Numbers</th><th>Winners</th></tr></thead>
          <tbody>
            {[...draws].reverse().map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 500 }}>{d.month}</td>
                <td><div className={`badge ${d.status === "published" ? "badge-green" : "badge-yellow"}`}>{d.status}</div></td>
                <td>
                  {d.numbers.length ? (
                    <div style={{ display: "flex", gap: 6 }}>{d.numbers.map(n => <div key={n} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{n}</div>)}</div>
                  ) : <span style={{ color: "var(--muted)" }}>–</span>}
                </td>
                <td>{d.winners.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCharities({ charities, setCharities, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImg, setNewImg] = useState("🌟");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const add = () => {
    if (!newName) return;
    setCharities([...charities, { id: genId(), name: newName, desc: newDesc, img: newImg, raised: 0, events: [] }]);
    setNewName(""); setNewDesc(""); setShowAdd(false); toast("Charity added ✓");
  };
  const remove = (id) => { setCharities(charities.filter(c => c.id !== id)); toast("Charity removed"); };
  const saveEdit = (id) => { setCharities(charities.map(c => c.id === id ? { ...c, name: editName } : c)); setEditId(null); toast("Updated"); };

  return (
    <div className="fade-in">
      <div className="flex-between mb24">
        <div>
          <h2 className="section-title">Charity Management</h2>
          <p className="section-sub">{charities.length} charities listed</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add charity</button>
      </div>

      {showAdd && (
        <div className="card mb16" style={{ maxWidth: 480 }}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>New charity</div>
          <label className="label">Emoji icon</label>
          <input className="input mb12" value={newImg} onChange={e => setNewImg(e.target.value)} placeholder="🌟" style={{ width: 80 }} />
          <label className="label">Name</label>
          <input className="input mb12" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Charity name" />
          <label className="label">Description</label>
          <textarea className="input mb16" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="Brief description..." style={{ resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Charity</th><th>Raised</th><th>Subscribers</th><th>Actions</th></tr></thead>
          <tbody>
            {charities.map(c => (
              <tr key={c.id}>
                <td>
                  {editId === c.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: 180 }} />
                      <button className="btn btn-success btn-sm" onClick={() => saveEdit(c.id)}>✓</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{c.img}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.desc?.slice(0, 50)}{c.desc?.length > 50 ? "..." : ""}</div>
                      </div>
                    </div>
                  )}
                </td>
                <td>₹{c.raised.toLocaleString()}</td>
                <td>–</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditId(c.id); setEditName(c.name); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminWinners({ users, draws, setDraws, toast }) {
  const allWinners = draws.flatMap(d => d.winners.map(w => ({ ...w, month: d.month, drawId: d.id })));
  const user = (id) => users.find(u => u.id === id);

  const verify = (drawId, userId) => {
    setDraws(draws.map(d => d.id === drawId ? { ...d, winners: d.winners.map(w => w.userId === userId ? { ...w, verified: true } : w) } : d));
    toast("Winner verified ✓");
  };
  const markPaid = (drawId, userId) => {
    setDraws(draws.map(d => d.id === drawId ? { ...d, winners: d.winners.map(w => w.userId === userId ? { ...w, paid: true } : w) } : d));
    toast("Marked as paid ✓");
  };
  const reject = (drawId, userId) => {
    setDraws(draws.map(d => d.id === drawId ? { ...d, winners: d.winners.filter(w => !(w.userId === userId)) } : d));
    toast("Winner rejected and removed");
  };

  return (
    <div className="fade-in">
      <h2 className="section-title">Winner Verification</h2>
      <p className="section-sub">{allWinners.length} winner records</p>
      {allWinners.length === 0 && <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No winners yet</div>}
      {allWinners.length > 0 && (
        <div className="card">
          <table>
            <thead><tr><th>User</th><th>Month</th><th>Tier</th><th>Prize</th><th>Verified</th><th>Paid</th><th>Actions</th></tr></thead>
            <tbody>
              {allWinners.map((w, i) => {
                const u = user(w.userId);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{u?.name || "Unknown"}</td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{w.month}</td>
                    <td><div className="badge badge-yellow">{w.tier}</div></td>
                    <td style={{ fontWeight: 700 }}>₹{Math.round(w.prize ?? 0).toLocaleString("en-IN")}</td>
                    <td><div className={`badge ${w.verified ? "badge-green" : "badge-gray"}`}>{w.verified ? "Yes" : "Pending"}</div></td>
                    <td><div className={`badge ${w.paid ? "badge-green" : "badge-gray"}`}>{w.paid ? "Paid" : "Unpaid"}</div></td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {!w.verified && <button className="btn btn-success btn-sm" onClick={() => verify(w.drawId, w.userId)}>Verify</button>}
                        {w.verified && !w.paid && <button className="btn btn-primary btn-sm" onClick={() => markPaid(w.drawId, w.userId)}>Mark Paid</button>}
                        <button className="btn btn-danger btn-sm" onClick={() => reject(w.drawId, w.userId)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminReports({ users, draws, charities }) {
  const pool = calcPool(users);
  const active = users.filter(u => u.active);
  const totalRev = active.reduce((s, u) => s + PLANS[u.plan]?.price, 0);
  const totalCharity = users.reduce((s, u) => s + PLANS[u.plan]?.price * (u.charityPct / 100), 0);
  const allWinners = draws.flatMap(d => d.winners);
  const totalPaid = allWinners.filter(w => w.paid).reduce((s, w) => s + (w.prize || 0), 0);

  return (
    <div className="fade-in">
      <h2 className="section-title">Reports & Analytics</h2>
      <p className="section-sub">Platform financial overview</p>
      <div className="grid4 mb24">
        {[
          { label: "Monthly revenue", val: "₹" + Math.round(totalRev).toLocaleString("en-IN") },
          { label: "Prize pool (live)", val: "₹" + Math.round(pool.total).toLocaleString("en-IN") },
          { label: "Charity contributions", val: "₹" + Math.round(totalCharity).toLocaleString("en-IN") },
          { label: "Total prizes paid", val: "₹" + Math.round(totalPaid).toLocaleString("en-IN") },
        ].map(s => <div className="stat-card" key={s.label}><div className="stat-val">{s.val}</div><div className="stat-label">{s.label}</div></div>)}
      </div>
      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Draw statistics</div>
          <div className="flex-between" style={{ marginBottom: 10, fontSize: 14 }}><span style={{ color: "var(--muted)" }}>Total draws</span><strong>{draws.length}</strong></div>
          <div className="flex-between" style={{ marginBottom: 10, fontSize: 14 }}><span style={{ color: "var(--muted)" }}>Published</span><strong>{draws.filter(d => d.status === "published").length}</strong></div>
          <div className="flex-between" style={{ marginBottom: 10, fontSize: 14 }}><span style={{ color: "var(--muted)" }}>Total winners</span><strong>{allWinners.length}</strong></div>
          <div className="flex-between" style={{ fontSize: 14 }}><span style={{ color: "var(--muted)" }}>Jackpot pool</span><strong>₹{Math.round(pool.tier5).toLocaleString("en-IN")}</strong></div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Charity totals</div>
          {charities.map(c => (
            <div key={c.id} className="flex-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "center" }}><span>{c.img}</span>{c.name}</span>
              <strong style={{ fontSize: 14 }}>₹{c.raised.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [users, setUsers] = useState(seedUsers());
  const [draws, setDraws] = useState(seedDraws());
  const [charities, setCharities] = useState(CHARITIES);
  const [session, setSession] = useState(null); // null | { role: "user"|"admin", userId }
  const [modal, setModal] = useState(null); // "login" | "signup"
  const [toastMsg, setToastMsg] = useState(null);

  const toast = useCallback((msg) => { setToastMsg(msg); }, []);

  const handleLogin = (role, userId) => {
    setSession({ role, userId });
    setModal(null);
    toast(role === "admin" ? "Welcome, Admin 🛡" : "Welcome back! 👋");
  };

  const handleSignup = (newUser) => {
    setUsers(prev => [...prev, newUser]);
    setSession({ role: "user", userId: newUser.id });
    setModal(null);
    toast("Account created! Welcome to GolfHeroes 🎉");
  };

  const handleLogout = () => { setSession(null); toast("Signed out"); };

  const updateUser = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const currentUser = session?.role === "user" ? users.find(u => u.id === session.userId) : null;

  return (
    <>
      <GlobalStyle />
      {!session && (
        <HomePage onSubscribe={() => setModal("signup")} onLogin={() => setModal("login")} />
      )}
      {session?.role === "user" && currentUser && (
        <UserDashboard
          user={currentUser} users={users} draws={draws} charities={charities}
          onUpdateUser={updateUser} onLogout={handleLogout} toast={toast}
        />
      )}
      {session?.role === "admin" && (
        <AdminDashboard
          users={users} setUsers={setUsers} draws={draws} setDraws={setDraws}
          charities={charities} setCharities={setCharities} onLogout={handleLogout} toast={toast}
        />
      )}
      {modal === "login" && <LoginModal users={users} onLogin={handleLogin} onClose={() => setModal(null)} toast={toast} />}
      {modal === "signup" && <SignupModal onSignup={handleSignup} onClose={() => setModal(null)} />}
      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </>
  );
}
