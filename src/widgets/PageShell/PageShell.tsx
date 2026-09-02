"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Container } from "@/shared/ui";
import { cx } from "@/shared/lib/cx";
import type { NavItem } from "@/shared/config/site";

type PageShellProps = {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
};

export function PageShell({ title, nav, children }: PageShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border-subtle bg-card">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-50">
            <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            {title}
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            ← На сайт
          </Link>
        </Container>
      </header>
      <Container className="flex flex-1 flex-col gap-8 py-8 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const isActive =
                item.href === pathname ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-card text-zinc-50 ring-1 ring-border-subtle"
                      : "text-zinc-400 hover:bg-card hover:text-zinc-100",
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </Container>
    </div>
  );
}
