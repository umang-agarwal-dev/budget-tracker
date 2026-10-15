"use client";
import Brand from "@/components/Brand";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import GoogleButton from "@/components/GoogleButton";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", name: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (mode === "register") await api("/auth/register", { method: "POST", json: f });
      const t = await api<{ access_token: string }>("/auth/login", { method: "POST", form: { username: f.email, password: f.password } });
      localStorage.setItem("token", t.access_token);
      router.replace("/");
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <main className="auth">
      <div className="auth-blob" />
      <form className="card auth-card" onSubmit={submit}>
        <Link href="/" className="back">← Back to home</Link>
        <Brand />
        <h2 className="h" style={{ margin: "4px 0 0" }}>{mode === "login" ? "Welcome back" : "Create your Pocket"}</h2>
        <p className="mut">{mode === "login" ? "Log in to see what's left this month." : "Free to start. Takes ten seconds."}</p>
        <GoogleButton onError={setErr} />
        <div className="divider"><span>or use email</span></div>
        <input type="email" placeholder="Email" value={f.email} onChange={set("email")} required autoComplete="email" />
        {mode === "register" && <input placeholder="Your name" value={f.name} onChange={set("name")} required autoComplete="name" />}
        <input type="password" placeholder="Password (8+ characters)" minLength={8} value={f.password} onChange={set("password")} required autoComplete={mode === "login" ? "current-password" : "new-password"} />
        {err && <p className="err">{err}</p>}
        <button className="btn big" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="link" style={{ margin: "0 auto" }} onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
        <p className="mut legal-note">By continuing you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
      </form>
    </main>
  );
}
