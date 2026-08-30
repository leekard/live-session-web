import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { requireUser } from "@/shared/lib/auth";

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default async function AccountPage() {
  const { user } = await requireUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Email</p>
            <p className="text-zinc-50">{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Роль</p>
            <Badge tone={user.role === "admin" ? "warning" : "neutral"}>{user.role}</Badge>
          </div>
          <Button href="/account/licenses" size="sm">
            Мои лицензии
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
