import { myLicense, orders } from "@/shared/mock/data";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

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

export default function AccountLicensesPage() {
  const myOrders = orders.filter((o) => o.userId === myLicense.userId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Моя лицензия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-zinc-50">
              {planLabel[myLicense.plan]}
            </span>
            <Badge tone={statusTone[myLicense.status]}>
              {myLicense.status === "active" ? "Активна" : myLicense.status}
            </Badge>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-zinc-500">Активирована</p>
              <p className="text-zinc-50">
                {new Date(myLicense.activatedOn).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Действует до</p>
              <p className="text-zinc-50">
                {myLicense.expiresOn
                  ? new Date(myLicense.expiresOn).toLocaleDateString("ru-RU")
                  : "—"}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Лицензия привязана к аккаунту {myLicense.userId}. Войдите в LiveSession на Windows
            этим же аккаунтом для активации.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myOrders.length === 0 && (
              <p className="text-sm text-zinc-500">Заказов пока нет.</p>
            )}
            {myOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-card p-4"
              >
                <div>
                  <p className="font-medium text-zinc-50">{planLabel[order.plan]}</p>
                  <p className="text-sm text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")} · {order.id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-50">
                    {order.amount > 0 ? `${order.amount.toLocaleString("ru-RU")} ₽` : "Бесплатно"}
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
