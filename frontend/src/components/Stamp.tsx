"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

// Shown right after a group is settled: a SETTLED stamp slams down and the trip moves to History.
export default function Stamp({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="stamp-ov" onClick={onClose}>
      <div className="stamp-box" onClick={(e) => e.stopPropagation()}>
        <div className="stamp-big">SETTLED</div>
        <p>This trip moved to your History.</p>
        <div className="acts" style={{ justifyContent: "center" }}>
          <Link className="btn" href={`/splitter?tab=history&open=${groupId}`}><Icon n="receipt" size={16} /> View receipt</Link>
          <button className="btn ghost" onClick={onClose}>Stay here</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
