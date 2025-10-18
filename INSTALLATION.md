# Инструкция по установке и запуску ChallengeTV Frontend

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите URL вашего API:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Запуск dev server

```bash
npm run dev
```

Приложение будет доступно по адресу: **http://localhost:3000**

## Подробная инструкция

### Системные требования

- Node.js версии 18 или выше
- npm версии 9 или выше (или yarn/pnpm)
- Работающий backend API ChallengeTV

### Установка Node.js

#### Windows
1. Скачайте установщик с https://nodejs.org/
2. Запустите установщик и следуйте инструкциям

#### macOS
```bash
# Используя Homebrew
brew install node
```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Проверка установки

```bash
node --version  # должно показать v18.0.0 или выше
npm --version   # должно показать 9.0.0 или выше
```

### Установка проекта

1. **Распакуйте архив или клонируйте репозиторий**

```bash
# Если это git репозиторий
git clone <repository-url>
cd challengetv-frontend

# Или просто распакуйте архив и перейдите в папку
cd challengetv-frontend
```

2. **Установите зависимости**

```bash
npm install
```

Это может занять несколько минут при первом запуске.

3. **Настройте окружение**

```bash
# Скопируйте пример конфигурации
cp .env.example .env

# Откройте .env в текстовом редакторе
# Для Windows:
notepad .env

# Для macOS:
open -e .env

# Для Linux:
nano .env
```

Измените `VITE_API_BASE_URL` на адрес вашего API:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Запуск приложения

#### Development mode (разработка)

```bash
npm run dev
```

Приложение запустится на **http://localhost:3000**

Dev server поддерживает:
- ✅ Hot Module Replacement (изменения видны без перезагрузки)
- ✅ Source maps для отладки
- ✅ Proxy для API запросов

#### Production build (сборка для продакшена)

```bash
# Собрать приложение
npm run build

# Просмотреть production сборку
npm run preview
```

Файлы будут собраны в папку `dist/`.

### Структура проекта после установки

```
challengetv-frontend/
├── node_modules/          # Зависимости (создается после npm install)
├── dist/                  # Production сборка (создается после npm run build)
├── public/                # Статические файлы
├── src/                   # Исходный код
│   ├── components/        # React компоненты
│   ├── pages/            # Страницы
│   ├── store/            # Zustand stores
│   ├── lib/              # Утилиты и API клиент
│   ├── types/            # TypeScript типы
│   ├── App.tsx           # Главный компонент
│   ├── main.tsx          # Точка входа
│   └── index.css         # Глобальные стили
├── .env                   # Переменные окружения (создайте вручную)
├── .env.example          # Пример переменных окружения
├── index.html            # HTML шаблон
├── package.json          # Зависимости и скрипты
├── tsconfig.json         # Конфигурация TypeScript
├── vite.config.ts        # Конфигурация Vite
├── tailwind.config.js    # Конфигурация Tailwind CSS
└── README.md             # Документация

## Возможные проблемы и решения

### Проблема: `npm install` завершается с ошибкой

**Решение:**
```bash
# Очистите кэш npm
npm cache clean --force

# Удалите node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Установите снова
npm install
```

### Проблема: Порт 3000 уже занят

**Решение 1:** Остановите процесс, использующий порт 3000

**Решение 2:** Измените порт в `vite.config.ts`:
```typescript
export default defineConfig({
  // ...
  server: {
    port: 3001, // Измените на другой порт
  },
})
```

### Проблема: API запросы не работают (CORS ошибки)

**Решение:** Убедитесь, что:
1. Backend API запущен и доступен
2. В `.env` правильно указан `VITE_API_BASE_URL`
3. Backend API настроен для приема запросов с вашего домена

### Проблема: "Cannot find module '@/...'"

**Решение:** 
1. Проверьте, что в `tsconfig.json` настроены path aliases
2. Перезапустите dev server
3. Если не помогло, перезапустите IDE/редактор

### Проблема: Стили Tailwind не применяются

**Решение:**
```bash
# Убедитесь, что установлены PostCSS и Tailwind
npm install -D tailwindcss postcss autoprefixer

# Перезапустите dev server
npm run dev
```

## Скрипты package.json

- `npm run dev` - Запуск development server
- `npm run build` - Сборка для production
- `npm run preview` - Просмотр production сборки локально
- `npm run lint` - Проверка кода линтером

## Тестирование установки

После запуска проверьте:

1. ✅ Главная страница загружается
2. ✅ Можно перейти на страницу челленджей
3. ✅ Страницы логина и регистрации работают
4. ✅ Навигация работает корректно
5. ✅ Нет ошибок в консоли браузера (F12)

## Подключение к API

### Локальный API (Development)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Production API

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Проверка подключения к API

1. Откройте браузер
2. Откройте DevTools (F12)
3. Перейдите на вкладку Network
4. Попробуйте загрузить список челленджей
5. Проверьте, что запросы отправляются на правильный URL

## Дополнительная настройка

### Изменение цветовой схемы

Отредактируйте `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Ваши цвета
      },
    },
  },
},
```

### Изменение шрифтов

1. Добавьте шрифты в `index.html`
2. Обновите `tailwind.config.js`:

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['YourFont', 'system-ui', 'sans-serif'],
    },
  },
},
```

## Развертывание

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Загрузите папку dist/ в Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host"]
```

## Поддержка

Если у вас возникли проблемы:

1. Проверьте раздел "Возможные проблемы" выше
2. Убедитесь, что все зависимости установлены
3. Проверьте консоль браузера на ошибки
4. Проверьте терминал на ошибки сборки

## Что дальше?

После успешной установки вы можете:

1. 📖 Изучить структуру проекта в `README.md`
2. 🎨 Кастомизировать дизайн
3. 🔧 Добавить новые функции
4. 🚀 Развернуть на production сервере

Успешной работы с ChallengeTV! 🎉
