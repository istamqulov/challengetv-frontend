# ChallengeTV Frontend

Современный веб-интерфейс для платформы челленджей ChallengeTV.

## Технологический стек

- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev server
- **React Router v6** - маршрутизация
- **Zustand** - управление состоянием
- **Axios** - HTTP клиент
- **React Hook Form** - формы
- **Tailwind CSS** - стилизация
- **Lucide React** - иконки
- **date-fns** - работа с датами

## Возможности

✅ Аутентификация (регистрация, вход, JWT токены)
✅ Просмотр и поиск челленджей
✅ Фильтрация челленджей по различным параметрам
✅ Адаптивный дизайн (mobile-first)
✅ Автоматическое обновление токенов
✅ Защищенные маршруты
✅ TypeScript типизация всего API

## Установка и запуск

### Предварительные требования

- Node.js >= 18
- npm или yarn

### Шаги установки

1. Клонируйте репозиторий
```bash
git clone <repository-url>
cd challengetv-frontend
```

2. Установите зависимости
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`
```bash
cp .env.example .env
```

4. Настройте переменные окружения в `.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

5. Запустите dev server
```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

## Скрипты

- `npm run dev` - запуск dev server
- `npm run build` - сборка для production
- `npm run preview` - предпросмотр production сборки
- `npm run lint` - запуск линтера

## Структура проекта

```
src/
├── components/        # React компоненты
│   ├── ui/           # Базовые UI компоненты
│   ├── layout/       # Layout компоненты (Header, Footer)
│   └── challenges/   # Компоненты для челленджей
├── pages/            # Страницы приложения
├── store/            # Zustand stores
├── lib/              # Утилиты и хелперы
│   ├── api.ts       # API клиент
│   └── utils.ts     # Вспомогательные функции
├── types/            # TypeScript типы
│   └── api.ts       # Типы API
├── App.tsx           # Главный компонент
├── main.tsx          # Точка входа
└── index.css         # Глобальные стили

## API Endpoints

Приложение взаимодействует со следующими endpoints:

### Аутентификация
- `POST /api/v1/auth/register/` - регистрация
- `POST /api/v1/auth/login/` - вход
- `POST /api/v1/auth/refresh/` - обновление токена
- `GET /api/v1/users/me/` - текущий пользователь

### Челленджи
- `GET /api/v1/challenges/` - список челленджей
- `POST /api/v1/challenges/` - создать челлендж
- `GET /api/v1/challenges/{slug}/` - детали челленджа
- `PUT/PATCH /api/v1/challenges/{slug}/` - обновить челлендж
- `DELETE /api/v1/challenges/{slug}/` - удалить челлендж
- `POST /api/v1/challenges/{slug}/join/` - присоединиться
- `POST /api/v1/challenges/{slug}/leave/` - покинуть
- `GET /api/v1/challenges/{slug}/leaderboard/` - таблица лидеров
- `GET /api/v1/challenges/{slug}/statistics/` - статистика

### Достижения
- `GET /api/v1/achievements/` - список достижений
- `GET /api/v1/achievements/{slug}/` - детали достижения
- `GET /api/v1/users/{id}/achievements/` - достижения пользователя

### Активности
- `GET /api/v1/activities/` - список активностей
- `GET /api/v1/activities/{slug}/` - детали активности

## Основные функции

### Аутентификация

Приложение использует JWT токены для аутентификации:
- Access token хранится в localStorage
- Автоматическое обновление токена при истечении
- Redirect на страницу логина при неудачной аутентификации

### Управление состоянием

Zustand store для управления состоянием:
- `authStore` - аутентификация и пользовательские данные

### Защищенные маршруты

Компонент `ProtectedRoute` проверяет аутентификацию перед отображением защищенных страниц.

## Customization

### Цвета

Цвета настраиваются в `tailwind.config.js`:

```js
colors: {
  primary: { /* цвета primary */ },
  secondary: { /* цвета secondary */ },
}
```

### Шрифты

Шрифты настраиваются в `tailwind.config.js` и подключаются в `index.html`.

## Развертывание

### Production build

```bash
npm run build
```

Файлы будут собраны в папку `dist/`.

### Переменные окружения для production

Создайте файл `.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Будущие улучшения

- [ ] Страница деталей челленджа
- [ ] Форма создания челленджа
- [ ] Профиль пользователя
- [ ] Страница достижений
- [ ] Глобальная таблица лидеров
- [ ] Загрузка и отображение доказательств
- [ ] Уведомления
- [ ] Чат между участниками
- [ ] Темная тема
- [ ] Мультиязычность

## Лицензия

MIT

## Поддержка

Для вопросов и предложений создавайте issue в репозитории.
```

## Контакты

- Email: support@challengetv.com
- Website: https://challengetv.com
