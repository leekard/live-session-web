import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { requireAdmin } from "@/shared/lib/auth";
import { adminPlanLimits } from "@/shared/api/client";
import { savePlanLimit } from "./actions";

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default async function AdminLimitsPage() {
  const { cookie } = await requireAdmin();
  const limits = await adminPlanLimits(cookie);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Лимиты устройств по тарифам</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-zinc-400">
          Количество одновременно активных устройств на один аккаунт. 0 — без ограничений.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-zinc-400">
                <th className="pb-3 pr-4 font-medium">Тариф</th>
                <th className="pb-3 pr-4 font-medium">Лимит</th>
                <th className="pb-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {limits.map((limit) => (
                <tr key={limit.plan}>
                  <td className="py-3 pr-4">
                    <span className="text-zinc-50">{planLabel[limit.plan] ?? limit.plan}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <form
                      action={savePlanLimit.bind(null, limit.plan)}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="number"
                        name="deviceLimit"
                        min={0}
                        defaultValue={limit.device_limit}
                        className="w-24 rounded-md border border-border-subtle bg-card px-3 py-1.5 text-sm text-zinc-50"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Сохранить
                      </Button>
                    </form>
                  </td>
                  <td className="py-3">
                    <Badge tone={limit.device_limit === 0 ? "neutral" : "success"}>
                      {limit.device_limit === 0 ? "Безлимит" : `${limit.device_limit} уст.`}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
