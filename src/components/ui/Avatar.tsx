"use client";

import { motion } from "motion/react";
import { avatarMeta, type AvatarId } from "@/shared/avatars";
import { SnackIcon } from "@/components/icons/SnackIcon";

export function Avatar({
  id,
  size = 56,
  ring = false,
  dim = false,
  className = "",
  bounce = false,
}: {
  id: AvatarId;
  size?: number;
  ring?: boolean;
  dim?: boolean;
  className?: string;
  bounce?: boolean;
}) {
  const meta = avatarMeta(id);
  return (
    <motion.div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, #ffffff 0%, color-mix(in srgb, ${meta.tint} 22%, white) 55%, color-mix(in srgb, ${meta.tint} 48%, white) 100%)`,
        boxShadow: ring ? `0 0 0 ${Math.max(3, size * 0.06)}px #fff, 0 0 0 ${Math.max(5, size * 0.1)}px ${meta.tint}` : `inset 0 -${size * 0.06}px 0 rgba(0,0,0,0.08)`,
        opacity: dim ? 0.45 : 1,
        filter: dim ? "grayscale(0.7)" : undefined,
      }}
      animate={bounce ? { y: [0, -6, 0] } : undefined}
      transition={bounce ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" } : undefined}
    >
      <SnackIcon id={id} size={size * 0.72} />
    </motion.div>
  );
}
