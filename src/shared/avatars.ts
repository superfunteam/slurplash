export type AvatarId =
  | "donut"
  | "taquito"
  | "slurpee"
  | "bigbite"
  | "coffee"
  | "pizza"
  | "redbull"
  | "nachos";

export interface AvatarMeta {
  id: AvatarId;
  name: string;
  /** brand-tinted accent used behind the icon */
  tint: string;
}

export const AVATARS: AvatarMeta[] = [
  { id: "slurpee", name: "Slurpee", tint: "#00A3E0" },
  { id: "donut", name: "Glazed Donut", tint: "#F9B4C9" },
  { id: "taquito", name: "Taquito", tint: "#F58220" },
  { id: "bigbite", name: "Big Bite", tint: "#EE1C25" },
  { id: "coffee", name: "Coffee", tint: "#8B5A2B" },
  { id: "pizza", name: "Pizza", tint: "#FFC93C" },
  { id: "redbull", name: "Red Bull", tint: "#1F4FD6" },
  { id: "nachos", name: "Nachos", tint: "#FFB000" },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

export function avatarMeta(id: AvatarId): AvatarMeta {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export type ReactionId = "coffee" | "biggulp" | "taquito" | "gaspump" | "slurpee" | "fire";

export const REACTIONS: { id: ReactionId; name: string }[] = [
  { id: "slurpee", name: "Slurpee" },
  { id: "biggulp", name: "Big Gulp" },
  { id: "taquito", name: "Taquito" },
  { id: "coffee", name: "Coffee" },
  { id: "gaspump", name: "Gas Pump" },
  { id: "fire", name: "Fire" },
];
