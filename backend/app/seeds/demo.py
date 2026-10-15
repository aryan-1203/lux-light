"""Demo seeds (DB_SCHEMA §10.2): demo customers + addresses, demo orders (``demo_orders``, owned by
Backend Commerce) and approved reviews with recomputed rating aggregates. Local/staging only."""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core import clock
from app.core.config import get_settings
from app.core.india import state_name
from app.core.security import hash_password
from app.models import Address, Product, Review, User
from app.models.catalog import EMPTY_RATING_DIST
from app.models.enums import ReviewSource, ReviewStatus, UserRole
from app.seeds import data, demo_orders
from app.seeds.essential import SeedReport

DEMO_EMAIL_SUFFIX = ".demo@example.com"


def seed_customers(db: Session, report: SeedReport) -> dict[str, User]:
    settings = get_settings()
    out: dict[str, User] = {}
    for spec in data.DEMO_CUSTOMERS:
        user = db.scalar(select(User).where(User.email == spec.email))
        if user is None:
            user = User(
                email=spec.email,
                password_hash=hash_password(settings.SEED_DEMO_PASSWORD),
                full_name=spec.full_name,
                phone=spec.phone,
                role=UserRole.CUSTOMER,
                is_active=True,
                email_verified_at=clock.now_utc() - timedelta(days=30),
                marketing_opt_in=True,
                created_at=clock.now_utc() - timedelta(days=30),
            )
            db.add(user)
            db.flush()
            report.add("users.customer")
        has_address = db.scalar(select(func.count()).select_from(Address).where(Address.user_id == user.id))
        if not has_address:
            addr = spec.address
            db.add(
                Address(
                    user_id=user.id,
                    label=addr["label"],
                    full_name=spec.full_name,
                    phone=spec.phone,
                    line1=addr["line1"],
                    line2=addr["line2"],
                    landmark=addr["landmark"],
                    city=addr["city"],
                    state=state_name(addr["state_code"]),
                    state_code=addr["state_code"],
                    pincode=addr["pincode"],
                    country="IN",
                    is_default=True,
                )
            )
            db.flush()
            report.add("addresses")
        out[spec.email] = user
    return out


def seed_reviews(db: Session, report: SeedReport, customers: dict[str, User]) -> None:
    products = {p.slug: p for p in db.scalars(select(Product))}
    admin_id = db.scalar(select(User.id).where(User.email == "admin@dawnlit.in"))
    now = clock.now_utc()
    touched: set[int] = set()
    for spec in data.REVIEWS:
        product = products.get(spec.product_slug)
        if product is None:
            continue
        exists = db.scalar(
            select(Review.id).where(Review.product_id == product.id, Review.title == spec.title)
        )
        if exists is not None:
            continue
        customer = customers.get(spec.customer_email) if spec.customer_email else None
        created_at = now - timedelta(days=spec.days_ago)
        db.add(
            Review(
                product_id=product.id,
                user_id=customer.id if customer else None,
                author_name=spec.author_name,
                rating=spec.rating,
                title=spec.title,
                body=spec.body,
                status=ReviewStatus.APPROVED,
                # Demo customers' reviews are backed by their delivered demo orders (DB_SCHEMA §10.2).
                verified_purchase=customer is not None,
                source=ReviewSource.CUSTOMER if customer else ReviewSource.DEMO_SEED,
                moderated_by_id=admin_id,
                moderated_at=created_at + timedelta(hours=6),
                created_at=created_at,
            )
        )
        db.flush()
        touched.add(product.id)
        report.add("reviews")
    for product in products.values():
        recompute_rating(db, product)


def recompute_rating(db: Session, product: Product) -> None:
    """Seed-local equivalent of ``services.reviews.recompute_product_rating`` (approved only)."""
    rows = db.execute(
        select(Review.rating, func.count())
        .where(Review.product_id == product.id, Review.status == ReviewStatus.APPROVED)
        .group_by(Review.rating)
    ).all()
    dist = dict(EMPTY_RATING_DIST)
    for rating, count in rows:
        dist[str(int(rating))] = int(count)
    product.rating_dist = dist
    product.rating_count = sum(dist.values())
    product.rating_sum = sum(int(star) * n for star, n in dist.items())
    db.flush()


def run(db: Session, report: SeedReport) -> None:
    customers = seed_customers(db, report)
    created_orders = demo_orders.run(db)
    if created_orders:
        report.add("orders", created_orders)
    seed_reviews(db, report, customers)


def purge(db: Session, report: SeedReport) -> None:
    """Remove demo data before launch: demo orders, demo reviews, demo customers."""
    removed_orders = demo_orders.purge(db)
    if removed_orders:
        report.add("purged.orders", removed_orders)
    demo_users = list(db.scalars(select(User).where(User.email.like(f"%{DEMO_EMAIL_SUFFIX}"))))
    demo_user_ids = [u.id for u in demo_users]
    review_filter = Review.source == ReviewSource.DEMO_SEED
    if demo_user_ids:
        review_filter = review_filter | Review.user_id.in_(demo_user_ids)
    result = db.execute(delete(Review).where(review_filter))
    report.add("purged.reviews", int(getattr(result, "rowcount", 0) or 0))
    for user in demo_users:
        db.delete(user)
    db.flush()
    report.add("purged.users", len(demo_users))
    for product in db.scalars(select(Product)):
        recompute_rating(db, product)
