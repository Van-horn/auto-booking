# auto-booking

Автозапись на тренировки в mobifitness.ru, без телефона и без бэкенда.

## Структура

- `src/`, `index.html`, `vite.config.js`, `package.json` — исходники панели
  управления (React + Vite): расписание, пауза одной тренировки, логи, токены.
  Собирается в `docs/`.
- `docs/` — собранный статический сайт (`npm run build`), его отдаёт
  GitHub Pages: https://van-horn.github.io/auto-booking/
- `automation/auto-booking.mjs` — скрипт бронирования, который выполняет GitHub
  Actions по расписанию.
- `.github/workflows/auto-booking.yml` — сама автозапись: запускается по
  Пн/Ср/Пт/Сб в 05:58 UTC (08:58 по Минску), ждёт ровно 09:00:00 по Минску и
  бронирует тренировку на завтра.
- `.github/workflows/build-pages.yml` — пересобирает исходники в `docs/` при
  каждом пуше, чтобы сайт всегда был актуальным.
- `state/logs.json` — лог последних прогонов автозаписи, читается панелью
  управления.

## Разработка панели управления

```bash
npm install
npm run dev
```

## Настройка

В Settings панели управления нужно один раз ввести:

1. **GitHub токен** (scope `repo`) — хранится только в localStorage браузера,
   им панель управляет паузой и логами через GitHub API.
2. **Токен mobifitness** — сохраняется локально и шифруется в GitHub Secret
   `MOBIFIT_TOKEN`, который читает пайплайн для бронирования.
