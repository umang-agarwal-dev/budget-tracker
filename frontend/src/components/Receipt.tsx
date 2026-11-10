"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, inr } from "@/lib/api";
import Icon from "./Icon";

type Item = { id: number; amount: string; description: string; date: string; paid_by_name: string; split_all?: boolean; participants?: { id: number; name: string }[] };
type Settlement = { total_spent: string; message: string; balances: { member_id: number; name: string; paid?: string | null; owed?: string | null }[]; payments: { from_name: string; to_name: string; amount: string }[] };
export type ReceiptGroup = { id: number; name: string; settled_at: string | null; members: { id: number; name: string }[] };

// A settled trip, shown like a printed receipt.
export default function Receipt({ group, onClose }: { group: ReceiptGroup; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [s, setS] = useState<Settlement | null>(null);
  const [copied, setCopied] = useState(false);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    setMounted(true);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close.current(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    Promise.all([api<Item[]>(`/groups/${group.id}/expenses`), api<Settlement>(`/groups/${group.id}/settlement`)])
      .then(([i, st]) => { setItems([...i].reverse()); setS(st); })
      .catch(() => setItems([]));
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [group.id]);

  if (!mounted) return null;
  const total = Number(s?.total_spent ?? 0);
  const each = group.members.length ? Math.round((total / group.members.length) * 100) / 100 : 0;
  const date = group.settled_at ? new Date(group.settled_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

  return createPortal(
    <div className="ov" onClick={onClose}>
      <div className="receipt" onClick={(e) => e.stopPropagation()}>
        <button className="receipt-x" onClick={onClose} aria-label="Close receipt"><Icon n="x" size={16} /></button>
        <p className="rc-brand">POCKET · TRIP RECEIPT</p>
        <h3>{group.name}</h3>
        <p className="rc-meta">Settled {date} · No. {String(group.id).padStart(5, "0")}</p>
        <hr />
        {!items && <p className="rc-meta">Printing…</p>}
        {items?.map((e, i) => (
          <div key={e.id} className="rc-row" style={{ animationDelay: 500 + i * 70 + "ms" }}>
            <span>{e.description}<small>Paid by {e.paid_by_name} · Split: {e.split_all === false && e.participants?.length ? e.participants.map((p) => p.name).join(", ") : "everyone"}</small></span><b>{inr(e.amount)}</b>
          </div>
        ))}
        <hr />
        <div className="rc-row total" style={{ animationDelay: 700 + (items?.length ?? 0) * 70 + "ms" }}><span>TOTAL</span><b>{inr(total)}</b></div>
        {items?.every((e) => e.split_all !== false) && <div className="rc-row" style={{ animationDelay: 780 + (items?.length ?? 0) * 70 + "ms" }}><span>Each share ({group.members.length} people)</span><b>{inr(each)}</b></div>}
        {s?.balances?.[0]?.paid != null && (
          <>
            <hr />
            <p className="rc-h">PER PERSON</p>
            {s.balances.map((b, i) => <div key={b.member_id} className="rc-row" style={{ animationDelay: 850 + i * 60 + "ms" }}><span>{b.name}<small>paid {inr(b.paid ?? 0)}</small></span><b>share {inr(b.owed ?? 0)}</b></div>)}
          </>
        )}
        {s && s.payments.length > 0 && (
          <>
            <hr />
            <p className="rc-h">WHO PAYS WHOM</p>
            {s.payments.map((p, i) => <div key={i} className="rc-row" style={{ animationDelay: 900 + i * 70 + "ms" }}><span>{p.from_name} → {p.to_name}</span><b>{inr(p.amount)}</b></div>)}
          </>
        )}
        <div className="rc-foot"><span className="rc-stamp">SETTLED</span><div className="rc-bar" /></div>
        {s && (
          <div className="rc-acts">
            <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(s.message)}`}>WhatsApp</a>
            <button className="btn ghost" onClick={async () => { await navigator.clipboard.writeText(s.message); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy"}</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
