import pytest


PROPERTY_PAYLOAD = {
    "title": "Светлая студия",
    "type": "studio",
    "price": 3_200_000,
    "area": 28.5,
    "rooms": 1,
    "address": "Москва, ул. Арбат, 5",
    "latitude": 55.7494,
    "longitude": 37.5974,
}


@pytest.mark.asyncio
async def test_create_property(client, auth_headers):
    resp = await client.post("/properties", json=PROPERTY_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == PROPERTY_PAYLOAD["title"]
    assert data["type"] == "studio"
    assert data["price"] == 3_200_000
    assert "id" in data


@pytest.mark.asyncio
async def test_create_property_unauthorized(client):
    resp = await client.post("/properties", json=PROPERTY_PAYLOAD)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_properties(client, test_property):
    resp = await client.get("/properties")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_filter_by_type(client, auth_headers):
    await client.post("/properties", json=PROPERTY_PAYLOAD, headers=auth_headers)
    resp = await client.get("/properties", params={"type": "studio"})
    assert resp.status_code == 200
    for p in resp.json():
        assert p["type"] == "studio"


@pytest.mark.asyncio
async def test_filter_by_price(client, auth_headers):
    await client.post("/properties", json=PROPERTY_PAYLOAD, headers=auth_headers)
    resp = await client.get("/properties", params={"price_max": 4_000_000})
    assert resp.status_code == 200
    for p in resp.json():
        assert p["price"] <= 4_000_000


@pytest.mark.asyncio
async def test_get_property_authenticated(client, auth_headers, test_property):
    resp = await client.get(f"/properties/{test_property.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == test_property.id


@pytest.mark.asyncio
async def test_get_property_not_found(client, auth_headers):
    resp = await client.get("/properties/999999", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_geo_search(client, test_property):
    resp = await client.get("/properties/geo", params={
        "lat": 55.751244,
        "lon": 37.618423,
        "radius": 10000,
    })
    assert resp.status_code == 200
    results = resp.json()
    assert isinstance(results, list)
    if results:
        assert "distance_m" in results[0]


@pytest.mark.asyncio
async def test_geo_search_invalid_params(client):
    resp = await client.get("/properties/geo", params={"lat": 999, "lon": 0, "radius": 1000})
    assert resp.status_code == 422
