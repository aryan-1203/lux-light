"""API contract checks against docs/openapi.yaml (PLAN §5).

* Always (non-strict): every contract operation's router module exists and is mounted; every live
  operation exists in the contract with the same method + path; operation ids are unique; every
  ``x-py-module`` schema module is importable.
* ``CONTRACT_STRICT=1`` (Phase 4 gate): the live ``app.openapi()`` must match the contract —
  operationIds, methods, paths, parameters, request/response schema names, component schema names,
  required properties and enum values. Diffs are reported as a readable list.
"""

from __future__ import annotations

import importlib
import os
import re
from collections.abc import Iterable
from pathlib import Path
from typing import Any

import pytest
import yaml
from fastapi.routing import APIRouter

from app import main

CONTRACT_PATH = Path(__file__).resolve().parents[2] / "docs" / "openapi.yaml"
HTTP_METHODS = ("get", "put", "post", "delete", "patch", "options", "head")

Operation = tuple[str, str, dict[str, Any]]  # (method, path, operation)


@pytest.fixture(scope="module")
def contract() -> dict[str, Any]:
    with CONTRACT_PATH.open(encoding="utf-8") as fh:
        loaded: dict[str, Any] = yaml.safe_load(fh)
    return loaded


@pytest.fixture(scope="module")
def live() -> dict[str, Any]:
    main.app.openapi_schema = None
    return main.app.openapi()


def operations(spec: dict[str, Any]) -> dict[str, Operation]:
    out: dict[str, Operation] = {}
    for path, item in spec.get("paths", {}).items():
        for method in HTTP_METHODS:
            op = item.get(method)
            if isinstance(op, dict):
                out[op["operationId"]] = (method, path, op)
    return out


def _tag_modules(spec: dict[str, Any]) -> dict[str, str]:
    modules: dict[str, str] = {}
    for tag in spec.get("tags", []):
        match = re.search(r"app/api/[\w/]+\.py", tag.get("description", ""))
        if match:
            modules[tag["name"]] = match.group(0)[:-3].replace("/", ".")
    return modules


# ----------------------------------------------------------------------------------------------
# Non-strict checks (Phase 2+)
# ----------------------------------------------------------------------------------------------


def test_contract_has_114_operations(contract: dict[str, Any]) -> None:
    assert len(operations(contract)) == 114


def test_every_contract_operation_module_exists_and_is_mounted(contract: dict[str, Any]) -> None:
    tag_modules = _tag_modules(contract)
    mounted = {m.__name__ for m in main.V1_ROUTER_MODULES} | {"app.api.seo"}
    problems: list[str] = []
    for op_id, (_, _, op) in sorted(operations(contract).items()):
        tag = op["tags"][0]
        module_name = tag_modules.get(tag)
        if module_name is None:
            problems.append(f"{op_id}: tag {tag!r} has no module in its description")
            continue
        module = importlib.import_module(module_name)
        if not isinstance(getattr(module, "router", None), APIRouter):
            problems.append(f"{op_id}: {module_name}.router is not an APIRouter")
        if module_name not in mounted:
            problems.append(f"{op_id}: {module_name} is not included by app.main")
    assert problems == []


def test_live_operations_are_subset_of_contract(contract: dict[str, Any], live: dict[str, Any]) -> None:
    contract_ops = operations(contract)
    problems: list[str] = []
    seen: set[str] = set()
    for path, item in live.get("paths", {}).items():
        for method in HTTP_METHODS:
            op = item.get(method)
            if not isinstance(op, dict):
                continue
            op_id = op.get("operationId", "")
            if op_id in seen:
                problems.append(f"duplicate live operationId {op_id}")
            seen.add(op_id)
            expected = contract_ops.get(op_id)
            if expected is None:
                problems.append(f"live {method.upper()} {path} has operationId {op_id!r} not in the contract")
            elif (expected[0], expected[1]) != (method, path):
                problems.append(
                    f"{op_id}: live {method.upper()} {path} != contract {expected[0].upper()} {expected[1]}"
                )
    assert problems == []
    assert "getHealth" in seen


