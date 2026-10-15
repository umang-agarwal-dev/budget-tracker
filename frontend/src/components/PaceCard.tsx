import Icon from "./Icon";
import { inr } from "@/lib/api";

// Replaces the old sticky note: shows if you are on track, with a useful daily number.
export default function PaceCard({ overspent, used, pace, left, days }: { overspent: boolean; used: number; pace: number; left: number; days: number }) {
  const state = overspent ? "bad" : used > pace + 10 ? "warn" : "ok";
  const perDay = days > 0 ? Math.max(left, 0) / days : 0;
  const title = state === "bad" ? "Over budget" : state === "warn" ? "Spending fast" : "On track";
  const line = state === "bad" ? "Pause non-essentials until next month." : state === "warn" ? `Aim for about ${inr(Math.round(perDay))} a day from here.` : `You can spend about ${inr(Math.round(perDay))} a day.`;
  return (
    <div className={`pace ${state}`} role="status">
      <span className="pace-ic"><Icon n={state === "ok" ? "check" : state === "warn" ? "zap" : "alert"} size={20} /></span>
      <div><b>{title}</b><span>{line}</span></div>
      <i className="pace-glow" />
    </div>
  );
}
