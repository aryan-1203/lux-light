"""Routes for the `auth` tag (docs/openapi.yaml): CSRF, signup, login, OTP, refresh, logout, me."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Request
from starlette.responses import Response

from app.api.deps import CurrentUser, DbSession, get_client_ip
from app.core import cookies
from app.core.rate_limit import RateLimit
from app.core.security import verify_cart_token
from app.models import User
from app.schemas.auth import (
    AuthResponse,
    CsrfTokenResponse,
    LoginRequest,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    SignupRequest,
)
from app.schemas.common import ErrorResponse
from app.schemas.users import UserProfile
from app.services import auth as auth_service
from app.services import users as users_service

router = APIRouter(tags=["auth"])

_ERROR_DESCRIPTIONS: dict[int, str] = {
    400: "Bad request (e.g. PAYMENT_SIGNATURE_INVALID, AUTH_OTP_INVALID).",
    401: "Not authenticated (UNAUTHENTICATED, AUTH_TOKEN_EXPIRED, AUTH_INVALID_CREDENTIALS, "
    "AUTH_REFRESH_INVALID).",
    403: "Forbidden (FORBIDDEN, CSRF_FAILED, ORDER_ACCESS_DENIED, AUTH_ACCOUNT_DISABLED).",
    404: "Resource not found (*_NOT_FOUND).",
    409: "State conflict (e.g. INSUFFICIENT_STOCK, INVALID_STATUS_TRANSITION, *_TAKEN).",
    422: "Validation or business-rule failure (VALIDATION_ERROR, PROMO_*, COD_*, ...).",
    429: "Rate limited (RATE_LIMITED, AUTH_OTP_TOO_MANY_ATTEMPTS).",
}


def error_responses(*statuses: int) -> dict[int | str, dict[str, Any]]:
    """``responses=`` mapping declaring the contract's ErrorResponse statuses for a route."""
    out: dict[int | str, dict[str, Any]] = {}
    for status in statuses:
        entry: dict[str, Any] = {"model": ErrorResponse, "description": _ERROR_DESCRIPTIONS[status]}
        if status == 429:
            entry["headers"] = {
                "Retry-After": {
                    "description": "Seconds until the window resets.",
                    "schema": {"type": "integer"},
                }
            }
        out[status] = entry
    return out


_SESSION_COOKIE_DOC = {
    "Set-Cookie": {
        "description": "Sets `dl_access` (httpOnly, 15 min), `dl_refresh` (httpOnly, 30 d, "
        "Path=/api/v1/auth), refreshes `dl_csrf`; clears `dl_cart` after merging.",
        "schema": {"type": "string"},
    }
}

CartCookie = Annotated[
    str | None,
    Cookie(description="Signed guest cart token (ignored for logged-in users except for merge on login)."),
]
RefreshCookie = Annotated[str | None, Cookie(description="Opaque refresh token.")]


def _client(request: Request) -> auth_service.ClientInfo:
    return auth_service.ClientInfo(ip=get_client_ip(request), user_agent=request.headers.get("user-agent"))


def _establish_session(
    db: DbSession,
    request: Request,
    response: Response,
    user: User,
    *,
    is_new_user: bool,
    dl_cart: str | None,
) -> AuthResponse:
    """Issue tokens, merge the guest cart, commit, then set cookies (PLAN §1.3)."""
    tokens, _ = auth_service.issue_session(db, user, _client(request))
    guest_token = verify_cart_token(dl_cart) if dl_cart else None
    merged = auth_service.merge_guest_cart(db, guest_token, user)
    db.commit()
    cookies.set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    cookies.set_csrf_cookie(response)
    if dl_cart:
        cookies.clear_cart_cookie(response)
    return AuthResponse(
        user=users_service.build_user_profile(user), is_new_user=is_new_user, cart_merged=merged
    )


@router.get(
    "/auth/csrf",
    operation_id="issueCsrfToken",
    response_model=CsrfTokenResponse,
    responses={
        200: {
            "headers": {
                "Set-Cookie": {
                    "description": "Sets readable `dl_csrf` cookie (not httpOnly, SameSite=Lax, 7 d).",
                    "schema": {"type": "string"},
                }
            }
        }
    },
)
def issue_csrf_token(response: Response) -> CsrfTokenResponse:
    return CsrfTokenResponse(csrf_token=cookies.set_csrf_cookie(response))


