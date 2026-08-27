import { Button, Container } from "@/shared/ui";
import { cx } from "@/shared/lib/cx";
import type { PlanType } from "@/shared/mock/types";

type Plan = {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

const plans: Plan[] = [
  {
    id: "basic",
    name: "Базовый",
    price: 2900,
    period: "в год",
    description: "Для первых живых сессий и репетиций.",
    features: [
      "До 8 аудиодорожек",
      "Метроном на BPM-сетке",
      "Микшер: громкость, панорама, solo/mute",
      "1 рабочее устройство",
      "Поддержка по email",
    ],
    cta: "Выбрать",
  },
  {
    id: "pro",
    name: "Профессиональный",
    price: 5900,
    period: "в год",
    description: "Для активных музыкантов и небольших групп.",
    features: [
      "Безлимит аудиодорожек",
      "Мульти-выходной ASIO-роутинг",
      "Совмещённая волна с сеткой тактов",
      "Группы инструментов и автовыравнивание",
      "3 рабочих устройства",
      "Приоритетная поддержка",
    ],
    highlighted: true,
    cta: "Купить",
  },
  {
    id: "team",
    name: "Командный",
    price: 14900,
    period: "в год",
    description: "Для студий и музыкальных проектов.",
    features: [
      "Все функции Pro",
      "Безлимит рабочих устройств",
      "Общие настройки проектов",
      "Версия для нескольких участников",
      "Персональный менеджер",
      "SLA-поддержка",
    ],
    cta: "Купить",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-background-darker py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Тарифы
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Выберите подходящий план. Лицензия привязывается к вашему аккаунту и
            работает на Windows.
          </p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cx(
                "relative flex flex-col rounded-2xl border bg-card p-6",
                plan.highlighted
                  ? "border-accent-blue shadow-xl shadow-accent-blue/10"
                  : "border-border-subtle",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-blue px-3 py-0.5 text-xs font-medium text-white">
                  Популярный
                </span>
              )}
              <h3 className="text-lg font-semibold text-zinc-50">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-zinc-50">
                  {plan.price.toLocaleString("ru-RU")} ₽
                </span>
                <span className="text-sm text-zinc-400">/ {plan.period}</span>
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-zinc-400">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                href="/account"
                variant={plan.highlighted ? "primary" : "outline"}
                className="mt-8"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
