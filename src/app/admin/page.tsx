import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth";
import { adminStats, adminOrders, adminUsers } from "@/shared/api/client";
import { LicensePlanChart } from "@/widgets";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Дашборд",
};

export default async function AdminDashboardPage() {
  const { cookie } = await requireAdmin();
  const [stats, orders, users] = await Promise.all([
    adminStats(cookie),
    adminOrders(cookie),
    adminUsers(cookie),
  ]);

  const activeLicenses = stats?.licensesByStatus.active ?? 0;
  const statCards = [
    { label: "Пользователи", value: stats?.users ?? 0, href: "/admin/users" },
    { label: "Активные лицензии", value: activeLicenses, href: "/admin/licenses" },
    { label: "Заказы", value: orders.length, href: "/admin/orders" },
    { label: "Доход", value: `${(stats?.revenue ?? 0).toLocaleString("ru-RU")} ₽`, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-zinc-50">{stat.value}</p>
              <Button href={stat.href} variant="ghost" size="sm" className="mt-3 px-0">
                Подробнее →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Типы используемых лицензий</CardTitle>
        </CardHeader>
        <CardContent>
          <LicensePlanChart counts={stats?.licensesByPlan} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border-subtle">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-zinc-50">{order.id}</p>
                  <p className="text-sm text-zinc-400">
                    {users.find((u) => u.id === order.user_id)?.email ?? String(order.user_id)} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="font-semibold text-zinc-50">{Number(order.amount).toLocaleString("ru-RU")} ₽</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
