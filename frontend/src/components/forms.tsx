"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export type Exp = { id: number; amount: string; category: string; description: string | null; date: string };
export const CATS = ["food", "transport", "shopping", "bills", "fun", "other"];
const ICON: Record<string, string> = { food: "🍔", transport: "🚌", shopping: "🛍️", bills: "⚡", fun: "🎬", other: "💸" };
export const icon = (c: string) => ICON[c] ?? "💸";
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ExpenseForm({ onDone }: { onDone: (e: Exp) => void }) {
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("food");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setErr("");
    try {
      onDone(await api<Exp>("/expenses", { method: "POST", json: { amount: Number(amount), category: cat, description: note.trim() || null } }));
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="amt-in">
        <span>₹</span>
        <input autoFocus type="number" min="0.01" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <div className="lbl-s">Category</div>
      <div className="cat-grid">
        {CATS.map((c) => (
          <button type="button" key={c} className={c === cat ? "cat on" : "cat"} onClick={() => setCat(c)}>
            <span>{icon(c)}</span>{cap(c)}
          </button>
        ))}
      </div>
      <input placeholder="Add a note, e.g. Zomato (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <button className="btn big" disabled={busy}>{busy ? "Adding…" : "Add expense"}</button>
    </form>
  );
}

export function BudgetForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    try {
      await api("/budget", { method: "PUT", json: { amount: Number(amount) } });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="amt-in">
        <span>₹</span>
        <input autoFocus type="number" min="1" step="0.01" placeholder="Budget for this month" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      {err && <p className="err">{err}</p>}
      <button className="btn big">Save budget</button>
    </form>
  );
}
