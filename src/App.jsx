import { useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import "./index.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Lineup from "./components/Lineup";
import Register from "./components/Register";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const AdminPanel = lazy(() => import("./components/AdminPanel"));

gsap.registerPlugin(ScrollTrigger);

// ── Main public site ──────────────────────────────────────────────────────────
function MainSite() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, touchMultiplier: 1.5 });
    lenisRef.current = lenis;

    // BUG FIX: store ticker fn in a variable so the SAME reference is removed on cleanup.
    // Previously a new arrow function was passed to remove(), which never matched.
    const tickerFn = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    ScrollTrigger.refresh();

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerFn);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Expose scroll helper for Lineup → Register link
  useEffect(() => {
    const handler = (e) => {
      const el = document.getElementById(e.detail?.id);
      if (el && lenisRef.current) lenisRef.current.scrollTo(el, { offset: -80 });
    };
    window.addEventListener("aashiyana:scrollTo", handler);
    return () => window.removeEventListener("aashiyana:scrollTo", handler);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg,#2a0a3d 0%,#4b1257 50%,#b02a5b 100%)" }}
    >
      <Navbar />
      <main>
        <Hero />
        <About />
        <Lineup />
        <Register />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route
          path="/owner"
          element={
            <Suspense
              fallback={
                <div
                  className="min-h-screen flex items-center justify-center font-display text-gold tracking-widest text-sm"
                  style={{ background: "#1c0630" }}
                >
                  LOADING OWNER PORTAL…
                </div>
              }
            >
              <AdminPanel />
            </Suspense>
          }
        />
        <Route path="/admin" element={<Navigate to="/owner" replace />} />
        {/* Catch-all: redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
