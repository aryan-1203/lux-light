"""Test data factories. Every factory takes the test ``Session``, flushes and returns ORM objects.

They build valid rows (all DB constraints satisfied) without going through business services, so any
agent can set up state for its tests. Defaults are deterministic but unique per call.
"""

from __future__ import annotations

import itertools
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.core import clock
from app.core.india import state_name
from app.core.money import taxable_value
from app.core.security import hash_password, new_opaque_token, sha256_hex
from app.models import (
    Address,
    Cart,
    CartItem,
    Category,
    Inventory,
    Order,
    OrderAddress,
    OrderItem,
    OrderStatusHistory,
    Product,
    ProductVariant,
    PromoCode,
    User,
)
from app.models.enums import (
    ActorType,
    AddressKind,
    DiscountType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    UserRole,
)

_seq = itertools.count(1)
DEFAULT_PASSWORD = "Sunrise!2026"
SELLER_STATE_CODE = "27"


def _n() -> int:
    return next(_seq)


def make_user(
    db: Session,
    *,
    email: str | None = None,
    password: str | None = DEFAULT_PASSWORD,
    role: UserRole = UserRole.CUSTOMER,
    full_name: str | None = "Test User",
    phone: str | None = None,
    is_active: bool = True,
    **extra: Any,
) -> User:
    n = _n()
    user = User(
        email=(email or f"user{n}@example.com").lower(),
        password_hash=hash_password(password) if password else None,
        full_name=full_name,
        phone=phone,
        role=role,
        is_active=is_active,
        **extra,
    )
    db.add(user)
    db.flush()
    return user


def make_address(
    db: Session,
    user: User,
    *,
    state_code: str = SELLER_STATE_CODE,
    pincode: str = "400050",
    city: str = "Mumbai",
    is_default: bool = True,
    **extra: Any,
) -> Address:
    address = Address(
        user_id=user.id,
        full_name=user.full_name or "Test User",
        phone=user.phone or "+919800000099",
        line1="12 Test Street",
        city=city,
        state=state_name(state_code),
        state_code=state_code,
        pincode=pincode,
        is_default=is_default,
        **extra,
    )
    db.add(address)
    db.flush()
    return address


def make_category(db: Session, *, slug: str | None = None, **extra: Any) -> Category:
    n = _n()
    category = Category(slug=slug or f"category-{n}", name=extra.pop("name", f"Category {n}"), **extra)
    db.add(category)
    db.flush()
    return category


def make_variant(
    db: Session,
    product: Product,
    *,
    sku: str | None = None,
    kelvin: int = 5500,
    bundle: str | None = None,
    price_paise: int = 499900,
    compare_at_price_paise: int | None = None,
    on_hand: int = 50,
    reserved: int = 0,
    low_stock_threshold: int = 10,
    is_default: bool = False,
    is_active: bool = True,
) -> ProductVariant:
    n = _n()
    variant = ProductVariant(
        product_id=product.id,
        sku=sku or f"DL-TEST-{n}",
        name=f"Daylight {kelvin}K · Solo {n}",
        colour_temperature_k=kelvin,
        colour_temperature_label="Daylight",
        bundle=bundle or f"solo{n}",
        bundle_label="Solo",
        price_paise=price_paise,
        compare_at_price_paise=compare_at_price_paise,
        weight_grams=1400,
        length_mm=380,
        breadth_mm=260,
        height_mm=90,
        is_default=is_default,
        is_active=is_active,
    )
    variant.inventory = Inventory(on_hand=on_hand, reserved=reserved, low_stock_threshold=low_stock_threshold)
    db.add(variant)
    db.flush()
    return variant


@dataclass
class ProductBundle:
    product: Product
    variants: list[ProductVariant]
    category: Category

    @property
    def variant(self) -> ProductVariant:
        return self.variants[0]


def make_product(
    db: Session,
    *,
    slug: str | None = None,
    category: Category | None = None,
    variants: int = 1,
    price_paise: int = 499900,
    on_hand: int = 50,
    is_active: bool = True,
    gst_rate_percent: int = 18,
    **extra: Any,
) -> ProductBundle:
    """Product + ``variants`` variants (first is default) each with an inventory row."""
    n = _n()
    category = category or make_category(db)
    product = Product(
        category_id=category.id,
        slug=slug or f"test-lamp-{n}",
        name=extra.pop("name", f"Test Lamp {n}"),
        tagline="A test lamp.",
        description_md="Test lamp.\n\nNot a medical device. Consult a doctor for medical conditions.",
        is_active=is_active,
        gst_rate_percent=gst_rate_percent,
        **extra,
    )
    db.add(product)
    db.flush()
    created = [
        make_variant(db, product, price_paise=price_paise, on_hand=on_hand, is_default=(i == 0))
        for i in range(variants)
    ]
    return ProductBundle(product=product, variants=created, category=category)


