import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.models.rating import Rating
from app.models.view import View


def compute_item_similarity(ratings_matrix: np.ndarray) -> np.ndarray:
    return cosine_similarity(ratings_matrix.T)


def get_recommendations_from_matrix(
    user_idx: int,
    matrix: np.ndarray,
    item_sim: np.ndarray,
    top_n: int = 10,
) -> list[int]:
    row = matrix[user_idx]
    scores = item_sim.dot(row)
    scores[row > 0] = 0
    top = np.argsort(scores)[::-1][:top_n]
    return [int(i) for i in top if scores[i] > 0]


async def _build_ratings_matrix(db: AsyncSession) -> tuple[np.ndarray, list[int], list[int]]:
    """Строит матрицу взаимодействий user×item из оценок и просмотров."""
    ratings_rows = (await db.execute(select(Rating))).scalars().all()
    views_rows = (await db.execute(select(View))).scalars().all()

    user_ids = sorted({r.user_id for r in ratings_rows} | {v.user_id for v in views_rows})
    property_ids = sorted({r.property_id for r in ratings_rows} | {v.property_id for v in views_rows})

    if not user_ids or not property_ids:
        return np.array([]), [], []

    u_idx = {uid: i for i, uid in enumerate(user_ids)}
    p_idx = {pid: i for i, pid in enumerate(property_ids)}

    matrix = np.zeros((len(user_ids), len(property_ids)), dtype=np.float32)

    for v in views_rows:
        matrix[u_idx[v.user_id], p_idx[v.property_id]] = max(
            matrix[u_idx[v.user_id], p_idx[v.property_id]], 1.0
        )
    for r in ratings_rows:
        matrix[u_idx[r.user_id], p_idx[r.property_id]] = float(r.score)

    return matrix, user_ids, property_ids


async def get_recommendations(
    user_id: int,
    db: AsyncSession,
    top_n: int = 10,
) -> list[int]:
    matrix, user_ids, property_ids = await _build_ratings_matrix(db)

    # Холодный старт: возвращаем популярные объекты по среднему рейтингу
    if not user_ids or user_id not in user_ids:
        return await _popular_properties(db, top_n)

    u_idx = {uid: i for i, uid in enumerate(user_ids)}
    row = matrix[u_idx[user_id]]

    if np.count_nonzero(row) < 3:
        return await _popular_properties(db, top_n)

    item_sim = compute_item_similarity(matrix)
    top_indices = get_recommendations_from_matrix(u_idx[user_id], matrix, item_sim, top_n)
    return [property_ids[i] for i in top_indices]


async def _popular_properties(db: AsyncSession, top_n: int) -> list[int]:
    result = await db.execute(
        select(Rating.property_id, func.avg(Rating.score).label("avg_score"))
        .group_by(Rating.property_id)
        .order_by(func.avg(Rating.score).desc())
        .limit(top_n)
    )
    rows = result.all()
    if rows:
        return [r.property_id for r in rows]

    result = await db.execute(select(Property.id).order_by(Property.created_at.desc()).limit(top_n))
    return list(result.scalars().all())
