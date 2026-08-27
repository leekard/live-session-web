import { currentUser } from "@/shared/mock/data";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Имя</p>
            <p className="text-zinc-50">{currentUser.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Email</p>
            <p className="text-zinc-50">{currentUser.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Текущий тариф</p>
            <div className="flex items-center gap-2">
              <p className="text-zinc-50">{planLabel[currentUser.plan]}</p>
              <Badge tone="info">{currentUser.plan}</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500">Зарегистрирован</p>
            <p className="text-zinc-50">
              {new Date(currentUser.createdAt).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <Button href="/account/licenses" size="sm">
            Мои лицензии
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
