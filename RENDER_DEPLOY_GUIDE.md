# Деплой проекта «Guess the Number» на Render.com

## Архитектура

```
Браузер → Frontend (Static Site) → Backend (Web Service) → PostgreSQL (Database)
           guess-number/dist          backend/index.js        Render Managed DB
```

На Render создаётся **3 отдельных сервиса**:

1. **PostgreSQL** — база данных
2. **Web Service** — Express-бэкенд (Node.js)
3. **Static Site** — React-фронтенд (Vite)

---

## Предварительные требования

- Проект загружен на GitHub
- Аккаунт на [render.com](https://render.com)

---

## Шаг 1: Создание базы данных PostgreSQL

1. Render Dashboard → **New +** → **PostgreSQL**
2. Заполни:
   - **Name**: `game-rate-db` (или любое)
   - **Database**: `game_rate_db`
   - **User**: оставь дефолт или задай свой
   - **Region**: выбери ближайший (например Oregon)
   - **Plan**: Free
3. Нажми **Create Database**
4. После создания откроется страница с данными подключения. Запиши:
   - **Internal Database URL** — для бэкенда (бесплатный трафик внутри Render)
   - **External Database URL** — для применения миграций с локальной машины

### Применение схемы (CREATE TABLE)

С локальной машины выполни:

```bash
psql "<External Database URL>" -f backend/schema.sql
```

Пример:

```bash
psql "postgresql://user:password@dpg-xxx.oregon-postgres.render.com/game_rate_db" -f backend/schema.sql
```

Должен появиться вывод:

```
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
```

---

## Шаг 2: Создание Backend (Web Service)

1. Render Dashboard → **New +** → **Web Service**
2. Подключи GitHub-репозиторий
3. Настройки:

| Параметр           | Значение            |
| ------------------ | ------------------- |
| **Name**           | `game-rate-backend` |
| **Region**         | Тот же, что и у БД  |
| **Runtime**        | Node                |
| **Root Directory** | `backend`           |
| **Build Command**  | `npm install`       |
| **Start Command**  | `node index.js`     |
| **Plan**           | Free                |

4. **Environment → Add Environment Variable:**

| Key            | Value                                 |
| -------------- | ------------------------------------- |
| `DATABASE_URL` | `<Internal Database URL>` (из Шага 1) |

> ⚠️ Используй именно **Internal** URL (без `.oregon-postgres.render.com`) —
> он работает только внутри Render, но быстрее и бесплатен.
>
> Пример Internal URL:
> `postgresql://user:pass@dpg-xxx-a/game_rate_db`

5. Нажми **Create Web Service**
6. Дождись деплоя (~2-3 мин)

### Проверка

Открой в браузере:

```
https://game-rate-backend.onrender.com/api/health
```

Должен вернуть: `{"status":"ok"}`

Проверь запись в БД:

```bash
curl -X POST https://game-rate-backend.onrender.com/api/highscores \
  -H 'Content-Type: application/json' \
  -d '{"name":"test","attempts":5}'
```

---

## Шаг 3: Создание Frontend (Static Site)

1. Render Dashboard → **New +** → **Static Site**
2. Подключи тот же GitHub-репозиторий
3. Настройки:

| Параметр              | Значение                       |
| --------------------- | ------------------------------ |
| **Name**              | `game-rate-frontend`           |
| **Root Directory**    | `guess-number`                 |
| **Build Command**     | `npm install && npm run build` |
| **Publish Directory** | `dist`                         |

4. **Environment → Add Environment Variable:**

| Key            | Value                                        |
| -------------- | -------------------------------------------- |
| `VITE_API_URL` | `https://game-rate-backend.onrender.com/api` |

> ⚠️ URL заканчивается на `/api` — это важно!
> В коде `storage.ts` к нему добавляется `/highscores`,
> итого: `https://game-rate-backend.onrender.com/api/highscores`

5. Нажми **Create Static Site**
6. Дождись билда (~1-2 мин)

### Проверка

Открой URL фронтенда, сыграй и сохрани результат — он должен появиться в таблице Highscore.

---

## Как работает подключение к БД в коде

Файл `backend/index.js`:

```javascript
const pool = process.env.DATABASE_URL
	? new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl: { rejectUnauthorized: false },
		})
	: new Pool({
			user: process.env.DB_USER || 'dci-student',
			host: process.env.DB_HOST || 'localhost',
			database: process.env.DB_NAME || 'guess-number',
			password: process.env.DB_PASSWORD || '',
			port: Number(process.env.DB_PORT) || 5432,
		})
```

- На **Render**: переменная `DATABASE_URL` установлена → используется она + SSL
- **Локально**: `DATABASE_URL` нет → используются отдельные `DB_*` переменные из `.env`

---

## Как работает API URL на фронтенде

Файл `guess-number/src/utils/storage.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

- На **Render**: `VITE_API_URL` установлен при билде → запросы идут на `https://game-rate-backend.onrender.com/api`
- **Локально**: `VITE_API_URL` не задан → Vite прокси перенаправляет `/api` на `localhost:3001`

---

## Важные замечания

| Тема                     | Детали                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Free tier: засыпание** | Бэкенд засыпает после 15 мин неактивности. Первый запрос после паузы ~30 сек |
| **Free tier: БД**        | Данные удаляются через 90 дней. Делай дамп если нужно сохранить              |
| **Auto-Deploy**          | По умолчанию каждый `git push` в `main` запускает редеплой                   |
| **Смена пароля БД**      | Dashboard → БД → Regenerate. После смены обнови `DATABASE_URL` в бэкенде     |
| **Логи**                 | Dashboard → Backend → Logs (полезно для отладки ошибок)                      |

---

## Полезные команды

```bash
# Применить схему к Render БД (с локальной машины)
psql "<External Database URL>" -f backend/schema.sql

# Проверить таблицы
psql "<External Database URL>" -c "\dt"

# Health check
curl https://game-rate-backend.onrender.com/api/health

# Записать тестовый результат
curl -X POST https://game-rate-backend.onrender.com/api/highscores \
  -H 'Content-Type: application/json' \
  -d '{"name":"test","attempts":3}'

# Получить highscores
curl https://game-rate-backend.onrender.com/api/highscores
```
