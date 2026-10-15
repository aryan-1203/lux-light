"""Migration round trip on the test database: downgrade base → upgrade head, and the migrated schema
matches the ORM metadata exactly (alembic autogenerate finds no differences)."""

from __future__ import annotations

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

from alembic import command
from app.db.session import engine
from app.models import Base
from tests.conftest import alembic_config


def _tables() -> set[str]:
    with engine.connect() as conn:
        return set(inspect(conn).get_table_names())


def test_single_head_named_0001_initial() -> None:
    script = ScriptDirectory.from_config(alembic_config())
    assert script.get_heads() == ["0001_initial"]


def test_downgrade_and_upgrade_round_trip() -> None:
    try:
        with engine.begin() as conn:
            command.downgrade(alembic_config(conn), "base")
        assert _tables() == {"alembic_version"}
    finally:
        with engine.begin() as conn:
            command.upgrade(alembic_config(conn), "head")
    tables = _tables()
    assert len(tables - {"alembic_version"}) == 39
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    assert version == "0001_initial"


def test_schema_matches_models() -> None:
    with engine.connect() as conn:
        context = MigrationContext.configure(conn, opts={"compare_type": True})
        diff = compare_metadata(context, Base.metadata)
    assert diff == []


def test_named_constraints_and_indexes_exist() -> None:
    with engine.connect() as conn:
        insp = inspect(conn)
        users_uniques = {u["name"] for u in insp.get_unique_constraints("users")}
        assert "uq_users_email" in users_uniques
        variant_indexes = {i["name"] for i in insp.get_indexes("product_variants")}
        assert "ix_product_variants_product_id_is_active_price_paise" in variant_indexes
        assert "uq_product_variants_product_id_colour_temperature_k_bundle" in variant_indexes | {
            u["name"] for u in insp.get_unique_constraints("product_variants")
        }
        checks = {c["name"] for c in insp.get_check_constraints("orders")}
        assert "ck_orders_total_math" in checks
        inv_checks = {c["name"] for c in insp.get_check_constraints("inventory")}
        assert inv_checks >= {
            "ck_inventory_on_hand_nonneg",
            "ck_inventory_reserved_nonneg",
            "ck_inventory_reserved_le_on_hand",
        }
        fks = {fk["name"]: fk for fk in insp.get_foreign_keys("refresh_tokens")}
        assert fks["fk_refresh_tokens_user_id_users"]["options"].get("ondelete") == "CASCADE"
        assert fks["fk_refresh_tokens_replaced_by_id_refresh_tokens"]["options"].get("ondelete") == "SET NULL"
        order_fks = {fk["name"]: fk for fk in insp.get_foreign_keys("payments")}
        assert order_fks["fk_payments_order_id_orders"]["options"].get("ondelete") in (None, "RESTRICT")
