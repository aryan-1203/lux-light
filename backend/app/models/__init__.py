"""ORM models for every table in docs/DB_SCHEMA.md (39 tables).

Import from here: ``from app.models import Order, ProductVariant, ...``.
"""

from app.db.base import Base
from app.models.cart import Cart, CartItem, CartPromo
from app.models.catalog import Category, Product, ProductImage, ProductVariant
from app.models.content import BlogPost, ContactMessage, Faq, QuizResult, Review
from app.models.inventory import Inventory, StockMovement, StockReservation
from app.models.invoice import Invoice, InvoiceSequence
from app.models.ops import AuditLog, NotificationLog, WebhookEvent
from app.models.order import Order, OrderAddress, OrderItem, OrderStatusHistory
from app.models.payment import Payment, Refund
from app.models.promo import PromoCode, PromoRedemption, promo_code_categories, promo_code_products
from app.models.purchasing import PurchaseBatch, PurchaseBatchItem, Supplier
from app.models.shipping import Shipment, ShipmentEvent
from app.models.user import Address, OtpCode, RefreshToken, User

__all__ = [
    "Address",
    "AuditLog",
    "Base",
    "BlogPost",
    "Cart",
    "CartItem",
    "CartPromo",
    "Category",
    "ContactMessage",
    "Faq",
    "Inventory",
    "Invoice",
    "InvoiceSequence",
    "NotificationLog",
    "Order",
    "OrderAddress",
    "OrderItem",
    "OrderStatusHistory",
    "OtpCode",
    "Payment",
    "Product",
    "ProductImage",
    "ProductVariant",
    "PromoCode",
    "PromoRedemption",
    "PurchaseBatch",
    "PurchaseBatchItem",
    "QuizResult",
    "RefreshToken",
    "Refund",
    "Review",
    "Shipment",
    "ShipmentEvent",
    "StockMovement",
    "StockReservation",
    "Supplier",
    "User",
    "WebhookEvent",
    "promo_code_categories",
    "promo_code_products",
]
