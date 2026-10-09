import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { event } from "../data/event";

gsap.registerPlugin(ScrollTrigger);

const facts = [
  { label: "Date", value: event.date },
  { label: "Time", value: event.timing },
  { label: "Venue", value: event.venue },
  { label: "Events", value: "12 categories, open to all years" },
];

export default function About() {
  const sectionRef = useRef(null);
  const statementRef = useRef(null);
  const rulesRef = useRef([]);
  const factsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Statement word-by-word fade in
      const words = statementRef.current?.querySelectorAll(".word");
      if (words?.length) {
        gsap.from(words, {
          opacity: 0, y: 18, duration: 0.7, stagger: 0.04, ease: "power3.out",
          scrollTrigger: {
            trigger: statementRef.current,
            start: "top 75%",
            once: true,
          },
        });
      }

      // Hairlines draw in
      rulesRef.current.forEach((el) => {
        if (!el) return;
        gsap.from(el, {
          scaleX: 0, duration: 0.8, ease: "power3.inOut", transformOrigin: "left",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      // Facts stagger up
      gsap.from(factsRef.current.filter(Boolean), {
        y: 20, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 65%",
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Split statement into spans
  const statementWords = event.about.split(" ").map((w, i) => (
    <span key={i} className="word inline-block mr-2">{w}</span>
  ));

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-28 md:py-36"
      style={{ background: "rgba(42,10,61,0.45)" }}
    >
      {/* Label */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="label-tag mb-12">About the Evening</p>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Left: statement + paragraph */}
          <div>
            <h2
              ref={statementRef}
              className="font-display font-bold text-cream leading-snug mb-8"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)" }}
            >
              {statementWords}
            </h2>
            <p className="font-body text-cream opacity-60 leading-relaxed" style={{ fontSize: "0.97rem" }}>
              {event.aboutParagraph}
            </p>
          </div>

          {/* Right: facts */}
          <div className="flex flex-col">
            {facts.map((f, i) => (
              <div key={f.label} ref={(el) => (factsRef.current[i] = el)}>
                <div
                  ref={(el) => (rulesRef.current[i * 2] = el)}
                  className="gold-rule mb-6"
                />
                <div className="flex justify-between items-baseline mb-6">
                  <span className="label-tag">{f.label}</span>
                  <span
                    className="font-display font-bold text-cream text-right"
                    style={{ fontSize: "1.15rem" }}
                  >
                    {f.value}
                  </span>
                </div>
              </div>
            ))}
            <div
              ref={(el) => (rulesRef.current[facts.length * 2] = el)}
              className="gold-rule"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
