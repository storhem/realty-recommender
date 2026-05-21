import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_differs_from_plain():
    h = hash_password("secret")
    assert h != "secret"
    assert len(h) > 20


def test_hash_is_unique():
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2  # bcrypt salt


def test_verify_correct_password():
    h = hash_password("mypassword")
    assert verify_password("mypassword", h) is True


def test_verify_wrong_password():
    h = hash_password("mypassword")
    assert verify_password("wrong", h) is False


def test_token_round_trip():
    token = create_access_token(subject=42)
    assert decode_access_token(token) == 42


def test_token_different_subjects():
    t1 = create_access_token(subject=1)
    t2 = create_access_token(subject=2)
    assert decode_access_token(t1) == 1
    assert decode_access_token(t2) == 2


def test_invalid_token_raises():
    with pytest.raises(JWTError):
        decode_access_token("not.a.valid.token")


def test_tampered_token_raises():
    token = create_access_token(subject=1)
    tampered = token[:-5] + "XXXXX"
    with pytest.raises(JWTError):
        decode_access_token(tampered)
