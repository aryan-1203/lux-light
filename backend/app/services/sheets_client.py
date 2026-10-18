"""Thin, blocking Google Sheets client (gspread). Call it from a worker thread.

`SheetsClient` is the minimal surface the store needs, so tests can swap in an in-memory fake.
"""

import base64
import json
import re
from collections.abc import Mapping
from typing import Protocol

import gspread
import requests
from google.auth.exceptions import TransportError
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

_UPDATED_ROW = re.compile(r"![A-Z]+(\d+)")


class SheetsClient(Protocol):
    def get_all_values(self, tab: str) -> list[list[str]]: ...

    def row_values(self, tab: str, row: int) -> list[str]: ...

    def append_row(self, tab: str, values: list[str]) -> int | None:
        """Append a row and return its 1-based row number when known."""
        ...

    def update_range(self, tab: str, a1_range: str, values: list[list[str]]) -> None: ...


def is_transient(exc: BaseException) -> bool:
    """True for errors worth retrying: HTTP 429 / 5xx from the API, or network failures."""
    if isinstance(exc, gspread.exceptions.APIError):
        code = getattr(exc, "code", 0)
        return code == 429 or (isinstance(code, int) and code >= 500)
    return isinstance(
        exc, requests.ConnectionError | requests.Timeout | TransportError | ConnectionError | TimeoutError
    )


def decode_service_account(b64: str) -> dict:
    return json.loads(base64.b64decode(b64.strip()))


class GspreadSheetsClient:
    """`sheet_ids` maps a tab name to its spreadsheet key; tabs not listed live in `sheet_id`."""

    def __init__(
        self,
        service_account_b64: str,
        sheet_id: str = "",
        timeout: float = 10.0,
        *,
        sheet_ids: Mapping[str, str] | None = None,
    ) -> None:
        creds = Credentials.from_service_account_info(
            decode_service_account(service_account_b64), scopes=SCOPES
        )
        self._gc = gspread.authorize(creds)
        self._gc.set_timeout(timeout)
        self._sheet_id = sheet_id
        self._sheet_ids = dict(sheet_ids or {})
        self._spreadsheets: dict[str, gspread.Spreadsheet] = {}
        self._worksheets: dict[str, gspread.Worksheet] = {}

    def _spreadsheet(self, tab: str) -> gspread.Spreadsheet:
        key = self._sheet_ids.get(tab) or self._sheet_id
        sh = self._spreadsheets.get(key)
        if sh is None:
            sh = self._spreadsheets[key] = self._gc.open_by_key(key)
        return sh

    def _ws(self, tab: str) -> gspread.Worksheet:
        ws = self._worksheets.get(tab)
        if ws is None:
            sh = self._spreadsheet(tab)
            try:
                ws = sh.worksheet(tab)
            except gspread.exceptions.WorksheetNotFound:
                sheets = sh.worksheets()
                # A fresh spreadsheet's lone, empty "Sheet1" is renamed rather than left beside a new tab.
                if len(sheets) == 1 and not any(any(r) for r in sheets[0].get_all_values()):
                    ws = sheets[0]
                    ws.update_title(tab)
                else:
                    ws = sh.add_worksheet(title=tab, rows=1000, cols=26)
            self._worksheets[tab] = ws
        return ws

    def get_all_values(self, tab: str) -> list[list[str]]:
        return [[str(v) for v in row] for row in self._ws(tab).get_all_values()]

    def row_values(self, tab: str, row: int) -> list[str]:
        return ["" if v is None else str(v) for v in self._ws(tab).row_values(row)]

    def append_row(self, tab: str, values: list[str]) -> int | None:
        resp = self._ws(tab).append_row(
            values, value_input_option="RAW", insert_data_option="INSERT_ROWS", table_range="A1"
        )
        updated = (resp or {}).get("updates", {}).get("updatedRange", "")
        match = _UPDATED_ROW.search(updated)
        return int(match.group(1)) if match else None

    def update_range(self, tab: str, a1_range: str, values: list[list[str]]) -> None:
        self._ws(tab).update(values=values, range_name=a1_range, value_input_option="RAW")
