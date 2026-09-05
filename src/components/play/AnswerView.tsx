"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Send, Tv } from "lucide-react";
import { useMemo, useState } from "react";
import type { MeState, PublicState } from "@/shared/types";
import { ANSWER_MAX_LENGTH, BIG_BITE_SLOTS, TIMINGS } from "@/shared/constants";
import { Button } from "@/components/ui/Button";
import { haptic } from "@/lib/audio";

function TimerBar({ remaining, total }: { remaining: number; total: number }) {
  const frac = Math.max(0, Math.min(1, remaining / total));
  const urgent = remaining <= 10;
  return (
    <div className="px-5">
      <div className="flex items-center justify-between text-white">
        <span className="eyebrow opacity-60">Time left</span>
        <span className={`numeric display text-2xl ${urgent ? "text-seven-red" : ""}`}>{Math.ceil(remaining)}s</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full ${urgent ? "bg-seven-red" : "stripes-h"}`} style={{ width: `${frac * 100}%`, transition: "width 120ms linear" }} />
      </div>
    </div>
  );
}

export function AnswerView({
  state,
  me,
  remaining,
  onAnswer,
  onBigBite,
}: {
  state: PublicState;
  me: MeState;
  remaining: number;
  onAnswer: (matchupIndex: number, text: string) => void;
  onBigBite: (entries: string[]) => void;
}) {
  const phase = state.phase;
  if (phase.kind !== "input") return null;
  const total = TIMINGS.input[phase.round] / 1000;
  return (
    <div className="flex flex-1 flex-col gap-4 pt-3">
      <TimerBar remaining={remaining} total={total} />
      {phase.round === 3 ? <BigBiteEntry me={me} onSubmit={onBigBite} /> : <HeadToHeadEntry me={me} onAnswer={onAnswer} />}
    </div>
  );
}

function HeadToHeadEntry({ me, onAnswer }: { me: MeState; onAnswer: (i: number, t: string) => void }) {
  const pending = me.prompts.filter((p) => p.answer === null);
  const current = pending[0];
  const answeredCount = me.prompts.length - pending.length;
  if (!current) return <AllIn title="Both answers are in!" subtitle="Nice. Watch the big screen for the showdown." />;
  return (
    <AnimatePresence mode="wait">
      <PromptEntry key={current.matchupIndex} prompt={current.prompt} index={answeredCount} total={me.prompts.length} onSubmit={(t) => onAnswer(current.matchupIndex, t)} />
    </AnimatePresence>
  );
}

function PromptEntry({ prompt, index, total, onSubmit }: { prompt: string; index: number; total: number; onSubmit: (t: string) => void }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    haptic([10, 40, 10]);
    onSubmit(text.trim());
  };
  return (
    <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="flex flex-1 flex-col gap-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < index ? "bg-seven-green-bright" : i === index ? "bg-seven-orange" : "bg-white/20"}`} />
        ))}
        <span className="eyebrow ml-2 text-white/60">
          Prompt {index + 1} of {total}
        </span>
      </div>
      <div className="card-white relative overflow-hidden rounded-[1.75rem] p-5">
        <div className="stripes-h absolute inset-x-0 top-0 h-2" />
        <div className="display-soft text-[26px] leading-snug text-seven-green-dark">{prompt}</div>
      </div>
      <div className="card-white flex flex-1 flex-col rounded-[1.75rem] p-4">
        <textarea
          value={text}
          maxLength={ANSWER_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Type something dangerously funny…"
          className="display-soft min-h-[120px] flex-1 resize-none bg-transparent text-2xl leading-snug text-ink outline-none placeholder:text-ink/25"
          autoFocus
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`numeric text-sm ${text.length >= ANSWER_MAX_LENGTH - 8 ? "text-seven-red" : "text-ink-soft/60"}`}>
            {text.length}/{ANSWER_MAX_LENGTH}
          </span>
        </div>
      </div>
      <Button size="xl" block disabled={!text.trim()} onClick={submit}>
        Lock it in <Send size={22} strokeWidth={2.5} />
      </Button>
    </motion.div>
  );
}

function BigBiteEntry({ me, onSubmit }: { me: MeState; onSubmit: (entries: string[]) => void }) {
  const prompt = me.prompts[0]?.prompt ?? "";
  const [entries, setEntries] = useState<string[]>(() => Array.from({ length: BIG_BITE_SLOTS }, () => ""));
  const filled = useMemo(() => entries.filter((e) => e.trim()).length, [entries]);
  if (me.bigBiteEntries) return <AllIn title="All three are in!" subtitle="Everyone's answers hit the big screen next. Then you vote." />;
  return (
    <div className="flex flex-1 flex-col gap-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="card-white relative overflow-hidden rounded-[1.75rem] p-5">
        <div className="stripes-h absolute inset-x-0 top-0 h-2" />
        <div className="eyebrow text-seven-orange">The Big Bite</div>
        <div className="display-soft mt-1 text-[24px] leading-snug text-seven-green-dark">{prompt}</div>
      </div>
      {entries.map((v, i) => (
        <motion.label key={i} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 * i, type: "spring", stiffness: 300, damping: 26 }} className="card-white flex items-center gap-3 rounded-[1.5rem] p-3 pl-4">
          <div className={`numeric display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${v.trim() ? "bg-seven-green text-white" : "bg-mist text-seven-green-dark"}`}>{v.trim() ? <Check size={20} strokeWidth={3} /> : i + 1}</div>
          <input
            value={v}
            maxLength={ANSWER_MAX_LENGTH}
            onChange={(e) => setEntries((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={["First one…", "Second one…", "Third one…"][i]}
            className="display-soft w-full bg-transparent py-2 text-xl text-ink outline-none placeholder:text-ink/25"
          />
        </motion.label>
      ))}
      <div className="mt-auto" />
      <Button
        size="xl"
        block
        disabled={filled === 0}
        onClick={() => {
          haptic([10, 40, 10]);
          onSubmit(entries.map((e) => e.trim()).filter(Boolean));
        }}
      >
        {filled === BIG_BITE_SLOTS ? "Send all three" : `Send ${filled || ""} ${filled === 1 ? "answer" : "answers"}`.replace("  ", " ")} <Send size={22} strokeWidth={2.5} />
      </Button>
    </div>
  );
}

function AllIn({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.1 }} className="flex h-28 w-28 items-center justify-center rounded-full bg-seven-green text-white shadow-[0_10px_0_0_#004D38]">
        <Check size={64} strokeWidth={3.5} />
      </motion.div>
      <div className="display mt-8 text-4xl text-white">{title}</div>
      <div className="display-soft mt-3 flex items-center justify-center gap-2 text-white/70">
        <Tv size={18} className="shrink-0" />
        <span>{subtitle}</span>
      </div>
    </motion.div>
  );
}
