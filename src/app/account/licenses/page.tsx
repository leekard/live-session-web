import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { requireUser } from "@/shared/lib/auth";
import { myLicenses, myOrders } from "@/shared/api/client";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  expired: "warning",
  revoked: "danger",
  pending: "neutral",
  paid: "success",
  cancelled: "neutral",
  refunded: "danger",
};

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default async function AccountLicensesPage() {
  const { cookie } = await requireUser();
  const [licenses, orders] = await Promise.all([myLicenses(cookie), myOrders(cookie)]);
  const license = licenses[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Моя лицензия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {license ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-zinc-50">
                  {planLabel[license.plan] ?? license.plan}
                </span>
                <Badge tone={statusTone[license.status]}>
                  {license.status === "active" ? "Активна" : license.status}
                </Badge>
              </div>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-zinc-500">Активирована</p>
                  <p className="text-zinc-50">
                    {license.activated_at
                      ? new Date(license.activated_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Действует до</p>
                  <p className="text-zinc-50">
                    {license.expires_at
                      ? new Date(license.expires_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </p>
                </div>
              </div>
              {license.license_key && (
                <p className="text-sm text-zinc-400">
                  Ключ лицензии: <span className="font-mono text-zinc-200">{license.license_key}</span>
                </p>
              )}
              <p className="text-sm text-zinc-400">
                Войдите в LiveSession на Windows этим же аккаунтом для активации.
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">Лицензий пока нет.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="text-sm text-zinc-500">Заказов пока нет.</p>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-card p-4"
              >
                <div>
                  <p className="font-medium text-zinc-50">{planLabel[order.plan] ?? order.plan}</p>
                  <p className="text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString("ru-RU")} · {order.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-50">
                    {Number(order.amount) > 0
                      ? `${Number(order.amount).toLocaleString("ru-RU")} ₽`
                      : "Бесплатно"}
                  </span>
                  <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <Button href="/#pricing" variant="outline" className="mt-5" size="sm">
            Продлить или сменить тариф
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
