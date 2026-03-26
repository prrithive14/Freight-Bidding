import { useState, useEffect, useRef } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;700;800&display=swap');`;

// ─── DATA ────────────────────────────────────────────────────────────────────

const CARRIER_PROFILES = {
  "Shri Logistics":       { rating: 4.8, trips: 312, onTime: 97, since: 2018, region: "Pan-India", fleet: 48, badge: "Top Rated" },
  "FastMove India":       { rating: 4.5, trips: 187, onTime: 91, since: 2020, region: "West & North", fleet: 22, badge: null },
  "CoolChain Transport":  { rating: 4.9, trips: 523, onTime: 99, since: 2016, region: "South India", fleet: 61, badge: "Premium" },
  "Iron Road Freight":    { rating: 4.3, trips: 98,  onTime: 88, since: 2021, region: "East India", fleet: 14, badge: null },
  "Bharat Carriers":      { rating: 4.7, trips: 441, onTime: 95, since: 2017, region: "Pan-India", fleet: 73, badge: "Verified" },
  "Ganges Movers":        { rating: 4.1, trips: 65,  onTime: 84, since: 2022, region: "East India", fleet: 9,  badge: null },
  "Nova Freight Co.":     { rating: 4.6, trips: 278, onTime: 93, since: 2019, region: "West India", fleet: 31, badge: "Verified" },
  "HindRoute Logistics":  { rating: 4.4, trips: 156, onTime: 90, since: 2020, region: "Central India", fleet: 19, badge: null },
  "Skyline Truckers":     { rating: 4.2, trips: 112, onTime: 87, since: 2021, region: "North India", fleet: 16, badge: null },
  "PeakLoad Transport":   { rating: 4.8, trips: 389, onTime: 96, since: 2018, region: "Pan-India", fleet: 55, badge: "Top Rated" },
  "Golden Mile Cargo":    { rating: 4.5, trips: 201, onTime: 92, since: 2019, region: "South & West", fleet: 27, badge: null },
  "Deccan Speedways":     { rating: 4.7, trips: 334, onTime: 94, since: 2017, region: "South India", fleet: 42, badge: "Verified" },
};

const ALL_CARRIERS = Object.keys(CARRIER_PROFILES);

// Approximate city coords for map visualization
const CITY_COORDS = {
  "Mumbai, MH":    { x: 18,  y: 52 },
  "Delhi, DL":     { x: 28,  y: 22 },
  "Chennai, TN":   { x: 38,  y: 72 },
  "Hyderabad, TS": { x: 34,  y: 58 },
  "Kolkata, WB":   { x: 60,  y: 38 },
  "Patna, BR":     { x: 52,  y: 30 },
  "Bangalore, KA": { x: 32,  y: 68 },
  "Pune, MH":      { x: 22,  y: 57 },
  "Ahmedabad, GJ": { x: 16,  y: 38 },
  "Surat, GJ":     { x: 16,  y: 47 },
  "Jaipur, RJ":    { x: 24,  y: 28 },
  "Lucknow, UP":   { x: 42,  y: 27 },
};

