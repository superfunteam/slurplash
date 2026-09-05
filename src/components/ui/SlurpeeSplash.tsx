"use client";

import { motion } from "motion/react";

/** Liquid splash burst that flares behind an answer card as it slams in. */
export function SlurpeeSplash({ flavor, size = 520, delay = 0 }: { flavor: "blue" | "cherry"; size?: number; delay?: number }) {
  const fill = flavor === "blue" ? "#00A3E0" : "#E31B23";
  const hi = flavor === "blue" ? "#8ED9F7" : "#FF8A8D";
  const drops = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: Math.cos(a), y: Math.sin(a), r: 8 + ((i * 7) % 5) * 4, d: 0.55 + ((i * 3) % 4) * 0.12 };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
      <motion.svg viewBox="-100 -100 200 200" width={size} height={size} initial={{ scale: 0, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 190, damping: 14, delay }}>
        <motion.path
          d="M0-78C22-76 32-56 52-52 78-46 84-20 76 4 70 26 78 52 52 60 32 66 20 84 0 78-22 74-36 60-56 50-80 40-82 6-70-12-60-30-72-58-46-66-24-72-22-80 0-78Z"
          fill={fill}
          initial={{ scale: 0.6 }}
          animate={{ scale: [0.6, 1.08, 1] }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
        <motion.ellipse cx="-22" cy="-30" rx="18" ry="10" fill={hi} opacity="0.7" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: delay + 0.25 }} />
        {drops.map((d, i) => (
          <motion.circle
            key={i}
            r={d.r / 2.2}
            fill={fill}
            initial={{ cx: 0, cy: 0, opacity: 0 }}
            animate={{ cx: d.x * 92 * d.d, cy: d.y * 92 * d.d, opacity: [0, 1, 0.9] }}
            transition={{ duration: 0.55, delay: delay + 0.05, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </motion.svg>
    </div>
  );
}
