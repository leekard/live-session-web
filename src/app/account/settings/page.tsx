import type { Metadata } from "next";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Настройки",
};

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Настройки профиля, уведомления и безопасность появятся здесь после подключения
            бэкенда. Сейчас это демонстрационные заглушки.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сменить пароль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-sm font-medium text-zinc-300">
                Текущий пароль
              </label>
              <input
                id="current-password"
                type="password"
                disabled
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
                disabled
                className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm"
              />
            </div>
            <Button type="button" disabled>
              Сохранить (недоступно)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
