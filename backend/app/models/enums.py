"""Domain enums. Class names equal the OpenAPI enum schema names; values are stored as VARCHAR.

Members are UPPER_CASE, values are the lower-case API strings (PLAN §6.1).
Enums marked "internal" are DB-only (not part of the API contract).
"""

from __future__ import annotations

from enum import StrEnum


class UserRole(StrEnum):
    CUSTOMER = "customer"
    STAFF = "staff"
    ADMIN = "admin"


class OrderStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    PACKED = "packed"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    RETURNED = "returned"


class PaymentStatus(StrEnum):
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(StrEnum):
    RAZORPAY = "razorpay"
    COD = "cod"


class PaymentProvider(StrEnum):
    RAZORPAY = "razorpay"
    MOCK = "mock"
    COD = "cod"


class GatewayMode(StrEnum):
    RAZORPAY = "razorpay"
    MOCK = "mock"


class CheckoutNextAction(StrEnum):
    PAY = "pay"
    CONFIRMED = "confirmed"


class MockPaymentOutcome(StrEnum):
    SUCCESS = "success"
    FAILURE = "failure"


class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FLAT = "flat"


class ShipmentStatus(StrEnum):
    CREATED = "created"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED_DELIVERY = "failed_delivery"
    RTO_INITIATED = "rto_initiated"
    RTO_DELIVERED = "rto_delivered"
    CANCELLED = "cancelled"


class ShippingProvider(StrEnum):
    MOCK = "mock"
    SHIPROCKET = "shiprocket"


