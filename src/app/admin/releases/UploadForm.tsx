"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shared/ui";

export default function UploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const version = String(formData.get("version") || "");
    const file = formData.get("file");
    if (!/^\d+(\.\d+){1,2}$/.test(version)) {
      setError("Укажите версию в формате x.y[.z]");
      return;
    }
    if (!(file instanceof File) || file.size === 0) {
      setError("Выберите файл установщика (.exe)");
      return;
    }

    setPending(true);
    setError(null);
    try {
      // Прямой multipart-post на бэкенд: nginx направляет /api/* на контейнер api,
      // админ-кука (HttpOnly, SameSite=Lax) уходит автоматически, бэкенд берёт её.
      const res = await fetch("/api/admin/releases", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok !== true) {
        setError((body as { message?: string }).message || (body as { error?: string }).error || "Ошибка загрузки");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("Не удалось выполнить запрос");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Версия
        <input
          type="text"
          name="version"
          placeholder="1.0.8"
          required
          pattern="\d+(\.\d+){1,2}"
          className="h-10 rounded-md border border-border-subtle bg-card px-3 text-zinc-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Файл (.exe)
        <input
          type="file"
          name="file"
          accept=".exe"
          required
          className="block w-72 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-zinc-100 hover:file:bg-zinc-600"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Загрузка…" : "Загрузить"}
      </Button>
      <label className="flex w-full flex-col gap-1 text-sm text-zinc-400">
        Заметки об обновлении (необязательно)
        <textarea
          name="notes"
          rows={6}
          placeholder={"Что нового:\n- исправлено\n- добавлено"}
          className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm text-zinc-50"
        />
      </label>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
