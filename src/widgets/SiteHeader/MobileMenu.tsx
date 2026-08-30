"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/shared/config/site";
import type { User } from "@/shared/api/types";
import { Button } from "@/shared/ui";
import { LogoutButton } from "./LogoutButton";

type Props = {
  nav: NavItem[];
  user: User | null;
  accountHref: string;
};

export function MobileMenu({ nav, user, accountHref }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label="Меню"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border-subtle bg-card p-2 shadow-xl">
          <nav className="flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex flex-col gap-1 border-t border-border-subtle pt-2">
            {user ? (
              <>
                <Button
                  href={accountHref}
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Профиль
                </Button>
                <LogoutButton />
              </>
            ) : (
              <Button href="/account" variant="ghost" size="sm">
                Войти
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