@router.post(
    "/auth/signup",
    operation_id="signup",
    status_code=201,
    response_model=AuthResponse,
    responses={201: {"headers": _SESSION_COOKIE_DOC}, **error_responses(403, 409, 422, 429)},
    dependencies=[Depends(RateLimit("auth.signup", 5, 600))],
)
def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: DbSession,
    background_tasks: BackgroundTasks,
    dl_cart: CartCookie = None,
) -> AuthResponse:
    user = auth_service.signup(db, payload)
    auth_service.send_welcome(db, user, background_tasks)
    return _establish_session(db, request, response, user, is_new_user=True, dl_cart=dl_cart)


@router.post(
    "/auth/login",
    operation_id="login",
    response_model=AuthResponse,
    responses={200: {"headers": _SESSION_COOKIE_DOC}, **error_responses(401, 403, 422, 429)},
    dependencies=[Depends(RateLimit("auth.login", 10, 300))],
)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: DbSession,
    dl_cart: CartCookie = None,
) -> AuthResponse:
    user = auth_service.authenticate(db, payload.email, payload.password)
    return _establish_session(db, request, response, user, is_new_user=False, dl_cart=dl_cart)


@router.post(
    "/auth/otp/request",
    operation_id="requestOtp",
    status_code=202,
    response_model=OtpSendResponse,
    responses=error_responses(403, 422, 429),
    dependencies=[Depends(RateLimit("auth.otp_request", 10, 3600))],
)
def request_otp(payload: OtpSendRequest, request: Request, db: DbSession) -> OtpSendResponse:
    code = auth_service.request_otp(db, payload.email, _client(request))
    db.commit()
    return OtpSendResponse(
        message="If this email can receive messages, a 6-digit code is on its way.",
        expires_in_seconds=int(auth_service.OTP_TTL.total_seconds()),
        resend_after_seconds=int(auth_service.OTP_RESEND_AFTER.total_seconds()),
        dev_code=code if auth_service.otp_dev_echo_enabled() else None,
    )


@router.post(
    "/auth/otp/verify",
    operation_id="verifyOtp",
    response_model=AuthResponse,
    responses={200: {"headers": _SESSION_COOKIE_DOC}, **error_responses(400, 403, 422, 429)},
)
def verify_otp(
    payload: OtpVerifyRequest,
    request: Request,
    response: Response,
    db: DbSession,
    background_tasks: BackgroundTasks,
    dl_cart: CartCookie = None,
) -> AuthResponse:
    try:
        user, is_new = auth_service.verify_otp(db, payload.email, payload.code)
    except auth_service.CommitBeforeRaiseError as exc:
        db.commit()
        raise exc.error from None
    if is_new:
        auth_service.send_welcome(db, user, background_tasks)
    return _establish_session(db, request, response, user, is_new_user=is_new, dl_cart=dl_cart)


@router.post(
    "/auth/refresh",
    operation_id="refreshSession",
    response_model=AuthResponse,
    responses={200: {"headers": _SESSION_COOKIE_DOC}, **error_responses(401, 403, 422, 429)},
    dependencies=[Depends(RateLimit("auth.refresh", 30, 60))],
)
def refresh_session(
    request: Request, response: Response, db: DbSession, dl_refresh: RefreshCookie = None
) -> AuthResponse:
    try:
        user, tokens = auth_service.rotate_refresh_token(db, dl_refresh, _client(request))
    except auth_service.CommitBeforeRaiseError as exc:
        db.commit()
        raise exc.error from None
    db.commit()
    cookies.set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return AuthResponse(user=users_service.build_user_profile(user), is_new_user=False, cart_merged=False)


@router.post(
    "/auth/logout",
    operation_id="logout",
    status_code=204,
    response_class=Response,
    responses={
        204: {
            "description": "No Content",
            "headers": {
                "Set-Cookie": {
                    "description": "Clears dl_access, dl_refresh and dl_cart.",
                    "schema": {"type": "string"},
                }
            },
        },
        **error_responses(403, 422),
    },
)
def logout(db: DbSession, dl_refresh: RefreshCookie = None) -> Response:
    auth_service.revoke_refresh_token(db, dl_refresh)
    db.commit()
    response = Response(status_code=204)
    cookies.clear_auth_cookies(response)
    cookies.clear_cart_cookie(response)
    cookies.set_csrf_cookie(response)
    return response


@router.get(
    "/auth/me",
    operation_id="getMe",
    response_model=UserProfile,
    responses=error_responses(401),
)
def get_me(user: CurrentUser) -> UserProfile:
    return users_service.build_user_profile(user)
