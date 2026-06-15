"""
Агент пересчёта рекомендаций.

Цикл: воспринять (найти активных пользователей) →
      решить (вычислить CF для каждого) →
      действовать (сохранить в Redis).
"""

import json
import logging
import os
import time

import numpy as np
import psycopg2
import redis
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [RecommendationAgent] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

DB_URL      = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/realty")
REDIS_URL   = os.getenv("REDIS_URL",    "redis://redis:6379/0")
INTERVAL    = int(os.getenv("AGENT_INTERVAL_SEC",    "300"))
WINDOW_HOURS = int(os.getenv("ACTIVE_WINDOW_HOURS",  "24"))
TOP_N       = 10
CACHE_TTL   = 3600


# ── Восприятие ────────────────────────────────────────────────────────────────

def perceive(conn) -> list[int]:
    """Возвращает user_id пользователей, активных за последние WINDOW_HOURS часов."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM views
                 WHERE viewed_at > NOW() - INTERVAL '%(h)s hours'
                UNION
                SELECT user_id FROM ratings
                 WHERE rated_at  > NOW() - INTERVAL '%(h)s hours'
            ) t
            """,
            {"h": WINDOW_HOURS},
        )
        return [row[0] for row in cur.fetchall()]


# ── Решение ───────────────────────────────────────────────────────────────────

def build_matrix(conn) -> tuple[np.ndarray, list[int], list[int]]:
    """Строит матрицу взаимодействий user×item из оценок и просмотров."""
    with conn.cursor() as cur:
        cur.execute("SELECT user_id, property_id, score FROM ratings")
        ratings = cur.fetchall()
        cur.execute("SELECT user_id, property_id FROM views")
        views = cur.fetchall()

    user_ids = sorted({r[0] for r in ratings} | {v[0] for v in views})
    prop_ids = sorted({r[1] for r in ratings} | {v[1] for v in views})

    if not user_ids or not prop_ids:
        return np.array([]), [], []

    u_idx = {uid: i for i, uid in enumerate(user_ids)}
    p_idx = {pid: i for i, pid in enumerate(prop_ids)}
    matrix = np.zeros((len(user_ids), len(prop_ids)), dtype=np.float32)

    for uid, pid in views:
        matrix[u_idx[uid], p_idx[pid]] = max(matrix[u_idx[uid], p_idx[pid]], 1.0)
    for uid, pid, score in ratings:
        matrix[u_idx[uid], p_idx[pid]] = float(score)

    return matrix, user_ids, prop_ids


def decide(user_id: int, matrix: np.ndarray, user_ids: list, prop_ids: list) -> list[int]:
    """Item-Based CF: возвращает топ-N рекомендованных property_id."""
    u_idx = {uid: i for i, uid in enumerate(user_ids)}
    if user_id not in u_idx:
        return []

    row = matrix[u_idx[user_id]]
    if np.count_nonzero(row) < 3:
        return []

    sim = cosine_similarity(matrix.T)
    scores = sim.dot(row)
    scores[row > 0] = 0
    top = np.argsort(scores)[::-1][:TOP_N]
    return [prop_ids[i] for i in top if scores[i] > 0]


# ── Действие ──────────────────────────────────────────────────────────────────

def act(r: redis.Redis, user_id: int, recommendations: list[int]) -> None:
    """Сохраняет рекомендации в Redis с TTL.

    Ключ `rec:{user_id}` совпадает с тем, что читает backend
    (routers/recommendations.py), поэтому прогретый агентом кэш
    переиспользуется эндпоинтом и сбрасывается при новой оценке.
    """
    key = f"rec:{user_id}"
    r.setex(key, CACHE_TTL, json.dumps(recommendations))
    log.info("  user_id=%-4d → %d рекомендаций сохранено", user_id, len(recommendations))


# ── Основной цикл ─────────────────────────────────────────────────────────────

def run_cycle() -> None:
    log.info("═══ Начало цикла ═══")
    try:
        conn = psycopg2.connect(DB_URL)
        r    = redis.from_url(REDIS_URL)

        active_users = perceive(conn)
        log.info("Активных пользователей за %dч: %d", WINDOW_HOURS, len(active_users))

        if not active_users:
            conn.close()
            return

        matrix, user_ids, prop_ids = build_matrix(conn)
        if matrix.size == 0:
            log.info("Матрица взаимодействий пуста — пропуск")
            conn.close()
            return

        for uid in active_users:
            recs = decide(uid, matrix, user_ids, prop_ids)
            act(r, uid, recs)

        conn.close()
        log.info("═══ Цикл завершён, обработано %d пользователей ═══", len(active_users))

    except Exception as exc:
        log.error("Ошибка в цикле агента: %s", exc)


if __name__ == "__main__":
    log.info(
        "RecommendationAgent запущен | интервал=%dс | окно=%dч",
        INTERVAL, WINDOW_HOURS,
    )
    while True:
        run_cycle()
        log.info("Ожидание %d с до следующего цикла...", INTERVAL)
        time.sleep(INTERVAL)
