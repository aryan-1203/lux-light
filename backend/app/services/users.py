"""Users service: profile, password and address book. Owner: Backend Core.

Addresses: max ``MAX_ADDRESSES`` per user, exactly one default per user (the first address becomes
default; deleting/un-defaulting the default promotes the oldest remaining address).
"""

from __future__ import annotations

from typing import Final

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.india import state_name
from app.core.security import hash_password, verify_password
from app.models import Address, User
from app.schemas import users as schemas

MAX_ADDRESSES: Final = 10


# ---- profile -----------------------------------------------------------------------------------


def build_user_profile(user: User) -> schemas.UserProfile:
    return schemas.UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        email_verified=user.email_verified_at is not None,
        has_password=bool(user.password_hash),
        marketing_opt_in=user.marketing_opt_in,
        created_at=user.created_at,
    )


def update_profile(db: Session, user: User, data: schemas.UserProfileUpdate) -> User:
    fields = data.model_fields_set
    if "full_name" in fields:
        user.full_name = data.full_name or None
    if "phone" in fields:
        user.phone = data.phone
    if "marketing_opt_in" in fields and data.marketing_opt_in is not None:
        user.marketing_opt_in = data.marketing_opt_in
    db.flush()
    return user


def change_password(db: Session, user: User, data: schemas.PasswordChangeRequest) -> None:
    """Set (OTP-only account) or change the password. 400 ``AUTH_PASSWORD_INCORRECT``.

    The caller revokes refresh tokens and re-issues the current session.
    """
    if user.password_hash and not verify_password(data.current_password or "", user.password_hash):
        raise BadRequestError("AUTH_PASSWORD_INCORRECT", "Your current password is incorrect.")
    user.password_hash = hash_password(data.new_password)
    db.flush()


# ---- addresses ---------------------------------------------------------------------------------


def build_address(address: Address) -> schemas.Address:
    return schemas.Address.model_validate(address)


def list_addresses(db: Session, user: User) -> list[Address]:
    stmt = (
        select(Address)
        .where(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.id.asc())
    )
    return list(db.scalars(stmt).all())


def _lock_user(db: Session, user: User) -> None:
    """Serialise address-book changes per user (limit + single-default invariants)."""
    db.execute(select(User.id).where(User.id == user.id).with_for_update())


def _clear_default(db: Session, user_id: int, *, except_id: int | None = None) -> None:
    stmt = update(Address).where(Address.user_id == user_id, Address.is_default.is_(True))
    if except_id is not None:
        stmt = stmt.where(Address.id != except_id)
    db.execute(stmt.values(is_default=False).execution_options(synchronize_session="fetch"))


def _promote_oldest(db: Session, user_id: int, *, exclude_id: int) -> None:
    candidate = db.scalar(
        select(Address)
        .where(Address.user_id == user_id, Address.id != exclude_id)
        .order_by(Address.id.asc())
        .limit(1)
    )
    if candidate is not None:
        candidate.is_default = True


def get_address(db: Session, user: User, address_id: int) -> Address:
    address = db.scalar(select(Address).where(Address.id == address_id, Address.user_id == user.id))
    if address is None:
        raise NotFoundError("ADDRESS_NOT_FOUND", "Address not found.")
    return address


def create_address(db: Session, user: User, data: schemas.AddressInput) -> Address:
    _lock_user(db, user)
    count = int(db.scalar(select(func.count()).select_from(Address).where(Address.user_id == user.id)) or 0)
    if count >= MAX_ADDRESSES:
        raise ConflictError(
            "ADDRESS_LIMIT",
            f"You can save up to {MAX_ADDRESSES} addresses. Delete one to add another.",
            details={"max_addresses": MAX_ADDRESSES},
        )
    make_default = data.is_default or count == 0
    if make_default:
        _clear_default(db, user.id)
    address = Address(
        user_id=user.id,
        label=data.label or None,
        full_name=data.full_name,
        phone=data.phone,
        line1=data.line1,
        line2=data.line2 or None,
        landmark=data.landmark or None,
        city=data.city,
        state=state_name(data.state_code),
        state_code=data.state_code.value,
        pincode=data.pincode,
        country="IN",
        is_default=make_default,
    )
    db.add(address)
    db.flush()
    return address


def update_address(db: Session, user: User, address_id: int, data: schemas.AddressUpdate) -> Address:
    _lock_user(db, user)
    address = get_address(db, user, address_id)
    fields = data.model_fields_set
    for name in ("full_name", "phone", "line1", "city", "pincode"):
        if name in fields:
            setattr(address, name, getattr(data, name))
    for name in ("label", "line2", "landmark"):
        if name in fields:
            setattr(address, name, getattr(data, name) or None)
    if "state_code" in fields and data.state_code is not None:
        address.state_code = data.state_code.value
        address.state = state_name(data.state_code)
    if "is_default" in fields and data.is_default is not None:
        if data.is_default and not address.is_default:
            _clear_default(db, user.id, except_id=address.id)
            address.is_default = True
        elif not data.is_default and address.is_default:
            others = db.scalar(
                select(func.count())
                .select_from(Address)
                .where(Address.user_id == user.id, Address.id != address.id)
            )
            if others:  # the only address always stays the default
                address.is_default = False
                _promote_oldest(db, user.id, exclude_id=address.id)
    db.flush()
    return address


def delete_address(db: Session, user: User, address_id: int) -> None:
    _lock_user(db, user)
    address = get_address(db, user, address_id)
    was_default = address.is_default
    db.delete(address)
    db.flush()
    if was_default:
        _promote_oldest(db, user.id, exclude_id=address_id)
        db.flush()
