"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const back = searchParams.get("back") || "/account";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      setError(body.message || body.error || "Ошибка");
      return;
    }
    router.push(back);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход в LiveSession</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 rounded-md bg-card p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m ? "bg-accent-blue text-white" : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {m === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm text-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-border-subtle bg-card px-3 py-2 text-sm text-zinc-50"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-16">
      <Suspense fallback={<p className="text-sm text-zinc-400">Загрузка...</p>}>
        <LoginInner />
      </Suspense>
    </div>
  );
}
