import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { contacts, social, event } from "../data/event";

gsap.registerPlugin(ScrollTrigger);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
  </svg>
);

export default function Contact() {
  const sectionRef = useRef(null);
  const rowsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(rowsRef.current.filter(Boolean), {
        y: 24, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative py-28 md:py-36"
      style={{
        background: "#1c0630",
        borderRadius: "40px 40px 0 0",
        marginTop: "-40px",
      }}
    >
      {/* Background text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="font-display font-black text-cream"
          style={{
            fontSize: "20vw",
            opacity: 0.04,
            WebkitTextStroke: "2px #fdf6ec",
            color: "transparent",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {event.name.toUpperCase()}
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <p className="label-tag mb-4">Contact</p>
        <h2
          className="font-display font-bold text-cream mb-16"
          style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
        >
          Questions? Talk to us.
        </h2>

        {/* Coordinator rows */}
        <div className="flex flex-col gap-0 mb-16 max-w-2xl">
          {contacts.map((c, i) => (
            <div key={c.name} ref={(el) => (rowsRef.current[i] = el)}>
              {i > 0 && <div className="gold-rule my-6" />}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-cream text-xl">{c.name}</p>
                  <p className="label-tag mt-0.5">{c.role}</p>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                    className="font-body text-cream opacity-70 hover:opacity-100 hover:text-gold transition-colors duration-200 text-sm"
                  >
                    {c.phone}
                  </a>
                  <a
                    href={`https://wa.me/${c.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="label-tag text-xs border border-gold-muted text-gold px-3 py-1 rounded-full
                               hover:bg-gold hover:text-plum transition-all duration-200"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
          <div className="gold-rule mt-6" />
        </div>

        {/* Social buttons */}
        <div
          ref={(el) => (rowsRef.current[contacts.length] = el)}
          className="flex items-center gap-4"
        >
          <a
            href={social.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Follow us on Instagram"
            className="w-10 h-10 rounded-full flex items-center justify-center text-cream
                       hover:bg-gold hover:text-plum transition-all duration-200 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-gold"
            style={{ border: "1px solid #b8962e" }}
          >
            <InstagramIcon />
          </a>
          <a
            href={social.whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="w-10 h-10 rounded-full flex items-center justify-center text-cream
                       hover:bg-gold hover:text-plum transition-all duration-200 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-gold"
            style={{ border: "1px solid #b8962e" }}
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
