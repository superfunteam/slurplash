"use client";

import { motion } from "motion/react";

/**
 * Circular countdown. Orange while comfortable, red and pulsing in the
 * final seconds — the 7-Eleven "urgent" colour doing its job.
 */
export function TimerRing({
  remaining,
  total,
  size = 120,
  stroke = 10,
  className = "",
  label,
}: {
  remaining: number; // seconds
  total: number; // seconds
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const urgent = remaining <= 5.05 && remaining > 0;
  const color = urgent ? "var(--color-seven-red)" : frac < 0.4 ? "var(--color-seven-orange)" : "var(--color-seven-orange)";
  const seconds = Math.ceil(remaining);
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={urgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={urgent ? { repeat: Infinity, duration: 1, ease: "easeInOut" } : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="rgba(0,0,0,0.18)" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 120ms linear, stroke 300ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="numeric display leading-none" style={{ fontSize: size * 0.36, color: urgent ? "var(--color-seven-red)" : "#fff" }}>
          {seconds}
        </span>
        {label && <span className="eyebrow mt-1 opacity-70" style={{ fontSize: Math.max(9, size * 0.09) }}>{label}</span>}
      </div>
    </motion.div>
  );
}
