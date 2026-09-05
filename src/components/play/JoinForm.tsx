"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Tv } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AVATARS, type AvatarId } from "@/shared/avatars";
import { NAME_MAX_LENGTH } from "@/shared/constants";
import { Wordmark } from "@/components/brand/Wordmark";
import { SnackIcon } from "@/components/icons/SnackIcon";
import { Button } from "@/components/ui/Button";
import { haptic } from "@/lib/audio";

export function JoinForm({
  initialCode,
  error,
  busy,
  onJoin,
  onClearError,
}: {
  initialCode: string;
  error: string | null;
  busy: boolean;
  onJoin: (code: string, name: string, avatar: AvatarId) => void;
  onClearError: () => void;
}) {
  const [code, setCode] = useState(initialCode.replace(/\D/g, "").slice(0, 4));
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("slurpee");
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCode.length === 4) nameRef.current?.focus();
    else codeRef.current?.focus();
  }, [initialCode]);

  const ready = code.length === 4 && name.trim().length > 0 && !busy;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 240, damping: 24 }} className="flex flex-1 flex-col px-5 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <Wordmark size="md" />
        <div className="display-soft mt-4 text-lg text-white/75">The 7-Eleven head-to-head comedy game</div>
      </div>

      <form
        className="mt-8 flex flex-1 flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onJoin(code, name, avatar);
        }}
      >
        {/* room code */}
        <label className="card-white relative flex flex-col overflow-hidden rounded-[1.75rem] p-5">
          <span className="stripes-h absolute inset-x-0 top-0 h-2" />
          <span className="eyebrow text-seven-green">Room code</span>
          <div className="relative mt-2">
            <input
              ref={codeRef}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                onClearError();
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setCode(v);
                if (v.length === 4) nameRef.current?.focus();
              }}
              className="numeric display w-full bg-transparent text-[64px] tracking-[0.35em] text-seven-green-dark outline-none placeholder:text-seven-green-dark/15"
              placeholder="7110"
              aria-label="Room code"
            />
          </div>
        </label>

        {/* nickname */}
        <label className="card-white flex flex-col rounded-[1.75rem] p-5">
          <span className="eyebrow text-seven-green">Nickname</span>
          <input
            ref={nameRef}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            autoCapitalize="words"
            autoComplete="off"
            onChange={(e) => {
              onClearError();
              setName(e.target.value);
            }}
            className="display-soft mt-1 w-full bg-transparent text-3xl text-seven-green-dark outline-none placeholder:text-seven-green-dark/25"
            placeholder="Night Shift Legend"
            aria-label="Nickname"
          />
        </label>

        {/* avatar */}
        <div className="card-white rounded-[1.75rem] p-5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow text-seven-green">Pick your snack</span>
            <AnimatePresence mode="wait">
              <motion.span key={avatar} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="display-soft text-seven-orange">
                {AVATARS.find((a) => a.id === avatar)?.name}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {AVATARS.map((a) => {
              const active = a.id === avatar;
              return (
                <motion.button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    haptic(8);
                    setAvatar(a.id);
                  }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: active ? 1.08 : 1, y: active ? -4 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="relative flex aspect-square items-center justify-center rounded-2xl"
                  style={{
                    background: active ? `radial-gradient(circle at 30% 25%, #fff 0%, ${a.tint}44 60%, ${a.tint}88 100%)` : "#F3F4F1",
                    boxShadow: active ? `0 0 0 3px #fff, 0 0 0 6px ${a.tint}, 0 12px 24px -10px ${a.tint}` : "inset 0 -3px 0 rgba(0,0,0,0.05)",
                  }}
                  aria-label={a.name}
                  aria-pressed={active}
                >
                  <SnackIcon id={a.id} size="72%" className={active ? "" : "opacity-80"} />
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl bg-seven-red px-4 py-3 text-center font-bold text-white">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto flex flex-col gap-4 pt-2">
          <Button type="submit" size="xl" block disabled={!ready}>
            {busy ? "Opening the door…" : "Let’s play"} <ArrowRight size={24} strokeWidth={3} />
          </Button>
          <Link href="/host" className="flex items-center justify-center gap-2 py-2 text-white/70 display-soft">
            <Tv size={18} /> Host a game on a big screen
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
