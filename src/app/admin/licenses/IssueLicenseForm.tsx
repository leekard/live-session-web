"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { issueLicense } from "./actions";
import type { AdminUser } from "@/shared/api/types";

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
  founder: "Founder",
};

type Props = {
  users: AdminUser[];
};

export function IssueLicenseForm({ users }: Props) {
  const [plan, setPlan] = useState("pro");

  return (
    <form action={issueLicense} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Пользователь
        <select
          name="userId"
          required
          className="h-10 rounded-md border border-border-subtle bg-card px-3 text-zinc-100"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Тариф
        <select
          name="plan"
          defaultValue="pro"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="h-10 rounded-md border border-border-subtle bg-card px-3 text-zinc-100"
        >
          {Object.entries(planLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {plan !== "founder" && (
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Месяцев
          <select
            name="months"
            defaultValue="12"
            className="h-10 rounded-md border border-border-subtle bg-card px-3 text-zinc-100"
          >
            {[1, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      )}
      <Button type="submit" size="sm">
        Выдать
      </Button>
    </form>
  );
}
