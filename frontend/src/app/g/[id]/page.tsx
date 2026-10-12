"use client";
import Brand from "@/components/Brand";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, getToken, inr } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import Confetti from "@/components/Confetti";

type Guest = { member_token: string; member_id?: number; name: string; group_name: string };
type GExp = { id: number; amount: string; description: string; date: string; paid_by_id: number; paid_by_name: string };
type Group = { id: number; name: string; invite_link: string; members: { id: number; name: string }[] };
type Settlement = {
  group_name: string; total_spent: string; message: string;
  balances: { member_id: number; name: string; balance: string }[];
  payments: { from_name: string; to_name: string; amount: string }[];
};

// Admin = you, logged in, on the group you made. Guest = a friend with the member pass saved when they joined.
// Each browser tab remembers its own role, so opening an invite link in a new tab gives you a fresh guest.
export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [ready, setReady] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [exps, setExps] = useState<GExp[]>([]);
  const [settle, setSettle] = useState<Settlement | null>(null);
  const [tab, setTab] = useState<"exp" | "set">("exp");
  const [modal, setModal] = useState<"add" | "settle" | "unlock" | null>(null);
  const [form, setForm] = useState({ amount: "", description: "" });
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [boom, setBoom] = useState(false);

  const load = useCallback(async (g: Guest | null) => {
    const o = g ? { member: g.member_token } : {};
    try {
      setExps(await api<GExp[]>(`/groups/${id}/expenses`, o));
      try { setSettle(await api<Settlement>(`/groups/${id}/settlement`, o)); }
      catch (x) { if ((x as { status?: number }).status !== 404) throw x; setSettle(null); }
    } catch (x) { setErr((x as Error).message); }
  }, [id]);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("group:" + id);
      let g: Guest | null = raw ? (JSON.parse(raw) as Guest) : null;
      const guestTab = sessionStorage.getItem("mode:" + id) === "guest" && !!g;
      if (!guestTab && getToken()) {
        try { setGroup(await api<Group>(`/groups/${id}`)); g = null; } catch { /* not the admin of this group */ }
      }
      if (!g && !getToken()) { router.replace("/login"); return; }
      setGuest(g);
      setReady(true);
      load(g);
    })();
  }, [id, load, router]);

  // Pull in what other people added every few seconds, and when you return to the tab.
  useEffect(() => {
    if (!ready) return;
    const tick = () => { if (document.visibilityState === "visible") load(guest); };
    const t = setInterval(tick, 4000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(t); window.removeEventListener("focus", tick); };
  }, [ready, guest, load]);

  const as = guest ? { member: guest.member_token } : {};
  const myId = guest ? (guest.member_id ?? exps.find((e) => e.paid_by_name === guest.name)?.paid_by_id) : group?.members[0]?.id;
  const isAdmin = !guest && !!group;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const made = await api<GExp>(`/groups/${id}/expenses`, { method: "POST", json: { amount: Number(form.amount), description: form.description }, ...as });
      setExps((l) => [made, ...l]);
      setForm({ amount: "", description: "" });
      load(guest);
    } catch (x) { setErr((x as Error).message); }
    setModal(null);
  }
  async function del(eid: number) {
    try { await api(`/groups/${id}/expenses/${eid}`, { method: "DELETE", ...as }); load(guest); }
    catch (x) { setErr((x as Error).message); }
  }
  async function doSettle() {
    setBusy(true);
    try {
      setSettle(await api<Settlement>(`/groups/${id}/settle`, { method: "POST" }));
      setTab("set");
      setBoom(true);
      setTimeout(() => setBoom(false), 3200);
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
    setModal(null);
  }
  async function doUnlock() {
    setBusy(true);
    try { await api(`/groups/${id}/unlock`, { method: "POST" }); setSettle(null); setTab("exp"); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
    setModal(null);
  }
  async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1800);
  }

  if (!ready) return <div className="splash"><p className="mut">Loading…</p></div>;
  const title = group?.name ?? guest?.group_name ?? "Group";
  const total = exps.reduce((s, e) => s + Number(e.amount), 0);

  const body = (
    <>
      {guest && <div className="gtop"><Brand /><span className="badge soft">Joined as {guest.name}</span></div>}
      {isAdmin && <Link href="/splitter" className="back">← Splitter</Link>}
      <div className="top">
        <h2 className="h" style={{ margin: 0, marginRight: "auto" }}>{title}</h2>
        {settle ? (
          <>
            <span className="badge"><Icon n="lock" size={14} /> Settled &amp; locked</span>
            {isAdmin && <button className="btn ghost" onClick={() => setModal("unlock")}><Icon n="unlock" size={16} /> Unlock</button>}
          </>
        ) : isAdmin && exps.length > 0 && <button className="btn spark" onClick={() => setModal("settle")}><Icon n="lock" size={16} /> Settle &amp; share</button>}
      </div>
      {group && (
        <div className="copy">
          <span>{group.members.map((m) => <Avatar key={m.id} name={m.name} />)}</span>
          <input readOnly value={group.invite_link} onFocus={(e) => e.target.select()} />
          <button className="btn ghost" onClick={() => copy(group.invite_link, "link")}>{copied === "link" ? "Copied ✓" : "Copy invite"}</button>
        </div>
      )}
      {guest && !settle && <p className="mut">Add what you paid. The admin will settle up when everyone is done.</p>}
      {!guest && !group && !err && <p className="err">You are not in this group. Open its invite link to join.</p>}
      {err && <p className="err">{err}</p>}

      <div className="tabs">
        <button className={tab === "exp" ? "on" : ""} onClick={() => setTab("exp")}>Expenses · {inr(total)}</button>
        <button className={tab === "set" ? "on" : ""} onClick={() => setTab("set")}>Settlement</button>
      </div>

      {tab === "exp" && (
        <div className="tl">
          {exps.length === 0 && <p className="mut">No expenses yet. Tap + and add what you paid.</p>}
          {exps.map((e, i) => (
            <div key={e.id} className={i === 0 ? "tl-i now" : "tl-i"} style={{ animationDelay: i * 60 + "ms" }}>
              <span className="dot" />
              <div className="tl-c">
                <b>{e.description}</b>
                <span className="amt">{inr(e.amount)}</span>
                {!settle && e.paid_by_id === myId
                  ? <button className="del" aria-label="Delete expense" onClick={() => del(e.id)}><Icon n="trash" size={16} /></button>
                  : <span />}
                <span className="mut">Paid by {e.paid_by_name} · {new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · split equally</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "set" && (settle ? (
        <div>
          <p className="mut" style={{ marginBottom: 12 }}>Total spent {inr(settle.total_spent)}</p>
          {settle.payments.length === 0 && <p>Everyone is already settled up. 🎉</p>}
          {settle.payments.map((p, i) => (
            <div key={i} className="pay" style={{ animationDelay: i * 90 + "ms" }}>
              <span><b>{p.from_name}</b> pays <b>{p.to_name}</b></span><span className="amt">{inr(p.amount)}</span>
            </div>
          ))}
          <div className="acts">
            <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(settle.message)}`}>Share on WhatsApp</a>
            <button className="btn ghost" onClick={() => copy(settle.message, "sum")}>{copied === "sum" ? "Copied ✓" : "Copy summary"}</button>
          </div>
          <h4 style={{ margin: "18px 0 8px" }}>Balances</h4>
          {settle.balances.map((b) => (
            <div key={b.member_id} className="row">
              <Avatar name={b.name} /><div><b>{b.name}</b></div>
              <b className={Number(b.balance) < 0 ? "up" : "down"}>{Number(b.balance) < 0 ? "owes " : "gets "}{inr(Math.abs(Number(b.balance)))}</b>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="mut">Not settled yet.</p>
          {isAdmin && exps.length > 0 && <div className="acts"><button className="btn spark" onClick={() => setModal("settle")}><Icon n="lock" size={16} /> Settle &amp; share</button></div>}
        </div>
      ))}

      {!settle && (guest || group) && <button className="fab" aria-label="Add expense" onClick={() => setModal("add")}>+</button>}
      {boom && <Confetti />}

      {modal === "add" && (
        <Modal title="Add expense" onClose={() => setModal(null)}>
          <form onSubmit={add}>
            <label className="amt-in"><span>₹</span><input autoFocus type="number" min="0.01" step="0.01" placeholder="Amount you paid" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
            <input placeholder="What was it for? e.g. Hotel" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <button className="btn big">Add expense</button>
          </form>
        </Modal>
      )}
      {modal === "settle" && (
        <Modal title="Settle & lock this group?" onClose={() => setModal(null)}>
          <p className="mut">We will work out who pays whom and lock the group (no new expenses or members). You can unlock it later if something was missed.</p>
          <div className="acts"><button className="btn big" disabled={busy} onClick={doSettle}>{busy ? "Settling…" : "Yes, settle & lock"}</button><button className="btn ghost" onClick={() => setModal(null)}>Cancel</button></div>
        </Modal>
      )}
      {modal === "unlock" && (
        <Modal title="Unlock this group?" onClose={() => setModal(null)}>
          <p className="mut">The current settlement will be removed and everyone can add or delete expenses again. You can settle again whenever you are ready.</p>
          <div className="acts"><button className="btn big" disabled={busy} onClick={doUnlock}>{busy ? "Unlocking…" : "Yes, unlock"}</button><button className="btn ghost" onClick={() => setModal(null)}>Cancel</button></div>
        </Modal>
      )}
    </>
  );
  return guest ? <main className="guest">{body}</main> : <Shell>{body}</Shell>;
}
