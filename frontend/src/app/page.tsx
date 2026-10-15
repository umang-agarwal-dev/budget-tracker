"use client";
import Brand from "@/components/Brand";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, inr } from "@/lib/api";
import Heatmap from "@/components/Heatmap";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import Count from "@/components/Count";
import Insights from "@/components/Insights";
import Landing from "@/components/Landing";
import PaceCard from "@/components/PaceCard";
import ExpenseRow from "@/components/ExpenseRow";
import { BudgetForm, ExpenseForm, Exp } from "@/components/forms";

type Dash = { budget: string; spent: string; amount_left: string; days_left: number; overspent: boolean };

// Counts the big number to its new value, so you see the budget change after every expense.
function useCountUp(target: number) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      from.current = a + (target - a) * (1 - Math.pow(1 - p, 3));
      setV(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function Dashboard() {
  const router = useRouter();
  const [dash, setDash] = useState<Dash | null>(null);
  const [noBudget, setNoBudget] = useState(false);
  const [exps, setExps] = useState<Exp[]>([]);
  const [saved, setSaved] = useState(0);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<"exp" | "budget" | null>(null);
  const [pill, setPill] = useState("");
  const [newId, setNewId] = useState(0);
  const [leaving, setLeaving] = useState(0);
  const [slow, setSlow] = useState(false);
  const [panel, setPanel] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, g] = await Promise.all([api<Exp[]>("/expenses"), api<{ saved: string }[]>("/savings/goals")]);
      setExps(e);
      setSaved(g.reduce((s, x) => s + Number(x.saved), 0));
      try {
        setDash(await api<Dash>("/dashboard"));
        setNoBudget(false);
      } catch (x) {
        if ((x as { status?: number }).status !== 404) throw x;
        setNoBudget(true);
      }
      setReady(true);
    } catch (x) {
      setErr((x as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [load, router]);

  // Refresh when you come back to the tab, so changes made elsewhere show up without a reload.
  useEffect(() => {
    const f = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", f);
    document.addEventListener("visibilitychange", f);
    return () => { window.removeEventListener("focus", f); document.removeEventListener("visibilitychange", f); };
  }, [load]);

  const left = useCountUp(dash ? Number(dash.amount_left) : 0);
  const flash = (t: string) => { setPill(t); setTimeout(() => setPill(""), 2600); };

  async function added(e: Exp) {
    setModal(null);
    flash("−" + inr(e.amount));
    setNewId(e.id);
    setTimeout(() => setNewId(0), 2000);
    await load();
  }
  function remove(id: number) {
    setLeaving(id);
    setTimeout(async () => {
      try { await api(`/expenses/${id}`, { method: "DELETE" }); await load(); flash("Expense deleted"); }
      catch (x) { flash((x as Error).message); }
      setLeaving(0);
    }, 280);
  }

  if (err) return <div className="splash"><p className="err">{err}</p><button className="btn" onClick={() => location.reload()}>Try again</button></div>;
  if (!ready) return (
    <div className="splash">
      <Brand big />
      <div className="sbar"><b /></div>
      <p>{slow ? "Waking up the server, this can take up to a minute…" : "Loading your financial world…"}</p>
    </div>
  );

  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const spent = dash ? Number(dash.spent) : 0;
  const budget = dash ? Number(dash.budget) : 0;
  const used = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const pace = (now.getDate() / dim) * 100;
  const mood = dash?.overspent ? ["Over budget!", "bad"] : used > pace + 10 ? ["Spending fast", "warn"] : ["You're on track!", ""];
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pk = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const lastTotal = exps.filter((e) => e.date.startsWith(pk)).reduce((s, e) => s + Number(e.amount), 0);
  const change = lastTotal ? Math.round(((spent - lastTotal) / lastTotal) * 100) : null;
  const QA: [string, string, () => void][] = [
    ["plus", "Add expense", () => setModal("exp")],
    ["wallet", "Set budget", () => setModal("budget")],
    ["target", "New goal", () => router.push("/savings?new=1")],
    ["users", "Create group", () => router.push("/splitter?new=1")],
  ];

  return (
    <Shell>
      <div className="top">
        <span className="mut">{now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
        <button className="btn ghost" onClick={() => setPanel(true)}><Icon n="chart" size={16} /> <span className="hide-m">Insights</span></button>
        <button className="btn" onClick={() => setModal("exp")}>+ Add</button>
      </div>

      {noBudget || !dash ? (
        <section className="hero">
          <div className="lbl">Amount left this month</div>
          <div className="big">₹—</div>
          <button className="btn big" onClick={() => setModal("budget")}>Set this month&apos;s budget</button>
        </section>
      ) : (
        <section className="hero">
          <div className="lbl">Amount left this month</div>
          <div key={dash.amount_left} className={left < 0 ? "big neg" : "big"}>
            {left < 0 ? "-" : ""}₹{Math.abs(Math.round(left)).toLocaleString("en-IN")}
          </div>
          <div className={"bar " + mood[1]}><b style={{ width: used + "%" }} /><i className="bar-mark" style={{ left: pace + "%" }} title="Where you should be by today" /></div>
          <p className="mut">{Math.round(used)}% used · {inr(spent)} spent of {inr(budget)} · {dash.days_left} days left</p>
          <PaceCard overspent={dash.overspent} used={used} pace={pace} left={Number(dash.amount_left)} days={dash.days_left} />
        </section>
      )}

      <div className="grid">
        <div className="card stat" style={{ animationDelay: "60ms" }}>
          <span className="tile pink"><Icon n="bag" /></span>
          <div><span className="mut">Total spent</span><b><Count value={spent} fmt={(n) => inr(Math.round(n))} /></b>
            {change !== null && <span className={change > 0 ? "up" : "down"}>{change > 0 ? "↑" : "↓"} {Math.abs(change)}% vs last month</span>}</div>
        </div>
        <div className="card stat" style={{ animationDelay: "120ms" }}>
          <span className="tile violet"><Icon n="wallet" /></span>
          <div><span className="mut">Monthly budget</span><b><Count value={budget} fmt={(n) => inr(Math.round(n))} /></b>
            <button className="chipbtn" onClick={() => setModal("budget")}><Icon n="edit" size={13} /> Edit budget</button></div>
        </div>
        <div className="card stat" style={{ animationDelay: "180ms" }}>
          <span className="tile green"><Icon n="target" /></span>
          <div><span className="mut">Saved for goals</span><b><Count value={saved} fmt={(n) => inr(Math.round(n))} /></b>
            <button className="chipbtn" onClick={() => router.push("/savings")}>View goals <Icon n="up" size={13} /></button></div>
        </div>
      </div>

      <div className="grid trio">
        <div className="card" style={{ animationDelay: "240ms" }}><h4>Expense heatmap</h4><Heatmap exps={exps} /></div>
        <div className="card recent" style={{ animationDelay: "300ms" }}>
          <h4>Recent expenses <button className="link" onClick={() => router.push("/expenses")}>View all</button></h4>
          {exps.length === 0 && <p className="mut">No expenses yet. Add your first one with “+ Add”.</p>}
          {exps.slice(0, 5).map((e) => <ExpenseRow key={e.id} e={e} isNew={e.id === newId} leaving={e.id === leaving} onDelete={remove} />)}
        </div>
        <div className="card dark-card" style={{ animationDelay: "360ms" }}>
          <h4>Quick actions</h4>
          <div className="qa">
            {QA.map(([ic, label, fn]) => (
              <button key={label} className="qa-row" onClick={fn}>
                <span className="qa-ic"><Icon n={ic} size={18} /></span>{label}<Icon n="up" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <Insights open={panel} onClose={() => setPanel(false)} exps={exps} budget={budget} />
      {modal === "exp" && <Modal title="Add expense" onClose={() => setModal(null)}><ExpenseForm onDone={added} /></Modal>}
      {modal === "budget" && <Modal title="Monthly budget" onClose={() => setModal(null)}><BudgetForm onDone={() => { setModal(null); load(); }} /></Modal>}
      {pill && <div key={pill} className="pill">{pill} <b>✓</b></div>}
    </Shell>
  );
}

// Visitors without a login see the landing page; logged-in users see their dashboard.
export default function Page() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => setAuthed(!!getToken()), []);
  if (authed === null) return <div className="splash"><Brand big /></div>;
  return authed ? <Dashboard /> : <Landing />;
}
