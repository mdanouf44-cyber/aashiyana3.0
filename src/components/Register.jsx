import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { event, lineup, years, teamEvents } from "../data/event";
import { submitRegistration } from "../lib/submit";

gsap.registerPlugin(ScrollTrigger);

const USN_RE = /^[1-4][A-Za-z]{2}\d{2}[A-Za-z]{2,3}\d{3}$/;
const DEADLINE = event.registrationDeadline;

function isPastDeadline() {
  return DEADLINE && new Date(DEADLINE) < new Date(new Date().toDateString());
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="relative pb-1">
      <label className="label-tag block mb-1">{label}</label>
      {children}
      {error && (
        <p className="text-xs mt-1.5 font-body" style={{ color: "#ff6b8a" }} role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

// ── QR Ticket ─────────────────────────────────────────────────────────────────
function QRTicket({ data, regId, onReset, ticketRef }) {
  const qrValue = JSON.stringify({ id: regId, usn: data.usn, name: data.fullName, events: data.participation });
  const waText = `I just registered for Aashiyana 3.0! 🎭\nName: ${data.fullName}\nUSN: ${data.usn}\nEvents: ${data.participation.join(", ")}\n\nJoin us on ${event.date} at ${event.venue}.\nRegister: ${window.location.href}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const saveImage = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, { useCORS: true, scale: 2, backgroundColor: "#2a0a3d" });
    const link = document.createElement("a");
    link.download = `Aashiyana3_${data.usn}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div aria-live="polite">
      {/* Ticket card */}
      <div
        ref={ticketRef}
        className="relative overflow-hidden rounded-2xl p-7 md:p-9"
        style={{ border: "2px dashed #ffd700", background: "linear-gradient(135deg,#2a0a3d 0%,#3d1254 100%)" }}
      >
        {/* Side notch cutouts */}
        {["left", "right"].map((side) => (
          <div
            key={side}
            className="absolute top-1/2 -translate-y-1/2 w-5 h-10 rounded-full"
            style={{
              [side]: "-1px",
              background: "linear-gradient(135deg,#2a0a3d,#4b1257)",
              borderRadius: side === "left" ? "0 50% 50% 0" : "50% 0 0 50%",
            }}
          />
        ))}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <p className="label-tag mb-1">Registration Confirmed ✦</p>
            <h3 className="font-display font-black text-cream" style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", lineHeight: 1.1 }}>
              You're in, <span className="text-gold">{data.fullName.split(" ")[0]}.</span>
            </h3>
            <p className="font-mono text-gold text-xs mt-1 tracking-wider uppercase">
              USN: {data.usn}
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm self-start md:self-auto"
            style={{
              background: "rgba(76, 222, 155, 0.1)",
              borderColor: "rgba(76, 222, 155, 0.35)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{
                backgroundColor: "#4cde9b",
                boxShadow: "0 0 8px #4cde9b",
              }}
            />
            <span
              className="font-body font-semibold text-xs tracking-wider uppercase leading-none"
              style={{ color: "#4cde9b" }}
            >
              Gate Pass Active
            </span>
          </div>
        </div>

        {/* Prominent QR Code Gate Pass */}
        <div className="my-6 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.2)" }}>
          <div
            className="rounded-2xl p-4 shadow-2xl transition hover:scale-105"
            style={{
              background: "#ffffff",
              border: "3px solid #ffd700",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 25px rgba(255,215,0,0.3)",
            }}
            title={`Scan QR Gate Pass for ${data.usn}`}
          >
            <QRCodeSVG
              value={regId}
              size={150}
              fgColor="#1c0630"
              bgColor="#ffffff"
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="font-mono text-gold font-bold text-xs mt-3 tracking-widest">
            REG ID: {regId}
          </p>
          <p className="font-body text-cream opacity-70 text-xs mt-1">
            ✦ Show this QR code at the entrance gate for instant check-in ✦
          </p>
        </div>

        {/* Dashed rule */}
        <div style={{ borderTop: "1px dashed #b8962e", margin: "0 0 1.25rem" }} />

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            <p className="label-tag">Name</p>
            <p className="font-display text-cream text-sm mt-0.5 font-semibold">{data.fullName}</p>
          </div>
          <div>
            <p className="label-tag">USN</p>
            <p className="font-display text-cream text-sm mt-0.5 font-semibold">{data.usn.toUpperCase()}</p>
          </div>
          <div>
            <p className="label-tag">Year</p>
            <p className="font-display text-cream text-sm mt-0.5">{data.year}</p>
          </div>
          <div>
            <p className="label-tag">Institution</p>
            <p className="font-display text-cream text-sm mt-0.5">{data.institution}</p>
          </div>
          <div className="col-span-2">
            <p className="label-tag">Events</p>
            <p className="font-body text-cream text-sm mt-0.5 leading-relaxed">
              {data.participation.join(" · ")}
            </p>
          </div>
          {data.teamName && (
            <div>
              <p className="label-tag">Team</p>
              <p className="font-display text-cream text-sm mt-0.5">{data.teamName}</p>
            </div>
          )}
          {data.teamMembers?.filter(Boolean).length > 0 && (
            <div className={data.teamName ? "" : "col-span-2"}>
              <p className="label-tag">Team Members</p>
              <p className="font-body text-cream text-sm mt-0.5 leading-relaxed">
                {data.teamMembers.filter(Boolean).join(", ")}
              </p>
            </div>
          )}
          <div className="col-span-2">
            <p className="label-tag">When & Where</p>
            <p className="font-display text-cream text-sm mt-0.5">
              {event.date} · {event.venue}
            </p>
          </div>
        </div>

        {/* Dashed rule */}
        <div style={{ borderTop: "1px dashed #b8962e", margin: "0 0 1rem" }} />

        {/* Reg ID */}
        <div className="flex items-center justify-between">
          <p style={{ fontSize: "0.62rem", color: "rgba(253,246,236,0.35)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
            REG ID: {regId}
          </p>
          <p className="label-tag" style={{ fontSize: "0.6rem", color: "#b8962e" }}>
            {event.name} {event.version}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={saveImage}
          className="label-tag bg-gold text-plum px-5 py-2.5 rounded-full hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Save as Image
        </button>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="label-tag border border-gold text-gold px-5 py-2.5 rounded-full hover:bg-gold hover:text-plum transition"
        >
          Share on WhatsApp
        </a>
        <button
          onClick={onReset}
          className="label-tag text-cream opacity-50 hover:opacity-100 px-2 py-2 transition focus:outline-none"
          style={{ background: "none", border: "none" }}
        >
          Register another →
        </button>
      </div>
    </div>
  );
}

// ── Main Register ─────────────────────────────────────────────────────────────
export default function Register() {
  const sectionRef = useRef(null);
  const formRef = useRef(null);
  const ticketRef = useRef(null);
  const fieldsRef = useRef([]);
  const teamContainerRef = useRef(null);
  const memberInputsRef = useRef(null);

  const blank = {
    fullName: "", year: "", usn: "", institution: event.institution,
    participation: [], teamName: "", numberOfMembers: 2, teamMembers: [],
    phone: "",
  };

  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [regId, setRegId] = useState("");

  const needsTeam = form.participation.some((e) => teamEvents.includes(e));

  // Sync teamMembers array length when numberOfMembers changes
  useEffect(() => {
    const n = parseInt(form.numberOfMembers, 10) || 2;
    setForm((prev) => {
      const current = [...(prev.teamMembers ?? [])];
      while (current.length < n) current.push("");
      return { ...prev, teamMembers: current.slice(0, n) };
    });
  }, [form.numberOfMembers]);

  // ── Listen for Lineup click ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const name = e.detail?.name;
      if (!name) return;
      setForm((prev) => ({
        ...prev,
        participation: prev.participation.includes(name)
          ? prev.participation
          : [...prev.participation, name],
      }));
    };
    window.addEventListener("aashiyana:selectEvent", handler);
    return () => window.removeEventListener("aashiyana:selectEvent", handler);
  }, []);

  // ── GSAP field entrance ──────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(fieldsRef.current.filter(Boolean), {
        y: 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: formRef.current, start: "top 75%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ── Team container slide ─────────────────────────────────────────────────
  useEffect(() => {
    const el = teamContainerRef.current;
    if (!el) return;
    if (needsTeam) {
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.45, ease: "power2.out" });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }, [needsTeam]);

  // ── Member inputs animate when count changes ─────────────────────────────
  useEffect(() => {
    if (!memberInputsRef.current) return;
    const items = memberInputsRef.current.querySelectorAll(".member-field");
    gsap.from(items, { opacity: 0, y: 10, duration: 0.3, stagger: 0.04, ease: "power2.out" });
  }, [form.teamMembers.length]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setMember = (i, val) => {
    setForm((prev) => {
      const t = [...(prev.teamMembers ?? [])];
      t[i] = val;
      return { ...prev, teamMembers: t };
    });
  };

  const toggleChip = (name) => {
    setForm((prev) => ({
      ...prev,
      participation: prev.participation.includes(name)
        ? prev.participation.filter((x) => x !== name)
        : [...prev.participation, name],
    }));
  };

  const validate = useCallback(() => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!form.year) errs.year = "Please select your year.";
    if (!form.usn.trim()) errs.usn = "USN is required.";
    else if (!USN_RE.test(form.usn.trim())) errs.usn = "Enter a valid USN, e.g. 4XX23CS001";
    if (!form.institution.trim()) errs.institution = "Institution name is required.";
    if (form.participation.length === 0) errs.participation = "Select at least one event.";
    if (needsTeam) {
      if (!form.teamName.trim()) errs.teamName = "Enter your team name.";
      const n = parseInt(form.numberOfMembers, 10) || 0;
      if (n < 2) errs.numberOfMembers = "A team needs at least 2 members.";
      const empty = (form.teamMembers ?? []).slice(0, n).findIndex((m) => !m.trim());
      if (empty !== -1) errs[`member_${empty}`] = "Enter this member's name.";
    }
    return errs;
  }, [form, needsTeam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");
    setServerError("");

    try {
      const { id } = await submitRegistration({ ...form, usn: form.usn.trim().toUpperCase() });
      setRegId(id);
      setSuccessData({ ...form, usn: form.usn.trim().toUpperCase() });
      setStatus("success");
      if (formRef.current) gsap.to(formRef.current, { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" });
    } catch (err) {
      setStatus("error");
      setServerError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleReset = () => {
    setForm(blank);
    setErrors({});
    setStatus("idle");
    setSuccessData(null);
    setRegId("");
    if (formRef.current) gsap.set(formRef.current, { opacity: 1, y: 0 });
  };

  const closed = isPastDeadline();
  const n = parseInt(form.numberOfMembers, 10) || 2;

  return (
    <section id="register" ref={sectionRef} className="py-28 md:py-36" style={{ background: "rgba(28,6,48,0.6)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">

          {/* ── Left: heading ─────────────────────────────────────────────── */}
          <div ref={(el) => (fieldsRef.current[0] = el)}>
            <p className="label-tag mb-4">Registration</p>
            <h2 className="font-display font-bold text-cream mb-6" style={{ fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1.1 }}>
              Take the stage.
            </h2>
            <p className="font-body text-cream opacity-60 leading-relaxed mb-8" style={{ fontSize: "0.97rem" }}>
              Fill in your details and pick the events you want to take part in. You can choose more than one.
            </p>
            {DEADLINE && !closed && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(184,150,46,0.4)" }}>
                <span className="label-tag">Last date</span>
                <span className="font-display text-cream text-sm">{new Date(DEADLINE).toDateString()}</span>
              </div>
            )}
          </div>

          {/* ── Right: form / ticket ──────────────────────────────────────── */}
          <div>
            {closed ? (
              <div className="rounded-2xl p-8 text-center" style={{ border: "1px solid #b8962e", background: "rgba(255,255,255,0.04)" }}>
                <p className="font-display text-2xl text-cream mb-2">Registrations are closed.</p>
                <p className="font-body text-cream opacity-50 text-sm">Thank you for your interest in Aashiyana 3.0.</p>
              </div>
            ) : status === "success" && successData ? (
              <QRTicket data={successData} regId={regId} onReset={handleReset} ticketRef={ticketRef} />
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-7" aria-label="Registration form">

                {/* Full Name */}
                <div ref={(el) => (fieldsRef.current[1] = el)}>
                  <Field label="Full Name *" error={errors.fullName}>
                    <input id="fullName" type="text" className="field-underline" placeholder="Your full name"
                      value={form.fullName} onChange={set("fullName")} required />
                  </Field>
                </div>

                {/* Year */}
                <div ref={(el) => (fieldsRef.current[2] = el)}>
                  <Field label="Year *" error={errors.year}>
                    <select id="year" className="field-underline" value={form.year} onChange={set("year")} required>
                      <option value="">Select your year</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                </div>

                {/* USN */}
                <div ref={(el) => (fieldsRef.current[3] = el)}>
                  <Field label="USN *" error={errors.usn}>
                    <input id="usn" type="text" className="field-underline uppercase"
                      placeholder="e.g. 4XX23CS001" value={form.usn}
                      onChange={(e) => setForm((p) => ({ ...p, usn: e.target.value.toUpperCase() }))} required />
                  </Field>
                </div>

                {/* Institution */}
                <div ref={(el) => (fieldsRef.current[4] = el)}>
                  <Field label="Institution *" error={errors.institution}>
                    <input id="institution" type="text" className="field-underline"
                      placeholder="Your college / institution" value={form.institution} onChange={set("institution")} required />
                  </Field>
                </div>

                {/* Event chips */}
                <div ref={(el) => (fieldsRef.current[5] = el)}>
                  <Field label="Events — select at least one *" error={errors.participation}>
                    <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Event selection">
                      {lineup.map((ev) => {
                        const selected = form.participation.includes(ev.name);
                        return (
                          <button type="button" key={ev.id} onClick={() => toggleChip(ev.name)}
                            aria-pressed={selected}
                            className="font-body text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                            style={{
                              background: selected ? "#ffd700" : "transparent",
                              color: selected ? "#2a0a3d" : "#fdf6ec",
                              border: `1px solid ${selected ? "#ffd700" : "#b8962e"}`,
                              transform: selected ? "scale(1.03)" : "scale(1)",
                              fontWeight: selected ? 600 : 400,
                            }}>
                            {selected && <span className="mr-1">✓</span>}
                            {ev.name}
                            {ev.team && (
                              <span className="ml-1.5 text-xs opacity-60">· Team</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                {/* ── Team fields (conditional) ────────────────────────── */}
                <div ref={teamContainerRef} style={{ overflow: "hidden", height: 0, opacity: 0 }}>
                  <div className="flex flex-col gap-6 pb-2 pt-1">
                    {/* Team info header */}
                    <div className="rounded-lg px-4 py-3 flex items-center gap-3"
                      style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(184,150,46,0.35)" }}>
                      <span style={{ fontSize: "0.7rem", color: "#ffd700", textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "'Jost', sans-serif" }}>
                        Team event selected
                      </span>
                    </div>

                    {/* Team Name */}
                    <Field label="Team Name *" error={errors.teamName}>
                      <input id="teamName" type="text" className="field-underline"
                        placeholder="Your team's name" value={form.teamName} onChange={set("teamName")} />
                    </Field>

                    {/* Number of members */}
                    <Field label="Number of Members *" error={errors.numberOfMembers}>
                      <input id="numberOfMembers" type="number" min="2" max="20"
                        className="field-underline" placeholder="e.g. 4"
                        value={form.numberOfMembers} onChange={set("numberOfMembers")} />
                    </Field>

                    {/* Dynamic member name inputs */}
                    {n >= 2 && (
                      <div ref={memberInputsRef} className="flex flex-col gap-4">
                        <p className="label-tag">Member Names *</p>
                        {Array.from({ length: n }).map((_, i) => (
                          <div key={i} className="member-field">
                            <Field label={`Member ${i + 1}`} error={errors[`member_${i}`]}>
                              <input
                                type="text"
                                id={`member-${i}`}
                                className="field-underline"
                                placeholder={`Member ${i + 1} full name`}
                                value={form.teamMembers[i] ?? ""}
                                onChange={(e) => setMember(i, e.target.value)}
                              />
                            </Field>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div ref={(el) => (fieldsRef.current[6] = el)}>
                  <Field label="Contact Number (optional)" error={errors.phone}>
                    <input id="phone" type="tel" className="field-underline"
                      placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} />
                  </Field>
                </div>

                {/* Server error */}
                {status === "error" && (
                  <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                    style={{ background: "rgba(255,107,138,0.1)", border: "1px solid rgba(255,107,138,0.3)" }} role="alert">
                    <p className="font-body text-sm" style={{ color: "#ff6b8a" }}>{serverError}</p>
                    <button type="submit" className="label-tag text-gold underline focus:outline-none"
                      style={{ background: "none", border: "none" }}>
                      Retry
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={status === "loading"}
                  className="w-full bg-gold text-plum font-body font-semibold uppercase tracking-widest text-sm
                             py-4 rounded-full hover:brightness-105 transition-all duration-200 mt-2
                             disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cream">
                  {status === "loading" ? "Saving…" : "Confirm Registration"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
