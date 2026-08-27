import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props}>
      {children}
    </div>
  );
}
