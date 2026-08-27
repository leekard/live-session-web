import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { cx } from "@/shared/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-blue text-white hover:bg-accent-blue-hover",
  secondary:
    "bg-card text-zinc-100 border border-border-subtle hover:bg-card-hover",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800",
  outline:
    "border border-zinc-700 text-zinc-100 hover:bg-zinc-800",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-blue focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export function Button(props: ButtonProps) {
  const classes = cx(
    base,
    variants[props.variant ?? "primary"],
    sizes[props.size ?? "md"],
    props.className,
  );

  if ("href" in props && props.href) {
    const {
      href: _href,
      variant: _variant,
      size: _size,
      className: _className,
      children: _children,
      ...rest
    } = props;
    return (
      <Link href={props.href} className={classes} {...rest}>
        {props.children}
      </Link>
    );
  }

  const {
    href: _href,
    variant: _variant,
    size: _size,
    className: _className,
    children: _children,
    ...rest
  } = props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {props.children}
    </button>
  );
}