def test_schema_modules_importable(contract: dict[str, Any]) -> None:
    modules = {
        schema.get("x-py-module")
        for schema in contract["components"]["schemas"].values()
        if isinstance(schema, dict) and schema.get("x-py-module")
    }
    for module_name in sorted(m for m in modules if m):
        importlib.import_module(module_name)


def test_live_document_metadata(contract: dict[str, Any], live: dict[str, Any]) -> None:
    assert live["info"]["title"] == contract["info"]["title"]
    assert live["info"]["version"] == contract["info"]["version"]
    assert [s["url"] for s in live["servers"]] == [s["url"] for s in contract["servers"]]
    assert [t["name"] for t in live["tags"]] == [t["name"] for t in contract["tags"]]
    assert set(live["components"]["securitySchemes"]) == set(contract["components"]["securitySchemes"])
    schemas = live["components"].get("schemas", {})
    assert "HTTPValidationError" not in schemas
    assert {"ErrorResponse", "ErrorBody", "HealthResponse"} <= set(schemas)


# ----------------------------------------------------------------------------------------------
# Strict diff (Phase 4 gate)
# ----------------------------------------------------------------------------------------------


def _ref_name(schema: dict[str, Any] | None) -> str | None:
    if not schema:
        return None
    ref = schema.get("$ref")
    if isinstance(ref, str):
        return ref.rsplit("/", 1)[-1]
    if schema.get("type") == "array" and isinstance(schema.get("items"), dict):
        inner = _ref_name(schema["items"])
        return f"array<{inner}>" if inner else "array"
    for key in ("anyOf", "oneOf"):
        if key in schema:
            names = sorted(str(_ref_name(s)) for s in schema[key])
            return f"{key}<{','.join(names)}>"
    return str(schema.get("type")) if schema.get("type") else None


def _params(spec: dict[str, Any], op: dict[str, Any]) -> set[tuple[str, str, bool]]:
    out: set[tuple[str, str, bool]] = set()
    for param in op.get("parameters", []):
        if "$ref" in param:
            param = spec["components"]["parameters"][param["$ref"].rsplit("/", 1)[-1]]
        out.add((param["in"], param["name"], bool(param.get("required", False))))
    return out


def _bodies(op: dict[str, Any]) -> dict[str, str | None]:
    body = op.get("requestBody")
    if not body:
        return {}
    return {ct: _ref_name(media.get("schema")) for ct, media in body.get("content", {}).items()}


def _responses(op: dict[str, Any], spec: dict[str, Any]) -> dict[str, dict[str, str | None]]:
    out: dict[str, dict[str, str | None]] = {}
    for status, response in op.get("responses", {}).items():
        if "$ref" in response:
            response = spec["components"]["responses"][response["$ref"].rsplit("/", 1)[-1]]
        out[str(status)] = {ct: _ref_name(m.get("schema")) for ct, m in response.get("content", {}).items()}
    return out


def _fmt(items: Iterable[Any]) -> str:
    return ", ".join(sorted(map(str, items))) or "-"


