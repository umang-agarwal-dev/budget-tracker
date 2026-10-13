"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Brand from "./Brand";
import Count from "./Count";
import Icon from "./Icon";
import { inr } from "@/lib/api";

const HEAT = [0, 1, 0, 2, 3, 1, 0, 1, 0, 4, 2, 0, 1, 3, 0, 2, 1, 0, 3, 4, 1, 3, 1, 0, 2, 1, 0, 2, 0, 4, 2, 1, 0, 3, 1];
const ROT = ["sorted.", "split.", "saved.", "smarter.", "sorted."]; // last one repeats the first, so the loop is seamless
const TAGS = ["Track", "Save", "Split", "Insights", "AI tips", "Heatmap"];
const FEATS = [
  ["wallet", "Know what's left", "One big number, always up to date."],
  ["spark", "Smart nudges", "Tips on where to cut back."],
  ["users", "Split, no awkward", "Share a link. Pocket does the maths."],
];
const STEPS = [["01", "Set a budget", "Takes ten seconds."], ["02", "Add spends", "One tap, instant update."], ["03", "Chill", "Pocket handles the rest."]];

// Pulls a button slightly towards the cursor.
const mag = {
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
  },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = ""; },
};
// Soft light that follows the cursor inside a card.
const spot = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--px", e.clientX - r.left + "px");
  e.currentTarget.style.setProperty("--py", e.clientY - r.top + "px");
};

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      el.style.setProperty("--mx", e.clientX + "px");
      el.style.setProperty("--my", e.clientY + "px");
      el.style.setProperty("--tx", String((e.clientX / window.innerWidth - 0.5) * 2));
      el.style.setProperty("--ty", String((e.clientY / window.innerHeight - 0.5) * 2));
    };
    window.addEventListener("pointermove", move);
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) x.target.classList.add("in"); }), { threshold: 0.15 });
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    return () => { window.removeEventListener("pointermove", move); io.disconnect(); };
  }, []);

  return (
    <div className="lp" ref={root}>
      <div className="lp-aurora" />
      <div className="lp-grid" />
      <nav className="lp-nav">
        <Brand />
        <Link className="lp-cta sm" href="/login" {...mag}>Get Started <span>→</span></Link>
      </nav>

      <header className="lp-hero">
        <div className="lp-bits" aria-hidden>
          {["₹", "✦", "₹", "✦", "₹", "✦"].map((s, i) => <i key={i} style={{ left: 6 + i * 16 + "%", animationDelay: -i * 2.3 + "s", animationDuration: 12 + i * 2 + "s" }}>{s}</i>)}
        </div>
        <div>
          <span className="lp-eyebrow"><i className="live" /> Made for students</span>
          <h1 aria-label="Your pocket, sorted.">
            <span className="w" aria-hidden>Your</span><span className="w" aria-hidden style={{ animationDelay: "90ms" }}>pocket,</span>
            <span className="rot" aria-hidden><span className="rot-in">{ROT.map((r, i) => <b key={i}>{r}</b>)}</span></span>
          </h1>
          <p className="lp-sub">Know what&apos;s left. Split the bill. Skip the stress.</p>
          <div className="lp-acts"><Link className="lp-cta" href="/login" {...mag}>Get Started <span>→</span></Link></div>
        </div>

        <div className="lp-vis" aria-hidden>
          <div className="lp-par lp-p1">
            <div className="lp-card">
              <span className="lp-lbl">AMOUNT LEFT</span>
              <b className="lp-big"><Count value={12480} fmt={inr} /></b>
              <div className="lp-bar"><i /></div>
              <span className="lp-mut">50% used</span>
            </div>
          </div>
          <div className="lp-par lp-p2 lp-k2">
            <div className="lp-card" style={{ animationDelay: "-2s" }}>
              <span className="lp-lbl">THIS MONTH</span>
              <div className="lp-heat">{HEAT.map((l, i) => <i key={i} className={`c${l}`} style={{ animationDelay: 600 + i * 25 + "ms" }} />)}</div>
            </div>
          </div>
          <div className="lp-par lp-p3">
            <div className="lp-card" style={{ animationDelay: "-4s" }}>
              <span className="lp-lbl">✦ AI TIP</span>
              <p>Skip two Swiggy orders. Goa is yours.</p>
              <div className="lp-pay"><b>Priya</b> pays <b>Rahul</b><em>₹1,200</em></div>
            </div>
          </div>
          <div className="lp-note">On track!</div>
        </div>
      </header>

      <div className="lp-marq" aria-hidden>
        <div className="lp-track">{[0, 1].map((k) => <span key={k}>{TAGS.map((t) => <b key={t}>{t}</b>)}</span>)}</div>
      </div>

      <section className="lp-sec">
        <p className="lp-kick rv">Why Pocket</p>
        <h2 className="rv">Built for tight budgets.</h2>
        <p className="lp-sub rv" style={{ marginTop: 14 }}>No spreadsheets. No awkward chats.</p>
        <div className="lp-feats">
          {FEATS.map(([ic, t, d], i) => (
            <div key={t} className="lp-feat rv" style={{ transitionDelay: i * 120 + "ms" }} onPointerMove={spot}>
              <span className="lp-ic"><Icon n={ic} size={22} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec">
        <h2 className="rv">Easy as 1-2-3.</h2>
        <div className="lp-steps">
          {STEPS.map(([n, t, d], i) => (
            <div key={n} className="lp-step rv" style={{ transitionDelay: i * 120 + "ms" }}>
              <span>{n}</span><h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-final rv">
        <div className="lp-orb" aria-hidden />
        <h2>Make it to month-end.</h2>
        <Link className="lp-cta" href="/login" {...mag}>Get Started <span>→</span></Link>
      </section>
      <footer className="lp-foot"><Brand /><span>© Pocket</span></footer>
    </div>
  );
}
