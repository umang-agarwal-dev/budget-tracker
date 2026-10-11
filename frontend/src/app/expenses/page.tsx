"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import ExpenseRow from "@/components/ExpenseRow";
import { ExpenseForm, Exp, cap } from "@/components/forms";

export default function Expenses() {
  const router = useRouter();
  const [exps, setExps] = useState<Exp[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(0);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setExps(await api<Exp[]>("/expenses")); } catch (x) { setErr((x as Error).message); }
  }, []);
  useEffect(() => { if (!getToken()) router.replace("/login"); else load(); }, [load, router]);

  function remove(id: number) {
    setLeaving(id);
    setTimeout(async () => {
      try { await api(`/expenses/${id}`, { method: "DELETE" }); await load(); } catch (x) { setErr((x as Error).message); }
      setLeaving(0);
    }, 280);
  }
  const cats = ["all", ...Array.from(new Set((exps ?? []).map((e) => e.category)))];
  const shown = (exps ?? []).filter((e) => (filter === "all" || e.category === filter) && (e.description ?? e.category).toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <div className="top"><h2 className="h" style={{ margin: 0, marginRight: "auto" }}>Expenses</h2><button className="btn" onClick={() => setOpen(true)}>+ Add</button></div>
      <input className="search" placeholder="Search expenses…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips" style={{ margin: "12px 0" }}>
        {cats.map((c) => <button key={c} className={c === filter ? "chip on" : "chip"} onClick={() => setFilter(c)}>{cap(c)}</button>)}
      </div>
      {err && <p className="err">{err}</p>}
      {!exps && !err && <p className="mut">Loading…</p>}
      {exps && shown.length === 0 && <p className="mut">Nothing here yet.</p>}
      <div className="card">{shown.map((e) => <ExpenseRow key={e.id} e={e} leaving={e.id === leaving} onDelete={remove} />)}</div>
      {open && <Modal title="Add expense" onClose={() => setOpen(false)}><ExpenseForm onDone={() => { setOpen(false); load(); }} /></Modal>}
    </Shell>
  );
}
