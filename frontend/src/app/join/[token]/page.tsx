"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Joined = { group_id: number; member_id: number; name: string; member_token: string; group_name: string };

// Friends land here from the invite link. No account: a name is enough, and we keep their member token on this device.
export default function Join() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<{ name: string; member_count: number } | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ name: string; member_count: number }>(`/groups/join/${token}`).then(setInfo).catch((x) => setErr(x.message));
  }, [token]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await api<Joined>(`/groups/join/${token}`, { method: "POST", json: { name } });
      localStorage.setItem("group:" + r.group_id, JSON.stringify({ member_token: r.member_token, member_id: r.member_id, name: r.name, group_name: r.group_name }));
      sessionStorage.setItem("mode:" + r.group_id, "guest"); // this tab acts as the guest, even if you are logged in as admin in another tab
      router.replace(`/g/${r.group_id}`);
    } catch (x) { setErr((x as Error).message); }
  }

  return (
    <main className="auth">
      <form className="card auth-card" onSubmit={join}>
        <div className="logo"><i>◎</i>Coinly</div>
        {info ? <h2 className="h" style={{ margin: 0 }}>Join “{info.name}”</h2> : !err && <p className="mut">Opening invite…</p>}
        {info && <p className="mut">{info.member_count} member{info.member_count === 1 ? "" : "s"} so far. Just add your name, no account needed.</p>}
        {info && <input autoFocus placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />}
        {err && <p className="err">{err}</p>}
        {info && <button className="btn">Join group</button>}
      </form>
    </main>
  );
}
