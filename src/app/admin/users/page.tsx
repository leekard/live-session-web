import type { Metadata } from "next";
import { users } from "@/shared/mock/data";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Пользователи",
};

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default function AdminUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Пользователи ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-zinc-400">
                <th className="pb-3 pr-4 font-medium">Имя</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Роль</th>
                <th className="pb-3 pr-4 font-medium">Тариф</th>
                <th className="pb-3 font-medium">Регистрация</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 text-zinc-50">{user.name}</td>
                  <td className="py-3 pr-4 text-zinc-400">{user.email}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.role === "admin" ? "warning" : "neutral"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">{planLabel[user.plan]}</td>
                  <td className="py-3 text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
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
