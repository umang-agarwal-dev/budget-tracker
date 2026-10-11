"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";

type Group = { id: number; name: string; invite_link: string; members: { id: number; name: string }[] };

export default function Splitter() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api<Group[]>("/groups").then(setGroups).catch((x) => setErr(x.message));
    if (location.search.includes("new")) setOpen(true);
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

  return (
    <Shell>
      <div className="top"><h2 className="h" style={{ margin: 0, marginRight: "auto" }}>Splitter</h2><button className="btn" onClick={() => setOpen(true)}>+ New group</button></div>
      {err && <p className="err">{err}</p>}
      {!groups && !err && <p className="mut">Loading your groups…</p>}
      {groups?.length === 0 && <p className="mut">No groups yet. Create one, share the link, and let friends add what they paid.</p>}
      <div className="grid two">
        {groups?.map((g, i) => (
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
