import numpy as np
import pytest

from app.services.recommender import compute_item_similarity, get_recommendations_from_matrix

# --- Unit-тесты алгоритма (без БД) ---

def test_item_similarity_shape():
    matrix = np.array([
        [5, 3, 0, 1],
        [4, 0, 4, 1],
        [1, 1, 0, 5],
        [0, 0, 5, 4],
    ], dtype=np.float32)
    sim = compute_item_similarity(matrix)
    assert sim.shape == (4, 4)


def test_item_similarity_diagonal_ones():
    matrix = np.eye(4, dtype=np.float32)
    sim = compute_item_similarity(matrix)
    np.testing.assert_allclose(np.diag(sim), 1.0, atol=1e-5)


def test_recommendations_exclude_seen():
    matrix = np.array([
        [5, 3, 0, 0],
        [4, 0, 4, 0],
        [0, 0, 5, 4],
    ], dtype=np.float32)
    sim = compute_item_similarity(matrix)
    recs = get_recommendations_from_matrix(user_idx=0, matrix=matrix, item_sim=sim, top_n=5)
    seen = {0, 1}  # user 0 has interacted with items 0 and 1
    for idx in recs:
        assert idx not in seen


def test_recommendations_top_n_limit():
    matrix = np.random.rand(10, 20).astype(np.float32)
    sim = compute_item_similarity(matrix)
    recs = get_recommendations_from_matrix(user_idx=0, matrix=matrix, item_sim=sim, top_n=3)
    assert len(recs) <= 3


def test_empty_matrix_returns_empty():
    matrix = np.zeros((3, 3), dtype=np.float32)
    sim = compute_item_similarity(matrix)
    recs = get_recommendations_from_matrix(user_idx=0, matrix=matrix, item_sim=sim, top_n=5)
    assert recs == []


# --- Интеграционные тесты API рекомендаций ---

@pytest.mark.asyncio
async def test_recommendations_cold_start(client, auth_headers):
    """Новый пользователь получает популярные объекты (холодный старт)."""
    resp = await client.get("/recommendations", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_recommendations_unauthorized(client):
    resp = await client.get("/recommendations")
    assert resp.status_code == 403
