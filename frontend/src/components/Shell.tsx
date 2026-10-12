"use client";
import Brand from "@/components/Brand";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Icon from "./Icon";

const ITEMS = [["/", "Home", "home"], ["/expenses", "Expenses", "list"], ["/savings", "Savings Goals", "target"], ["/splitter", "Splitter", "users"], ["/settings", "Settings", "sliders"]];

// Sidebar + page area, like the Coinly board. Every logged-in page is wrapped in this.
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    api<{ name: string }>("/auth/me").then((u) => setName(u.name)).catch(() => {});
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setDark(!dark);
  };
  const on = (h: string) => (h === "/" ? path === "/" : h === "/splitter" ? path.startsWith("/splitter") || path.startsWith("/g/") : path.startsWith(h));

  return (
    <div className="shell">
      <header className="mbar">
        <Brand />
        <div className="mbar-r">
          <button className={dark ? "toggle dark" : "toggle"} onClick={toggle} aria-label="Toggle theme"><Icon n="sun" size={14} /><Icon n="moon" size={14} /><i /></button>
          <button aria-label="Log out" onClick={() => { localStorage.removeItem("token"); router.replace("/login"); }}><Icon n="out" size={20} /></button>
        </div>
      </header>
      <aside className="side">
        <Brand />
        <nav>
          {ITEMS.map(([h, l, ic]) => (
            <Link key={h} href={h} className={on(h) ? "on" : ""}><Icon n={ic} /><span>{l}</span></Link>
          ))}
        </nav>
        <div className="side-bot">
          <button className={dark ? "toggle dark" : "toggle"} onClick={toggle} aria-label="Toggle theme">
            <Icon n="sun" size={14} /><Icon n="moon" size={14} /><i />
          </button>
          <div className="me">
            <span className="av me-av">{(name || "U")[0].toUpperCase()}</span>
            <div><b>{name || "…"}</b><div className="mut">Free plan</div></div>
            <button aria-label="Log out" onClick={() => { localStorage.removeItem("token"); router.replace("/login"); }}><Icon n="out" size={18} /></button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
