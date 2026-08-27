import type { Metadata } from "next";
import { orders, users } from "@/shared/mock/data";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Заказы",
};

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
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

export default function AdminOrdersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Заказы ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-zinc-400">
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Клиент</th>
                <th className="pb-3 pr-4 font-medium">Тариф</th>
                <th className="pb-3 pr-4 font-medium">Сумма</th>
                <th className="pb-3 pr-4 font-medium">Статус</th>
                <th className="pb-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3 pr-4 text-zinc-50">{order.id}</td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {users.find((u) => u.id === order.userId)?.email ?? order.userId}
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">{planLabel[order.plan]}</td>
                  <td className="py-3 pr-4 text-zinc-50">
                    {order.amount.toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="py-3 text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")}
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
