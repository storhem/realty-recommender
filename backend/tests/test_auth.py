async def test_register_success(client):
    resp = await client.post("/auth/register", json={
        "email": "new@example.com",
        "password": "secret123",
        "name": "Новый Пользователь",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert data["name"] == "Новый Пользователь"
    assert "hashed_password" not in data


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "pass", "name": "User"}
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 400
    assert "уже зарегистрирован" in resp.json()["detail"]


async def test_login_success(client):
    await client.post("/auth/register", json={
        "email": "login@example.com", "password": "mypassword", "name": "Login User"
    })
    resp = await client.post("/auth/login", json={
        "email": "login@example.com", "password": "mypassword"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "email": "wrongpass@example.com", "password": "correct", "name": "User"
    })
    resp = await client.post("/auth/login", json={
        "email": "wrongpass@example.com", "password": "wrong"
    })
    assert resp.status_code == 401


async def test_login_unknown_email(client):
    resp = await client.post("/auth/login", json={
        "email": "nobody@example.com", "password": "pass"
    })
    assert resp.status_code == 401


async def test_get_me(client, auth_headers):
    resp = await client.get("/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "auth@example.com"


async def test_get_me_unauthorized(client):
    resp = await client.get("/users/me")
    assert resp.status_code == 403
