async def test_history_empty(client, auth_headers):
    resp = await client.get("/users/me/history", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


async def test_history_records_view(client, auth_headers, test_property):
    await client.get(f"/properties/{test_property.id}", headers=auth_headers)
    resp = await client.get("/users/me/history", headers=auth_headers)
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert test_property.id in ids


async def test_history_returns_property_fields(client, auth_headers, test_property):
    await client.get(f"/properties/{test_property.id}", headers=auth_headers)
    resp = await client.get("/users/me/history", headers=auth_headers)
    assert resp.status_code == 200
    item = resp.json()[0]
    assert "title" in item
    assert "price" in item
    assert "area" in item


async def test_history_unauthorized(client):
    resp = await client.get("/users/me/history")
    assert resp.status_code == 403


async def test_me_returns_correct_email(client, auth_headers):
    resp = await client.get("/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "auth@example.com"


async def test_me_no_password_in_response(client, auth_headers):
    resp = await client.get("/users/me", headers=auth_headers)
    assert "hashed_password" not in resp.json()
    assert "password" not in resp.json()
