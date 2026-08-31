import { siteConfig } from "@/shared/config/site";
import { Button, Container } from "@/shared/ui";
import { DownloadButton } from "./DownloadButton";

export function Download() {
  return (
    <section id="download" className="scroll-mt-20 py-20">
      <Container className="max-w-3xl">
        <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-card p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Скачать LiveSession
          </h2>
          <p className="mt-4 max-w-xl text-lg text-zinc-400">
            Установщик для Windows ({siteConfig.platform}). Статическая сборка без
            зависимости от VC++ Redistributable.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <DownloadButton />
            <Button href="/#requirements" variant="outline" size="lg">
              Системные требования
            </Button>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Совместимо с Windows 10/11 · Лицензия активируется через аккаунт
          </p>
        </div>
      </Container>
    </section>
  );
}
