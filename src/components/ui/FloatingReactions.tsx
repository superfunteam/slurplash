"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { ReactionId } from "@/shared/avatars";
import { SnackIcon } from "@/components/icons/SnackIcon";

interface Floater {
  key: number;
  reaction: ReactionId;
  x: number;
  drift: number;
  size: number;
  duration: number;
}

let counter = 0;

/** Audience reactions float up from the bottom of the host screen. */
export function FloatingReactions({ subscribe }: { subscribe: (fn: (r: ReactionId) => void) => () => void }) {
  const [items, setItems] = useState<Floater[]>([]);

  const push = useCallback((reaction: ReactionId) => {
    const f: Floater = {
      key: counter++,
      reaction,
      x: 120 + Math.random() * 1680,
      drift: (Math.random() - 0.5) * 220,
      size: 64 + Math.random() * 56,
      duration: 3.2 + Math.random() * 1.6,
    };
    setItems((prev) => [...prev.slice(-60), f]);
    setTimeout(() => setItems((prev) => prev.filter((p) => p.key !== f.key)), f.duration * 1000);
  }, []);

  useEffect(() => subscribe(push), [subscribe, push]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {items.map((f) => (
          <motion.div
            key={f.key}
            className="absolute bottom-0"
            style={{ left: f.x }}
            initial={{ y: 80, x: 0, opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ y: -1250, x: f.drift, opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.9], rotate: [-10, 8, -6, 4] }}
            transition={{ duration: f.duration, ease: "easeOut" }}
          >
            <SnackIcon id={f.reaction} size={f.size} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
