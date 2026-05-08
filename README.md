# Рекомендательная система недвижимости

Курсовой проект по дисциплине «Методы и технологии программирования».  
Вариант 18. Стек: Python + FastAPI + React + PostgreSQL + Redis.

## Быстрый старт

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

- API: http://localhost:8000
- Документация API (Swagger): http://localhost:8000/docs
- Фронтенд: http://localhost:3000

## Структура проекта

```
realty_recommender/
├── backend/
│   ├── app/
│   │   ├── core/         # безопасность, кэш
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── routers/      # FastAPI роутеры
│   │   ├── schemas/      # Pydantic схемы
│   │   ├── services/     # бизнес-логика
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
├── frontend/
│   └── src/
├── docker-compose.yml
└── README.md
```

## Запуск тестов

```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```

## Статический анализ

```bash
bandit -r app/
pip-audit
```
