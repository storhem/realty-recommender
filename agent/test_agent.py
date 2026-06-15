"""
Unit-тесты логики агента рекомендаций.
Не требуют подключения к БД или Redis — тестируют чистую математику.
"""

import json
import numpy as np
import pytest
from unittest.mock import MagicMock, patch

from agent import build_matrix, decide, act, perceive


# ── build_matrix ──────────────────────────────────────────────────────────────

def _make_conn(ratings=None, views=None):
    """Фиктивное соединение с PostgreSQL, возвращающее заданные данные."""
    ratings = ratings or []
    views   = views   or []

    cur = MagicMock()
    cur.fetchall.side_effect = [ratings, views]
    cur.__enter__ = MagicMock(return_value=cur)
    cur.__exit__  = MagicMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cur
    return conn


def test_build_matrix_shape():
    conn = _make_conn(
        ratings=[(1, 10, 5), (1, 11, 3), (2, 10, 4)],
        views=[(2, 12)],
    )
    matrix, user_ids, prop_ids = build_matrix(conn)
    assert matrix.shape == (2, 3)
    assert set(user_ids) == {1, 2}
    assert set(prop_ids) == {10, 11, 12}


def test_build_matrix_rating_overrides_view():
    conn = _make_conn(
        ratings=[(1, 10, 5)],
        views=[(1, 10)],
    )
    matrix, user_ids, prop_ids = build_matrix(conn)
    u_idx = {uid: i for i, uid in enumerate(user_ids)}
    p_idx = {pid: i for i, pid in enumerate(prop_ids)}
    assert matrix[u_idx[1], p_idx[10]] == 5.0


def test_build_matrix_empty():
    conn = _make_conn()
    matrix, user_ids, prop_ids = build_matrix(conn)
    assert matrix.size == 0


# ── decide ────────────────────────────────────────────────────────────────────

def _sample_matrix():
    matrix = np.array([
        [5, 3, 0, 0, 0],
        [4, 0, 4, 0, 0],
        [0, 0, 5, 4, 0],
        [0, 0, 0, 4, 5],
    ], dtype=np.float32)
    user_ids = [1, 2, 3, 4]
    prop_ids = [10, 11, 12, 13, 14]
    return matrix, user_ids, prop_ids


def test_decide_excludes_seen():
    matrix, user_ids, prop_ids = _sample_matrix()
    recs = decide(1, matrix, user_ids, prop_ids)
    # user 1 (idx 0) оценил prop 10 и 11
    assert 10 not in recs
    assert 11 not in recs


def test_decide_top_n_limit():
    matrix, user_ids, prop_ids = _sample_matrix()
    recs = decide(1, matrix, user_ids, prop_ids)
    assert len(recs) <= 10


def test_decide_cold_start_returns_empty():
    """Пользователь с < 3 взаимодействиями → пустой список."""
    matrix = np.array([[5, 0, 0, 0, 0]], dtype=np.float32)
    recs = decide(1, matrix, [1], [10, 11, 12, 13, 14])
    assert recs == []


def test_decide_unknown_user_returns_empty():
    matrix, user_ids, prop_ids = _sample_matrix()
    recs = decide(999, matrix, user_ids, prop_ids)
    assert recs == []


def test_decide_returns_list_of_ints():
    matrix, user_ids, prop_ids = _sample_matrix()
    recs = decide(3, matrix, user_ids, prop_ids)
    for r in recs:
        assert isinstance(r, int)


# ── act ───────────────────────────────────────────────────────────────────────

def test_act_writes_to_redis():
    r = MagicMock()
    act(r, user_id=42, recommendations=[10, 11, 12])
    r.setex.assert_called_once()
    key, ttl, value = r.setex.call_args[0]
    assert key == "rec:42"
    assert ttl == 3600
    assert json.loads(value) == [10, 11, 12]


def test_act_empty_recommendations():
    r = MagicMock()
    act(r, user_id=7, recommendations=[])
    r.setex.assert_called_once()
    _, _, value = r.setex.call_args[0]
    assert json.loads(value) == []


# ── perceive (мок) ────────────────────────────────────────────────────────────

def test_perceive_combines_views_and_ratings():
    cur = MagicMock()
    cur.fetchall.return_value = [(1,), (2,), (3,)]
    cur.__enter__ = MagicMock(return_value=cur)
    cur.__exit__  = MagicMock(return_value=False)
    conn = MagicMock()
    conn.cursor.return_value = cur

    result = perceive(conn)
    assert result == [1, 2, 3]


def test_perceive_empty():
    cur = MagicMock()
    cur.fetchall.return_value = []
    cur.__enter__ = MagicMock(return_value=cur)
    cur.__exit__  = MagicMock(return_value=False)
    conn = MagicMock()
    conn.cursor.return_value = cur

    result = perceive(conn)
    assert result == []
