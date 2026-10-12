export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#dcf75a" />
      <circle cx="16" cy="10" r="4.2" fill="none" stroke="#111" strokeWidth="2.2" />
      <path d="M6.5 15h19l-1.6 9a3 3 0 0 1-3 2.5H11.1a3 3 0 0 1-3-2.5z" fill="#111" />
    </svg>
  );
}

export default function Brand({ big }: { big?: boolean }) {
  return <div className={big ? "logo big-logo" : "logo"}><Logo size={big ? 42 : 30} />Pocket</div>;
}
