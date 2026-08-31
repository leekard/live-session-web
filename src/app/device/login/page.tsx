import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { getSession } from "@/shared/lib/auth";
import { DeviceLoginConfirm } from "./DeviceLoginConfirm";

export default async function DeviceLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const codeParam = (await searchParams).code;
  const code = typeof codeParam === "string" ? codeParam : "";

  if (!code) {
    return (
      <div className="mx-auto max-w-md py-16">
        <Card>
          <CardHeader>
            <CardTitle>Подтверждение входа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">Нет кода подтверждения.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Браузер не авторизован на сайте — сначала форма входа, затем возврат
  // сюда на подтверждение устройства (параметр back).
  const { user } = await getSession();
  if (!user) {
    redirect(`/login?back=${encodeURIComponent(`/device/login?code=${code}`)}`);
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение входа</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceLoginConfirm code={code} />
        </CardContent>
      </Card>
    </div>
  );
}
