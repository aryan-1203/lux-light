"""Print the live OpenAPI document (``app.openapi()``) as JSON.

Usage (from backend/): ``.venv/bin/python scripts/export_openapi.py > /tmp/live.json``
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


def main() -> int:
    json.dump(app.openapi(), sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
