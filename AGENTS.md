# Проектный контекст (из предыдущих сессий)

## Проект
- Next.js 16.3.3, React 19.2.8, TypeScript strict, Tailwind CSS v4, FSD (`src/shared|entities|features|widgets|app`).
- Реальный продукт: Windows-аудио-приложение **LiveSession** (C++20/JUCE, v1.0.7) — репетиции/живые сессии: блоки→треки, совмещённая волна с сеткой тактов, синтезируемый метроном, микшер, независимый вывод каналов (ASIO-роутинг), группы.
- npm в PowerShell запускается только через `npm.cmd` (PowerShell блокирует npm.ps1).
- `next.config.ts` → `output: "standalone"` (self-hosted Docker).
- Тёмные токены в `src/app/globals.css` через `@theme inline`: `accent-blue #748bd5`, `accent-orange #ff832b`, `background #0a0a0a`, `card #111111`, `border-subtle #222222`.
- Лендинг: Hero (widget `AppShowcase` — вкладки «Редактирование»/«Лайв режим» с переключением скриншотов), Features, Pricing, Download, SystemRequirements, Faq + заглушки ЛК `/account` и админки `/admin`. `/account`, `/admin` — `noindex`.
- UI-kit в `src/shared/ui`: `Button`, `Badge`, `Card`, `Container`. Сборка и lint чистые.

## Деплой / инфраструктура
- Self-hosted Linux (Ubuntu): IP `151.245.217.113`, SSH root / порт 22.
- **Amnezia VPN на сервере — НЕ ТРОГАТЬ**: 3 Docker-контейнера `amnezia-xray` (TCP 443), `amnezia-awg` (UDP 34614), `amnezia-awg2` (UDP 34848). Не останавливать/не удалять.
- Сайт: Docker-контейнер `live-session-web`, папка `/opt/live-session-web`, порт `8080` → `http://151.245.217.113:8080`.
- Репо: `https://github.com/leekard/live-session-web.git`, ветка `main`.
- **Автодеплой**: push в `main` → GitHub Actions (`.github/workflows/deploy.yml`) → SSH → `cd /opt/live-session-web && git pull origin main && docker compose up -d --build`. Секреты GitHub: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
- Ручное обновление на сервере: `cd /opt/live-session-web && git pull && docker compose up -d --build`.

## SSH-доступ из этой среды
- OpenSSH на Windows не умеет неинтерактивный пароль → применяю **paramiko** через хелпер `C:\Users\user\AppData\Local\Temp\opencode\ssh_run.py` (root-пароль внутри скрипта, IP/порт 22).
- Перед запуском `py ...` выставлять `$env:PYTHONIOENCODING="utf-8"`, иначе stdout в cp1251 падает на юникоде (напр. `▲`).
- Для автодеплоя создан отдельный ed25519-ключ, добавлен в `/root/.ssh/authorized_keys` на сервере; локальная копия удалена (приватный ключ живёт в GitHub secrets, локально не нужен).
- `gh` CLI авторизован как `leekard`, доступны `gh run`, `gh secret set/list` для репо `leekard/live-session-web`.

## Безопасность (заметка)
- Рекомендуется перевести вход на сервер с пароля на SSH-ключ (пароль root был указан ранее в чате).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
