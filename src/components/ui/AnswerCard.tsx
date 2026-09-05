"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * A Slurpee-flavoured answer card. Blue raspberry on the left, cherry on the
 * right, both with a frosty glass face and a liquid rim.
 */
export function AnswerCard({
  flavor,
  children,
  footer,
  dim = false,
  winner = false,
  className = "",
  size = "lg",
  textSize,
}: {
  textSize?: number;
  flavor: "blue" | "cherry";
  children: ReactNode;
  footer?: ReactNode;
  dim?: boolean;
  winner?: boolean;
  className?: string;
  size?: "md" | "lg";
}) {
  const liquid = flavor === "blue" ? "liquid-blue" : "liquid-cherry";
  const glow = flavor === "blue" ? "shadow-glow-blue" : "shadow-glow-orange";
  return (
    <motion.div
      layout
      className={`relative flex flex-col overflow-hidden rounded-[2rem] ${liquid} ${winner ? glow : ""} ${className}`}
      style={{ boxShadow: winner ? undefined : "0 30px 60px -30px rgba(0,0,0,0.6)" }}
      animate={{ opacity: dim ? 0.55 : 1, scale: winner ? 1.03 : dim ? 0.96 : 1, filter: dim ? "saturate(0.7)" : "saturate(1)" }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(120% 60% at 50% -10%, #fff 0%, transparent 60%)" }} />
      <div className={`m-3 flex flex-1 flex-col rounded-[1.5rem] bg-white/95 ${size === "lg" ? "p-10" : "p-5"}`} style={{ boxShadow: "inset 0 2px 0 #fff, 0 2px 0 rgba(0,0,0,0.05)" }}>
        <div className={`display-soft flex flex-1 items-center text-ink ${size === "lg" ? "text-[50px] leading-[1.08]" : "text-lg leading-snug"}`} style={textSize ? { fontSize: textSize } : undefined}>
          <div>{children}</div>
        </div>
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </motion.div>
  );
}
