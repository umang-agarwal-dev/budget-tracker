"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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
      <form className="card auth-card" onSubmit={submit}>
        <div className="logo"><i>◎</i>Coinly</div>
        <p className="mut">Your money, your way.</p>
        <input type="email" placeholder="Email" value={f.email} onChange={set("email")} required />
        {mode === "register" && <input placeholder="Your name" value={f.name} onChange={set("name")} required />}
        <input type="password" placeholder="Password (8+ characters)" minLength={8} value={f.password} onChange={set("password")} required />
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </form>
    </main>
  );
}
