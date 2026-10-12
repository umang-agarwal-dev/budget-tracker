"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type GIS = { accounts: { id: { initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void; renderButton: (el: HTMLElement, o: Record<string, unknown>) => void } } };
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const gis = () => (window as unknown as { google?: GIS }).google;

// "Continue with Google": Google gives us an ID token, and our API swaps it for a Pocket login token.
export default function GoogleButton({ onError }: { onError: (m: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const fail = useRef(onError);
  fail.current = onError;
  const router = useRouter();

  useEffect(() => {
    const el = box.current;
    if (!CLIENT_ID || !el) return;
    const init = () => {
      const g = gis();
      if (!g) return;
      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (r) => {
          try {
            const t = await api<{ access_token: string }>("/auth/google", { method: "POST", json: { id_token: r.credential } });
            localStorage.setItem("token", t.access_token);
            router.replace("/");
          } catch (x) { fail.current((x as Error).message); }
        },
      });
      el.innerHTML = "";
      g.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(340, el.offsetWidth || 300) });
    };
    if (gis()) { init(); return; }
    const src = "https://accounts.google.com/gsi/client";
    const old = document.querySelector(`script[src="${src}"]`);
    if (old) { old.addEventListener("load", init); return () => old.removeEventListener("load", init); }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [router]);

  if (!CLIENT_ID) return null;
  return <div ref={box} className="g-btn" />;
}
