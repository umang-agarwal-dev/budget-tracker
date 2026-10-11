"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  const items = [["/", "Home"], ["/savings", "Savings"], ["/splitter", "Splitter"]];
  const on = (h: string) => (h === "/" ? path === "/" : h === "/splitter" ? path.startsWith("/splitter") || path.startsWith("/g/") : path.startsWith(h));
  return (
    <>
      <div className="logo"><i>◎</i>Coinly</div>
      <nav className="links">
        {items.map(([h, l]) => <Link key={h} href={h} className={on(h) ? "on" : ""}>{l}</Link>)}
      </nav>
    </>
  );
}
