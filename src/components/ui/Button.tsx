"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "green" | "blue" | "cherry" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-seven-orange text-white shadow-[0_6px_0_0_#B8560C] hover:bg-seven-orange-bright",
  secondary: "bg-white text-seven-green-dark shadow-[0_6px_0_0_#CFC6B3] hover:bg-cream",
  ghost: "bg-white/10 text-white border border-white/20 hover:bg-white/15 shadow-none",
  green: "bg-seven-green text-white shadow-[0_6px_0_0_#004D38] hover:bg-seven-green-bright",
  blue: "bg-slurpee-blue text-white shadow-[0_6px_0_0_#0A6A98] hover:brightness-110",
  cherry: "bg-slurpee-cherry text-white shadow-[0_6px_0_0_#8F0E14] hover:brightness-110",
  danger: "bg-seven-red text-white shadow-[0_6px_0_0_#8F0E14] hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm rounded-2xl gap-1.5",
  md: "h-12 px-5 text-base rounded-2xl gap-2",
  lg: "h-14 px-7 text-lg rounded-[1.25rem] gap-2.5",
  xl: "h-[4.25rem] px-9 text-xl rounded-[1.5rem] gap-3",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", block = false, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { y: 5, scale: 0.985, boxShadow: "0 1px 0 0 rgba(0,0,0,0.25)" }}
      transition={{ type: "spring", stiffness: 700, damping: 30 }}
      disabled={disabled}
      className={[
        "display-soft inline-flex select-none items-center justify-center whitespace-nowrap font-bold leading-none",
        "transition-[filter,background-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60",
        VARIANTS[variant],
        SIZES[size],
        block ? "w-full" : "",
        disabled ? "cursor-not-allowed opacity-50 saturate-50" : "cursor-pointer",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
