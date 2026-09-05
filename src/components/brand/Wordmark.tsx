import { SevenElevenLogo } from "./SevenElevenLogo";

/**
 * Slurplash lockup — the 7-Eleven tile beside chunky rounded type with a
 * brand stripe underline.
 */
export function Wordmark({ size = "lg", light = true, className = "" }: { size?: "sm" | "md" | "lg" | "xl"; light?: boolean; className?: string }) {
  const scale = { sm: 0.5, md: 0.7, lg: 1, xl: 1.5 }[size];
  const fontSize = 64 * scale;
  return (
    <div className={`inline-flex items-center gap-[0.35em] ${className}`} style={{ fontSize }}>
      <SevenElevenLogo size={fontSize * 0.95} />
      <div className="flex flex-col leading-none">
        <span
          className={`display ${light ? "text-white" : "text-seven-green-dark"}`}
          style={{ fontSize, lineHeight: 0.9, textShadow: light ? "0 3px 0 rgba(0,0,0,0.25)" : undefined }}
        >
          Slurplash
        </span>
        <span className="stripes-h mt-[0.16em] h-[0.14em] w-full rounded-full" />
      </div>
    </div>
  );
}
