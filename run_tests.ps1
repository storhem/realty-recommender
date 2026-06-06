# ============================================================================
#  Прогон тестов бэкенда в Docker.
#  Тестовая схема создаётся миграциями Alembic (как в продакшене),
#  поэтому тесты проверяют ровно ту схему, которая разворачивается.
#
#  Запуск:  ./run_tests.ps1
# ============================================================================
$ErrorActionPreference = "Stop"

Write-Host "1/3  Поднимаю стек (db, redis, backend)..." -ForegroundColor Cyan
docker compose up -d db redis backend

Write-Host "2/3  Проверяю тестовую БД realty_test..." -ForegroundColor Cyan
$exists = docker compose exec -T db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='realty_test'"
if ($exists -notmatch "1") {
    docker compose exec -T db psql -U postgres -c "CREATE DATABASE realty_test" | Out-Null
    Write-Host "     База создана." -ForegroundColor Green
} else {
    Write-Host "     База уже существует." -ForegroundColor Green
}

Write-Host "3/3  Запускаю pytest (58 тестов + покрытие)..." -ForegroundColor Cyan
docker compose exec `
  -e TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/realty_test `
  backend pytest tests/ -v --cov=app --cov-report=term-missing
