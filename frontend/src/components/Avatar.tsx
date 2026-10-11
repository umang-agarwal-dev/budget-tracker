const COLORS = ["#dcf75a", "#ffd9df", "#cfe5b4", "#ffd37a", "#cfe0ff", "#e6d5ff"];
export default function Avatar({ name }: { name: string }) {
  const c = COLORS[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];
  return <span className="av" title={name} style={{ background: c }}>{name.slice(0, 1).toUpperCase()}</span>;
}
