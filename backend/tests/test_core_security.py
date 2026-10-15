from __future__ import annotations

from datetime import timedelta

import jwt
import pytest
import time_machine

from app.core import security
from app.core.config import Settings
from app.core.errors import UnauthorizedError
from app.models.enums import UserRole


def test_hash_and_verify_password() -> None:
    hashed = security.hash_password("Sunrise!2026")
    assert hashed.startswith("$argon2id$")
    assert hashed != "Sunrise!2026"
    assert security.verify_password("Sunrise!2026", hashed)
    assert not security.verify_password("wrong", hashed)
    assert not security.verify_password("Sunrise!2026", "not-a-hash")
    assert not security.verify_password("Sunrise!2026", "")
    assert not security.password_needs_rehash(hashed)
    assert security.password_needs_rehash("garbage")


def test_access_token_roundtrip(frozen_time: time_machine.Traveller) -> None:
    token = security.create_access_token(42, UserRole.STAFF)
    claims = security.decode_access_token(token)
    assert claims.user_id == 42
    assert claims.role is UserRole.STAFF
    assert claims.expires_at - claims.issued_at == timedelta(minutes=15)
    assert len(claims.jti) == 32


def test_access_token_expired(frozen_time: time_machine.Traveller) -> None:
    token = security.create_access_token(1, UserRole.CUSTOMER)
    frozen_time.shift(timedelta(minutes=16))
    with pytest.raises(UnauthorizedError) as info:
        security.decode_access_token(token)
    assert info.value.code == "AUTH_TOKEN_EXPIRED"
    assert info.value.status_code == 401


def test_access_token_invalid_signature_and_garbage(settings: Settings) -> None:
    token = security.create_access_token(1, UserRole.CUSTOMER)
    tampered = token[:-2] + ("AA" if not token.endswith("AA") else "BB")
    for bad in (tampered, "garbage", ""):
        with pytest.raises(UnauthorizedError) as info:
            security.decode_access_token(bad)
        assert info.value.code == "UNAUTHENTICATED"


def test_access_token_wrong_type_or_missing_claims(settings: Settings) -> None:
    now = 2_000_000_000
    base = {"sub": "1", "role": "customer", "typ": "refresh", "iat": now - 10, "exp": now + 900, "jti": "x"}
    with time_machine.travel(now, tick=False):
        token = jwt.encode(base, settings.SECRET_KEY, algorithm="HS256")
        with pytest.raises(UnauthorizedError):
            security.decode_access_token(token)
        no_role = {k: v for k, v in base.items() if k != "role"} | {"typ": "access"}
        with pytest.raises(UnauthorizedError):
            security.decode_access_token(jwt.encode(no_role, settings.SECRET_KEY, algorithm="HS256"))
        bad_role = base | {"typ": "access", "role": "superuser"}
        with pytest.raises(UnauthorizedError):
            security.decode_access_token(jwt.encode(bad_role, settings.SECRET_KEY, algorithm="HS256"))


def test_alg_none_rejected() -> None:
    token = jwt.encode(
        {"sub": "1", "role": "admin", "typ": "access", "iat": 1, "exp": 9999999999, "jti": "x"},
        key="",
        algorithm="none",
    )
    with pytest.raises(UnauthorizedError):
        security.decode_access_token(token)


def test_opaque_tokens_and_hashes() -> None:
    a, b = security.new_opaque_token(), security.new_opaque_token()
    assert a != b
    assert len(a) >= 43
    assert security.sha256_hex("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    assert security.hmac_hex("key", "The quick brown fox jumps over the lazy dog") == (
        "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
    )
    assert security.constant_time_equals("a", "a")
    assert not security.constant_time_equals("a", "b")


def test_ip_hash_is_keyed_and_stable() -> None:
    first = security.ip_hash("203.0.113.7")
    assert first == security.ip_hash("203.0.113.7")
    assert first != security.ip_hash("203.0.113.8")
    assert "203.0.113.7" not in first
    assert len(first) == 64


def test_cart_token_sign_and_verify() -> None:
    token = security.new_opaque_token(32)
    signed = security.sign_cart_token(token)
    assert signed.startswith(token + ".")
    assert len(signed.rsplit(".", 1)[1]) == 32
    assert security.verify_cart_token(signed) == token


@pytest.mark.parametrize("value", ["", "no-dot", ".sig", "abc.", "abc.short"])
def test_cart_token_rejects_malformed(value: str) -> None:
    assert security.verify_cart_token(value) is None


def test_cart_token_rejects_tampering() -> None:
    signed = security.sign_cart_token("tok123")
    token, sig = signed.rsplit(".", 1)
    assert security.verify_cart_token(f"tok124.{sig}") is None
    flipped = ("0" if sig[0] != "0" else "1") + sig[1:]
    assert security.verify_cart_token(f"{token}.{flipped}") is None
