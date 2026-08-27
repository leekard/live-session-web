"use client";

import { useState } from "react";
import { Container } from "@/shared/ui";
import { cx } from "@/shared/lib/cx";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "Как активировать лицензию?",
    answer:
      "После оплаты лицензия привязывается к вашему аккаунту. Осталось войти в LiveSession на десктопе (Windows) тем же аккаунтом — приложение активируется автоматически.",
  },
  {
    question: "На каких платформах работает приложение?",
    answer:
      "LiveSession — Windows-приложение (Windows 10/11). Для вывода нескольких каналов по мульти-выходному роутингу требуется ASIO-совместимое аудиоустройство.",
  },
  {
    question: "Нужен ли мне ASIO-драйвер?",
    answer:
      "Для базовой работы достаточно стандартного звука Windows. Мульти-выходной роутинг (каждый канал на свою пару выходов) использует ASIO — понадобится ASIO-совместимое устройство вывода, например аудиоинтерфейс.",
  },
  {
    question: "Можно ли перенести лицензию на другой компьютер?",
    answer:
      "Да. Лицензия привязана к аккаунту, а не к конкретному устройству, поэтому вы можете войти на новом компьютере в любой момент (лимит устройств зависит от тарифа).",
  },
  {
    question: "Где хранятся мои данные?",
    answer:
      "Все данные локальные: настройки блоков, треков и микшера — в %APPDATA%/LiveSession/settings.json, кэш волны — в %APPDATA%/LiveSession/WaveCache. Ничего не отправляется в облако.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Частые вопросы
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-xl border border-border-subtle bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-zinc-50">{item.question}</span>
                  <span
                    className={cx(
                      "text-xl text-zinc-500 transition-transform",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-6 text-zinc-400">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
