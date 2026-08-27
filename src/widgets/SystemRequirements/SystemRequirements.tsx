import { Container } from "@/shared/ui";

type Requirement = {
  title: string;
  value: string;
};

const requirements: Requirement[] = [
  { title: "Операционная система", value: "Windows 10 или Windows 11 (64-бит)" },
  { title: "Звук", value: "Звуковое устройство; ASIO для мульти-выходного роутинга" },
  { title: "Аудиофайлы", value: "MP3 (точная длительность по скану заголовков кадров)" },
  { title: "Процессор", value: "2 ядра и выше, 64-бит" },
  { title: "Память", value: "4 ГБ ОЗУ рекомендуется" },
  { title: "Место на диске", value: "~200 МБ; кэш волны по мере работы" },
];

export function SystemRequirements() {
  return (
    <section id="requirements" className="scroll-mt-20 bg-background-darker py-20">
      <Container className="max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Системные требования
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            LiveSession — нативное Windows-приложение, не требует установки дополнительных
            библиотек.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {requirements.map((req) => (
            <div
              key={req.title}
              className="rounded-xl border border-border-subtle bg-card p-5"
            >
              <p className="text-sm font-medium text-accent-blue">{req.title}</p>
              <p className="mt-1 text-zinc-200">{req.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
