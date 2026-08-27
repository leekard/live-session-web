import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-border-subtle bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cx("border-b border-border-subtle p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cx("text-lg font-semibold text-zinc-50", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cx("p-5", className)} {...props}>
      {children}
    </div>
  );
}
