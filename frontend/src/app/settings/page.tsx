"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import Shell from "@/components/Shell";
import Icon from "@/components/Icon";
import { Exp } from "@/components/forms";

export default function Settings() {
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [dark, setDark] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api<{ name: string; email: string }>("/auth/me").then(setMe).catch(() => {});
    setDark(document.documentElement.dataset.theme === "dark");
  }, [router]);

  const theme = (t: "light" | "dark") => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setDark(t === "dark");
  };
  async function exportCsv() {
    try {
      const rows = await api<Exp[]>("/expenses");
      const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const csv = ["Date,Category,Note,Amount", ...rows.map((e) => [e.date, q(e.category), q(e.description ?? ""), e.amount].join(","))].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "pocket-expenses.csv";
      a.click();
      setMsg(`Exported ${rows.length} expenses`);
    } catch (x) { setMsg((x as Error).message); }
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <Shell>
      <h2 className="h">Settings</h2>
      <div className="set">
        <div className="card set-card">
          <span className="av big-av">{(me?.name || "P")[0].toUpperCase()}</span>
          <div><b>{me?.name ?? "…"}</b><div className="mut">{me?.email}</div></div>
        </div>
        <div className="card">
          <h4>Appearance</h4>
          <div className="seg">
            <button className={!dark ? "on" : ""} onClick={() => theme("light")}><Icon n="sun" size={16} /> Light</button>
            <button className={dark ? "on" : ""} onClick={() => theme("dark")}><Icon n="moon" size={16} /> Dark</button>
          </div>
        </div>
        <div className="card">
          <h4>Your data</h4>
          <p className="mut">Download every expense you have added as a spreadsheet file.</p>
          <div className="acts"><button className="btn ghost" onClick={exportCsv}>Export expenses (CSV)</button></div>
          {msg && <p className="mut">{msg}</p>}
        </div>
        <div className="card">
          <h4>Session</h4>
          <div className="acts"><button className="btn" onClick={() => { localStorage.removeItem("token"); router.replace("/login"); }}><Icon n="out" size={16} /> Log out</button></div>
        </div>
        <p className="mut" style={{ textAlign: "center" }}>Pocket · your money, in your pocket</p>
      </div>
    </Shell>
  );
}
