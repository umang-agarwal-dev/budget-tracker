"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import Brand from "./Brand";
import Count from "./Count";
import Icon from "./Icon";
import { inr } from "@/lib/api";

const HEAT = [0, 1, 0, 2, 3, 1, 0, 1, 0, 4, 2, 0, 1, 3, 0, 2, 1, 0, 3, 4, 1, 3, 1, 0, 2, 1, 0, 2, 0, 4, 2, 1, 0, 3, 1];
const WORDS = ["Your", "money,", "in", "your"];
const TAGS = ["Track spending", "Save for goals", "Split with friends", "AI tips", "Heatmaps", "Monthly insights"];
const FEATS = [
  ["wallet", "Know what's left", "One big number shows what you can still spend this month. It counts down the moment you add an expense."],
  ["spark", "Tips that actually help", "Smart suggestions tell you where to cut back, and how to reach the trip or gadget you are saving for."],
  ["users", "Split without the awkward", "Share a link, friends add what they paid, and Pocket works out who pays whom. No accounts needed."],
];
const STEPS = [["01", "Set your budget", "Tell Pocket what you have for the month."], ["02", "Add what you spend", "It takes five seconds, and your number updates instantly."], ["03", "Let Pocket do the thinking", "Charts, tips and settle-ups, all in one place."]];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => { el.style.setProperty("--mx", e.clientX + "px"); el.style.setProperty("--my", e.clientY + "px"); };
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
        <div className="lp-nav-r">
          <Link className="lp-link" href="/login">Log in</Link>
          <Link className="lp-cta sm" href="/login">Get Started <span>→</span></Link>
        </div>
      </nav>

      <header className="lp-hero">
        <div>
          <span className="lp-eyebrow"><i className="live" /> Budgeting and bill splitting, made for students</span>
          <h1>
            {WORDS.map((w, i) => <span key={w} className="w" style={{ animationDelay: i * 90 + "ms" }}>{w} </span>)}
            <span className="w acc" style={{ animationDelay: "420ms" }}>Pocket
              <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M2 8 C 25 2, 60 12, 98 4" /></svg>
            </span>.
          </h1>
          <p className="lp-sub">See what is left this month, watch where it goes, save for the trip, and split the bill with friends. Simple, quick, and kind to a student budget.</p>
          <div className="lp-acts">
            <Link className="lp-cta" href="/login">Get Started <span>→</span></Link>
            <a className="lp-link" href="#about">See how it works</a>
          </div>
        </div>

        <div className="lp-vis" aria-hidden>
          <div className="lp-card lp-c1">
            <span className="lp-lbl">AMOUNT LEFT</span>
            <b className="lp-big"><Count value={12480} fmt={inr} /></b>
            <div className="lp-bar"><i /></div>
            <span className="lp-mut">50% used · 14 days left</span>
          </div>
          <div className="lp-card lp-c2">
            <span className="lp-lbl">THIS MONTH</span>
            <div className="lp-heat">{HEAT.map((l, i) => <i key={i} className={`l${l}`} style={{ animationDelay: 600 + i * 25 + "ms" }} />)}</div>
          </div>
          <div className="lp-card lp-c3">
            <span className="lp-lbl">✦ AI SUGGESTION</span>
            <p>Cut food delivery by 20% and your Goa trip fund is on track.</p>
            <div className="lp-pay"><b>Priya</b> pays <b>Rahul</b><em>₹1,200</em></div>
          </div>
          <div className="lp-note">You&apos;re on track!</div>
        </div>
      </header>

      <div className="lp-marq" aria-hidden>
        <div className="lp-track">
          {[0, 1].map((k) => <span key={k}>{TAGS.map((t) => <b key={t}>{t}</b>)}</span>)}
        </div>
      </div>

      <section className="lp-sec" id="about">
        <p className="lp-kick rv">About Pocket</p>
        <h2 className="rv">A money app that feels like part of college life.</h2>
        <p className="lp-sub rv" style={{ marginTop: 16 }}>Pocket was built for people living on a tight monthly budget. No jargon, no spreadsheets. Just a clear picture of your money and a little help staying on top of it.</p>
        <div className="lp-feats">
          {FEATS.map(([ic, t, d], i) => (
            <div key={t} className="lp-feat rv" style={{ transitionDelay: i * 120 + "ms" }}>
              <span className="lp-ic"><Icon n={ic} size={22} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec">
        <h2 className="rv">Three steps. That&apos;s it.</h2>
        <div className="lp-steps">
          {STEPS.map(([n, t, d], i) => (
            <div key={n} className="lp-step rv" style={{ transitionDelay: i * 120 + "ms" }}>
              <span>{n}</span><h3>{t}</h3><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-final rv">
        <h2>Ready to fill your Pocket?</h2>
        <Link className="lp-cta" href="/login">Get Started <span>→</span></Link>
      </section>
      <footer className="lp-foot"><Brand /><span>Made for students · © Pocket</span></footer>
    </div>
  );
}
