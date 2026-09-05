import type { Metadata } from "next";
import { requireAdmin } from "@/shared/lib/auth";
import { adminReleases } from "@/shared/api/client";
import { publishRelease, deleteRelease } from "./actions";
import UploadForm from "./UploadForm";
import { NotesButton } from "./NotesButton";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Релизы",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default async function AdminReleasesPage() {
  const { cookie } = await requireAdmin();
  const releases = await adminReleases(cookie);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Загрузить установщик</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm />
          <p className="mt-3 text-xs text-zinc-500">
            Загруженный установщик будет опубликован отдельной кнопкой. Версия должна быть новее текущей.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Релизы ({releases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">Версия</th>
                  <th className="pb-3 pr-4 font-medium">Файл</th>
                  <th className="pb-3 pr-4 font-medium">Размер</th>
                  <th className="pb-3 pr-4 font-medium">Статус</th>
                  <th className="pb-3 pr-4 font-medium">Заметки</th>
                  <th className="pb-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {releases.map((release) => (
                  <tr key={release.id}>
                    <td className="py-3 pr-4 text-zinc-50">v{release.version}</td>
                    <td className="py-3 pr-4 text-zinc-400">{release.file_name}</td>
                    <td className="py-3 pr-4 text-zinc-400">{formatBytes(release.file_size)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={release.published ? "success" : "neutral"}>
                        {release.published ? "Опубликован" : "Черновик"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <NotesButton version={release.version} notes={release.notes} />
                    </td>
                    <td className="py-3">
                      {!release.published ? (
                        <form action={publishRelease.bind(null, release.id)}>
                          <Button type="submit" variant="outline" size="sm">
                            Выпустить обновление
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          {release.published_at
                            ? new Date(release.published_at).toLocaleString("ru-RU")
                            : "—"}
                        </span>
                      )}
                      <form action={deleteRelease.bind(null, release.id)} className="mt-2">
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:bg-red-950/40"
                        >
                          Удалить
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
