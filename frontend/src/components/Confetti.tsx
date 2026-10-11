const COLORS = ["#dcf75a", "#ff9f5a", "#8b7cf6", "#35c48d", "#f26d85"];

export default function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ left: ((i * 29) % 100) + "%", background: COLORS[i % 5], animationDelay: (i % 9) * 70 + "ms", animationDuration: 1.8 + (i % 5) * 0.3 + "s" }} />
      ))}
    </div>
  );
}
