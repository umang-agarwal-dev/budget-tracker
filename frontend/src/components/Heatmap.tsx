"use client";
import { useState } from "react";
import { inr } from "@/lib/api";
import Icon from "./Icon";

// A month calendar: every day is a square that fills the card. Warmer colour = more spent that day.
export default function Heatmap({ exps }: { exps: { date: string; amount: string }[] }) {
  const now = new Date();
  const [back, setBack] = useState(0);
  const [tip, setTip] = useState("");
  const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const key = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
  const totals: number[] = Array.from({ length: n }, () => 0);
  exps.forEach((e) => { if (e.date.startsWith(key)) totals[Number(e.date.slice(8, 10)) - 1] += Number(e.amount); });
  const max = Math.max(...totals, 0);
  const level = (t: number) => (t <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((t / max) * 4))));
  const offset = (first.getDay() + 6) % 7;
  const month = first.toLocaleDateString("en-IN", { month: "short" });
  const sum = totals.reduce((a, b) => a + b, 0);
  const go = (d: number) => { setBack(back + d); setTip(""); };

  return (
    <div>
      <div className="hm-head">
        <button onClick={() => go(1)} disabled={back >= 11} aria-label="Previous month"><Icon n="left" size={16} /></button>
        <b>{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b>
        <button onClick={() => go(-1)} disabled={back === 0} aria-label="Next month"><Icon n="right" size={16} /></button>
      </div>
      <div className="hm-tip">{tip || (sum ? `${inr(sum)} spent this month` : "No spending this month")}</div>
      <div className="cal" key={key}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="cal-h">{d}</span>)}
        {Array.from({ length: offset }, (_, i) => <i key={"b" + i} />)}
        {totals.map((t, i) => {
          const future = back === 0 && i + 1 > now.getDate();
          const today = back === 0 && i + 1 === now.getDate();
          return (
            <button key={i} className={`cal-c c${level(t)}${future ? " fut" : ""}${today ? " today" : ""}`} style={{ animationDelay: i * 12 + "ms" }}
              aria-label={`${i + 1} ${month}: ${inr(t)}`} onClick={() => setTip(`${i + 1} ${month}: ${inr(t)}`)}>
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="cal-key"><span>Less</span>{[0, 1, 2, 3, 4].map((l) => <i key={l} className={`c${l}`} />)}<span>More</span></div>
    </div>
  );
}
