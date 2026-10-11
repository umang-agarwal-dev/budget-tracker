"use client";
import { useEffect, useRef, useState } from "react";

// Shows a number that counts up (or down) to its new value.
export default function Count({ value, fmt }: { value: number; fmt: (n: number) => string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      from.current = a + (value - a) * (1 - Math.pow(1 - p, 3));
      setV(from.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(v)}</>;
}
