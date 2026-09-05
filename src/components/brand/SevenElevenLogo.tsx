/**
 * The 7-Eleven tile — white tile, green frame, orange/red "7", green ELEVEN
 * (with the famous lowercase n).
 */
export function SevenElevenLogo({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="7-Eleven"
    >
      <defs>
        <clipPath id="seven-clip">
          <path d="M24 16h52v13.5L52.5 84H33l21-54.5H24z" />
        </clipPath>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="14" fill="#fff" stroke="#008060" strokeWidth="4" />
      {/* orange 7 */}
      <path d="M24 16h52v13.5L52.5 84H33l21-54.5H24z" fill="#F58220" />
      {/* red notch on the top-right of the bar */}
      <g clipPath="url(#seven-clip)">
        <path d="M60 10h20v22L60 32z" fill="#EE1C25" />
      </g>
      {/* ELEVEN band */}
      <rect x="10" y="44" width="80" height="16" fill="#fff" />
      <text
        x="50"
        y="57.2"
        textAnchor="middle"
        fontFamily="var(--font-gsf), Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="16.5"
        letterSpacing="0.5"
        fill="#008060"
      >
        ELEVEn
      </text>
    </svg>
  );
}
