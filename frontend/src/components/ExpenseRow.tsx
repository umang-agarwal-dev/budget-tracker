"use client";
import { inr } from "@/lib/api";
import { Exp, cap, icon } from "./forms";
import Icon from "./Icon";

export default function ExpenseRow({ e, isNew, leaving, onDelete }: { e: Exp; isNew?: boolean; leaving?: boolean; onDelete: (id: number) => void }) {
  return (
    <div className={`row${isNew ? " new" : ""}${leaving ? " out" : ""}`}>
      <span className="ic">{icon(e.category)}</span>
      <div>
        <b>{cap(e.description || e.category)}</b>
        <div className="mut">{cap(e.category)} · {new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
      </div>
      <b>−{inr(e.amount)}</b>
      <button className="del" aria-label="Delete expense" onClick={() => onDelete(e.id)}><Icon n="trash" size={16} /></button>
    </div>
  );
}
