"use client";

import { useEffect, useState, type ReactNode } from "react";

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * A fixed 1920×1080 design surface that letterboxes to whatever screen the
 * host is on — projector, TV, laptop — so every layout is pixel-predictable.
 */
export function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="host-bg fixed inset-0 overflow-hidden">
      <div
        className={`stage absolute left-1/2 top-1/2 overflow-hidden ${className}`}
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: "center" }}
      >
        {children}
      </div>
    </div>
  );
}
