"use client";
import Avatar from "./Avatar";
import Count from "./Count";
import Icon from "./Icon";
import { inr } from "@/lib/api";

export type Member = { id: number; name: string };
export type Split = { all: boolean; picked: number[] };

// Chooses who shares an expense: everyone, or only the people you tick. Shows each person's share live.
export default function SplitPicker({ members, amount, value, onChange }: { members: Member[]; amount: number; value: Split; onChange: (v: Split) => void }) {
  const ids = members.map((m) => m.id);
  const sharers = value.all ? ids.length : value.picked.length;
  const each = sharers > 0 && amount > 0 ? amount / sharers : 0;
  const toggle = (id: number) => onChange({ all: false, picked: value.picked.includes(id) ? value.picked.filter((x) => x !== id) : [...value.picked, id] });
  const setMode = (all: boolean) => onChange(all ? { all: true, picked: value.picked } : { all: false, picked: value.picked.length ? value.picked : ids });

  return (
    <div className="split">
      <div className="lbl-s">Split between</div>
      <div className={`seg2 ${value.all ? "everyone" : "choose"}`}>
        <i />
        <button type="button" onClick={() => setMode(true)}><Icon n="users" size={15} /> Everyone</button>
        <button type="button" onClick={() => setMode(false)}><Icon n="check" size={15} /> Choose</button>
      </div>
      <div className={value.all ? "pick-wrap" : "pick-wrap open"}>
        <div className="pick-in">
          <div className="pick-grid">
            {members.map((m, i) => (
              <button type="button" key={m.id} className={value.picked.includes(m.id) ? "pick on" : "pick"} style={{ animationDelay: i * 45 + "ms" }} onClick={() => toggle(m.id)}>
                <Avatar name={m.name} /><span>{m.name}</span><em><Icon n="check" size={12} /></em>
              </button>
            ))}
          </div>
          <div className="pick-quick">
            <button type="button" className="link" style={{ margin: 0 }} onClick={() => onChange({ all: false, picked: ids })}>Select all</button>
            <button type="button" className="link" style={{ margin: 0 }} onClick={() => onChange({ all: false, picked: [] })}>Clear</button>
          </div>
        </div>
      </div>
      <div className={sharers === 0 ? "split-prev warn" : "split-prev"}>
        {sharers === 0 ? "Pick at least one person" : <><b><Count value={each} fmt={inr} /></b> each · {sharers} {sharers === 1 ? "person" : "people"}</>}
      </div>
    </div>
  );
}
