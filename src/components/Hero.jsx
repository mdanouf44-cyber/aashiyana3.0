import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { event } from "../data/event";

function scrollTo(id) {
  window.dispatchEvent(new CustomEvent("aashiyana:scrollTo", { detail: { id } }));
}

// ── Countdown ─────────────────────────────────────────────────────────────
function useCountdown(target) {
  const [time, setTime] = useState(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - Date.now();
      if (diff <= 0) { setTime(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

export default function Hero() {
  const heroRef = useRef(null);
  const ruleRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const eyebrowRef = useRef(null);
  const pillRef = useRef(null);
  const subRef = useRef(null);
  const btnsRef = useRef(null);
  const countdown = useCountdown(event.isoDate);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });

      // Eyebrow
      tl.from(eyebrowRef.current, { opacity: 0, y: 16, duration: 0.7, ease: "power3.out" });

      // Title lines masked reveal
      tl.from(
        [line1Ref.current, line2Ref.current],
        { yPercent: 110, duration: 0.9, stagger: 0.12, ease: "power4.out" },
        "-=0.3"
      );

      // Gold rule draws left-to-right
      tl.from(ruleRef.current, { scaleX: 0, duration: 0.8, ease: "power3.inOut", transformOrigin: "left" }, "-=0.4");

      // Date pill fades in
      tl.from(pillRef.current, { opacity: 0, y: 12, duration: 0.6, ease: "power2.out" }, "-=0.3");

      // Subline and buttons
      tl.from([subRef.current, btnsRef.current], { opacity: 0, y: 16, duration: 0.6, stagger: 0.1, ease: "power2.out" }, "-=0.2");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const CountUnit = ({ val, label }) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl md:text-4xl font-black text-cream leading-none">
        {String(val).padStart(2, "0")}
      </span>
      <span className="label-tag mt-1" style={{ fontSize: "0.55rem" }}>{label}</span>
    </div>
  );

  const CountDivider = () => (
    <span className="font-display text-2xl text-gold-muted self-start mt-1 opacity-60">·</span>
  );

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background soft circles (like poster) */}
      <div
        className="absolute -top-32 -left-32 rounded-full"
        style={{
          width: "55vw", height: "55vw",
          background: "radial-gradient(circle, rgba(176,42,91,0.22) 0%, transparent 70%)",
          animation: "spin 20s linear infinite",
          animationTimingFunction: "linear",
        }}
      />
      <div
        className="absolute -bottom-32 -right-16 rounded-full"
        style={{
          width: "50vw", height: "50vw",
          background: "radial-gradient(circle, rgba(75,18,87,0.35) 0%, transparent 70%)",
          animation: "spin 20s linear infinite reverse",
        }}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.04); } to { transform: rotate(360deg) scale(1); } }
        @keyframes pulse-line { 0%,100% { opacity: 0.2; } 50% { opacity: 0.7; } }
      `}</style>

      {/* Large decorative version — desktop only (if version present) */}
      {event.version && (
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none"
          style={{
            fontSize: "28vw",
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,215,0,0.06)",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {event.version}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-16">
        {/* Eyebrow */}
        <p ref={eyebrowRef} className="label-tag mb-6">{event.label}</p>

        {/* Main title */}
        <div className="mb-4">
          <div className="clip-reveal">
            <h1
              ref={line1Ref}
              className="font-display font-black text-cream leading-none"
              style={{ fontSize: "clamp(3.5rem, 11vw, 10rem)", letterSpacing: "-0.02em" }}
            >
              {event.name.toUpperCase()}
            </h1>
          </div>
          <div className="clip-reveal">
            <h2
              ref={line2Ref}
              className="font-display font-black leading-none"
              style={{ fontSize: "clamp(3rem, 9vw, 8rem)", letterSpacing: "-0.02em" }}
            >
              {event.version ? (
                <>
                  <span className="text-gold">{event.version}</span>
                  <span className="text-cream opacity-50 mx-3">·</span>
                  <span className="text-cream">{event.year}</span>
                </>
              ) : (
                <span className="text-gold">{event.year}</span>
              )}
            </h2>
          </div>
        </div>

        {/* Gold hairline */}
        <span
          ref={ruleRef}
          className="block h-px mb-8"
          style={{ background: "#b8962e", width: "min(480px, 90%)" }}
        />

        {/* Date pill */}
        <div ref={pillRef} className="mb-6">
          <span
            className="inline-block bg-gold text-plum font-body font-bold uppercase tracking-widest text-xs px-5 py-2 rounded-full"
          >
            {event.date}
          </span>
        </div>

        {/* Tagline + subline */}
        <p
          ref={subRef}
          className="font-display italic text-gold text-xl md:text-2xl mb-3"
        >
          {event.tagline}
        </p>
        <p className="text-cream opacity-70 font-body max-w-lg leading-relaxed mb-10" style={{ fontSize: "1rem" }}>
          An evening of music, dance, comedy and everything in between. Pick your stage and register below.
        </p>

        {/* Countdown */}
        {countdown ? (
          <div className="mb-10 flex items-center gap-5">
            <CountUnit val={countdown.d} label="Days" />
            <CountDivider />
            <CountUnit val={countdown.h} label="Hours" />
            <CountDivider />
            <CountUnit val={countdown.m} label="Minutes" />
            <CountDivider />
            <CountUnit val={countdown.s} label="Seconds" />
          </div>
        ) : (
          <p className="mb-10 font-display italic text-gold text-lg">The evening has begun.</p>
        )}

        {/* CTA Buttons */}
        <div ref={btnsRef} className="flex flex-wrap gap-4 items-center">
          <button
            className="bg-gold text-plum font-body font-semibold uppercase tracking-widest text-sm
                       px-8 py-3.5 rounded-full hover:-translate-y-0.5 hover:brightness-105
                       transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            onClick={() => scrollTo("register")}
          >
            Register Now
          </button>
          <button
            className="font-body text-sm text-gold border-b border-gold pb-0.5 hover:opacity-80
                       transition-opacity duration-200 bg-transparent border-t-0 border-l-0 border-r-0
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer"
            style={{ background: "none" }}
            onClick={() => scrollTo("lineup")}
          >
            View Lineup →
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <div
          className="w-px h-12 bg-gold"
          style={{ animation: "pulse-line 2.4s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
