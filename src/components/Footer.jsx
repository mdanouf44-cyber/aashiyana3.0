import { event } from "../data/event";

const links = ["Home", "About", "Lineup", "Register", "Contact"];
const ids =   ["hero", "about", "lineup", "register", "contact"];

function scrollTo(id) {
  window.dispatchEvent(new CustomEvent("aashiyana:scrollTo", { detail: { id } }));
}

const MARQUEE_TEXT = Array.from({ length: 8 })
  .map(() => `${event.name.toUpperCase()} · ${event.date.toUpperCase()} ·`)
  .join("  ");

export default function Footer() {
  return (
    <footer
      style={{ background: "#1c0630" }}
      className="pt-16 pb-10"
    >
      {/* Slow gold marquee */}
      <div className="overflow-hidden mb-12" aria-hidden="true">
        <div
          className="marquee-inner font-display font-black text-gold select-none"
          style={{ opacity: 0.08, fontSize: "clamp(1rem,2.5vw,1.5rem)", letterSpacing: "0.15em" }}
        >
          {MARQUEE_TEXT}&nbsp;&nbsp;{MARQUEE_TEXT}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Gold rule */}
        <div className="gold-rule mb-10" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo + tagline */}
          <div>
            <p className="font-display font-bold text-cream text-lg">
              {event.name}{event.version ? <> <span className="text-gold">{event.version}</span></> : ""}
            </p>
            <p className="font-body text-cream opacity-40 text-sm mt-1 italic font-display">
              {event.tagline}
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-6">
              {links.map((label, i) => (
                <li key={label}>
                  <button
                    onClick={() => scrollTo(ids[i])}
                    className="label-tag text-cream opacity-60 hover:opacity-100 hover:text-gold
                               transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Gold rule */}
        <div className="gold-rule my-8" />

        {/* Bottom line */}
        <p className="font-body text-center" style={{ color: "rgba(253,246,236,0.35)", fontSize: "0.78rem", letterSpacing: "0.05em" }}>
          © 2026 {event.name}{event.version ? ` ${event.version}` : ""} · {event.institution} · Organised by {event.committee}
        </p>
      </div>
    </footer>
  );
}
