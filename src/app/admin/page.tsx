import type { Metadata } from "next";
import { licenses, orders, users } from "@/shared/mock/data";
import { LicensePlanChart } from "@/widgets";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Дашборд",
};

const stats = [
  {
    label: "Пользователи",
    value: users.length,
    href: "/admin/users",
  },
  {
    label: "Активные лицензии",
    value: licenses.filter((l) => l.status === "active").length,
    href: "/admin/licenses",
  },
  {
    label: "Заказы",
    value: orders.length,
    href: "/admin/orders",
  },
  {
    label: "Доход",
    value: `${orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.amount, 0)
      .toLocaleString("ru-RU")} ₽`,
    href: "/admin/orders",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
          <LicensePlanChart />
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
                    {users.find((u) => u.id === order.userId)?.email ?? order.userId} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <p className="font-semibold text-zinc-50">
                  {order.amount.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
