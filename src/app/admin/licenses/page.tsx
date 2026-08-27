import type { Metadata } from "next";
import { licenses, users } from "@/shared/mock/data";
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
};

export default function AdminLicensesPage() {
  return (
    <div className="space-y-6">
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
                      {users.find((u) => u.id === license.userId)?.email ?? license.userId}
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">{planLabel[license.plan]}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={statusTone[license.status]}>{license.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {license.expiresOn
                        ? new Date(license.expiresOn).toLocaleDateString("ru-RU")
                        : "—"}
                    </td>
                    <td className="py-3">
                      <Button variant="outline" size="sm" disabled>
                        Отозвать
                      </Button>
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
