"""Helpers Foundation implements fully inside ★ stubs, plus the stub surface itself."""

from __future__ import annotations

import importlib
import inspect

import pytest

from app.jobs import worker
from app.models.enums import OrderStatus, StockStatus
from app.services import inventory, orders
from app.services.gst import TaxLine

S = OrderStatus

# PLAN §1.7 table, written out independently.
EXPECTED_EDGES = {
    (S.PENDING, S.PAID),
    (S.PENDING, S.PACKED),
    (S.PENDING, S.CANCELLED),
    (S.PAID, S.PACKED),
    (S.PAID, S.CANCELLED),
    (S.PACKED, S.SHIPPED),
    (S.PACKED, S.CANCELLED),
    (S.SHIPPED, S.OUT_FOR_DELIVERY),
    (S.SHIPPED, S.DELIVERED),
    (S.SHIPPED, S.RETURNED),
    (S.OUT_FOR_DELIVERY, S.DELIVERED),
    (S.OUT_FOR_DELIVERY, S.RETURNED),
    (S.DELIVERED, S.RETURNED),
    (S.DELIVERED, S.REFUNDED),
    (S.RETURNED, S.REFUNDED),
    (S.CANCELLED, S.PAID),
}


def test_allowed_transitions_match_plan_table() -> None:
    assert set(orders.ALLOWED_TRANSITIONS) == set(OrderStatus)
    edges = {(src, dst) for src, targets in orders.ALLOWED_TRANSITIONS.items() for dst in targets}
    assert edges == EXPECTED_EDGES
    assert orders.ALLOWED_TRANSITIONS[S.REFUNDED] == frozenset()
    assert orders.PAYMENT_WINDOW_EXPIRED == "payment_window_expired"
    with pytest.raises(TypeError):
        orders.ALLOWED_TRANSITIONS[S.PENDING] = frozenset()


@pytest.mark.parametrize(
    ("available", "threshold", "expected"),
    [
        (0, 10, StockStatus.OUT_OF_STOCK),
        (-3, 10, StockStatus.OUT_OF_STOCK),
        (1, 10, StockStatus.LOW_STOCK),
        (10, 10, StockStatus.LOW_STOCK),
        (11, 10, StockStatus.IN_STOCK),
        (1, 0, StockStatus.IN_STOCK),
    ],
)
def test_stock_status(available: int, threshold: int, expected: StockStatus) -> None:
    assert inventory.stock_status(available, threshold) is expected


def test_tax_line_tax_property() -> None:
    line = TaxLine(
        gross_paise=4900,
        rate_percent=18,
        taxable_value_paise=4153,
        cgst_paise=373,
        sgst_paise=374,
        igst_paise=0,
    )
    assert line.tax_paise == 747


STUB_FUNCTIONS = {
    "app.services.inventory": [
        "stock_status_for_variants",
        "reserve_for_order",
        "commit_reservation",
        "release_reservation",
        "restock_order",
        "apply_movement",
        "adjust_stock",
    ],
    "app.services.promos": [
        "reserve_redemptions",
        "redeem_for_order",
        "release_redemptions",
        "restore_redemptions",
    ],
    "app.services.pricing": ["price_cart"],
    "app.services.gst": ["is_intra_state", "split_gst", "compute_order_tax"],
    "app.services.cart": ["get_cart", "merge_guest_cart"],
    "app.services.orders": [
        "get_order_for_update",
        "get_order_by_number_for_update",
        "transition_status",
        "mark_paid",
        "cancel_order",
        "handle_full_refund",
        "clear_cart_after_order",
        "expire_stale_orders",
        "verify_order_access",
        "build_order_detail",
        "build_order_tracking",
    ],
    "app.services.payments": [
        "create_gateway_payment",
        "create_cod_payment",
        "checkout_payload_for",
        "capture_cod_payment",
        "reconcile_gateway_order",
        "create_refund",
    ],
    "app.services.invoices": [
        "generate_invoice",
        "render_invoice_pdf",
        "get_invoice_pdf",
        "schedule_pdf_render",
    ],
    "app.services.notifications": ["notify", "dispatch", "dispatch_pending"],
    "app.services.shipping": [
        "check_pincode",
        "assert_serviceable",
        "create_shipment",
        "sync_shipment",
        "apply_tracking",
    ],
    "app.services.auth": ["revoke_all_refresh_tokens"],
    "app.services.reviews": ["recompute_product_rating"],
    "app.services.catalog": ["build_product_cards"],
    "app.adapters.payments": ["get_payment_gateway", "sign_mock_payment"],
    "app.adapters.shipping": ["get_shipping_adapter"],
    "app.adapters.email": ["get_email_adapter"],
    "app.adapters.whatsapp": ["get_whatsapp_adapter"],
}


@pytest.mark.parametrize("module_name", sorted(STUB_FUNCTIONS))
def test_frozen_signatures_exist_and_are_annotated(module_name: str) -> None:
    module = importlib.import_module(module_name)
    for name in STUB_FUNCTIONS[module_name]:
        func = getattr(module, name)
        sig = inspect.signature(func)
        assert sig.return_annotation is not inspect.Signature.empty, f"{module_name}.{name}"
        for param in sig.parameters.values():
            assert param.annotation is not inspect.Parameter.empty, f"{module_name}.{name}({param.name})"


def test_worker_tolerates_unimplemented_jobs() -> None:
    jobs = worker.build_jobs()
    assert [j.name for j in jobs] == [
        "reservations",
        "notifications",
        "abandoned_cart",
        "shipments",
        "invoices",
        "purge",
    ]
    for job in jobs:
        assert worker.run_job(job) is None  # all stubs raise NotImplementedError in Phase 2
    assert worker.run_once(jobs, "purge") == 0
    with pytest.raises(SystemExit):
        worker.run_once(jobs, "nope")


def test_worker_daily_schedule() -> None:
    from datetime import UTC, datetime

    nxt = worker.next_daily_run(datetime(2026, 10, 15, 4, 30, tzinfo=UTC), (3, 0))
    assert nxt == datetime(2026, 10, 15, 21, 30, tzinfo=UTC)  # 03:00 IST next day
    early = worker.next_daily_run(datetime(2026, 10, 14, 20, 0, tzinfo=UTC), (3, 0))
    assert early == datetime(2026, 10, 14, 21, 30, tzinfo=UTC)
