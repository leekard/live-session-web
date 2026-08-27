"use client";

import { useState } from "react";
import Image from "next/image";
import editMode from "@/shared/assets/screens/edit-mode.png";
import liveMode from "@/shared/assets/screens/live-mode.png";
import { cx } from "@/shared/lib/cx";

type Mode = {
  id: "edit" | "live";
  label: string;
  src: typeof editMode;
  alt: string;
};

const modes: Mode[] = [
  {
    id: "edit",
    label: "Редактирование",
    src: editMode,
    alt: "LiveSession в режиме редактирования: блоки, треки и совмещённая волна",
  },
  {
    id: "live",
    label: "Лайв режим",
    src: liveMode,
    alt: "LiveSession в лайв-режиме: метроном, микшер и мульти-выходной роутинг",
  },
];

export function AppShowcase() {
  const [activeId, setActiveId] = useState<Mode["id"]>("edit");
  const active = modes.find((m) => m.id === activeId) ?? modes[0];

  return (
    <div className="relative mt-12 w-full max-w-4xl">
      <div role="tablist" aria-label="Режимы приложения" className="mb-5 flex justify-center">
        <div className="inline-flex rounded-lg border border-border-subtle bg-card p-1">
          {modes.map((mode) => {
            const isActive = mode.id === activeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(mode.id)}
                className={cx(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-blue text-white"
                    : "text-zinc-400 hover:text-zinc-100",
                )}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-accent-blue/10 blur-2xl" />
      <div className="overflow-hidden rounded-xl border border-zinc-700/60 bg-background-darker shadow-2xl shadow-black/60 ring-1 ring-white/10">
        <Image
          key={active.id}
          src={active.src}
          alt={active.alt}
          priority
          className="h-auto w-full"
          sizes="(min-width: 896px) 896px, 100vw"
        />
      </div>
    </div>
  );
}