const INITIAL_CARGOS = [
  {
    id: "RNT-001", origin: "Mumbai, MH", destination: "Delhi, DL",
    weight: "18,500 kg", type: "General Merchandise", distance: "1,414 km",
    deadline: "2026-03-28", baseRate: 85000, status: "live", timer: 180,
    bids: [
      { carrier: "Shri Logistics",    amount: 79000, time: "10:42 AM", ts: Date.now() - 3600000 },
      { carrier: "FastMove India",    amount: 81500, time: "10:45 AM", ts: Date.now() - 3200000 },
      { carrier: "Nova Freight Co.",  amount: 77500, time: "11:02 AM", ts: Date.now() - 1800000 },
    ],
  },
  {
    id: "RNT-002", origin: "Chennai, TN", destination: "Hyderabad, TS",
    weight: "6,200 kg", type: "Perishable Goods", distance: "627 km",
    deadline: "2026-03-27", baseRate: 32000, status: "live", timer: 420,
    bids: [
      { carrier: "CoolChain Transport", amount: 29500, time: "11:01 AM", ts: Date.now() - 2700000 },
      { carrier: "Deccan Speedways",    amount: 28800, time: "11:15 AM", ts: Date.now() - 1200000 },
    ],
  },
  {
    id: "RNT-003", origin: "Kolkata, WB", destination: "Patna, BR",
    weight: "11,000 kg", type: "Construction Material", distance: "531 km",
    deadline: "2026-03-29", baseRate: 44000, status: "closed", timer: 0,
    bids: [
      { carrier: "Iron Road Freight",  amount: 38000, time: "09:15 AM", ts: Date.now() - 7200000 },
      { carrier: "Bharat Carriers",    amount: 36500, time: "09:22 AM", ts: Date.now() - 6900000 },
      { carrier: "Ganges Movers",      amount: 41000, time: "09:30 AM", ts: Date.now() - 6300000 },
      { carrier: "HindRoute Logistics",amount: 37200, time: "09:44 AM", ts: Date.now() - 5800000 },
    ],
  },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────

const formatINR = n => "₹" + Number(n).toLocaleString("en-IN");
const formatTime = s => { const m = Math.floor(s/60); return `${String(m).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; };

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────

const Pill = ({ children, color = "#f59e0b", bg }) => (
  <span style={{
    display: "inline-block", padding: "2px 9px", borderRadius: 20,
    fontFamily: "Rajdhani", fontWeight: 700, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase",
    color, background: bg || `${color}18`, border: `1px solid ${color}44`,
  }}>{children}</span>
);

const StatBox = ({ label, val, icon, accent }) => (
  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
    <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 20, color: accent || "#f3f4f6" }}>{val}</div>
    <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
  </div>
);

// ─── NOTIFICATION SYSTEM ─────────────────────────────────────────────────────

let _notifId = 0;
const NOTIF_INIT = [
  { id: ++_notifId, type: "bid",     msg: "Nova Freight Co. placed a bid of ₹77,500 on RNT-001", time: "2 min ago", read: false },
  { id: ++_notifId, type: "winner",  msg: "RNT-003 bidding closed — Bharat Carriers won at ₹36,500", time: "1 hr ago",  read: false },
  { id: ++_notifId, type: "cargo",   msg: "New cargo RNT-002 posted: Chennai → Hyderabad", time: "2 hr ago",  read: true  },
  { id: ++_notifId, type: "bid",     msg: "Deccan Speedways placed a bid of ₹28,800 on RNT-002", time: "45 min ago", read: true },
];

function NotifPanel({ notifs, setNotifs, onClose }) {
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const typeIcon = t => ({ bid: "📋", winner: "🏆", cargo: "📦", system: "⚙️" })[t] || "🔔";

  return (
    <div style={{
      position: "fixed", top: 60, right: 16, width: 360, zIndex: 500,
      background: "#13141a", border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      animation: "slideDown 0.25s ease",
    }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, color: "#f3f4f6" }}>Notifications</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={markAll} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Rajdhani", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>Mark all read</button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 18 }}>×</button>
        </div>
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {notifs.map(n => (
          <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{
            padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: n.read ? "transparent" : "rgba(245,158,11,0.04)",
            cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
            transition: "background 0.2s",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{typeIcon(n.type)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Rajdhani", fontSize: 14, color: n.read ? "#9ca3af" : "#e5e7eb", lineHeight: 1.4 }}>{n.msg}</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#4b5563", marginTop: 3 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAP VIEW ────────────────────────────────────────────────────────────────

function MapView({ cargos, selectedId, onSelect }) {
  const colors = { live: "#f59e0b", closed: "#374151" };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0e1015", borderRadius: 0, overflow: "hidden" }}>
      {/* Grid lines */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <g key={i}>
            <line x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#f59e0b" strokeWidth="0.5" />
            <line x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#f59e0b" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* India silhouette hint */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "Syne", fontSize: 180, fontWeight: 800, color: "rgba(255,255,255,0.015)", userSelect: "none", letterSpacing: "-0.05em" }}>IND</div>
      </div>

      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {cargos.map(cargo => {
          const o = CITY_COORDS[cargo.origin];
          const d = CITY_COORDS[cargo.destination];
          if (!o || !d) return null;
          const col = colors[cargo.status];
          const sel = cargo.id === selectedId;
          return (
            <g key={cargo.id} onClick={() => onSelect(cargo.id)} style={{ cursor: "pointer" }}>
              <line
                x1={`${o.x}%`} y1={`${o.y}%`} x2={`${d.x}%`} y2={`${d.y}%`}
                stroke={col} strokeWidth={sel ? 2 : 1}
                strokeDasharray={cargo.status === "live" ? "6 4" : "0"}
                opacity={sel ? 1 : 0.5}
              />
              {/* Origin */}
              <circle cx={`${o.x}%`} cy={`${o.y}%`} r={sel ? 8 : 5} fill={col} opacity={sel ? 1 : 0.6} />
              <circle cx={`${o.x}%`} cy={`${o.y}%`} r={sel ? 14 : 0} fill={col} opacity={0.12} />
              {/* Destination */}
              <rect
                x={`${d.x}%`} y={`${d.y}%`}
                width={sel ? 12 : 8} height={sel ? 12 : 8}
                transform={`translate(-${sel?6:4},-${sel?6:4}) rotate(45,${d.x*6},${d.y*6})`}
                fill={col} opacity={sel ? 1 : 0.6}
              />
              {/* Labels */}
              {sel && <>
                <text x={`${o.x}%`} y={`${o.y - 3}%`} textAnchor="middle" fill="#f59e0b"
                  fontSize="11" fontFamily="Rajdhani" fontWeight="700" dy="-4">{cargo.origin.split(",")[0]}</text>
                <text x={`${d.x}%`} y={`${d.y - 3}%`} textAnchor="middle" fill="#f59e0b"
                  fontSize="11" fontFamily="Rajdhani" fontWeight="700" dy="-8">{cargo.destination.split(",")[0]}</text>
              </>}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 20, left: 20, display: "flex", gap: 16 }}>
        {[{ col: "#f59e0b", label: "Live" }, { col: "#374151", label: "Closed" }].map(({ col, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Rajdhani", fontSize: 12, color: "#6b7280" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />
            {label}
          </div>
        ))}
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#374151" }}>● Origin  ◆ Destination</div>
      </div>

      {/* Selected cargo overlay */}
      {selectedId && (() => {
        const c = cargos.find(x => x.id === selectedId);
        if (!c) return null;
        const lowestBid = c.bids.length ? Math.min(...c.bids.map(b => b.amount)) : null;
        return (
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(13,14,20,0.92)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 12, padding: "14px 16px", minWidth: 200,
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#f59e0b", marginBottom: 4 }}>{c.id}</div>
            <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, color: "#f3f4f6" }}>{c.origin.split(",")[0]} → {c.destination.split(",")[0]}</div>
            <div style={{ fontFamily: "Rajdhani", fontSize: 13, color: "#6b7280", marginTop: 4 }}>{c.distance} · {c.weight}</div>
            {lowestBid && <div style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: "#34d399", marginTop: 6 }}>Best: {formatINR(lowestBid)}</div>}
          </div>
        );
      })()}
    </div>
  );
}

// ─── CARRIER PROFILE MODAL ───────────────────────────────────────────────────

function CarrierProfileModal({ carrier, onClose }) {
  const p = CARRIER_PROFILES[carrier] || { rating: 4.0, trips: 0, onTime: 85, since: 2022, region: "—", fleet: 0, badge: null };
  const stars = Math.round(p.rating);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 440, background: "#13141a", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20, padding: "28px 28px", animation: "slideDown 0.25s ease",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #1e293b, #334155)",
              border: "2px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "#f59e0b",
            }}>{carrier[0]}</div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "#f9fafb" }}>{carrier}</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#6b7280" }}>Since {p.since} · {p.region}</div>
              {p.badge && <Pill color={p.badge === "Top Rated" ? "#f59e0b" : p.badge === "Premium" ? "#a78bfa" : "#34d399"}>{p.badge}</Pill>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: 22 }}>×</button>
        </div>

        {/* Rating */}
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, padding: "16px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 40, color: "#f59e0b", lineHeight: 1 }}>{p.rating}</div>
            <div style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>{"★".repeat(stars)}{"☆".repeat(5-stars)}</div>
            <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#6b7280", marginTop: 2 }}>OVERALL RATING</div>
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Trips", val: p.trips, icon: "🚛" },
              { label: "On-Time %", val: `${p.onTime}%`, icon: "⏱" },
              { label: "Fleet Size", val: p.fleet, icon: "🚚" },
              { label: "Coverage", val: p.region, icon: "📍" },
            ].map(({ label, val, icon }) => (
              <div key={label}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563" }}>{icon} {label}</div>
                <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, color: "#e5e7eb" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bars */}
        {[
          { label: "On-Time Delivery", pct: p.onTime, col: "#34d399" },
          { label: "Customer Satisfaction", pct: Math.round(p.rating / 5 * 100), col: "#f59e0b" },
          { label: "Cargo Safety Record", pct: 88 + Math.round(p.rating * 2), col: "#60a5fa" },
        ].map(({ label, pct, col }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani", fontSize: 13, color: "#9ca3af", marginBottom: 5 }}>
              <span>{label}</span><span style={{ color: col, fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6 }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", borderRadius: 4, background: col, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}

        <button onClick={onClose} style={{
          width: "100%", marginTop: 18, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0c0d10",
          fontFamily: "Syne", fontWeight: 800, fontSize: 15,
        }}>Close Profile</button>
      </div>
    </div>
  );
}

// ─── POST CARGO MODAL ────────────────────────────────────────────────────────

const CITIES = Object.keys(CITY_COORDS);
const CARGO_TYPES = ["General Merchandise","Perishable Goods","Construction Material","Auto Parts","Electronics","Chemicals","Textiles","FMCG","Heavy Equipment"];

function PostCargoModal({ onClose, onPost }) {
  const [form, setForm] = useState({ origin: CITIES[0], destination: CITIES[1], weight: "", type: CARGO_TYPES[0], baseRate: "", deadline: "", timer: "300" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.weight || !form.baseRate || !form.deadline) return;
    onPost({
      id: `RNT-${String(Math.floor(Math.random()*900)+100)}`,
      origin: form.origin, destination: form.destination,
      weight: `${Number(form.weight).toLocaleString("en-IN")} kg`,
      type: form.type, distance: `${Math.floor(Math.random()*1200+300)} km`,
      deadline: form.deadline, baseRate: Number(form.baseRate),
      status: "live", timer: Number(form.timer), bids: [],
    });
    onClose();
  };

  const Field = ({ label, children }) => (
    <div>
      <div style={{ fontFamily: "Rajdhani", fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0e0f14", border: "1px solid rgba(255,255,255,0.09)", color: "#e5e7eb", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 15 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, background: "#13141a", border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20, padding: "28px 28px", animation: "slideDown 0.25s ease",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "#f9fafb" }}>Post New Cargo</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563" }}>Carriers will bid on your load</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 22 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Origin City">
            <select value={form.origin} onChange={e => set("origin")(e.target.value)} style={inputStyle}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Destination City">
            <select value={form.destination} onChange={e => set("destination")(e.target.value)} style={inputStyle}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Weight (kg)">
            <input type="number" placeholder="e.g. 12000" value={form.weight} onChange={e => set("weight")(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Cargo Type">
            <select value={form.type} onChange={e => set("type")(e.target.value)} style={inputStyle}>
              {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Base Rate (₹)">
            <input type="number" placeholder="e.g. 55000" value={form.baseRate} onChange={e => set("baseRate")(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Delivery Deadline">
            <input type="date" value={form.deadline} onChange={e => set("deadline")(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Bidding Window">
            <select value={form.timer} onChange={e => set("timer")(e.target.value)} style={inputStyle}>
              <option value="120">2 minutes</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
              <option value="1800">30 minutes</option>
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#6b7280", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0c0d10", fontFamily: "Syne", fontWeight: 800, fontSize: 15 }}>Post Cargo →</button>
        </div>
      </div>
    </div>
  );
}

// ─── BID CHART ───────────────────────────────────────────────────────────────

function BidChart({ bids, baseRate }) {
  if (bids.length < 2) return (
    <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontFamily: "Rajdhani", fontSize: 14 }}>
      Not enough bids to show chart
    </div>
  );

  const sorted = [...bids].sort((a, b) => a.ts - b.ts);
  const amounts = sorted.map(b => b.amount);
  const min = Math.min(...amounts, baseRate) * 0.92;
  const max = Math.max(...amounts, baseRate) * 1.02;
  const W = 480, H = 110, PAD = { l: 60, r: 20, t: 16, b: 24 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const xScale = i => PAD.l + (i / (sorted.length - 1)) * iW;
  const yScale = v => PAD.t + iH - ((v - min) / (max - min)) * iH;

  const pathD = sorted.map((b, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(b.amount)}`).join(" ");
  const areaD = `${pathD} L${xScale(sorted.length-1)},${H-PAD.b} L${PAD.l},${H-PAD.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Base rate line */}
      <line x1={PAD.l} y1={yScale(baseRate)} x2={W-PAD.r} y2={yScale(baseRate)} stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3" />
      <text x={PAD.l - 4} y={yScale(baseRate)+4} textAnchor="end" fill="#4b5563" fontSize="9" fontFamily="JetBrains Mono">Base</text>
      {/* Area */}
      <path d={areaD} fill="url(#bidGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
      {/* Dots */}
      {sorted.map((b, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(b.amount)} r="4" fill="#0e0f14" stroke="#f59e0b" strokeWidth="2" />
          <text x={xScale(i)} y={yScale(b.amount) - 8} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="JetBrains Mono">
            {(b.amount/1000).toFixed(0)}k
          </text>
        </g>
      ))}
      {/* Y axis */}
      {[min, (min+max)/2, max].map((v, i) => (
        <text key={i} x={PAD.l-6} y={yScale(v)+4} textAnchor="end" fill="#374151" fontSize="8" fontFamily="JetBrains Mono">
          {(v/1000).toFixed(0)}k
        </text>
      ))}
    </svg>
  );
}

// ─── BID ROW ─────────────────────────────────────────────────────────────────

function BidRow({ bid, isWinner, rank, onViewProfile }) {
  const p = CARRIER_PROFILES[bid.carrier];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 14px",
      background: isWinner ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.02)",
      borderRadius: 8, border: isWinner ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.05)",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: isWinner ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 12, color: isWinner ? "#f59e0b" : "#4b5563",
        }}>#{rank}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "Rajdhani", fontWeight: 700, color: isWinner ? "#f59e0b" : "#e5e7eb", fontSize: 14 }}>{bid.carrier}</span>
            {p?.badge && <Pill color={p.badge === "Top Rated" ? "#f59e0b" : p.badge === "Premium" ? "#a78bfa" : "#34d399"} >{p.badge}</Pill>}
          </div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#6b7280" }}>★ {p?.rating || "—"} · {bid.time}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isWinner && <span style={{ fontSize: 14 }}>🏆</span>}
        <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: isWinner ? "#f59e0b" : "#d1d5db", fontSize: 15, textAlign: "right" }}>
          {formatINR(bid.amount)}
        </div>
        <button onClick={() => onViewProfile(bid.carrier)} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "4px 8px", cursor: "pointer",
          fontFamily: "Rajdhani", fontWeight: 600, fontSize: 11, color: "#6b7280",
        }}>Profile</button>
      </div>
    </div>
  );
}

// ─── CARGO CARD ──────────────────────────────────────────────────────────────

function CargoCard({ cargo, onSelect, selected }) {
  const lowestBid = cargo.bids.length ? Math.min(...cargo.bids.map(b => b.amount)) : null;
  return (
    <div onClick={() => onSelect(cargo.id)} style={{
      background: selected ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.025)",
      border: selected ? "1.5px solid rgba(245,158,11,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.2s", marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#f59e0b", marginBottom: 2 }}>{cargo.id}</div>
          <div style={{ fontFamily: "Rajdhani", fontWeight: 700, fontSize: 16, color: "#f3f4f6" }}>
            {cargo.origin.split(",")[0]} → {cargo.destination.split(",")[0]}
          </div>
        </div>
        {cargo.status === "live"
          ? <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#f59e0b", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b", animation: "pulse 1.5s infinite", display: "inline-block" }} />LIVE
            </span>
          : <span style={{ color: "#4b5563", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 12 }}>CLOSED</span>
        }
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563" }}>{cargo.weight} · {cargo.bids.length} bids</div>
        {cargo.status === "live" && cargo.timer > 0 && (
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: cargo.timer < 60 ? "#ef4444" : "#6b7280" }}>⏱ {formatTime(cargo.timer)}</div>
        )}
        {lowestBid && <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: "#34d399", fontSize: 13 }}>{formatINR(lowestBid)}</div>}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [cargos, setCargos] = useState(INITIAL_CARGOS);
  const [selectedId, setSelectedId] = useState("RNT-001");
  const [view, setView] = useState("shipper");
  const [activeTab, setActiveTab] = useState("bids"); // bids | chart | map
  const [bidAmount, setBidAmount] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState(ALL_CARRIERS[0]);
  const [toast, setToast] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [profileCarrier, setProfileCarrier] = useState(null);
  const [notifs, setNotifs] = useState(NOTIF_INIT);
  const [showNotifs, setShowNotifs] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const selected = cargos.find(c => c.id === selectedId);
  const unread = notifs.filter(n => !n.read).length;

  // Countdown timers
  useEffect(() => {
    const iv = setInterval(() => {
      setCargos(prev => prev.map(c => {
        if (c.status !== "live" || c.timer <= 0) return c;
        const t = c.timer - 1;
        if (t === 0) {
          const winner = [...c.bids].sort((a,b) => a.amount - b.amount)[0];
          if (winner) {
            setNotifs(n => [{ id: ++_notifId, type: "winner", msg: `${c.id} closed — ${winner.carrier} won at ${formatINR(winner.amount)}`, time: "Just now", read: false }, ...n]);
          }
        }
        return { ...c, timer: t, status: t <= 0 ? "closed" : "live" };
      }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const submitBid = () => {
    const amount = parseInt(String(bidAmount).replace(/,/g, ""));
    if (!amount || amount < 1000) return showToast("Enter a valid bid amount", "error");
    if (selected.status !== "live") return showToast("Bidding is closed", "error");
    const newBid = { carrier: selectedCarrier, amount, time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}), ts: Date.now() };
    setCargos(prev => prev.map(c => c.id === selectedId ? { ...c, bids: [...c.bids, newBid] } : c));
    setNotifs(n => [{ id: ++_notifId, type: "bid", msg: `${selectedCarrier} placed a bid of ${formatINR(amount)} on ${selectedId}`, time: "Just now", read: false }, ...n]);
    setBidAmount("");
    showToast(`Bid of ${formatINR(amount)} submitted!`);
  };

  const handlePost = cargo => {
    setCargos(prev => [cargo, ...prev]);
    setSelectedId(cargo.id);
    setNotifs(n => [{ id: ++_notifId, type: "cargo", msg: `New cargo ${cargo.id} posted: ${cargo.origin.split(",")[0]} → ${cargo.destination.split(",")[0]}`, time: "Just now", read: false }, ...n]);
    showToast(`Cargo ${cargo.id} posted!`);
  };

  const filteredCargos = cargos.filter(c => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !`${c.origin}${c.destination}${c.type}${c.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sortedBids = [...(selected?.bids || [])].sort((a,b) => a.amount - b.amount);
  const winnerBid = selected?.status === "closed" ? sortedBids[0] : null;

  return (
    <>
      <style>{FONT}{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0d10; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideDown { from{transform:translateY(-12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1f2028; border-radius: 2px; }
        input, select { outline: none; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10,
          background: toast.type === "error" ? "#450a0a" : "#022c22",
          border: `1px solid ${toast.type === "error" ? "#b91c1c" : "#059669"}`,
          color: toast.type === "error" ? "#fca5a5" : "#6ee7b7",
          fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15,
          animation: "slideDown 0.25s ease", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>{toast.msg}</div>
      )}

      {/* Notification Panel */}
      {showNotifs && <NotifPanel notifs={notifs} setNotifs={setNotifs} onClose={() => setShowNotifs(false)} />}

      {/* Carrier Profile Modal */}
      {profileCarrier && <CarrierProfileModal carrier={profileCarrier} onClose={() => setProfileCarrier(null)} />}

      {/* Post Cargo Modal */}
      {showPostModal && <PostCargoModal onClose={() => setShowPostModal(false)} onPost={handlePost} />}

      <div style={{ minHeight: "100vh", background: "#0c0d10", display: "flex", flexDirection: "column" }}>
        {/* ── HEADER ── */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 58, background: "rgba(10,11,14,0.95)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 200, flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: "#0c0d10" }}>R</div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 17, color: "#f9fafb", letterSpacing: "-0.02em" }}>Ramnath</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#374151", letterSpacing: "0.12em" }}>FREIGHT EXCHANGE</div>
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
            {[["shipper","🚢 Shipper"],["carrier","🚛 Carrier"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "Rajdhani", fontWeight: 700, fontSize: 14,
                background: view === v ? "#f59e0b" : "transparent",
                color: view === v ? "#0c0d10" : "#6b7280", transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#374151" }}>
              {cargos.filter(c=>c.status==="live").length} live loads
            </div>
            {/* Notification bell */}
            <button onClick={() => setShowNotifs(v => !v)} style={{
              position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              🔔
              {unread > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0c0d10" }}>{unread}</span>
              )}
            </button>
            {view === "shipper" && (
              <button onClick={() => setShowPostModal(true)} style={{
                padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0c0d10",
                fontFamily: "Rajdhani", fontWeight: 700, fontSize: 14,
              }}>+ Post Cargo</button>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 58px)" }}>
          {/* ── LEFT PANEL ── */}
          <div style={{ width: 360, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Search & filter */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <input
                placeholder="Search routes, cargo type…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#e5e7eb", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                {[["all","All"],["live","Live"],["closed","Closed"]].map(([v, label]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 7, border: "none", cursor: "pointer",
                    fontFamily: "Rajdhani", fontWeight: 700, fontSize: 13,
                    background: filter === v ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                    color: filter === v ? "#f59e0b" : "#4b5563",
                    borderBottom: filter === v ? "2px solid #f59e0b" : "2px solid transparent",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
              {filteredCargos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#374151", fontFamily: "Rajdhani" }}>No loads found</div>
              ) : (
                filteredCargos.map(c => <CargoCard key={c.id} cargo={c} onSelect={setSelectedId} selected={selectedId === c.id} />)
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {selected && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                {/* Cargo header card */}
                <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 26px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "#f59e0b" }}>{selected.id}</div>
                        {selected.status === "live"
                          ? <Pill color="#f59e0b">Live</Pill>
                          : <Pill color="#6b7280">Closed</Pill>}
                        <Pill color="#60a5fa">{selected.type}</Pill>
                      </div>
                      <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 26, color: "#f9fafb", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                        {selected.origin}
                        <span style={{ color: "#2d3748", margin: "0 10px" }}>→</span>
                        {selected.destination}
                      </div>
                      <div style={{ fontFamily: "Rajdhani", fontSize: 14, color: "#6b7280", marginTop: 5 }}>
                        {selected.weight} · {selected.distance} · Deadline: {selected.deadline}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>Base Rate</div>
                      <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 22, color: "#9ca3af" }}>{formatINR(selected.baseRate)}</div>
                    </div>
                  </div>

                  {selected.status === "live" && (
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "10px 16px" }}>
                      <span style={{ fontSize: 18 }}>⏱</span>
                      <div>
                        <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 22, color: selected.timer < 60 ? "#ef4444" : "#f59e0b" }}>{formatTime(selected.timer)}</div>
                        <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#6b7280" }}>Bidding closes in</div>
                      </div>
                    </div>
                  )}

                  {selected.status === "closed" && winnerBid && (
                    <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.35)", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 26 }}>🏆</span>
                      <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: "#f59e0b" }}>Winner: {winnerBid.carrier}</div>
                        <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "#9ca3af" }}>
                          {formatINR(winnerBid.amount)} · Saved {formatINR(selected.baseRate - winnerBid.amount)} vs base rate
                        </div>
                      </div>
                      <button onClick={() => setProfileCarrier(winnerBid.carrier)} style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>View Profile</button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                  <StatBox label="Total Bids" val={selected.bids.length} icon="📋" />
                  <StatBox label="Lowest Bid" val={selected.bids.length ? formatINR(Math.min(...selected.bids.map(b=>b.amount))) : "—"} icon="📉" accent="#34d399" />
                  <StatBox label="Avg Bid" val={selected.bids.length ? formatINR(Math.round(selected.bids.reduce((s,b)=>s+b.amount,0)/selected.bids.length)) : "—"} icon="📊" />
                  <StatBox label="Saved" val={selected.bids.length ? formatINR(selected.baseRate - Math.min(...selected.bids.map(b=>b.amount))) : "—"} icon="💰" accent="#f59e0b" />
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[["bids","📋 Bids"],["chart","📈 Bid Chart"],["map","🗺 Route Map"]].map(([t, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                      padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontFamily: "Rajdhani", fontWeight: 700, fontSize: 14,
                      background: activeTab === t ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
                      color: activeTab === t ? "#f59e0b" : "#6b7280",
                      borderBottom: activeTab === t ? "2px solid #f59e0b" : "2px solid transparent",
                    }}>{label}</button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === "bids" && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px", marginBottom: 16 }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: "#f3f4f6", marginBottom: 12 }}>
                      Bids <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563", fontWeight: 400 }}>— sorted lowest to highest</span>
                    </div>
                    {sortedBids.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#374151", fontFamily: "Rajdhani", fontSize: 14 }}>No bids yet</div>
                    ) : (
                      sortedBids.map((bid, i) => (
                        <BidRow key={i} bid={bid} isWinner={i===0 && selected.status==="closed"} rank={i+1} onViewProfile={setProfileCarrier} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === "chart" && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 18px", marginBottom: 16 }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: "#f3f4f6", marginBottom: 12 }}>
                      Bid History <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563", fontWeight: 400 }}>— chronological</span>
                    </div>
                    <BidChart bids={selected.bids} baseRate={selected.baseRate} />
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#374151", marginTop: 8, textAlign: "center" }}>
                      Dashed line = base rate · Each dot = a bid
                    </div>
                  </div>
                )}

                {activeTab === "map" && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", height: 320, marginBottom: 16 }}>
                    <MapView cargos={cargos} selectedId={selectedId} onSelect={setSelectedId} />
                  </div>
                )}

                {/* Carrier Bid Form */}
                {view === "carrier" && selected.status === "live" && (
                  <div style={{ background: "rgba(245,158,11,0.04)", border: "1.5px solid rgba(245,158,11,0.18)", borderRadius: 14, padding: "20px 22px", animation: "slideDown 0.3s ease" }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: "#f59e0b", marginBottom: 14 }}>🚛 Submit Your Bid</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Carrier</div>
                        <select value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0e0f14", border: "1px solid rgba(255,255,255,0.09)", color: "#e5e7eb", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14 }}>
                          {ALL_CARRIERS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontFamily: "Rajdhani", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Bid Amount (₹)</div>
                        <input type="number" placeholder={`e.g. ${Math.round(selected.baseRate*0.88).toLocaleString("en-IN")}`} value={bidAmount} onChange={e => setBidAmount(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0e0f14", border: "1px solid rgba(255,255,255,0.09)", color: "#e5e7eb", fontFamily: "JetBrains Mono", fontWeight: 600, fontSize: 14 }} />
                      </div>
                    </div>

                    {selectedCarrier && CARRIER_PROFILES[selectedCarrier] && (
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#4b5563", marginBottom: 10 }}>
                        {selectedCarrier}: ★ {CARRIER_PROFILES[selectedCarrier].rating} · {CARRIER_PROFILES[selectedCarrier].onTime}% on-time · {CARRIER_PROFILES[selectedCarrier].trips} trips
                      </div>
                    )}

                    {bidAmount && parseInt(bidAmount) < (selected.bids.length ? Math.min(...selected.bids.map(b=>b.amount)) : Infinity) && (
                      <div style={{ fontFamily: "Rajdhani", fontSize: 13, color: "#34d399", marginBottom: 10 }}>✓ This would be the lowest bid — highly likely to win!</div>
                    )}
                    {bidAmount && parseInt(bidAmount) > selected.baseRate && (
                      <div style={{ fontFamily: "Rajdhani", fontSize: 13, color: "#f87171", marginBottom: 10 }}>⚠ Bid exceeds base rate — unlikely to be selected</div>
                    )}

                    <button onClick={submitBid} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0c0d10", fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>
                      Submit Bid →
                    </button>
                  </div>
                )}

                {view === "shipper" && selected.status === "live" && (
                  <div style={{ textAlign: "center", padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 12, color: "#374151", fontFamily: "Rajdhani", fontSize: 14 }}>
                    Switch to <strong style={{ color: "#f59e0b" }}>Carrier View</strong> to place bids
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
