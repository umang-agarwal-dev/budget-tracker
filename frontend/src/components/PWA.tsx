"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global { interface Window { __bip?: Prompt } }

// Registers the service worker and keeps hold of the browser's "install" prompt until the user asks for it.
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    const on = (e: Event) => { e.preventDefault(); window.__bip = e as Prompt; window.dispatchEvent(new Event("pocket:installable")); };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  return null;
}

export function InstallCard() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setReady(!!window.__bip);
    const on = () => setReady(true);
    const done = () => setInstalled(true);
    window.addEventListener("pocket:installable", on);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("pocket:installable", on); window.removeEventListener("appinstalled", done); };
  }, []);
  async function install() {
    const p = window.__bip;
    if (!p) return;
    await p.prompt();
    await p.userChoice;
    window.__bip = undefined;
    setReady(false);
  }
  return (
    <div className="card install">
      <span className="tile green"><Icon n="download" /></span>
      <div>
        <h4 style={{ marginBottom: 4 }}>{installed ? "Pocket is installed ✓" : "Install Pocket"}</h4>
        <p className="mut">
          {installed ? "You're using the installed app." : ready ? "Add Pocket to your home screen for a full-screen, faster app." : ios ? "On iPhone: tap the Share button, then Add to Home Screen." : "Open your browser menu and choose Install app or Add to Home Screen."}
        </p>
        {ready && !installed && <div className="acts"><button className="btn" onClick={install}><Icon n="download" size={16} /> Install</button></div>}
      </div>
    </div>
  );
}