def contract_diff(contract: dict[str, Any], live: dict[str, Any]) -> list[str]:
    diffs: list[str] = []
    c_ops, l_ops = operations(contract), operations(live)
    missing = sorted(set(c_ops) - set(l_ops))
    if missing:
        diffs.append(f"missing operations ({len(missing)}): {_fmt(missing)}")
    for op_id in sorted(set(l_ops) - set(c_ops)):
        diffs.append(f"extra operation: {op_id}")
    for op_id in sorted(set(c_ops) & set(l_ops)):
        c_method, c_path, c_op = c_ops[op_id]
        l_method, l_path, l_op = l_ops[op_id]
        prefix = f"[{op_id}]"
        if (c_method, c_path) != (l_method, l_path):
            diffs.append(f"{prefix} route {l_method.upper()} {l_path} != {c_method.upper()} {c_path}")
        c_params, l_params = _params(contract, c_op), _params(live, l_op)
        if c_params != l_params:
            diffs.append(
                f"{prefix} params missing: {_fmt(c_params - l_params)}; "
                f"unexpected: {_fmt(l_params - c_params)}"
            )
        if _bodies(c_op) != _bodies(l_op):
            diffs.append(f"{prefix} request body {_bodies(l_op)} != {_bodies(c_op)}")
        c_resp, l_resp = _responses(c_op, contract), _responses(l_op, live)
        if set(c_resp) != set(l_resp):
            diffs.append(
                f"{prefix} response statuses missing: {_fmt(set(c_resp) - set(l_resp))}; "
                f"unexpected: {_fmt(set(l_resp) - set(c_resp))}"
            )
        for status in sorted(set(c_resp) & set(l_resp)):
            if c_resp[status] != l_resp[status]:
                diffs.append(f"{prefix} response {status} {l_resp[status]} != {c_resp[status]}")

    c_schemas = contract["components"]["schemas"]
    l_schemas = live.get("components", {}).get("schemas", {})
    missing_schemas = sorted(set(c_schemas) - set(l_schemas))
    if missing_schemas:
        diffs.append(f"missing component schemas ({len(missing_schemas)}): {_fmt(missing_schemas)}")
    for name in sorted(set(l_schemas) - set(c_schemas)):
        diffs.append(f"extra component schema: {name}")
    for name in sorted(set(c_schemas) & set(l_schemas)):
        c_s, l_s = c_schemas[name], l_schemas[name]
        if "enum" in c_s or "enum" in l_s:
            if c_s.get("enum") != l_s.get("enum"):
                diffs.append(f"[schema {name}] enum {l_s.get('enum')} != {c_s.get('enum')}")
            continue
        c_req, l_req = set(c_s.get("required", [])), set(l_s.get("required", []))
        if c_req != l_req:
            diffs.append(
                f"[schema {name}] required missing: {_fmt(c_req - l_req)}; unexpected: {_fmt(l_req - c_req)}"
            )
        c_props, l_props = set(c_s.get("properties", {})), set(l_s.get("properties", {}))
        if c_props != l_props:
            diffs.append(
                f"[schema {name}] properties missing: {_fmt(c_props - l_props)}; "
                f"unexpected: {_fmt(l_props - c_props)}"
            )
        for prop in sorted(c_props & l_props):
            c_ref = _ref_name(c_s["properties"][prop])
            l_ref = _ref_name(l_s["properties"][prop])
            if c_ref != l_ref and (c_ref or "")[:1].isupper():
                diffs.append(f"[schema {name}.{prop}] type {l_ref} != {c_ref}")
    return diffs


def test_contract_diff_helper_reports_readably(contract: dict[str, Any]) -> None:
    """The strict differ itself works (identical documents → no diffs; a change is reported)."""
    assert contract_diff(contract, contract) == []
    mutated = yaml.safe_load(CONTRACT_PATH.read_text(encoding="utf-8"))
    mutated["components"]["schemas"]["HealthStatus"]["enum"] = ["ok"]
    del mutated["paths"]["/api/v1/health"]
    diffs = contract_diff(contract, mutated)
    assert any("getHealth" in d for d in diffs)
    assert any("[schema HealthStatus] enum" in d for d in diffs)


if os.environ.get("CONTRACT_STRICT") == "1":

    def test_contract_strict(contract: dict[str, Any], live: dict[str, Any]) -> None:
        diffs = contract_diff(contract, live)
        report = "\n".join(f"  - {d}" for d in diffs)
        assert not diffs, (
            f"{len(diffs)} contract difference(s) between app.openapi() and docs/openapi.yaml:\n{report}"
        )
