# Vanguard Wiki

Full-stack wiki-приложение на `Express + React + Vite + SQLite + Tailwind CSS`.

## Возможности

- JWT-вход для администратора
- CRUD для wiki-страниц
- Автоматическая генерация `slug`
- Визуальный редактор на `Quill`
- Публичный просмотр страниц по адресу `/wiki/:slug`
- Админ-панель для управления контентом
- Автоматическое создание SQLite-базы и стартовой страницы

## Запуск

```bash
npm install
npm run dev
```

После запуска:

- клиент: `http://localhost:5173`
- сервер API: `http://localhost:3001`
- админка: `http://localhost:5173/admin`

Стандартные данные администратора:

- логин: `admin`
- пароль: `change-me`

Если хотите изменить порт или данные администратора, создайте файл `server/.env` по образцу `server/.env.example`.

## Дополнительно

- SQLite-файл хранится в `server/data/wiki.db`
- production-сборка клиента: `npm run build`
- запуск backend с готовым `client/dist`: `npm start`
