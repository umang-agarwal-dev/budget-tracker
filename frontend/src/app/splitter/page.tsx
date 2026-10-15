"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getToken, inr } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import Receipt from "@/components/Receipt";

type Group = {
  id: number; name: string; invite_link: string; members: { id: number; name: string }[];
  settled: boolean; settled_at: string | null; total_spent: string | null;
};
const when = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function Splitter() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(0);
  const [receipt, setReceipt] = useState<number | null>(null);
  const [fresh, setFresh] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    const q = new URLSearchParams(location.search);
    if (q.get("tab") === "history") setTab("history");
    const o = Number(q.get("open"));
    if (o) { setReceipt(o); setFresh(o); }
    if (q.has("new")) setOpen(true);
    api<Group[]>("/groups").then(setGroups).catch((x) => setErr(x.message));
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try { router.push(`/g/${(await api<Group>("/groups", { method: "POST", json: { name } })).id}`); }
    catch (x) { setErr((x as Error).message); }
  }
  async function copy(g: Group) {
    await navigator.clipboard.writeText(g.invite_link);
    setCopied(g.id);
    setTimeout(() => setCopied(0), 1800);
  }
  const active = (groups ?? []).filter((g) => !g.settled);
  const history = (groups ?? []).filter((g) => g.settled);
  const rg = groups?.find((g) => g.id === receipt);

  return (
    <Shell>
      <div className="top"><h2 className="h" style={{ margin: 0, marginRight: "auto" }}>Splitter</h2><button className="btn" onClick={() => setOpen(true)}>+ New group</button></div>
      <div className={`seg2 ${tab}`}>
        <i />
        <button onClick={() => setTab("active")}>Active <em>{active.length}</em></button>
        <button onClick={() => setTab("history")}><Icon n="history" size={15} /> History <em>{history.length}</em></button>
      </div>
      {err && <p className="err">{err}</p>}
      {!groups && !err && <p className="mut" style={{ marginTop: 16 }}>Loading your groups…</p>}

      {tab === "active" && (
        <>
          {groups && active.length === 0 && <p className="mut" style={{ marginTop: 16 }}>No active groups. Create one, share the link, and let friends add what they paid.</p>}
          <div className="grid two" key="active" style={{ marginTop: 16 }}>
            {active.map((g, i) => (
              <div key={g.id} className="card" style={{ animationDelay: i * 80 + "ms" }}>
                <h4>{g.name}</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                  <span>{g.members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} />)}</span>
                  <span className="mut" style={{ marginLeft: 8 }}>{g.members.length} member{g.members.length === 1 ? "" : "s"}</span>
                </div>
                <div className="acts">
                  <button className="btn ghost" onClick={() => copy(g)}>{copied === g.id ? "Link copied ✓" : "Copy invite link"}</button>
                  <Link className="btn" href={`/g/${g.id}`}>Open</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <>
          {groups && history.length === 0 && <p className="mut" style={{ marginTop: 16 }}>Settled trips show up here as receipts you can open any time.</p>}
          <div className="grid two" key="history" style={{ marginTop: 16 }}>
            {history.map((g, i) => (
              <button key={g.id} className={g.id === fresh ? "hist fresh" : "hist"} style={{ animationDelay: i * 90 + "ms" }} onClick={() => setReceipt(g.id)}>
                <span className="hist-ic"><Icon n="receipt" /></span>
                <div><b>{g.name}</b><span className="mut">Settled {when(g.settled_at)} · {g.members.length} people</span></div>
                <div className="hist-amt"><b>{inr(g.total_spent ?? 0)}</b><span className="stamp-mini">SETTLED</span></div>
              </button>
            ))}
          </div>
        </>
      )}

      {rg && <Receipt group={rg} onClose={() => setReceipt(null)} />}
      {open && (
        <Modal title="New group" onClose={() => setOpen(false)}>
          <form onSubmit={create}>
            <input autoFocus placeholder="Group name, e.g. Goa trip" value={name} onChange={(e) => setName(e.target.value)} required />
            <button className="btn big">Create group</button>
          </form>
        </Modal>
      )}
    </Shell>
  );
}
