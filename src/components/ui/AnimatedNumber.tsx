"use client";

import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect, useRef } from "react";

/** Counts toward `value` with a spring-ish ease; formats with locale separators. */
export function AnimatedNumber({ value, duration = 1.1, className = "", delay = 0 }: { value: number; duration?: number; className?: string; delay?: number }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration, delay, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, mv, duration, delay]);
  return <motion.span className={`numeric ${className}`}>{rounded}</motion.span>;
}
