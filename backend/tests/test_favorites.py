async def test_add_favorite(client, auth_headers, test_property):
    resp = await client.post("/favorites", json={"property_id": test_property.id}, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["property_id"] == test_property.id


async def test_add_favorite_duplicate(client, auth_headers, test_property):
    await client.post("/favorites", json={"property_id": test_property.id}, headers=auth_headers)
    resp = await client.post("/favorites", json={"property_id": test_property.id}, headers=auth_headers)
    assert resp.status_code == 400


async def test_list_favorites(client, auth_headers, test_property):
    await client.post("/favorites", json={"property_id": test_property.id}, headers=auth_headers)
    resp = await client.get("/favorites", headers=auth_headers)
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert test_property.id in ids


async def test_remove_favorite(client, auth_headers, test_property):
    await client.post("/favorites", json={"property_id": test_property.id}, headers=auth_headers)
    resp = await client.delete(f"/favorites/{test_property.id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_remove_favorite_not_found(client, auth_headers):
    resp = await client.delete("/favorites/999999", headers=auth_headers)
    assert resp.status_code == 404


async def test_favorites_unauthorized(client):
    resp = await client.get("/favorites")
    assert resp.status_code == 403