def make_promo(
    db: Session,
    *,
    code: str | None = None,
    discount_type: DiscountType = DiscountType.PERCENTAGE,
    percent_off: int | None = 10,
    amount_off_paise: int | None = None,
    **extra: Any,
) -> PromoCode:
    n = _n()
    if discount_type is DiscountType.FLAT and amount_off_paise is None:
        amount_off_paise, percent_off = 50000, None
    promo = PromoCode(
        code=(code or f"TEST{n}").upper(),
        title=extra.pop("title", f"Test promo {n}"),
        discount_type=discount_type,
        percent_off=percent_off if discount_type is DiscountType.PERCENTAGE else None,
        amount_off_paise=amount_off_paise,
        starts_at=extra.pop("starts_at", clock.now_utc() - timedelta(days=1)),
        **extra,
    )
    db.add(promo)
    db.flush()
    return promo


def make_cart(
    db: Session, *, user: User | None = None, items: list[tuple[ProductVariant, int]] | None = None
) -> Cart:
    cart = Cart(user_id=user.id if user else None, token=None if user else new_opaque_token(32))
    db.add(cart)
    db.flush()
    for variant, qty in items or []:
        db.add(
            CartItem(
                cart_id=cart.id, variant_id=variant.id, quantity=qty, added_price_paise=variant.price_paise
            )
        )
    db.flush()
    return cart


def make_order(
    db: Session,
    *,
    user: User | None = None,
    items: list[tuple[ProductVariant, int]] | None = None,
    status: OrderStatus = OrderStatus.PENDING,
    payment_method: PaymentMethod = PaymentMethod.RAZORPAY,
    payment_status: PaymentStatus = PaymentStatus.CREATED,
    state_code: str = SELLER_STATE_CODE,
    email: str | None = None,
    placed_at: datetime | None = None,
    access_token: str | None = None,
    **extra: Any,
) -> Order:
    """A structurally valid order (totals satisfy ``ck_orders_total_math``; GST per PLAN §1.8, no promo).

    Stock and payments are NOT touched — use the services for that.
    """
    if not items:
        items = [(make_product(db).variant, 1)]
    n = _n()
    subtotal = sum(v.price_paise * q for v, q in items)
    shipping = 0 if subtotal >= 99900 else 7900
    cod_fee = 4900 if payment_method is PaymentMethod.COD else 0
    intra = state_code == SELLER_STATE_CODE
    order = Order(
        order_number=extra.pop("order_number", f"DL-261015-T{n:05d}"),
        user_id=user.id if user else None,
        email=(email or (user.email if user else f"guest{n}@example.com")).lower(),
        phone=(user.phone if user and user.phone else "+919800000099"),
        status=status,
        payment_method=payment_method,
        payment_status=payment_status,
        subtotal_paise=subtotal,
        discount_paise=0,
        shipping_paise=shipping,
        cod_fee_paise=cod_fee,
        total_paise=subtotal + shipping + cod_fee,
        taxable_value_paise=0,
        tax_paise=0,
        place_of_supply_state_code=state_code,
        access_token_hash=sha256_hex(access_token or new_opaque_token()),
        placed_at=placed_at or clock.now_utc(),
        **extra,
    )
    db.add(order)
    db.flush()
    taxable_total = cgst_total = sgst_total = igst_total = 0
    for variant, qty in items:
        product = db.get(Product, variant.product_id)
        assert product is not None
        gross = variant.price_paise * qty
        taxable = taxable_value(gross, product.gst_rate_percent)
        tax = gross - taxable
        cgst = tax // 2 if intra else 0
        sgst = tax - cgst if intra else 0
        igst = 0 if intra else tax
        taxable_total += taxable
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                variant_id=variant.id,
                product_slug=product.slug,
                product_name=product.name,
                variant_name=variant.name,
                sku=variant.sku,
                hsn_code=product.hsn_code,
                gst_rate_percent=product.gst_rate_percent,
                quantity=qty,
                unit_price_paise=variant.price_paise,
                compare_at_price_paise=variant.compare_at_price_paise,
                line_subtotal_paise=gross,
                discount_paise=0,
                line_total_paise=gross,
                taxable_value_paise=taxable,
                cgst_paise=cgst,
                sgst_paise=sgst,
                igst_paise=igst,
            )
        )
    order.taxable_value_paise = taxable_total
    order.cgst_paise, order.sgst_paise, order.igst_paise = cgst_total, sgst_total, igst_total
    order.tax_paise = cgst_total + sgst_total + igst_total
    for kind in (AddressKind.SHIPPING, AddressKind.BILLING):
        db.add(
            OrderAddress(
                order_id=order.id,
                kind=kind,
                full_name=user.full_name if user and user.full_name else "Guest Buyer",
                phone=order.phone,
                line1="12 Test Street",
                city="Mumbai" if intra else "Bengaluru",
                state=state_name(state_code),
                state_code=state_code,
                pincode="400050" if intra else "560034",
            )
        )
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=None,
            to_status=OrderStatus.PENDING,
            actor_type=ActorType.CUSTOMER if user else ActorType.SYSTEM,
            actor_user_id=user.id if user else None,
        )
    )
    db.flush()
    return order
