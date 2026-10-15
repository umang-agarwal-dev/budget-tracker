"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import Shell from "@/components/Shell";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { InstallCard } from "@/components/PWA";
import { Exp } from "@/components/forms";
import { fileToAvatar, getAvatar, notify, setAvatar } from "@/lib/profile";

type Me = { name: string; email: string };

export default function Settings() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [msg, setMsg] = useState("");
  const [del, setDel] = useState(false);
  const [sure, setSure] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api<Me>("/auth/me").then((u) => { setMe(u); setName(u.name); }).catch(() => {});
    setPhoto(getAvatar());
    setDark(document.documentElement.dataset.theme === "dark");
  }, [router]);

  const theme = (t: "light" | "dark") => { document.documentElement.dataset.theme = t; localStorage.setItem("theme", t); setDark(t === "dark"); };
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    try { const u = await api<Me>("/auth/me", { method: "PATCH", json: { name } }); setMe(u); setName(u.name); notify(); flash("Name updated"); }
    catch (x) { flash((x as Error).message); }
  }
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { const url = await fileToAvatar(f); setAvatar(url); setPhoto(url); flash("Photo updated"); }
    catch (x) { flash((x as Error).message); }
  }
  async function exportCsv() {
    try {
      const rows = await api<Exp[]>("/expenses");
      const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const csv = ["Date,Category,Note,Amount", ...rows.map((e) => [e.date, q(e.category), q(e.description ?? ""), e.amount].join(","))].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "pocket-expenses.csv";
      a.click();
      flash(`Exported ${rows.length} expenses`);
    } catch (x) { flash((x as Error).message); }
  }
  async function deleteAccount() {
    try {
      await api("/auth/me", { method: "DELETE" });
      localStorage.removeItem("token");
      setAvatar(null);
      router.replace("/");
    } catch (x) { flash((x as Error).message); setDel(false); }
  }

  return (
    <Shell>
      <h2 className="h">Your profile</h2>
      <div className="set">
        <div className="card prof">
          <button className="prof-pic" onClick={() => file.current?.click()} aria-label="Change photo">
            {photo ? <img src={photo} alt="" /> : <span>{(me?.name || "P")[0].toUpperCase()}</span>}
            <em><Icon n="edit" size={16} /></em>
          </button>
          <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
          <div className="prof-r">
            <form onSubmit={saveName}>
              <label className="lbl-s" htmlFor="nm">Name</label>
              <div className="prof-row"><input id="nm" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /><button className="btn" disabled={!name.trim() || name.trim() === me?.name}>Save</button></div>
            </form>
            <span className="mut">{me?.email}</span>
            {photo && <button className="link" style={{ margin: 0, alignSelf: "flex-start" }} onClick={() => { setAvatar(null); setPhoto(null); }}>Remove photo</button>}
            <span className="mut">Your photo is saved on this device only.</span>
          </div>
        </div>
        <InstallCard />
        <div className="card">
          <h4>Appearance</h4>
          <div className="seg">
            <button className={!dark ? "on" : ""} onClick={() => theme("light")}><Icon n="sun" size={16} /> Light</button>
            <button className={dark ? "on" : ""} onClick={() => theme("dark")}><Icon n="moon" size={16} /> Dark</button>
          </div>
        </div>
        <div className="card">
          <h4>Your data</h4>
          <div className="acts"><button className="btn ghost" onClick={exportCsv}>Export expenses (CSV)</button></div>
          <p className="mut"><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Use</Link></p>
        </div>
        <div className="card">
          <div className="acts" style={{ margin: 0 }}>
            <button className="btn" onClick={() => { localStorage.removeItem("token"); router.replace("/login"); }}><Icon n="out" size={16} /> Log out</button>
            <button className="btn ghost" onClick={() => setDel(true)}><Icon n="trash" size={16} /> Delete account</button>
          </div>
        </div>
      </div>
      {del && (
        <Modal title="Delete your account?" onClose={() => { setDel(false); setSure(""); }}>
          <p className="mut">This permanently removes your account, budgets, expenses and goals, and the groups you created (for everyone in them). It can&apos;t be undone.</p>
          <input placeholder="Type DELETE to confirm" value={sure} onChange={(e) => setSure(e.target.value)} />
          <button className="btn big danger" disabled={sure !== "DELETE"} onClick={deleteAccount}>Delete everything</button>
        </Modal>
      )}
      {msg && <div key={msg} className="pill" style={{ background: "var(--lime)", color: "#111" }}>{msg}</div>}
    </Shell>
  );
}
