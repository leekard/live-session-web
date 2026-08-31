import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth";
import { adminLicenses, adminUsers } from "@/shared/api/client";
import { issueLicense, setLicenseStatus } from "./actions";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Лицензии",
};

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  expired: "warning",
  revoked: "danger",
};

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
  founder: "Founder",
};

export default async function AdminLicensesPage() {
  const { cookie } = await requireAdmin();
  const [licenses, users] = await Promise.all([adminLicenses(cookie), adminUsers(cookie)]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Выдать лицензию</CardTitle>
        </CardHeader>
        <CardContent>
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
                className="h-10 rounded-md border border-border-subtle bg-card px-3 text-zinc-100"
              >
                {(Object.keys(planLabel) as (keyof typeof planLabel)[]).map((p) => (
                  <option key={p} value={p}>
                    {planLabel[p]}
                  </option>
                ))}
              </select>
            </label>
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
            <Button type="submit" size="sm">
              Выдать
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Лицензии ({licenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Пользователь</th>
                  <th className="pb-3 pr-4 font-medium">Тариф</th>
                  <th className="pb-3 pr-4 font-medium">Статус</th>
                  <th className="pb-3 pr-4 font-medium">Действует до</th>
                  <th className="pb-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {licenses.map((license) => (
                  <tr key={license.id}>
                    <td className="py-3 pr-4 text-zinc-50">{license.id}</td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {users.find((u) => u.id === license.user_id)?.email ?? String(license.user_id)}
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">{planLabel[license.plan] ?? license.plan}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={statusTone[license.status]}>{license.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {license.expires_at
                        ? new Date(license.expires_at).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td className="py-3">
                      {license.status === "active" ? (
                        <form action={setLicenseStatus.bind(null, license.id, "revoked")}>
                          <Button type="submit" variant="outline" size="sm">
                            Отозвать
                          </Button>
                        </form>
                      ) : (
                        <form action={setLicenseStatus.bind(null, license.id, "active")}>
                          <Button type="submit" variant="outline" size="sm">
                            Возобновить
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
