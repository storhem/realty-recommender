# Рекомендательная система недвижимости

[![CI](https://github.com/storhem/realty-recommender/actions/workflows/ci.yml/badge.svg)](https://github.com/storhem/realty-recommender/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-78.77%25-brightgreen)](https://github.com/storhem/realty-recommender/actions)
[![Python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org/)
[![Go](https://img.shields.io/badge/go-1.22-00ADD8)](https://go.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Платформа для поиска и рекомендации объектов недвижимости с алгоритмом коллаборативной фильтрации, геопространственным поиском и мультиагентной системой персонализации.

Курсовой проект по дисциплине «Методы и технологии программирования», вариант 18.

---

## Возможности

- **Рекомендации** — Item-Based Collaborative Filtering на основе оценок пользователей
- **Геопоиск** — поиск объектов в радиусе с расстоянием через PostGIS / ST_DWithin
- **Карта** — интерактивная карта с Yandex Maps JavaScript API
- **Кэш** — Redis TTL-кэш рекомендаций (1 час), инвалидация при новой оценке
- **Агент** — фоновый Python-агент пересчитывает рекомендации каждые 5 минут
- **Статистика** — Go-микросервис агрегирует метрики платформы в реальном времени
- **Авторизация** — JWT Bearer token, bcrypt хеширование паролей

---

## Архитектура

```
┌─────────────┐     HTTP      ┌──────────────────┐     SQL      ┌─────────────────┐
│  React SPA  │ ────────────► │  FastAPI Backend  │ ──────────► │ PostgreSQL 16   │
│  (Vite)     │               │  Python 3.12      │             │ + PostGIS       │
│  :3000      │               │  :8000            │             └─────────────────┘
└─────────────┘               └──────────────────┘
                                       │                         ┌─────────────────┐
                                       ├──────────────────────── │ Redis           │
                                       │  GET /stats             │ рекомендации    │
                                       ▼                         └─────────────────┘
                               ┌───────────────┐
                               │ Go stats-svc  │
                               │ :8080         │
                               └───────────────┘

┌──────────────────────────────────────────────────────────┐
│  Python Agent  (perceive → decide → act, каждые 5 мин)  │
│  Читает ratings/views из БД → CF → пишет в Redis         │
└──────────────────────────────────────────────────────────┘
```

---

## Стек технологий

| Слой | Технологии |
|---|---|
| **Backend** | Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 async, asyncpg, Alembic |
| **База данных** | PostgreSQL 16, PostGIS 3.4 (Geography, ST_DWithin, ST_Distance) |
| **Кэш** | Redis 7, redis-asyncio |
| **Алгоритм** | Item-Based CF, cosine similarity (scikit-learn, numpy) |
| **Микросервис** | Go 1.22, net/http, lib/pq |
| **Агент** | Python, psycopg2, redis-py |
| **Frontend** | React 18, Vite, React Router v6, Yandex Maps JS API |
| **Безопасность** | JWT (python-jose), bcrypt 4.0 |
| **CI/CD** | GitHub Actions (6 jobs), ruff, bandit, pip-audit |
| **Инфраструктура** | Docker Compose (6 сервисов) |

---

## Быстрый старт

### Требования

- Docker Desktop 24+
- Git

### Запуск

```bash
git clone https://github.com/storhem/realty-recommender.git
cd realty-recommender

cp backend/.env.example backend/.env
docker compose up --build
```

Через ~30 секунд доступно:

| Сервис | URL |
|---|---|
| Фронтенд | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Stats API | http://localhost:8080/stats |

### Применить миграции (первый запуск)

```bash
docker compose exec backend alembic upgrade head
```

---

## Переменные окружения

Файл `backend/.env` (скопировать из `.env.example`):

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/realty
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
STATS_SERVICE_URL=http://stats-service:8080
ACCESS_TOKEN_EXPIRE_MINUTES=60
RECOMMENDATIONS_CACHE_TTL=3600
```

---

## API

Полная документация: http://localhost:8000/docs

### Основные эндпоинты

```
POST /auth/register          Регистрация
POST /auth/login             Вход, получение JWT

GET  /properties             Список объектов (фильтры: type, price_min, price_max, rooms)
POST /properties             Создать объект (auth)
GET  /properties/{id}        Детали объекта + запись просмотра
GET  /properties/geo         Геопоиск по координатам и радиусу (метры)

GET  /recommendations        Персональные рекомендации (CF + Redis кэш)
POST /ratings                Поставить оценку 1-5 (auth)
POST /favorites              Добавить в избранное (auth)
DELETE /favorites/{id}       Убрать из избранного (auth)

GET  /users/me               Профиль текущего пользователя
GET  /users/me/history       История просмотров (последние 50)

GET  /stats                  Статистика платформы (через Go-микросервис)
```

### Пример запроса

```bash
# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123", "name": "Иван"}'

# Получить рекомендации
curl http://localhost:8000/recommendations \
  -H "Authorization: Bearer <token>"

# Геопоиск — объекты в радиусе 5 км от центра Москвы
curl "http://localhost:8000/properties/geo?lat=55.751244&lon=37.618423&radius=5000"
```

---

## Тестирование

### Запуск тестов бэкенда

Требуется PostgreSQL + Redis (или Docker Compose):

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Результаты

```
58 passed, 0 failed — Coverage: 78.77%
```

| Группа тестов | Файл | Тестов |
|---|---|---|
| Аутентификация | test_auth.py | 7 |
| Объекты | test_properties.py | 9 |
| Оценки | test_ratings.py | 4 |
| Избранное | test_favorites.py | 6 |
| История | test_users.py | 6 |
| Рекомендации (CF) | test_recommendations_cf.py | 7 |
| Алгоритм CF (unit) | test_recommendations.py | 7 |
| Статистика | test_stats.py | 4 |
| Безопасность | test_security.py | 8 |

### Тесты агента

```bash
cd agent
pip install -r requirements.txt pytest
pytest test_agent.py -v
```

### Тесты Go-сервиса

```bash
cd stats-service
go test ./... -v
```

---

## CI/CD

GitHub Actions запускает 6 параллельных проверок при каждом пуше:

| Job | Инструмент | Что проверяет |
|---|---|---|
| **lint** | ruff 0.6.9 | стиль, импорты, UP/B/PLW правила |
| **test-backend** | pytest + coverage | 58 тестов, порог покрытия 70% |
| **test-agent** | pytest | unit-тесты агента |
| **build-go** | go build + go test | сборка и тесты Go-сервиса |
| **sast** | bandit | анализ уязвимостей Python-кода |
| **sca** | pip-audit | аудит зависимостей на CVE |

---

## Структура проекта

```
realty_recommender/
├── backend/                    # FastAPI приложение
│   ├── app/
│   │   ├── core/
│   │   │   ├── cache.py        # Redis get/set/delete
│   │   │   └── security.py     # bcrypt + JWT
│   │   ├── models/             # SQLAlchemy ORM модели
│   │   │   ├── property.py     # объект + Geography
│   │   │   ├── user.py
│   │   │   ├── rating.py
│   │   │   ├── favorite.py
│   │   │   └── view.py
│   │   ├── routers/            # FastAPI роутеры
│   │   │   ├── auth.py
│   │   │   ├── properties.py   # CRUD + геопоиск
│   │   │   ├── recommendations.py  # CF + Redis
│   │   │   ├── ratings.py
│   │   │   ├── favorites.py
│   │   │   ├── users.py
│   │   │   └── stats.py        # прокси к Go
│   │   ├── schemas/            # Pydantic схемы
│   │   ├── services/
│   │   │   ├── auth.py         # JWT middleware
│   │   │   ├── geo.py          # PostGIS утилиты
│   │   │   └── recommender.py  # CF алгоритм
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py         # NullPool + изоляция тестов
│   │   └── test_*.py
│   ├── alembic/                # миграции БД
│   ├── pytest.ini
│   ├── pyproject.toml          # ruff конфиг
│   └── requirements.txt
├── frontend/                   # React SPA
│   └── src/
│       ├── components/
│       └── pages/
├── stats-service/              # Go микросервис
│   ├── main.go                 # GET /stats, GET /health
│   ├── main_test.go
│   └── go.mod
├── agent/                      # Python рекомендательный агент
│   ├── agent.py                # perceive → decide → act
│   ├── test_agent.py
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
└── README.md
```

---

## Алгоритм рекомендаций

Используется **Item-Based Collaborative Filtering**:

1. Строится матрица `пользователи × объекты` из таблицы `ratings`
2. Вычисляется косинусное сходство между объектами
3. Для текущего пользователя подбираются объекты, похожие на те, которые он оценил высоко
4. Уже оценённые объекты исключаются из выдачи
5. Результат кэшируется в Redis на 1 час

При холодном старте (мало оценок) возвращаются популярные объекты по среднему рейтингу.

Фоновый **агент** обновляет кэш каждые 5 минут для всех активных пользователей, не дожидаясь запроса.

---

## Лицензия

MIT
