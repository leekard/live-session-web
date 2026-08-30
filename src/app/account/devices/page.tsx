import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { requireUser } from "@/shared/lib/auth";
import { myDevices } from "@/shared/api/client";
import { revokeDevice } from "./actions";

const planLabel: Record<string, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

export default async function AccountDevicesPage() {
  const { cookie } = await requireUser();
  const devices = await myDevices(cookie);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Устройства ({devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Авторизованных устройств пока нет. Войдите в LiveSession на Windows этим же
              аккаунтом.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-zinc-400">
                    <th className="pb-3 pr-4 font-medium">Устройство</th>
                    <th className="pb-3 pr-4 font-medium">ID</th>
                    <th className="pb-3 pr-4 font-medium">Лицензия</th>
                    <th className="pb-3 pr-4 font-medium">Последняя активность</th>
                    <th className="pb-3 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {devices.map((device) => (
                    <tr key={device.deviceId}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-50">
                            {device.status === "revoked" ? (
                              <Badge tone="danger">Отозвано</Badge>
                            ) : (
                              <Badge tone="success">Активно</Badge>
                            )}
                          </span>
                          <span className="text-zinc-300">{device.name ?? "Windows"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-zinc-400">{device.deviceId}</td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {device.license
                          ? `${planLabel[device.license.plan] ?? device.license.plan} · ${device.license.status}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {device.lastSeenAt
                          ? new Date(device.lastSeenAt).toLocaleDateString("ru-RU")
                          : "—"}
                      </td>
                      <td className="py-3">
                        {device.status === "active" ? (
                          <form action={revokeDevice.bind(null, device.deviceId)}>
                            <Button type="submit" variant="outline" size="sm">
                              Выйти
                            </Button>
                          </form>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-sm text-zinc-500">
            «Выйти» немедленно разлогинит приложение на выбранном устройстве.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
