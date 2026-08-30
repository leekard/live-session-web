"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

function DeviceLoginInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const [state, setState] = useState<"idle" | "approved" | "denied" | "error">("idle");
  const [error, setError] = useState("");

  async function confirm(approve: boolean) {
    setError("");
    const res = await fetch("/api/auth/device/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, approve }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      setState("error");
      setError(body.error || "Ошибка");
      return;
    }
    setState(approve ? "approved" : "denied");
  }

  if (!code) {
    return <p className="text-sm text-zinc-400">Нет кода подтверждения.</p>;
  }

  if (state === "approved") {
    return (
      <p className="text-sm text-zinc-50">
        Вход подтверждён. Можете закрыть эту вкладку и вернуться в приложение.
      </p>
    );
  }
  if (state === "denied") {
    return <p className="text-sm text-zinc-50">Вход отклонён.</p>;
  }
  if (state === "error") {
    return <p className="text-sm text-red-400">Ошибка: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Приложение пытается войти в ваш аккаунт. Подтвердите, чтобы продолжить.
      </p>
      <p className="text-xs text-zinc-500">Код: {code}</p>
      <div className="flex gap-3">
        <Button onClick={() => confirm(true)}>Подтвердить вход</Button>
        <Button variant="outline" onClick={() => confirm(false)}>
          Отклонить
        </Button>
      </div>
    </div>
  );
}

export default function DeviceLoginPage() {
  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение входа</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-zinc-400">Загрузка...</p>}>
            <DeviceLoginInner />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
