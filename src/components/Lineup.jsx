import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lineup } from "../data/event";

gsap.registerPlugin(ScrollTrigger);

function scrollTo(id) {
  window.dispatchEvent(new CustomEvent("aashiyana:scrollTo", { detail: { id } }));
}

export default function Lineup({ onSelectEvent }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const rowsRef = useRef([]);
  const barsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Panel fades in
      gsap.from(panelRef.current, {
        opacity: 0, y: 40, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: panelRef.current, start: "top 80%", once: true },
      });

      // Rows stagger in from left
      gsap.from(rowsRef.current.filter(Boolean), {
        x: -30, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power3.out",
        scrollTrigger: { trigger: panelRef.current, start: "top 75%", once: true },
      });

      // Accent bars scale from top
      gsap.from(barsRef.current.filter(Boolean), {
        scaleY: 0, duration: 0.4, stagger: 0.04, ease: "power2.out", transformOrigin: "top",
        scrollTrigger: { trigger: panelRef.current, start: "top 75%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleRowClick = (ev) => {
    // Pre-select event in register form via custom event, then scroll
    window.dispatchEvent(
      new CustomEvent("aashiyana:selectEvent", { detail: { name: ev.name } })
    );
    scrollTo("register");
  };

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section id="lineup" ref={sectionRef} className="py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Heading */}
        <div className="mb-12 flex flex-col gap-4">
          <p className="label-tag">Event Lineup</p>
          <h2
            className="font-display font-black text-cream"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            What's on the bill
          </h2>
          {/* Dotted divider */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="inline-block w-1 h-px bg-gold-muted opacity-50" />
            ))}
          </div>
        </div>

        {/* Panel */}
        <div
          ref={panelRef}
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid #b8962e",
          }}
        >
          <div className="grid md:grid-cols-2 gap-3">
            {lineup.map((ev, i) => (
              <button
                key={ev.id}
                ref={(el) => { rowsRef.current[i] = el; }}
                onClick={() => handleRowClick(ev)}
                className="group flex items-center gap-4 rounded-lg px-4 py-3.5 text-left
                           hover:bg-white/5 transition-colors duration-200 w-full focus:outline-none
                           focus-visible:ring-1 focus-visible:ring-gold cursor-pointer"
                style={{ background: "rgba(42,10,61,0.5)" }}
              >
                {/* Left accent bar */}
                <span
                  ref={(el) => { barsRef.current[i] = el; }}
                  className="shrink-0 rounded-sm transition-all duration-200"
                  style={{
                    width: "4px", height: "36px",
                    background: "#ffd700",
                    transform: "scaleX(1)",
                    transformOrigin: "left",
                  }}
                  aria-hidden="true"
                />

                {/* Number */}
                <span className="font-body text-gold text-xs tracking-widest shrink-0 w-6">
                  {pad(ev.id)}
                </span>

                {/* Name */}
                <span className="font-body font-medium text-cream text-sm flex-1">
                  {ev.name}
                </span>

                {/* Team tag */}
                {ev.team && (
                  <span
                    className="shrink-0 label-tag text-plum bg-gold rounded px-2 py-0.5"
                    style={{ fontSize: "0.58rem" }}
                  >
                    Team
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 font-body text-cream opacity-40 text-sm">
          Click any event to register for it directly.
        </p>
      </div>
    </section>
  );
}
