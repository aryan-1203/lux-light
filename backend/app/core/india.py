"""India-specific helpers: GST state codes, pincodes, phone numbers."""

from __future__ import annotations

import re
from typing import Final

from app.models.enums import IndianStateCode

STATE_NAMES: Final[dict[IndianStateCode, str]] = {
    IndianStateCode.JAMMU_AND_KASHMIR: "Jammu and Kashmir",
    IndianStateCode.HIMACHAL_PRADESH: "Himachal Pradesh",
    IndianStateCode.PUNJAB: "Punjab",
    IndianStateCode.CHANDIGARH: "Chandigarh",
    IndianStateCode.UTTARAKHAND: "Uttarakhand",
    IndianStateCode.HARYANA: "Haryana",
    IndianStateCode.DELHI: "Delhi",
    IndianStateCode.RAJASTHAN: "Rajasthan",
    IndianStateCode.UTTAR_PRADESH: "Uttar Pradesh",
    IndianStateCode.BIHAR: "Bihar",
    IndianStateCode.SIKKIM: "Sikkim",
    IndianStateCode.ARUNACHAL_PRADESH: "Arunachal Pradesh",
    IndianStateCode.NAGALAND: "Nagaland",
    IndianStateCode.MANIPUR: "Manipur",
    IndianStateCode.MIZORAM: "Mizoram",
    IndianStateCode.TRIPURA: "Tripura",
    IndianStateCode.MEGHALAYA: "Meghalaya",
    IndianStateCode.ASSAM: "Assam",
    IndianStateCode.WEST_BENGAL: "West Bengal",
    IndianStateCode.JHARKHAND: "Jharkhand",
    IndianStateCode.ODISHA: "Odisha",
    IndianStateCode.CHHATTISGARH: "Chhattisgarh",
    IndianStateCode.MADHYA_PRADESH: "Madhya Pradesh",
    IndianStateCode.GUJARAT: "Gujarat",
    IndianStateCode.DADRA_NAGAR_HAVELI_DAMAN_DIU: "Dadra and Nagar Haveli and Daman and Diu",
    IndianStateCode.MAHARASHTRA: "Maharashtra",
    IndianStateCode.KARNATAKA: "Karnataka",
    IndianStateCode.GOA: "Goa",
    IndianStateCode.LAKSHADWEEP: "Lakshadweep",
    IndianStateCode.KERALA: "Kerala",
    IndianStateCode.TAMIL_NADU: "Tamil Nadu",
    IndianStateCode.PUDUCHERRY: "Puducherry",
    IndianStateCode.ANDAMAN_AND_NICOBAR: "Andaman and Nicobar Islands",
    IndianStateCode.TELANGANA: "Telangana",
    IndianStateCode.ANDHRA_PRADESH: "Andhra Pradesh",
    IndianStateCode.LADAKH: "Ladakh",
}

PINCODE_RE: Final = re.compile(r"^[1-9][0-9]{5}$")
GSTIN_RE: Final = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
_IN_MOBILE_RE: Final = re.compile(r"^[6-9][0-9]{9}$")


def state_name(code: str | IndianStateCode) -> str:
    """Display name for a GST state code; raises ``ValueError`` for unknown codes."""
    return STATE_NAMES[IndianStateCode(code)]


def is_valid_pincode(pincode: str) -> bool:
    return bool(PINCODE_RE.fullmatch(pincode))


def is_valid_gstin(gstin: str) -> bool:
    return bool(GSTIN_RE.fullmatch(gstin))


def normalize_in_phone(raw: str) -> str | None:
    """Normalise an Indian mobile number to E.164 ``+91XXXXXXXXXX`` (None when invalid)."""
    digits = re.sub(r"[\s\-()]", "", raw)
    if digits.startswith("+91"):
        digits = digits[3:]
    elif digits.startswith("0091"):
        digits = digits[4:]
    elif len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not _IN_MOBILE_RE.fullmatch(digits):
        return None
    return "+91" + digits
