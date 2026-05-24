from unittest.mock import AsyncMock, MagicMock, patch

import httpx

MOCK_STATS = {
    "properties": 30,
    "users": 5,
    "views": 120,
    "ratings": 45,
    "favorites": 18,
}


def _make_mock_client(response_json=None, side_effect=None):
    mock_resp = MagicMock()
    mock_resp.json.return_value = response_json or MOCK_STATS
    mock_resp.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    if side_effect:
        mock_client.get.side_effect = side_effect
    else:
        mock_client.get.return_value = mock_resp
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    return mock_client


async def test_stats_success(client):
    with patch("app.routers.stats.httpx.AsyncClient", return_value=_make_mock_client()):
        resp = await client.get("/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["properties"] == 30
    assert data["users"] == 5
    assert data["views"] == 120


async def test_stats_all_fields_present(client):
    with patch("app.routers.stats.httpx.AsyncClient", return_value=_make_mock_client()):
        resp = await client.get("/stats")
    data = resp.json()
    for field in ("properties", "users", "views", "ratings", "favorites"):
        assert field in data


async def test_stats_service_unavailable(client):
    mock = _make_mock_client(side_effect=httpx.ConnectError("refused"))
    with patch("app.routers.stats.httpx.AsyncClient", return_value=mock):
        resp = await client.get("/stats")
    assert resp.status_code == 503
    assert "unavailable" in resp.json()["detail"].lower()


async def test_stats_timeout(client):
    mock = _make_mock_client(side_effect=httpx.TimeoutException("timeout"))
    with patch("app.routers.stats.httpx.AsyncClient", return_value=mock):
        resp = await client.get("/stats")
    assert resp.status_code == 503
