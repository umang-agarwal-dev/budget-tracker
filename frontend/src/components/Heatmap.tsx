"use client";
import { Fragment, useState } from "react";
import { inr } from "@/lib/api";
import Icon from "./Icon";

// Built from the expense list, so any past month can be shown. Rows = weekdays, columns = weeks, darker = bigger spend.
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
  const cols = Math.ceil((offset + n) / 7);
  const names = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
  const month = first.toLocaleDateString("en-IN", { month: "short" });
  const label = (i: number) => `${i + 1} ${month}: ${inr(totals[i])}`;
  const sum = totals.reduce((a, b) => a + b, 0);
  const go = (d: number) => { setBack(back + d); setTip(""); };

  return (
    <div>
      <div className="hm-head">
        <button onClick={() => go(1)} disabled={back >= 11} aria-label="Previous month"><Icon n="left" size={16} /></button>
        <b>{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b>
        <button onClick={() => go(-1)} disabled={back === 0} aria-label="Next month"><Icon n="right" size={16} /></button>
      </div>
      <div className="hm-tip">{tip || (sum ? `${inr(sum)} spent` : "No spending this month")}</div>
      <div key={key} className="hm" style={{ gridTemplateColumns: `auto repeat(${cols}, 16px)` }}>
        {names.map((nm, r) => (
          <Fragment key={r}>
            <span className="hm-lbl">{nm}</span>
            {Array.from({ length: cols }, (_, c) => {
              const i = c * 7 + r - offset;
              if (i < 0 || i >= n) return <i key={c} className="hm-c empty" />;
              const future = back === 0 && i + 1 > now.getDate();
              return (
                <button key={c} aria-label={label(i)} className={`hm-c l${level(totals[i])}${future ? " fut" : ""}`}
                  style={{ animationDelay: i * 14 + "ms" }} onMouseEnter={() => setTip(label(i))} onClick={() => setTip(label(i))} />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
