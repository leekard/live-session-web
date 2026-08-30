"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !body.ok) {
      setMessage({ ok: false, text: body.message || body.error || "Не удалось сменить пароль" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage({ ok: true, text: "Пароль успешно изменён" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Управление профилем, уведомлениями и безопасностью.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сменить пароль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-sm font-medium text-zinc-300">
                Текущий пароль
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-sm font-medium text-zinc-300">
                Новый пароль
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm"
              />
            </div>
            {message && (
              <p className={message.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