class RefundStatus(StrEnum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"


class RefundMethod(StrEnum):
    GATEWAY = "gateway"
    MANUAL = "manual"


class ReviewStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewSort(StrEnum):
    NEWEST = "newest"
    HIGHEST = "highest"
    LOWEST = "lowest"


class BlogStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class StockMovementReason(StrEnum):
    INITIAL_STOCK = "initial_stock"
    PURCHASE_RECEIPT = "purchase_receipt"
    SALE = "sale"
    ORDER_CANCELLED = "order_cancelled"
    CUSTOMER_RETURN = "customer_return"
    DAMAGED = "damaged"
    LOST = "lost"
    CORRECTION = "correction"


#: Reasons an admin may use for a manual adjustment (contract: StockMovementReason description).
MANUAL_ADJUSTMENT_REASONS: frozenset[StockMovementReason] = frozenset(
    {
        StockMovementReason.INITIAL_STOCK,
        StockMovementReason.CUSTOMER_RETURN,
        StockMovementReason.DAMAGED,
        StockMovementReason.LOST,
        StockMovementReason.CORRECTION,
    }
)


class StockStatus(StrEnum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"


class ProductSort(StrEnum):
    FEATURED = "featured"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NEWEST = "newest"
    RATING = "rating"


class CartLineWarningCode(StrEnum):
    OUT_OF_STOCK = "OUT_OF_STOCK"
    INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK"
    VARIANT_UNAVAILABLE = "VARIANT_UNAVAILABLE"
    PRICE_CHANGED = "PRICE_CHANGED"


class CartNoticeCode(StrEnum):
    PROMO_NOT_APPLICABLE = "PROMO_NOT_APPLICABLE"
    PROMO_REMOVED = "PROMO_REMOVED"
    ITEMS_MERGED = "ITEMS_MERGED"
    LINE_QUANTITY_CAPPED = "LINE_QUANTITY_CAPPED"


class TimelineEventKind(StrEnum):
    STATUS_CHANGE = "status_change"
    SHIPMENT_UPDATE = "shipment_update"
    PAYMENT = "payment"
    REFUND = "refund"


class ActorType(StrEnum):
    CUSTOMER = "customer"
    STAFF = "staff"
    ADMIN = "admin"
    SYSTEM = "system"


class PurchaseBatchStatus(StrEnum):
    DRAFT = "draft"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class NotificationKind(StrEnum):
    ORDER_CONFIRMED = "order_confirmed"
    ORDER_SHIPPED = "order_shipped"
    ORDER_OUT_FOR_DELIVERY = "order_out_for_delivery"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    REFUND_PROCESSED = "refund_processed"
    OTP_LOGIN = "otp_login"
    WELCOME = "welcome"
    ABANDONED_CART = "abandoned_cart"
    CONTACT_RECEIVED = "contact_received"


class NotificationChannel(StrEnum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class NotificationStatus(StrEnum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class ContactTopic(StrEnum):
    ORDER = "order"
    PRODUCT = "product"
    RETURNS = "returns"
    WHOLESALE = "wholesale"
    OTHER = "other"


class ContactMessageStatus(StrEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    SPAM = "spam"


class FaqCategory(StrEnum):
    PRODUCT = "product"
    USAGE = "usage"
    SHIPPING = "shipping"
    RETURNS = "returns"
    PAYMENTS = "payments"
    SAFETY = "safety"


class AdminOrderSort(StrEnum):
    NEWEST = "newest"
    OLDEST = "oldest"
    TOTAL_DESC = "total_desc"
    TOTAL_ASC = "total_asc"


class CustomerSort(StrEnum):
    NEWEST = "newest"
    TOTAL_SPENT_DESC = "total_spent_desc"
    ORDERS_DESC = "orders_desc"


class QuizWakeTime(StrEnum):
    EARLY = "early"
    REGULAR = "regular"
    LATE = "late"


class QuizWorkStyle(StrEnum):
    DESK_OFFICE = "desk_office"
    DESK_HOME = "desk_home"
    SHIFT_WORK = "shift_work"
    ON_THE_MOVE = "on_the_move"


class QuizScreenTime(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class QuizGoal(StrEnum):
    MORNING_ENERGY = "morning_energy"
    DAYTIME_FOCUS = "daytime_focus"
    CONSISTENT_ROUTINE = "consistent_routine"
    TRAVEL_ROUTINE = "travel_routine"


class QuizSetting(StrEnum):
    DESK = "desk"
    ROOM = "room"
    TRAVEL = "travel"


class IndianStateCode(StrEnum):
    JAMMU_AND_KASHMIR = "01"
    HIMACHAL_PRADESH = "02"
    PUNJAB = "03"
    CHANDIGARH = "04"
    UTTARAKHAND = "05"
    HARYANA = "06"
    DELHI = "07"
    RAJASTHAN = "08"
    UTTAR_PRADESH = "09"
    BIHAR = "10"
    SIKKIM = "11"
    ARUNACHAL_PRADESH = "12"
    NAGALAND = "13"
    MANIPUR = "14"
    MIZORAM = "15"
    TRIPURA = "16"
    MEGHALAYA = "17"
    ASSAM = "18"
    WEST_BENGAL = "19"
    JHARKHAND = "20"
    ODISHA = "21"
    CHHATTISGARH = "22"
    MADHYA_PRADESH = "23"
    GUJARAT = "24"
    DADRA_NAGAR_HAVELI_DAMAN_DIU = "26"
    MAHARASHTRA = "27"
    KARNATAKA = "29"
    GOA = "30"
    LAKSHADWEEP = "31"
    KERALA = "32"
    TAMIL_NADU = "33"
    PUDUCHERRY = "34"
    ANDAMAN_AND_NICOBAR = "35"
    TELANGANA = "36"
    ANDHRA_PRADESH = "37"
    LADAKH = "38"


class HealthStatus(StrEnum):
    OK = "ok"
    DEGRADED = "degraded"


# ---------------------------------------------------------------------------------------------
# Internal (DB-only) enums
# ---------------------------------------------------------------------------------------------


class ReservationStatus(StrEnum):
    ACTIVE = "active"
    COMMITTED = "committed"
    RELEASED = "released"
    EXPIRED = "expired"


class RedemptionStatus(StrEnum):
    RESERVED = "reserved"
    REDEEMED = "redeemed"
    RELEASED = "released"


class WebhookEventStatus(StrEnum):
    RECEIVED = "received"
    PROCESSED = "processed"
    IGNORED = "ignored"
    FAILED = "failed"


class WebhookSource(StrEnum):
    RAZORPAY = "razorpay"
    SHIPROCKET = "shiprocket"
    MOCK_SHIPPING = "mock_shipping"


class AddressKind(StrEnum):
    SHIPPING = "shipping"
    BILLING = "billing"


class ReviewSource(StrEnum):
    CUSTOMER = "customer"
    DEMO_SEED = "demo_seed"


class OtpPurpose(StrEnum):
    LOGIN = "login"
