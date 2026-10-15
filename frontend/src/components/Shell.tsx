"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Brand from "@/components/Brand";
import { api, getToken } from "@/lib/api";
import { getAvatar } from "@/lib/profile";
import Icon from "./Icon";

const ITEMS = [["/", "Home", "home"], ["/expenses", "Expenses", "list"], ["/savings", "Savings Goals", "target"], ["/splitter", "Splitter", "users"], ["/settings", "Settings", "sliders"]];
let lastIdx = -1; // remembers the previous page's slot, so the highlight can slide from it

// Sidebar (fixed, can fold away) + page area. Every logged-in page is wrapped in this.
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [folded, setFolded] = useState(false);
  const on = (h: string) => (h === "/" ? path === "/" : h === "/splitter" ? path.startsWith("/splitter") || path.startsWith("/g/") : path.startsWith(h));
  const idx = ITEMS.findIndex(([h]) => on(h));
  const [shown, setShown] = useState(lastIdx >= 0 ? lastIdx : idx);

  useEffect(() => {
    const t = setTimeout(() => setShown(idx), 40); // next frame: slide from the old slot to the new one
    lastIdx = idx;
    return () => clearTimeout(t);
  }, [idx]);
  useEffect(() => {
    if (!getToken()) return;
    const load = () => { api<{ name: string }>("/auth/me").then((u) => setName(u.name)).catch(() => {}); setPhoto(getAvatar()); };
    load();
    window.addEventListener("pocket:profile", load);
    setDark(document.documentElement.dataset.theme === "dark");
    setFolded(localStorage.getItem("side") === "1");
    return () => window.removeEventListener("pocket:profile", load);
  }, []);

  const toggle = () => {
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setDark(!dark);
  };
  const fold = () => { localStorage.setItem("side", folded ? "0" : "1"); setFolded(!folded); };
  const face = (cls: string) => photo ? <img src={photo} alt="" className={`av ${cls}`} /> : <span className={`av ${cls}`}>{(name || "U")[0].toUpperCase()}</span>;
  const switcher = <button className={dark ? "toggle dark" : "toggle"} onClick={toggle} aria-label="Toggle theme"><Icon n="sun" size={14} /><Icon n="moon" size={14} /><i /></button>;

  return (
    <div className={folded ? "shell folded" : "shell"}>
      <header className="mbar">
        <Brand />
        <div className="mbar-r">{switcher}<Link href="/settings" aria-label="Profile">{face("mbar-av")}</Link></div>
      </header>
      <aside className="side">
        <div className="side-top">
          <Brand />
          <button className="fold" onClick={fold} aria-label={folded ? "Open sidebar" : "Close sidebar"}><Icon n={folded ? "right" : "left"} size={16} /></button>
        </div>
        <nav>
          <i className={shown < 0 ? "nav-ind none" : "nav-ind"} style={{ "--i": Math.max(shown, 0) } as React.CSSProperties} />
          {ITEMS.map(([h, l, ic]) => <Link key={h} href={h} title={l} className={on(h) ? "on" : ""}><Icon n={ic} /><span>{l}</span></Link>)}
        </nav>
        <div className="side-bot">
          {switcher}
          <Link href="/settings" className="me" title="Your profile">
            {face("me-av")}
            <div><b>{name || "…"}</b><div className="mut">Your profile</div></div>
          </Link>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
