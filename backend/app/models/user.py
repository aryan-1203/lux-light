"""Identity & auth tables (DB_SCHEMA §2): users, refresh_tokens, otp_codes, addresses."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, ForeignKey, Index, SmallInteger, String, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, created_at_column, pk_column, table_args, updated_at_column
from app.db.types import FALSE_DEFAULT, TRUE_DEFAULT, UTCDateTime, enum_type, int_default, str_default
from app.models.enums import OtpPurpose, UserRole

if TYPE_CHECKING:
    from app.models.cart import Cart


class User(Base):
    __tablename__ = "users"
    __table_args__ = table_args(
        UniqueConstraint("email"),
        Index("ix_users_role_created_at", "role", "created_at"),
        Index("ix_users_phone", "phone"),
    )

    id: Mapped[int] = pk_column()
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(16), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        enum_type(UserRole, 16),
        nullable=False,
        default=UserRole.CUSTOMER,
        server_default=str_default(UserRole.CUSTOMER.value),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=TRUE_DEFAULT
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    marketing_opt_in: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    addresses: Mapped[list[Address]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(Address.is_default.desc(), Address.id)",
    )
    cart: Mapped[Cart | None] = relationship(back_populates="user", uselist=False, passive_deletes=True)

    @property
    def is_staff(self) -> bool:
        return self.role in (UserRole.STAFF, UserRole.ADMIN)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = table_args(
        UniqueConstraint("token_hash"),
        Index("ix_refresh_tokens_user_id_revoked_at", "user_id", "revoked_at"),
        Index("ix_refresh_tokens_family_id", "family_id"),
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )

    id: Mapped[int] = pk_column()
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    family_id: Mapped[str] = mapped_column(CHAR(32), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    replaced_by_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True
    )
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    created_at: Mapped[datetime] = created_at_column()

    user: Mapped[User] = relationship()


class OtpCode(Base):
    __tablename__ = "otp_codes"
    __table_args__ = table_args(
        Index("ix_otp_codes_email_purpose_created_at", "email", "purpose", "created_at"),
        Index("ix_otp_codes_expires_at", "expires_at"),
    )

    id: Mapped[int] = pk_column()
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    purpose: Mapped[OtpPurpose] = mapped_column(
        enum_type(OtpPurpose, 16),
        nullable=False,
        default=OtpPurpose.LOGIN,
        server_default=str_default(OtpPurpose.LOGIN.value),
    )
    code_hash: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    attempts: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, server_default=int_default(0)
    )
    max_attempts: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=5, server_default=int_default(5)
    )
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    created_at: Mapped[datetime] = created_at_column()


class Address(Base):
    __tablename__ = "addresses"
    __table_args__ = table_args(Index("ix_addresses_user_id_is_default", "user_id", "is_default"))

    id: Mapped[int] = pk_column()
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str | None] = mapped_column(String(40), nullable=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(16), nullable=False)
    line1: Mapped[str] = mapped_column(String(200), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(120), nullable=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    state: Mapped[str] = mapped_column(String(60), nullable=False)
    state_code: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    pincode: Mapped[str] = mapped_column(CHAR(6), nullable=False)
    country: Mapped[str] = mapped_column(
        CHAR(2), nullable=False, default="IN", server_default=str_default("IN")
    )
    is_default: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=FALSE_DEFAULT
    )
    created_at: Mapped[datetime] = created_at_column()
    updated_at: Mapped[datetime] = updated_at_column()

    user: Mapped[User] = relationship(back_populates="addresses")
