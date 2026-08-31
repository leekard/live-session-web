"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";

type Latest = {
  ok: boolean;
  release?: { version: string; url: string; file_name?: string };
};

export function DownloadButton() {
  const [release, setRelease] = useState<Latest["release"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/releases/latest", { cache: "no-store" })
      .then((res) => res.json().catch(() => null))
      .then((data: Latest | null) => {
        if (cancelled) return;
        if (data && data.ok && data.release) setRelease(data.release);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Пока актуальный релиз не опубликован — кнопка неактивна (не ведёт на тарифы).
  if (!release) {
    return (
      <Button size="lg" disabled>
        Скоро
      </Button>
    );
  }

  return (
    <Button href={release.url} size="lg">
      Скачать установщик v{release.version}
    </Button>
  );
}
