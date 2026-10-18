"""In-memory stand-in for the Google Sheets client."""

import re

from gspread.exceptions import APIError

_A1 = re.compile(r"^([A-Z]+)(\d+):([A-Z]+)(\d+)$")


class _FakeResponse:
    def __init__(self, code: int, message: str) -> None:
        self._body = {"error": {"code": code, "message": message, "status": "FAKE"}}
        self.text = message

    def json(self) -> dict:
        return self._body


def api_error(code: int, message: str = "fake error") -> APIError:
    return APIError(_FakeResponse(code, message))  # type: ignore[arg-type]


def _col_index(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


class FakeSheetsClient:
    def __init__(self) -> None:
        self.tabs: dict[str, list[list[str]]] = {}
        self.calls: list[str] = []
        self.fail_with: Exception | None = None
        self.fail_times: int | None = None  # None = fail forever while fail_with is set

    def _maybe_fail(self, op: str) -> None:
        self.calls.append(op)
        if self.fail_with is None:
            return
        if self.fail_times is None or self.fail_times > 0:
            if self.fail_times is not None:
                self.fail_times -= 1
            raise self.fail_with

    def _tab(self, tab: str) -> list[list[str]]:
        return self.tabs.setdefault(tab, [])

    def get_all_values(self, tab: str) -> list[list[str]]:
        self._maybe_fail("get_all_values")
        return [list(r) for r in self._tab(tab)]

    def row_values(self, tab: str, row: int) -> list[str]:
        self._maybe_fail("row_values")
        rows = self._tab(tab)
        return list(rows[row - 1]) if row <= len(rows) else []

    def append_row(self, tab: str, values: list[str]) -> int | None:
        self._maybe_fail("append_row")
        rows = self._tab(tab)
        rows.append(list(values))
        return len(rows)

    def update_range(self, tab: str, a1_range: str, values: list[list[str]]) -> None:
        self._maybe_fail("update_range")
        m = _A1.match(a1_range)
        assert m, a1_range
        first_col, first_row = _col_index(m.group(1)), int(m.group(2))
        rows = self._tab(tab)
        for offset, new in enumerate(values):
            r = first_row - 1 + offset
            while len(rows) <= r:
                rows.append([])
            row = rows[r]
            needed = first_col + len(new)
            row.extend([""] * (needed - len(row)))
            row[first_col:needed] = new

    # helpers for assertions
    def data_rows(self, tab: str) -> list[list[str]]:
        return self._tab(tab)[1:]
