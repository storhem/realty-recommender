@echo off
REM ===========================================================================
REM  Zapusk testov backend v Docker (dlya cmd.exe).
REM  Testovaya shema sozdayotsya migraciyami Alembic (kak v prode).
REM  Zapusk:  run_tests.bat
REM ===========================================================================
chcp 65001 >nul
cd /d "%~dp0"

echo [1/3] Podnimayu stek (db, redis, backend)...
docker compose up -d db redis backend

echo [2/3] Proveryayu testovuyu BD realty_test...
docker compose exec -T db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='realty_test'" | findstr "1" >nul
if errorlevel 1 (
    docker compose exec -T db psql -U postgres -c "CREATE DATABASE realty_test"
    echo     baza sozdana.
) else (
    echo     baza uzhe sushchestvuet.
)

echo [3/3] Zapuskayu pytest...
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/realty_test backend pytest tests/ -v --cov=app --cov-report=term-missing

pause
