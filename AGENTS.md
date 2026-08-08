# Стек проекта

Нет мобильного приложения и нет своего бэкенда. Есть три части:

- `src/` (+ `index.html`, `vite.config.js`, `package.json` в корне) — обычное
  React (Vite) веб-приложение, plain JS без TypeScript. Собирается в `docs/`,
  который отдаёт GitHub Pages.
- `automation/auto-booking.mjs` — plain Node ESM скрипт (без зависимостей,
  глобальный `fetch`), выполняется GitHub Actions по расписанию.
- `.github/workflows/` — сама автоматизация: бронирование по расписанию и
  пересборка исходников в `docs/` при пуше.

Токены (GitHub PAT, токен mobifitness) хранятся только в `localStorage`
браузера через страницу Settings — никогда не коммитятся в код (GitHub
автоматически отзывает PAT, найденные в публичных коммитах).
