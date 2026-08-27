import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-800 text-zinc-300",
  success: "bg-emerald-900/60 text-emerald-300",
  warning: "bg-amber-900/60 text-amber-300",
  danger: "bg-red-900/60 text-red-300",
  info: "bg-accent-blue/20 text-accent-blue",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  children: ReactNode;
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
