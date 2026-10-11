"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, inr } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";

type Goal = { id: number; purpose: string; target_amount: string; target_date: string; saved: string; remaining: string; months_left: number; monthly_needed: string };
type Advice = { advice: string; remaining_today: number; source: string };
type Tip = { state: "think" | "done" | "err"; text: string; left?: number; source?: string };

function GoalForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ purpose: "", target_amount: "", target_date: "" });
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try { await api("/savings/goals", { method: "POST", json: { ...f, target_amount: Number(f.target_amount) } }); onDone(); }
    catch (x) { setErr((x as Error).message); }
  }
  return (
    <form onSubmit={submit}>
      <input autoFocus placeholder="What are you saving for? e.g. Goa trip" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} required />
      <label className="amt-in"><span>₹</span><input type="number" min="1" placeholder="Target amount" value={f.target_amount} onChange={(e) => setF({ ...f, target_amount: e.target.value })} required /></label>
      <div className="lbl-s">Target date</div>
      <input type="date" value={f.target_date} onChange={(e) => setF({ ...f, target_date: e.target.value })} required />
      {err && <p className="err">{err}</p>}
      <button className="btn big">Create goal</button>
    </form>
  );
}

function MoneyForm({ id, onDone }: { id: number; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try { await api(`/savings/goals/${id}/logs`, { method: "POST", json: { amount: Number(amount) } }); onDone(); }
    catch (x) { setErr((x as Error).message); }
  }
  return (
    <form onSubmit={submit}>
      <label className="amt-in"><span>₹</span><input autoFocus type="number" min="1" step="0.01" placeholder="Amount you saved" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn big">Add to goal</button>
    </form>
  );
}

// Reveals the AI text letter by letter, so it feels like it is being written for you.
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [text]);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(n + 2), 16);
    return () => clearTimeout(t);
  }, [n, text]);
  return <p className="ai-text">{text.slice(0, n)}{n < text.length && <span className="caret" />}</p>;
}

export default function Savings() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [modal, setModal] = useState<"new" | number | null>(null);
  const [tips, setTips] = useState<Record<number, Tip>>({});
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setGoals(await api<Goal[]>("/savings/goals")); } catch (x) { setErr((x as Error).message); }
  }, []);
  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else { load(); if (location.search.includes("new")) setModal("new"); }
  }, [load, router]);

  async function ask(id: number) {
    setTips((t) => ({ ...t, [id]: { state: "think", text: "" } }));
    try {
      const a = await api<Advice>(`/savings/goals/${id}/advice`);
      setTips((t) => ({ ...t, [id]: { state: "done", text: a.advice, left: a.remaining_today, source: a.source } }));
    } catch (x) {
      setTips((t) => ({ ...t, [id]: { state: "err", text: (x as Error).message } }));
    }
  }
  const done = () => { setModal(null); load(); };

  return (
    <Shell>
      <div className="top"><h2 className="h" style={{ margin: 0, marginRight: "auto" }}>Savings goals</h2><button className="btn" onClick={() => setModal("new")}>+ New goal</button></div>
      {err && <p className="err">{err}</p>}
      {!goals && !err && <p className="mut">Loading your goals…</p>}
      {goals?.length === 0 && <p className="mut">No goals yet. Create one, like “Goa trip”, and track it here.</p>}
      <div className="grid two">
        {goals?.map((g, i) => {
          const pct = Math.min(100, (Number(g.saved) / Number(g.target_amount)) * 100);
          const t = tips[g.id];
          return (
            <div key={g.id} className="card" style={{ animationDelay: i * 80 + "ms" }}>
              <h4>{g.purpose}</h4>
              <p className="mut">Target {inr(g.target_amount)} by {new Date(g.target_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              <div className="bar" style={{ marginTop: 12 }}><b style={{ width: pct + "%" }} /></div>
              <p><b>{inr(g.saved)}</b> saved · {Math.round(pct)}%</p>
              <p className="mut">Save {inr(g.monthly_needed)} a month for {g.months_left} more month{g.months_left === 1 ? "" : "s"}</p>
              <div className="acts">
                <button className="btn ghost" onClick={() => setModal(g.id)}>Add money</button>
                <button className="btn spark" disabled={t?.state === "think"} onClick={() => ask(g.id)}><Icon n="spark" size={16} /> Ask AI</button>
              </div>
              {t && (
                <div className={`ai ${t.state}`}>
                  <div className="ai-head">
                    <span className="ai-ic"><Icon n="spark" size={16} /></span><b>AI Suggestion</b>
                    {t.left !== undefined && <em>{t.left} left today</em>}
                  </div>
                  {t.state === "think" ? <div className="ai-think"><i /><i /><i /> Analyzing your spending…</div> : t.state === "done" ? <Typed text={t.text} /> : <p className="ai-text">{t.text}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal === "new" && <Modal title="New savings goal" onClose={() => setModal(null)}><GoalForm onDone={done} /></Modal>}
      {typeof modal === "number" && <Modal title="Add money to goal" onClose={() => setModal(null)}><MoneyForm id={modal} onDone={done} /></Modal>}
    </Shell>
  );
}
