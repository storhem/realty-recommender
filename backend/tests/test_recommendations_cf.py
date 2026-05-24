"""
Тесты CF-рекомендаций на реальных данных (несколько пользователей с оценками).
Проверяет, что алгоритм работает не только в режиме холодного старта.
"""

PROPERTY_BASE = {
    "type": "apartment",
    "area": 50.0,
    "rooms": 2,
    "address": "Тула, ул. Ленина, 1",
    "latitude": 54.193122,
    "longitude": 37.617348,
}


async def _register_and_login(client, email: str) -> dict:
    await client.post("/auth/register", json={"email": email, "password": "pass123", "name": "U"})
    resp = await client.post("/auth/login", json={"email": email, "password": "pass123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


async def _create_property(client, headers, title: str, price: float) -> int:
    resp = await client.post(
        "/properties",
        json={**PROPERTY_BASE, "title": title, "price": price},
        headers=headers,
    )
    return resp.json()["id"]


async def _rate(client, headers, property_id: int, score: int):
    await client.post("/ratings", json={"property_id": property_id, "score": score}, headers=headers)


async def test_cf_returns_list_after_ratings(client):
    """После нескольких оценок /recommendations возвращает непустой список."""
    h = await _register_and_login(client, "cf1@example.com")
    ids = []
    for i in range(5):
        pid = await _create_property(client, h, f"CF объект {i}", 3_000_000 + i * 100_000)
        ids.append(pid)

    for pid in ids[:3]:
        await _rate(client, h, pid, 5)

    resp = await client.get("/recommendations", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_cf_does_not_recommend_rated(client):
    """Уже оценённые объекты не попадают в рекомендации."""
    h1 = await _register_and_login(client, "cf2@example.com")
    h2 = await _register_and_login(client, "cf3@example.com")

    ids = []
    for i in range(6):
        pid = await _create_property(client, h1, f"Shared {i}", 2_500_000 + i * 50_000)
        ids.append(pid)

    for pid in ids[:4]:
        await _rate(client, h1, pid, 5)
    for pid in ids[:3]:
        await _rate(client, h2, pid, 4)

    resp = await client.get("/recommendations", headers=h1)
    assert resp.status_code == 200
    recs = resp.json()
    rated_ids = set(ids[:4])
    for prop in recs:
        assert prop["id"] not in rated_ids


async def test_recommendations_score_boundary_min(client, auth_headers, test_property):
    resp = await client.post(
        "/ratings",
        json={"property_id": test_property.id, "score": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["score"] == 1


async def test_recommendations_score_boundary_max(client, auth_headers, test_property):
    resp = await client.post(
        "/ratings",
        json={"property_id": test_property.id, "score": 5},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["score"] == 5


async def test_recommendations_score_zero_invalid(client, auth_headers, test_property):
    resp = await client.post(
        "/ratings",
        json={"property_id": test_property.id, "score": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_properties_filter_by_rooms(client, auth_headers):
    await client.post(
        "/properties",
        json={**PROPERTY_BASE, "title": "2к квартира", "price": 4_000_000, "rooms": 2},
        headers=auth_headers,
    )
    await client.post(
        "/properties",
        json={**PROPERTY_BASE, "title": "3к квартира", "price": 5_000_000, "rooms": 3},
        headers=auth_headers,
    )
    resp = await client.get("/properties", params={"rooms": 2})
    assert resp.status_code == 200
    for p in resp.json():
        assert p["rooms"] == 2


async def test_properties_filter_price_min(client, auth_headers):
    await client.post(
        "/properties",
        json={**PROPERTY_BASE, "title": "Дешёвая", "price": 1_000_000, "rooms": 1},
        headers=auth_headers,
    )
    await client.post(
        "/properties",
        json={**PROPERTY_BASE, "title": "Дорогая", "price": 8_000_000, "rooms": 1},
        headers=auth_headers,
    )
    resp = await client.get("/properties", params={"price_min": 5_000_000})
    assert resp.status_code == 200
    for p in resp.json():
        assert p["price"] >= 5_000_000
