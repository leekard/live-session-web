import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth";
import { adminUsers } from "@/shared/api/client";
import { deleteUser } from "./actions";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Пользователи",
};

const protectedEmails = [
  "beloglazov.roma2017@yandex.ru",
  "sergey.kul8@gmail.com",
];

export default async function AdminUsersPage() {
  const { cookie } = await requireAdmin();
  const users = await adminUsers(cookie);

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
                <th className="pb-3 pr-4 font-medium">ID</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Роль</th>
                <th className="pb-3 pr-4 font-medium">Регистрация</th>
                <th className="pb-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 text-zinc-50">{user.id}</td>
                  <td className="py-3 pr-4 text-zinc-400">{user.email}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.role === "admin" ? "warning" : "neutral"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-3">
                    {protectedEmails.includes(user.email) ? (
                      <span className="text-xs text-zinc-500">Защищён</span>
                    ) : (
                      <form action={deleteUser.bind(null, user.id)}>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:bg-red-950/40"
                        >
                          Удалить
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
  );
}
