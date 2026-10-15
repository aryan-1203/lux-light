"""Routes for the `users` tag (docs/openapi.yaml): profile, password, address book.

``/users/me/orders*`` belong to Backend Commerce (``app/api/v1/orders.py``).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Request
from starlette.responses import Response

from app.api.deps import CurrentUser, DbSession, get_client_ip
from app.api.v1.auth import error_responses
from app.core import cookies
from app.core.rate_limit import check_rate_limit
from app.schemas.users import (
    Address,
    AddressInput,
    AddressListResponse,
    AddressUpdate,
    PasswordChangeRequest,
    UserProfile,
    UserProfileUpdate,
)
from app.services import auth as auth_service
from app.services import users as users_service

router = APIRouter(tags=["users"])

AddressId = Annotated[int, Path(ge=1)]
PASSWORD_CHANGE_LIMIT = (5, 600)


@router.get(
    "/users/me", operation_id="getProfile", response_model=UserProfile, responses=error_responses(401)
)
def get_profile(user: CurrentUser) -> UserProfile:
    return users_service.build_user_profile(user)


@router.patch(
    "/users/me",
    operation_id="updateProfile",
    response_model=UserProfile,
    responses=error_responses(401, 403, 422),
)
def update_profile(payload: UserProfileUpdate, user: CurrentUser, db: DbSession) -> UserProfile:
    users_service.update_profile(db, user, payload)
    db.commit()
    return users_service.build_user_profile(user)


@router.put(
    "/users/me/password",
    operation_id="changePassword",
    status_code=204,
    response_class=Response,
    responses={204: {"description": "No Content"}, **error_responses(400, 401, 403, 422, 429)},
)
def change_password(
    payload: PasswordChangeRequest, request: Request, user: CurrentUser, db: DbSession
) -> Response:
    check_rate_limit(f"users.password:user:{user.id}", *PASSWORD_CHANGE_LIMIT)
    users_service.change_password(db, user, payload)
    # Revoke every session, then re-issue one for this client: "all other sessions" end.
    auth_service.revoke_all_refresh_tokens(db, user.id)
    client = auth_service.ClientInfo(ip=get_client_ip(request), user_agent=request.headers.get("user-agent"))
    tokens, _ = auth_service.issue_session(db, user, client)
    db.commit()
    response = Response(status_code=204)
    cookies.set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return response


@router.get(
    "/users/me/addresses",
    operation_id="listAddresses",
    response_model=AddressListResponse,
    responses=error_responses(401),
)
def list_addresses(user: CurrentUser, db: DbSession) -> AddressListResponse:
    items = [users_service.build_address(a) for a in users_service.list_addresses(db, user)]
    return AddressListResponse(items=items)


@router.post(
    "/users/me/addresses",
    operation_id="createAddress",
    status_code=201,
    response_model=Address,
    responses=error_responses(401, 403, 409, 422),
)
def create_address(payload: AddressInput, user: CurrentUser, db: DbSession) -> Address:
    address = users_service.create_address(db, user, payload)
    db.commit()
    return users_service.build_address(address)


@router.patch(
    "/users/me/addresses/{address_id}",
    operation_id="updateAddress",
    response_model=Address,
    responses=error_responses(401, 403, 404, 422),
)
def update_address(
    address_id: AddressId, payload: AddressUpdate, user: CurrentUser, db: DbSession
) -> Address:
    address = users_service.update_address(db, user, address_id, payload)
    db.commit()
    return users_service.build_address(address)


@router.delete(
    "/users/me/addresses/{address_id}",
    operation_id="deleteAddress",
    status_code=204,
    response_class=Response,
    responses={204: {"description": "No Content"}, **error_responses(401, 403, 404, 422)},
)
def delete_address(address_id: AddressId, user: CurrentUser, db: DbSession) -> Response:
    users_service.delete_address(db, user, address_id)
    db.commit()
    return Response(status_code=204)
