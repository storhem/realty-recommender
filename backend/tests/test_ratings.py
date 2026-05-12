import pytest


@pytest.mark.asyncio
async def test_rate_property(client, auth_headers, test_property):
    resp = await client.post("/ratings", json={
        "property_id": test_property.id,
        "score": 4,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["score"] == 4
    assert data["property_id"] == test_property.id


@pytest.mark.asyncio
async def test_rate_upsert(client, auth_headers, test_property):
    await client.post("/ratings", json={"property_id": test_property.id, "score": 3}, headers=auth_headers)
    resp = await client.post("/ratings", json={"property_id": test_property.id, "score": 5}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["score"] == 5


@pytest.mark.asyncio
async def test_rate_invalid_score(client, auth_headers, test_property):
    resp = await client.post("/ratings", json={
        "property_id": test_property.id,
        "score": 6,
    }, headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_rate_unauthorized(client, test_property):
    resp = await client.post("/ratings", json={"property_id": test_property.id, "score": 4})
    assert resp.status_code == 403
