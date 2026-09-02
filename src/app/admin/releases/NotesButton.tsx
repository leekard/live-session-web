"use client";

import { useState } from "react";
import { Button, Modal } from "@/shared/ui";

type Props = {
  version: string;
  notes: string | null;
};

export function NotesButton({ version, notes }: Props) {
  const [open, setOpen] = useState(false);

  if (!notes) {
    return <span className="text-zinc-500">—</span>;
  }

  const preview = notes.split("\n")[0] || "";

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="max-w-[220px] truncate text-zinc-400">{preview}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Показать
        </Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={`Патчноут v${version}`}>
        <pre className="whitespace-pre-wrap break-words font-sans">{notes}</pre>
      </Modal>
    </>
  );
}
