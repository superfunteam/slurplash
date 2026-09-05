import type { AvatarId, ReactionId } from "@/shared/avatars";

export type SnackIconId = AvatarId | ReactionId;

/**
 * Chunky flat-vector snack icons. All drawn in a 64×64 box so they
 * composite cleanly inside avatar chips and floating reactions.
 */
export function SnackIcon({ id, size = 48, className = "" }: { id: SnackIconId; size?: number | string; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 64 64", className, "aria-hidden": true } as const;
  switch (id) {
    case "slurpee":
      return (
        <svg {...common}>
          {/* straw */}
          <path d="M40 3 L36 24" stroke="#EE1C25" strokeWidth="4" strokeLinecap="round" />
          {/* dome lid */}
          <path d="M14 26 a18 18 0 0 1 36 0z" fill="#E9F7FD" />
          <path d="M14 26 a18 18 0 0 1 36 0z" fill="none" stroke="#B8DFF0" strokeWidth="2" />
          <rect x="11" y="24" width="42" height="6" rx="3" fill="#fff" stroke="#B8DFF0" strokeWidth="2" />
          {/* cup */}
          <path d="M14 30h36l-4 30H18z" fill="#fff" stroke="#B8DFF0" strokeWidth="2" strokeLinejoin="round" />
          <path d="M17.5 36h29l-3 22h-23z" fill="#00A3E0" />
          <path d="M17.5 36h29l-1 7.5h-27z" fill="#62D4FF" />
          <path d="M20 47h24l-.9 7H20.9z" fill="#0078B5" opacity="0.5" />
          {/* frost swirl inside dome */}
          <path d="M23 22c2-6 8-8 12-6 3 1 5 4 4 7" fill="none" stroke="#8ED9F7" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "donut":
      return (
        <svg {...common}>
          <circle cx="32" cy="34" r="24" fill="#E0A86B" />
          <path d="M32 12a22 22 0 1 0 0 44 22 22 0 0 0 0-44zm0 14a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" fill="#F9B4C9" />
          <path d="M14 30c3-9 10-14 18-14s14 4 17 11c-4 2-6 6-10 5-4-1-5 4-9 3s-5-5-9-3-6 2-7-2z" fill="#FFC9DA" />
          <g strokeWidth="3" strokeLinecap="round">
            <path d="M22 24l4-2" stroke="#00A3E0" />
            <path d="M40 22l3 3" stroke="#F58220" />
            <path d="M18 36l4 1" stroke="#008060" />
            <path d="M44 38l3-2" stroke="#EE1C25" />
            <path d="M30 46l3 2" stroke="#FFD500" />
            <path d="M36 18l-1 4" stroke="#8B5CF6" />
          </g>
        </svg>
      );
    case "taquito":
      return (
        <svg {...common}>
          <g transform="rotate(-32 32 32)">
            <rect x="8" y="22" width="48" height="20" rx="10" fill="#E9A23B" />
            <rect x="8" y="22" width="48" height="20" rx="10" fill="none" stroke="#C97C1A" strokeWidth="2.5" />
            <path d="M18 24c4 4 4 12 0 16M28 24c4 4 4 12 0 16M38 24c4 4 4 12 0 16" fill="none" stroke="#C97C1A" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="54" cy="32" rx="5" ry="9" fill="#B34A2B" />
            <ellipse cx="54" cy="32" rx="3" ry="6" fill="#E85D3A" />
            <ellipse cx="10" cy="32" rx="5" ry="9" fill="#F4C36B" />
          </g>
        </svg>
      );
    case "bigbite":
      return (
        <svg {...common}>
          <path d="M10 36c0-8 6-12 14-12h16c8 0 14 4 14 12v4c0 4-3 6-6 6H16c-3 0-6-2-6-6z" fill="#F0B26B" />
          <path d="M8 34c0-6 4-10 10-10h28c6 0 10 4 10 10 0 3-2 5-5 5H13c-3 0-5-2-5-5z" fill="#F7CC8E" />
          <rect x="12" y="26" width="40" height="14" rx="7" fill="#C4432B" />
          <rect x="12" y="26" width="40" height="7" rx="3.5" fill="#E05A3E" opacity="0.8" />
          <path d="M14 33c4-4 6 4 10 0s6 4 10 0 6 4 10 0 4 2 6 0" fill="none" stroke="#FFD500" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M10 40h44c0 6-4 9-9 9H19c-5 0-9-3-9-9z" fill="#E9A96B" />
        </svg>
      );
    case "coffee":
      return (
        <svg {...common}>
          <rect x="16" y="12" width="32" height="7" rx="3.5" fill="#3A2A20" />
          <path d="M18 19h28l-3.5 36h-21z" fill="#F7F1E6" stroke="#D9CFC0" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19.5 30h25l-1.6 12H21.1z" fill="#008060" />
          <path d="M19.5 30h25l-.5 4h-24z" fill="#00A57A" />
          <circle cx="32" cy="36" r="3.2" fill="#fff" />
          <path d="M28 8c0-3 3-3 3-6M34 8c0-3 3-3 3-6" fill="none" stroke="#B8AFA2" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </svg>
      );
    case "pizza":
      return (
        <svg {...common}>
          <path d="M32 58 8 14c15-6 33-6 48 0z" fill="#F4C36B" />
          <path d="M8 14c15-6 33-6 48 0l-2.5 5c-13-5-30-5-43 0z" fill="#D9822B" />
          <path d="M32 50 14 20c11-4 25-4 36 0z" fill="#FFD766" />
          <circle cx="26" cy="27" r="4.2" fill="#C4432B" />
          <circle cx="38" cy="30" r="4.2" fill="#C4432B" />
          <circle cx="31" cy="39" r="4.2" fill="#C4432B" />
          <circle cx="26" cy="27" r="2" fill="#E05A3E" opacity="0.8" />
          <circle cx="38" cy="30" r="2" fill="#E05A3E" opacity="0.8" />
          <circle cx="31" cy="39" r="2" fill="#E05A3E" opacity="0.8" />
        </svg>
      );
    case "redbull":
      return (
        <svg {...common}>
          <rect x="20" y="8" width="24" height="50" rx="6" fill="#C9D3E2" />
          <rect x="20" y="14" width="24" height="38" fill="#2F5BD9" />
          <rect x="20" y="14" width="12" height="38" fill="#3B6BE8" />
          <rect x="20" y="24" width="24" height="18" fill="#C9D3E2" />
          <rect x="20" y="24" width="12" height="18" fill="#DCE4F0" />
          <circle cx="32" cy="33" r="6" fill="#EE1C25" />
          <path d="M26 33h12" stroke="#FFD500" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="24" y="8" width="16" height="4" rx="2" fill="#9AA7BA" />
        </svg>
      );
    case "nachos":
      return (
        <svg {...common}>
          <path d="M8 40h48l-4 14H12z" fill="#2B7A5B" />
          <path d="M8 40h48l-1.2 4H9.2z" fill="#3A9A75" />
          <path d="M14 40 24 20l10 20z" fill="#F4C36B" />
          <path d="M30 40 40 18l10 22z" fill="#F7CC8E" />
          <path d="M22 40 32 26l10 14z" fill="#FFD766" />
          <path d="M18 34c4 2 6-2 10 0s6-2 10 0 6-2 10 0" fill="none" stroke="#FFA500" strokeWidth="4" strokeLinecap="round" />
          <circle cx="24" cy="30" r="2.2" fill="#3B7A2A" />
          <circle cx="40" cy="27" r="2.2" fill="#3B7A2A" />
        </svg>
      );
    case "biggulp":
      return (
        <svg {...common}>
          <path d="M39 3l-5 22" stroke="#EE1C25" strokeWidth="4" strokeLinecap="round" />
          <rect x="12" y="20" width="40" height="6" rx="3" fill="#fff" stroke="#D0D8DD" strokeWidth="2" />
          <path d="M14 26h36l-4 34H18z" fill="#EE1C25" />
          <path d="M14 26h36l-1.2 10H15.2z" fill="#fff" />
          <path d="M17.5 42h29l-.8 7H18.3z" fill="#F58220" />
          <path d="M18.5 49h27l-.8 7H19.3z" fill="#008060" />
          <text x="32" y="34" textAnchor="middle" fontSize="7" fontWeight="900" fill="#EE1C25" fontFamily="var(--font-gsf), Arial, sans-serif">
            BIG GULP
          </text>
        </svg>
      );
    case "gaspump":
      return (
        <svg {...common}>
          <rect x="12" y="10" width="30" height="50" rx="5" fill="#008060" />
          <rect x="16" y="15" width="22" height="14" rx="3" fill="#E9F7FD" />
          <rect x="16" y="33" width="22" height="20" rx="3" fill="#00654B" />
          <path d="M42 22h6c3 0 4 1 4 4v20c0 3-2 5-5 5s-5-2-5-5V36" fill="none" stroke="#F58220" strokeWidth="4" strokeLinecap="round" />
          <rect x="18" y="35" width="18" height="3" rx="1.5" fill="#F58220" />
          <rect x="18" y="41" width="12" height="3" rx="1.5" fill="#FFA043" />
          <rect x="10" y="58" width="34" height="4" rx="2" fill="#01271E" opacity="0.6" />
        </svg>
      );
    case "fire":
      return (
        <svg {...common}>
          <path d="M32 6c2 10 10 12 10 24 0 4-1 6-2 8 6-2 10-8 10-14 0 18-6 34-18 34S14 44 14 30c0-8 4-12 8-16 0 4 2 6 4 8 0-8 4-12 6-16z" fill="#F58220" />
          <path d="M32 26c2 6 8 8 8 16 0 8-4 12-8 12s-8-4-8-12c0-6 4-8 4-12 1 3 3 4 4 5 0-4 0-7 0-9z" fill="#FFD500" />
          <path d="M32 40c1 3 3 4 3 8 0 3-1 5-3 5s-3-2-3-5c0-3 2-4 3-8z" fill="#fff" opacity="0.9" />
        </svg>
      );
    default:
      return null;
  }
}
