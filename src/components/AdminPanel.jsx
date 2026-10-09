import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { admin, event, lineup } from "../data/event";
import { fetchRegistrations, toggleCheckIn, deleteRegistration } from "../lib/submit";
import QRScannerModal from "./QRScannerModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
const allEventNames = lineup.map((e) => e.name);

function Badge({ checked }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-body font-semibold"
      style={{
        background: checked ? "rgba(0,200,100,0.15)" : "rgba(255,215,0,0.08)",
        color: checked ? "#4cde9b" : "#ffd700",
        border: `1px solid ${checked ? "rgba(76,222,155,0.3)" : "rgba(255,215,0,0.2)"}`,
      }}
    >
      {checked ? "✓ Checked In" : "Pending"}
    </span>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (user === admin.username && pass === admin.password) {
      onLogin();
    } else {
      setErr("Incorrect credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg,#2a0a3d,#4b1257,#b02a5b)" }}>
      <div className="w-full max-w-sm">
        <p className="label-tag mb-3">Admin Access</p>
        <h1 className="font-display font-black text-cream text-3xl mb-8">
          {event.name} <span className="text-gold">{event.version}</span>
        </h1>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <div>
            <label className="label-tag block mb-1">Username</label>
            <input className="field-underline" type="text" placeholder="admin" value={user}
              onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label-tag block mb-1">Password</label>
            <input className="field-underline" type="password" placeholder="••••••••" value={pass}
              onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          </div>
          {err && <p className="text-xs font-body" style={{ color: "#ff6b8a" }}>{err}</p>}
          <button type="submit"
            className="w-full bg-gold text-plum font-body font-semibold uppercase tracking-widest text-sm
                       py-3.5 rounded-full hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cream">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

// ── QR preview modal ──────────────────────────────────────────────────────────
function QRModal({ reg, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,6,48,0.92)" }}
      onClick={onClose}>
      <div className="rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full" style={{ background: "#2a0a3d", border: "2px dashed #ffd700" }}
        onClick={(e) => e.stopPropagation()}>
        <p className="label-tag">Gate Pass QR</p>
        <p className="font-display font-bold text-cream text-xl text-center">{reg.name}</p>
        <p className="font-mono text-gold text-xs tracking-wider">{reg.usn}</p>
        <div className="rounded-2xl p-4 shadow-xl" style={{ background: "#ffffff" }}>
          <QRCodeSVG value={reg.id} size={180} fgColor="#1c0630" bgColor="#ffffff" level="M" includeMargin={true} />
        </div>
        <p className="font-mono text-cream opacity-50 text-[11px] text-center">
          ID: {reg.id}
        </p>
        <p className="font-body text-cream opacity-60 text-xs text-center max-w-xs">
          {reg.events}
        </p>
        <button onClick={onClose}
          className="px-6 py-2 rounded-full font-body font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          style={{ background: "#ffd700", color: "#1c0630" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("All");
  const [filterCheckin, setFilterCheckin] = useState("All");
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [qrReg, setQrReg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRegistrations();
      setRecords(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalByEvent = allEventNames.reduce((acc, name) => {
    acc[name] = records.filter((r) =>
      (r.events ?? "").split(",").map((s) => s.trim()).includes(name)
    ).length;
    return acc;
  }, {});

  // ── Filtering & sorting ────────────────────────────────────────────────────
  const filtered = records
    .filter((r) => {
      const q = search.toLowerCase();
      const matches =
        !q ||
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.usn ?? "").toLowerCase().includes(q) ||
        (r.events ?? "").toLowerCase().includes(q) ||
        (r.teamName ?? "").toLowerCase().includes(q);
      const eventMatch =
        filterEvent === "All" ||
        (r.events ?? "").split(",").map((s) => s.trim()).includes(filterEvent);
      const checkinMatch =
        filterCheckin === "All" ||
        (filterCheckin === "Checked In" ? r.checkedIn : !r.checkedIn);
      return matches && eventMatch && checkinMatch;
    })
    .sort((a, b) => {
      let va = a[sortKey] ?? "";
      let vb = b[sortKey] ?? "";
      if (sortKey === "timestamp") { va = new Date(va); vb = new Date(vb); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleCheckIn = async (reg, forceStatus) => {
    const updated = forceStatus !== undefined ? forceStatus : !reg.checkedIn;
    setRecords((prev) => prev.map((r) => r.id === reg.id ? { ...r, checkedIn: updated } : r));
    try { await toggleCheckIn(reg.id, updated); }
    catch { setRecords((prev) => prev.map((r) => r.id === reg.id ? { ...r, checkedIn: reg.checkedIn } : r)); }
  };

  const handleDelete = async (target) => {
    const id = typeof target === "object" ? target.id : target;
    setConfirmDelete(null);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteRegistration(id);
    } catch (e) {
      setError("Delete failed: " + e.message);
      await load();
    }
  };

  const exportCSV = () => {
    const cols = ["id", "timestamp", "name", "year", "usn", "institution", "events", "teamName", "members", "phone", "checkedIn"];
    const rows = [cols.join(","), ...records.map((r) => cols.map((c) => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "aashiyana3_registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-40" style={{ fontSize: "0.7rem" }}>
      {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );

  if (!loggedIn) return <LoginForm onLogin={() => setLoggedIn(true)} />;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1c0630 0%,#2a0a3d 60%,#3d1254 100%)" }}>
      {qrReg && <QRModal reg={qrReg} onClose={() => setQrReg(null)} />}
      {showScanner && (
        <QRScannerModal
          records={records}
          onCheckIn={(reg, status) => handleCheckIn(reg, status)}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,3,32,0.94)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-2xl p-7 max-w-md w-full border" style={{ background: "#250937", borderColor: "rgba(244,63,94,0.4)", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/40 flex items-center justify-center text-lg font-bold">
                🗑️
              </span>
              <div>
                <p className="font-display font-bold text-cream text-lg">Delete Participant?</p>
                <p className="font-body text-cream/50 text-xs">This will permanently remove the record.</p>
              </div>
            </div>

            <div className="rounded-xl p-3.5 my-4 text-xs font-body space-y-1.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-cream font-bold text-sm">{confirmDelete.name || "Participant"}</p>
              <p className="font-mono text-gold text-xs">USN: {confirmDelete.usn || "N/A"}</p>
              <p className="text-cream/60 text-[11px] truncate">Events: {confirmDelete.events || "—"}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-full font-body text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg cursor-pointer"
              >
                Delete Permanently
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 rounded-full font-body text-xs uppercase tracking-wider text-cream/70 hover:text-cream transition border border-white/20 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 px-6 md:px-10 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: "rgba(28,6,48,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(184,150,46,0.2)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="label-tag text-gold-muted hover:text-gold transition">← Back to site</Link>
          <span className="opacity-30 text-cream">|</span>
          <p className="font-display font-bold text-cream text-lg">
            {event.name} <span className="text-gold">{event.version}</span>
            <span className="label-tag ml-2 text-gold-muted font-body font-normal">Admin</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 rounded-full font-body font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
            style={{ background: "#ffd700", color: "#1c0630" }}
          >
            <span className="text-sm">📷</span>
            <span style={{ color: "#1c0630", fontWeight: 700 }}>Scan QR</span>
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-full font-body font-semibold text-xs uppercase tracking-wider transition border disabled:opacity-50 hover:bg-gold/15 cursor-pointer"
            style={{ borderColor: "#b8962e", color: "#ffd700", background: "transparent" }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full font-body font-semibold text-xs uppercase tracking-wider transition border hover:bg-gold/15 cursor-pointer"
            style={{ borderColor: "#b8962e", color: "#ffd700", background: "transparent" }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setLoggedIn(false)}
            className="px-3 py-2 text-xs font-body uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-red-400 transition cursor-pointer"
            style={{ color: "#fdf6ec", background: "none", border: "none" }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-8">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg font-body text-sm" style={{ background: "rgba(255,107,138,0.1)", border: "1px solid rgba(255,107,138,0.3)", color: "#ff6b8a" }}>
            {error}
          </div>
        )}

        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Registrations", value: records.length },
            { label: "Checked In", value: records.filter((r) => r.checkedIn).length },
            { label: "Pending", value: records.filter((r) => !r.checkedIn).length },
            { label: "Events", value: allEventNames.filter((n) => totalByEvent[n] > 0).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(184,150,46,0.2)" }}>
              <p className="label-tag mb-1">{s.label}</p>
              <p className="font-display font-black text-cream text-3xl">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Event breakdown ──────────────────────────────────────────────── */}
        <div className="rounded-xl p-5 mb-8 overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(184,150,46,0.15)" }}>
          <p className="label-tag mb-4">Registrations by Event</p>
          <div className="flex flex-wrap gap-3">
            {allEventNames.map((name) => (
              <div key={name}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(42,10,61,0.7)", border: "1px solid rgba(184,150,46,0.2)" }}>
                <span className="font-body text-cream text-xs">{name}</span>
                <span className="font-display font-bold text-gold text-base">{totalByEvent[name]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <input
            type="search"
            placeholder="Search name, USN, event, team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-underline max-w-xs"
            style={{ borderBottom: "1px solid rgba(184,150,46,0.5)" }}
          />
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="field-underline"
            style={{ maxWidth: "180px", borderBottom: "1px solid rgba(184,150,46,0.5)" }}
          >
            <option value="All">All Events</option>
            {allEventNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={filterCheckin}
            onChange={(e) => setFilterCheckin(e.target.value)}
            className="field-underline"
            style={{ maxWidth: "150px", borderBottom: "1px solid rgba(184,150,46,0.5)" }}
          >
            <option value="All">All Status</option>
            <option value="Checked In">Checked In</option>
            <option value="Pending">Pending</option>
          </select>
          <span className="font-body text-cream opacity-40 text-xs ml-auto">
            {filtered.length} of {records.length} records
          </span>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(184,150,46,0.2)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse" style={{ tableLayout: "auto" }}>
              <thead>
                <tr style={{ background: "rgba(42,10,61,0.8)", borderBottom: "1px solid rgba(184,150,46,0.2)" }}>
                  {[
                    { key: "name", label: "Name" },
                    { key: "usn", label: "USN" },
                    { key: "year", label: "Year" },
                    { key: "events", label: "Events" },
                    { key: "teamName", label: "Team" },
                    { key: "phone", label: "Phone" },
                    { key: "timestamp", label: "Registered" },
                    { key: null, label: "Status" },
                    { key: null, label: "Actions" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={col.key ? () => toggleSort(col.key) : undefined}
                      className="px-4 py-3 label-tag whitespace-nowrap"
                      style={{ cursor: col.key ? "pointer" : "default", userSelect: "none" }}
                    >
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-body text-cream opacity-40">Loading…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-body text-cream opacity-40">No registrations found.</td></tr>
                )}
                {!loading && filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      background: i % 2 === 0 ? "rgba(42,10,61,0.4)" : "rgba(28,6,48,0.5)",
                      borderBottom: "1px solid rgba(184,150,46,0.1)",
                    }}
                  >
                    <td className="px-4 py-3 font-body text-cream text-sm whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 font-body text-gold text-xs uppercase tracking-wider whitespace-nowrap">{r.usn}</td>
                    <td className="px-4 py-3 font-body text-cream opacity-70 text-xs whitespace-nowrap">{r.year}</td>
                    <td className="px-4 py-3 font-body text-cream text-xs max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(r.events ?? "").split(",").map((ev) => (
                          <span key={ev}
                            className="inline-block rounded px-1.5 py-0.5 text-xs"
                            style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", fontSize: "0.65rem" }}>
                            {ev.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-cream opacity-70 text-xs whitespace-nowrap">
                      {r.teamName || "—"}
                      {r.members && <span className="block opacity-50 text-xs">{r.members}</span>}
                    </td>
                    <td className="px-4 py-3 font-body text-cream opacity-70 text-xs whitespace-nowrap">{r.phone || "—"}</td>
                    <td className="px-4 py-3 font-body text-cream opacity-50 text-xs whitespace-nowrap">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge checked={r.checkedIn} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckIn(r)}
                          title={r.checkedIn ? "Mark as Pending" : "Check In"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition cursor-pointer font-bold"
                          style={{
                            background: r.checkedIn ? "rgba(76,222,155,0.18)" : "rgba(255,215,0,0.12)",
                            border: `1px solid ${r.checkedIn ? "rgba(76,222,155,0.4)" : "rgba(255,215,0,0.3)"}`,
                            color: r.checkedIn ? "#4cde9b" : "#ffd700",
                          }}
                        >
                          {r.checkedIn ? "✓" : "○"}
                        </button>
                        <button
                          onClick={() => setQrReg(r)}
                          title="View QR Gate Pass"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(184,150,46,0.3)", color: "#ffd700" }}
                        >
                          🎟️
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r)}
                          title="Delete participant details"
                          className="px-2 py-1.5 rounded-lg text-xs font-body font-semibold transition hover:bg-rose-500/25 flex items-center gap-1 cursor-pointer"
                          style={{ background: "rgba(244,63,94,0.14)", border: "1px solid rgba(244,63,94,0.35)", color: "#fb7185" }}
                        >
                          <span>🗑️</span>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 font-body text-cream opacity-25 text-xs text-right">
          Aashiyana {event.version} Admin · {event.date}
        </p>
      </div>
    </div>
  );
}
