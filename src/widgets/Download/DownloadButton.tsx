"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { siteConfig } from "@/shared/config/site";

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

  const href = release?.url ?? siteConfig.downloadUrl;
  const version = release?.version ?? siteConfig.appVersion;

  return (
    <Button href={href} size="lg">
      Скачать установщик v{version}
    </Button>
  );
}
