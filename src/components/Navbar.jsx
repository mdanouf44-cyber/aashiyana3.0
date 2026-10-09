import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { event } from "../data/event";

const links = [
  { label: "Home", id: "hero" },
  { label: "About", id: "about" },
  { label: "Lineup", id: "lineup" },
  { label: "Register", id: "register" },
  { label: "Contact", id: "contact" },
];

function scrollTo(id) {
  window.dispatchEvent(
    new CustomEvent("aashiyana:scrollTo", { detail: { id } })
  );
}

export default function Navbar() {
  const navRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeId, setActiveId] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef(null);
  const menuLinksRef = useRef([]);

  // ── Scroll hide/show & background change ─────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Active link via IntersectionObserver ─────────────────────────────────
  useEffect(() => {
    const observers = links.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".nav-logo", { x: -24, opacity: 0, duration: 0.8, ease: "power2.out" });
      gsap.from(".nav-link", {
        opacity: 0, y: -8, duration: 0.6, stagger: 0.06, ease: "power2.out", delay: 0.3,
      });
      gsap.from(".nav-cta", { opacity: 0, scale: 0.92, duration: 0.6, ease: "back.out(1.4)", delay: 0.7 });
    }, navRef);
    return () => ctx.revert();
  }, []);

  // ── Mobile menu animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!menuRef.current) return;
    if (menuOpen) {
      gsap.to(menuRef.current, { opacity: 1, pointerEvents: "all", duration: 0.35, ease: "power2.out" });
      gsap.from(menuLinksRef.current, {
        y: 30, opacity: 0, stagger: 0.07, duration: 0.5, ease: "power3.out", delay: 0.1,
      });
      document.body.style.overflow = "hidden";
    } else {
      gsap.to(menuRef.current, { opacity: 0, pointerEvents: "none", duration: 0.25, ease: "power2.in" });
      document.body.style.overflow = "";
    }
  }, [menuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        style={{
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.4s ease, background 0.4s ease, backdrop-filter 0.4s ease",
          background: scrolled ? "rgba(42,10,61,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        }}
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between"
      >
        {/* Logo */}
        <button
          className="nav-logo text-cream font-display font-bold text-lg tracking-tight hover:opacity-90 focus:outline-none relative group"
          onClick={() => scrollTo("hero")}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Aashiyana{" "}
          <span className="text-gold">3.0</span>
          <span
            className="absolute bottom-0 left-0 h-px w-0 bg-gold group-hover:w-full transition-all duration-300"
            style={{ bottom: "-2px" }}
          />
        </button>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-10">
          {links.map(({ label, id }) => (
            <li key={id}>
              <button
                className={`nav-link label-tag relative group focus:outline-none ${
                  activeId === id ? "text-gold" : "text-cream opacity-80 hover:opacity-100"
                }`}
                onClick={() => scrollTo(id)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                {label}
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gold transition-all duration-300"
                  style={{ width: activeId === id ? "100%" : "0%", bottom: "-3px" }}
                />
              </button>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className="nav-cta hidden md:block label-tag bg-gold text-plum px-5 py-2 rounded-full font-semibold
                     hover:-translate-y-px hover:brightness-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          onClick={() => scrollTo("register")}
        >
          Register Now
        </button>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 focus:outline-none z-[60]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className="block h-px w-6 bg-cream transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none" }}
          />
          <span
            className="block h-px w-6 bg-cream transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? "translateY(-4px) rotate(-45deg)" : "none" }}
          />
        </button>
      </nav>

      {/* Mobile fullscreen menu */}
      <div
        ref={menuRef}
        style={{ opacity: 0, pointerEvents: "none" }}
        className="fixed inset-0 z-40 flex flex-col justify-center px-10"
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(e) => { if (e.target === menuRef.current) setMenuOpen(false); }}
      >
        {/* Solid background */}
        <div className="absolute inset-0 bg-plum" style={{ opacity: 0.98 }} />

        <ul className="relative flex flex-col gap-8">
          {links.map(({ label, id }, i) => (
            <li
              key={id}
              ref={(el) => (menuLinksRef.current[i] = el)}
            >
              <button
                className="flex items-baseline gap-4 group focus:outline-none"
                onClick={() => { scrollTo(id); setMenuOpen(false); }}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <span className="text-gold font-body text-xs tracking-widest w-6">
                  0{i + 1}
                </span>
                <span className="font-display text-4xl text-cream font-bold group-hover:text-gold transition-colors duration-200">
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="relative mt-16 label-tag text-cream opacity-40">
          {event.date}
        </p>
      </div>
    </>
  );
}
