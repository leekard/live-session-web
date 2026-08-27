import { Container } from "@/shared/ui";

type Feature = {
  title: string;
  description: string;
  icon: string;
};

const features: Feature[] = [
  {
    title: "Блоки → Треки → Дорожки",
    description:
      "Трёхуровневая организация материала: блоки и треки переименовываются, все настройки сохраняются между запусками.",
    icon: "◫",
  },
  {
    title: "Совмещённая волна",
    description:
      "Пики всех дорожек агрегируются асинхронно, на волне — сетка тактов и линия плейхеда. Длительность MP3 определяется точным сканом заголовков кадров.",
    icon: "∿",
  },
  {
    title: "Синтезируемый метроном",
    description:
      "Метроном синтезируется в реальном времени на BPM-сетке (20–999 BPM) без временных файлов — щелчок всегда точен.",
    icon: "♩",
  },
  {
    title: "Микшер на стрипах",
    description:
      "Громкость, панорама, solo/mute и VU-метр на каждом канале. Состояние микшера персистентно и переживает перестановку стрипов.",
    icon: "≡",
  },
  {
    title: "Мульти-выходной роутинг",
    description:
      "Каждый стрип (метроном и файлы) выводится на свою пару выходов устройства (OUT 1-2, 3-4…) через ASIO. Звук переезжает на лету.",
    icon: "⇄",
  },
  {
    title: "Группы и автовыравнивание",
    description:
      "Группы инструментов с иконками и drag-and-drop. Автовыравнивание громкости по BS.1770 с потолком пика −1 dBFS.",
    icon: "◈",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Возможности LiveSession
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Всё для подготовки и проведения живых сессий — в одном Windows-приложении.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border-subtle bg-card p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card-hover text-2xl text-accent-blue">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-50">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
