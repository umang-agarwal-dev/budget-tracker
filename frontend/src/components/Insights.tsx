"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { inr } from "@/lib/api";
import Icon from "./Icon";
import Count from "./Count";
import { cap, icon } from "./forms";

type E = { date: string; amount: string; category: string; description: string | null };
const COLORS = ["#c6e635", "#ff9f5a", "#8b7cf6", "#35c48d", "#f26d85", "#7fb3ff"];
const C = 2 * Math.PI * 40;
const mk = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const short = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(Math.round(n)));
const sum = (l: E[]) => l.reduce((s, e) => s + Number(e.amount), 0);
const rupees = (n: number) => inr(Math.round(n));

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 2), 14);
    return () => clearTimeout(t);
  }, [n, text]);
  return <p>{text.slice(0, n)}{n < text.length && <span className="caret" />}</p>;
}

// Side panel with charts built from your own expenses. Plain SVG, so no chart library is needed.
export default function Insights({ open, onClose, exps, budget }: { open: boolean; onClose: () => void; exps: E[]; budget: number }) {
  const [mounted, setMounted] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [active, setActive] = useState("");
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const now = new Date();
  const day = now.getDate();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const mine = exps.filter((e) => e.date.startsWith(mk(now)));
  const spent = sum(mine);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString("en-IN", { month: "short" }), total: sum(exps.filter((e) => e.date.startsWith(mk(d)))) };
  });
  const maxM = Math.max(...months.map((m) => m.total), 1);
  const byCat: Record<string, number> = {};
  mine.forEach((e) => { byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount); });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const daily: number[] = Array.from({ length: day }, () => 0);
  mine.forEach((e) => { const d = Number(e.date.slice(8, 10)); if (d >= 1 && d <= day) daily[d - 1] += Number(e.amount); });
  const cum: number[] = [];
  daily.forEach((v, i) => cum.push((i ? cum[i - 1] : 0) + v));
  const perDay = spent / day;
  const projected = perDay * dim;
  const lastMonth = sum(exps.filter((e) => e.date.startsWith(mk(new Date(now.getFullYear(), now.getMonth() - 1, 1)))));
  const change = lastMonth ? Math.round(((spent - lastMonth) / lastMonth) * 100) : null;
  const noSpend = daily.filter((v) => v === 0).length;
  const biggest = [...mine].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const top = cats[0];
  const over = budget > 0 && projected > budget;
  const tip = !mine.length ? "Add an expense to see how this month is shaping up."
    : budget <= 0 ? `You're spending about ${rupees(perDay)} a day.`
    : over ? `At this pace you'll finish the month about ${rupees(projected - budget)} over budget.${top ? ` Trimming ${cap(top[0])}, your biggest category, is the quickest fix.` : ""}`
    : `Nice! At this pace you'll finish the month about ${rupees(budget - projected)} under budget.`;

  const W = 300, H = 110;
  const maxY = Math.max(budget, projected, spent, 1);
  const x = (i: number) => (dim > 1 ? (i / (dim - 1)) * W : 0);
  const y = (v: number) => H - (v / maxY) * H;
  const line = cum.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = cum.length ? `${line} L${x(cum.length - 1).toFixed(1)} ${H} L0 ${H} Z` : "";
  const idx = hoverDay ?? day - 1;
  let off = 0;
  const slices = cats.map(([c, v], i) => { const len = (v / spent) * C; const s = { c, v, i, len, off }; off += len; return s; });

  const panel = (
    <>
      <div className={open ? "scrim on" : "scrim"} onClick={onClose} />
      <aside className={open ? "ins open" : "ins"} aria-hidden={!open}>
        <div className="ins-head">
          <h3><span className="ins-spark"><Icon n="spark" size={16} /></span> Insights</h3>
          <button onClick={onClose} aria-label="Close insights"><Icon n="x" size={18} /></button>
        </div>
        {exps.length === 0 ? (
          <div className="ins-body"><p className="mut">Add a few expenses and your charts and insights will appear here.</p></div>
        ) : (
          <div className="ins-body" key={open ? "open" : "shut"}>
            <div className="sbox">
              <i className="spk s1" /><i className="spk s2" /><i className="spk s3" />
              <div className="sbox-h"><Icon n="spark" size={16} /> Smart insight</div>
              <Typed text={tip} />
            </div>

            <div className="kpis">
              <div className="kpi"><span className="mut">Avg per day</span><b><Count value={Math.round(perDay)} fmt={inr} /></b></div>
              <div className="kpi"><span className="mut">Month-end pace</span><b className={over ? "up" : ""}><Count value={Math.round(projected)} fmt={inr} /></b></div>
              <div className="kpi"><span className="mut">No-spend days</span><b><Count value={noSpend} fmt={(n) => String(Math.round(n))} /></b></div>
              <div className="kpi"><span className="mut">Vs last month</span><b className={change !== null && change > 0 ? "up" : "down"}>{change === null ? "–" : `${change > 0 ? "↑" : "↓"} ${Math.abs(change)}%`}</b></div>
            </div>

            <div className="ins-card">
              <h5>{hoverDay === null ? "Spending this month" : `Day ${idx + 1}`}<span>{hoverDay === null ? `${rupees(spent)}${budget > 0 ? ` of ${inr(budget)}` : ""}` : rupees(cum[idx])}</span></h5>
              <svg viewBox={`0 0 ${W} ${H + 20}`} className="chart" role="img" aria-label="Cumulative spending this month"
                onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHoverDay(Math.max(0, Math.min(day - 1, Math.round(((e.clientX - r.left) / r.width) * (dim - 1))))); }}
                onPointerLeave={() => setHoverDay(null)}>
                <defs><linearGradient id="insg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dcf75a" stopOpacity=".8" /><stop offset="1" stopColor="#dcf75a" stopOpacity="0" /></linearGradient></defs>
                {[0.33, 0.66, 1].map((g) => <line key={g} className="grid-l" x1="0" x2={W} y1={H * g} y2={H * g} />)}
                {budget > 0 && <line className="bud" x1="0" x2={W} y1={y(budget)} y2={y(budget)} />}
                <line className="pace" x1={x(day - 1)} y1={y(spent)} x2={W} y2={y(projected)} />
                <path className="ar" d={area} />
                <path className="ln" pathLength={1} d={line} />
                {hoverDay !== null && <line className="cross" x1={x(idx)} x2={x(idx)} y1="0" y2={H} />}
                <circle className="ping" cx={x(idx)} cy={y(cum[idx] ?? 0)} r="4.5" />
                <circle className="pt" cx={x(idx)} cy={y(cum[idx] ?? 0)} r="4.5" />
                {[0, Math.floor((dim - 1) / 2), dim - 1].map((d) => <text key={d} className="ax" x={x(d)} y={H + 15} textAnchor={d === 0 ? "start" : d === dim - 1 ? "end" : "middle"}>{d + 1}</text>)}
              </svg>
              <div className="key"><span><i className="k-ln" />Spent</span><span><i className="k-bud" />Budget</span><span><i className="k-pace" />Pace</span></div>
            </div>

            <div className="ins-card">
              <h5>Where it goes</h5>
              <div className="donut-row">
                <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Spending by category">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--h0)" strokeWidth="14" />
                  {slices.map((s) => (
                    <circle key={s.c} cx="50" cy="50" r="40" fill="none" stroke={COLORS[s.i]} className="slice"
                      strokeWidth={active === s.c ? 18 : 14} opacity={active && active !== s.c ? 0.4 : 1}
                      strokeDasharray={`${Math.max(s.len - 1.5, 0)} ${C}`} strokeDashoffset={-s.off} transform="rotate(-90 50 50)" style={{ animationDelay: s.i * 120 + "ms" }} />
                  ))}
                  <text x="50" y="49" textAnchor="middle" className="d-top">{rupees(spent)}</text>
                  <text x="50" y="59" textAnchor="middle" className="d-sub">this month</text>
                </svg>
                <div className="legend">
                  {slices.map((s) => (
                    <div key={s.c} onPointerEnter={() => setActive(s.c)} onPointerLeave={() => setActive("")}>
                      <i style={{ background: COLORS[s.i] }} />{icon(s.c)} {cap(s.c)}<span>{Math.round((s.v / spent) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ins-card">
              <h5>Last 6 months</h5>
              <div className="bars">
                {months.map((m, i) => (
                  <div key={i} className={i === 5 ? "bcol now" : "bcol"}>
                    <div className="bwrap"><i style={{ height: Math.max(4, (m.total / maxM) * 100) + "%", animationDelay: i * 90 + "ms" }} /></div>
                    <span>{m.label}<br />{m.total ? "₹" + short(m.total) : "–"}</span>
                  </div>
                ))}
              </div>
            </div>

            {biggest && (
              <div className="ins-card big-one">
                <span className="tile pink">{icon(biggest.category)}</span>
                <div><span className="mut">Biggest expense this month</span><b>{cap(biggest.description || biggest.category)}</b></div>
                <b className="amt">{inr(biggest.amount)}</b>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
  return mounted ? createPortal(panel, document.body) : null;
}
