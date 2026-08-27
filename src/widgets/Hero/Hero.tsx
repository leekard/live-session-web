import background from "@/shared/assets/background.svg";
import { siteConfig } from "@/shared/config/site";
import { AppShowcase } from "@/widgets/AppShowcase";
import { Button, Container } from "@/shared/ui";

const highlights = [
  "Загрузка аудиодорожек",
  "Совмещённая волна с сеткой тактов",
  "Синтезируемый метроном",
  "Независимый вывод каналов",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative vector background; next/image doesn't optimize SVG */}
      <img
        src={(background as { src?: string }).src ?? String(background)}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-background" />
      <Container className="flex flex-col items-center py-28 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-background/70 px-3 py-1 text-xs font-medium text-zinc-300">
          Готово к установке · v{siteConfig.appVersion} · {siteConfig.platform}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
          LiveSession — репетиции и{" "}
          <span className="text-accent-blue">живые сессии</span> на десктопе
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          Загружайте аудиодорожки, работайте с совмещённой волной и сеткой тактов,
          играйте под синтезируемый метроном и выводите каждый канал на свою пару
          выходов аудиоустройства.
        </p>
        <AppShowcase />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/#pricing" size="lg">
            Купить лицензию
          </Button>
          <Button href="/#features" variant="outline" size="lg">
            Узнать больше
          </Button>
        </div>
        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-400">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
