export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

type Opts = { method?: string; json?: unknown; form?: Record<string, string>; member?: string };

// One place for every API call: adds the base URL and the login token, and turns errors into readable messages.
export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.member) headers["X-Member-Token"] = opts.member;
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  if (opts.form) body = new URLSearchParams(opts.form);
  const res = await fetch(API + path, { method: opts.method ?? "GET", headers, body });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !opts.member) {
      localStorage.removeItem("token");
      location.href = "/login";
    }
    const d = data.detail;
    const msg = typeof d === "string" ? d : Array.isArray(d) ? d[0]?.msg ?? "Invalid input" : "Something went wrong";
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data as T;
}

export const inr = (n: number | string) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
