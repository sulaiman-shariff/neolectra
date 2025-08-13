#!/usr/bin/env python3
"""
bescom_json_only.py

Usage:
    python bescom_json_only.py 3330427000

Outputs:
    - Writes ONLY one JSON object to stdout (no PDF or other files are created).
    - On error prints diagnostics to stderr and exits non-zero.
"""

import os
import sys
import json
import base64
import hashlib
import argparse
import time
import re
from datetime import datetime
from typing import Optional, List, Tuple
from io import BytesIO

import requests
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

# ---------- Config (env overridable) ----------
APPSERVICEKEY = os.environ.get(
    "BESCOM_APPSERVICEKEY",
    "$3z$23$JBC7QqHzHEzJ/TzoS5qH4.Morw8ublIgfA.0byOEKrvnMyOr1K8Aj"
)
RESPONSE_KEY = os.environ.get("BESCOM_RESPONSE_KEY", "b57ea4714sd2d6ahi7896e8")
PBKDF2_ITERS = int(os.environ.get("BESCOM_PBKDF2_ITERS", "1989"))
SALT_LEN = 32
IV_LEN = 16
KEY_LEN = 32
BLOCK_SIZE = 16

BASE = os.environ.get("BESCOM_BASE", "https://bescom.co.in:8081")
DOWNLOAD_URL = BASE + "/bescom/user/v1/downloadBillingDetails"

# ---------- Encryption helpers ----------
def pkcs7_pad(b: bytes) -> bytes:
    pad = BLOCK_SIZE - (len(b) % BLOCK_SIZE)
    return b + bytes([pad]) * pad

def pkcs7_unpad(b: bytes) -> bytes:
    if not b:
        return b
    pad = b[-1]
    if pad < 1 or pad > BLOCK_SIZE:
        return b
    if b[-pad:] != bytes([pad]) * pad:
        return b
    return b[:-pad]

def pbkdf2(password: bytes, salt: bytes, iters: int, dklen: int) -> bytes:
    return hashlib.pbkdf2_hmac("sha1", password, salt, iters, dklen)

def encrypt_json(obj: dict, key_str: str = RESPONSE_KEY) -> str:
    plaintext = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    salt = get_random_bytes(SALT_LEN)
    iv = get_random_bytes(IV_LEN)
    key = pbkdf2(key_str.encode("utf-8"), salt, PBKDF2_ITERS, KEY_LEN)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pkcs7_pad(plaintext))
    return salt.hex() + iv.hex() + base64.b64encode(ct).decode("ascii")

def decrypt_cdata(enc: str, key_str: str = RESPONSE_KEY) -> bytes:
    salt_hex = enc[:SALT_LEN*2]
    iv_hex = enc[SALT_LEN*2:SALT_LEN*2 + IV_LEN*2]
    b64_ct = enc[SALT_LEN*2 + IV_LEN*2:]
    salt = bytes.fromhex(salt_hex)
    iv = bytes.fromhex(iv_hex)
    ct = base64.b64decode(b64_ct)
    key = pbkdf2(key_str.encode("utf-8"), salt, PBKDF2_ITERS, KEY_LEN)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = cipher.decrypt(ct)
    return pkcs7_unpad(pt)

# ---------- PDF text extraction from bytes (no disk) ----------
AMOUNT_RE = re.compile(r'(?<!\d)(\d{1,3}(?:[,\u202F]\d{3})*(?:\.\d+)?)(?!\d)')
DATE_RES = [
    re.compile(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'),
    re.compile(r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b'),
    re.compile(r'\b([A-Za-z]{3,9}\s*[,-]?\s*\d{4})\b'),
    re.compile(r'\b([A-Za-z]{3}\s*\d{4})\b'),
]
UNIT_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(?:units|kwh|kw|kW|KWH|units\.)', re.IGNORECASE)

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Try pdfplumber -> PyPDF2 -> fitz. All operate on bytes in-memory."""
    # 1) pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
        if any(pages):
            return "\n\n".join(pages)
    except Exception:
        pass

    # 2) PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        pages = []
        for p in reader.pages:
            pages.append(p.extract_text() or "")
        if any(pages):
            return "\n\n".join(pages)
    except Exception:
        pass

    # 3) fitz / PyMuPDF
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = [p.get_text("text") or "" for p in doc]
        if any(pages):
            return "\n\n".join(pages)
    except Exception:
        pass

    raise RuntimeError("No available PDF text extractor succeeded. Install pdfplumber, PyPDF2 or pymupdf.")

# ---------- Heuristics for rows ----------
def normalize_num(s):
    if s is None:
        return None
    s = s.replace('\u202F','').replace(',','').strip()
    try:
        return int(s) if '.' not in s else float(s)
    except:
        try:
            return float(s)
        except:
            return None

def find_table_by_header(lines: List[str]):
    headers_keywords = ["bill date", "bill period", "amount", "units", "consumed", "bill amount", "net amount", "bill month", "month", "bill"]
    header_idx = None
    for i, ln in enumerate(lines):
        low = ln.lower()
        hits = sum(1 for kw in headers_keywords if kw in low)
        if hits >= 1 and ("amount" in low or "units" in low or "bill" in low):
            header_idx = i
            break
    if header_idx is None:
        return None
    data_rows = []
    for ln in lines[header_idx+1: header_idx+1+200]:
        if not ln.strip():
            break
        cols = re.split(r'\s{2,}|\t', ln.strip())
        if len(cols) < 2:
            cols = ln.strip().split()
        data_rows.append(cols)
    mapped = []
    for cols in data_rows:
        nums = []
        for c in cols:
            m = AMOUNT_RE.findall(c)
            if m:
                nums.extend(m)
        if not nums:
            continue
        amt = normalize_num(nums[-1])
        unit = None
        if len(nums) >= 2:
            candidate = normalize_num(nums[-2])
            if candidate is not None and candidate < 10000:
                unit = candidate
        date = None
        for c in cols:
            for dr in DATE_RES:
                m = dr.findall(c)
                if m:
                    date = m[0]
                    break
            if date:
                break
        mapped.append({"raw_cols": cols, "date": date, "units": unit, "amount": amt})
    return mapped if mapped else None

def guess_rows_from_lines(lines: List[str]):
    rows = []
    for ln in lines:
        ln_clean = " ".join(ln.split())
        if not ln_clean:
            continue
        amounts = AMOUNT_RE.findall(ln_clean)
        amounts = [a for a in amounts if len(a) <= 20]
        dates = []
        for dr in DATE_RES:
            for m in dr.findall(ln_clean):
                if m and len(m) < 40:
                    dates.append(m.strip())
        units = UNIT_RE.findall(ln_clean)
        if amounts and (dates or units or len(amounts) >= 2):
            amt = normalize_num(amounts[-1])
            unit_val = None
            if units:
                try:
                    unit_val = float(units[0])
                except:
                    unit_val = None
            else:
                if len(amounts) >= 2:
                    unit_val = normalize_num(amounts[-2])
            date_val = dates[0] if dates else None
            rows.append({
                "line": ln_clean,
                "date": date_val,
                "units": unit_val,
                "amount": amt
            })
    return rows

def parse_pdf_bytes_to_rows(pdf_bytes: bytes):
    txt = extract_text_from_pdf_bytes(pdf_bytes)
    lines: List[str] = []
    for page in txt.split("\n\n"):
        for ln in page.splitlines():
            lines.append(ln.strip())
    table = find_table_by_header(lines)
    rows = table if table else guess_rows_from_lines(lines)
    out_rows = []
    for r in rows:
        date = r.get("date")
        units = r.get("units")
        amount = r.get("amount")
        if amount is None:
            m = AMOUNT_RE.findall(r.get("line","") if "line" in r else " ".join(r.get("raw_cols",[])))
            if m:
                amount = normalize_num(m[-1])
        if units is None:
            m = UNIT_RE.findall(r.get("line","") if "line" in r else " ".join(r.get("raw_cols", [])))
            if m:
                try:
                    units = float(m[0])
                except:
                    units = None
        parsed_date = None
        if date:
            for fmt in ("%d/%m/%Y","%d/%m/%y","%Y-%m-%d","%b %Y","%B %Y","%b%Y","%b-%Y","%B,%Y"):
                try:
                    parsed_date = datetime.strptime(date.replace(',',' ').strip(), fmt).date().isoformat()
                    break
                except:
                    continue
            if not parsed_date:
                parsed_date = date.strip()
        out_rows.append({
            "date": parsed_date,
            "units": units,
            "amount": amount,
            "raw": r.get("line") if "line" in r else " | ".join(r.get("raw_cols", []))
        })
    # keep only rows that have amount
    out_rows = [r for r in out_rows if r.get("amount") is not None]
    return out_rows

# ---------- Fetch & decrypt (no disk writes) ----------
def fetch_and_decrypt(account: str, verbose: bool=False) -> bytes:
    req_json = {"accountId": account, "discomId": "1", "communicationWay": "download"}
    enc = encrypt_json(req_json)
    headers = {
        "appservicekey": APPSERVICEKEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://www.bescom.co.in",
        "Referer": "https://www.bescom.co.in/"
    }
    r = requests.post(DOWNLOAD_URL, json={"_cdata": enc}, headers=headers, timeout=30)
    r.raise_for_status()
    # expect JSON with _cdata
    content_type = r.headers.get("content-type","").lower()
    resp_json = None
    if content_type.startswith("application/json") or r.text.strip().startswith("{"):
        try:
            resp_json = r.json()
        except Exception:
            resp_json = None
    if not resp_json or "_cdata" not in resp_json:
        # If response body itself looks like _cdata string, try decrypting that directly
        body_text = r.text.strip()
        if body_text and len(body_text) > (SALT_LEN*2 + IV_LEN*2 + 8):
            try:
                dec = decrypt_cdata(body_text)
                return dec
            except Exception:
                pass
        # Otherwise can't handle; raise with content hint (but do NOT write files)
        raise RuntimeError("Unexpected response format from server and no _cdata present.")
    dec = decrypt_cdata(resp_json["_cdata"])
    # If dec is JSON with a base64 'data' field, decode that
    try:
        txt = dec.decode("utf-8")
        parsed = json.loads(txt)
        if isinstance(parsed, dict) and parsed.get("data"):
            # data is likely base64 string of PDF
            b64 = "".join(parsed["data"].split())
            try:
                pdf_bytes = base64.b64decode(b64, validate=True)
            except Exception:
                pdf_bytes = base64.b64decode(b64 + "===")
            return pdf_bytes
    except Exception:
        pass
    # If decrypted bytes contain PDF marker, return bytes
    if dec[:4] == b"%PDF" or b"%PDF" in dec:
        idx = dec.find(b"%PDF")
        if idx > 0:
            dec = dec[idx:]
        return dec
    # else unsupported content
    raise RuntimeError("Decrypted content did not contain PDF bytes or expected base64 'data' field.")

# ---------- CLI ----------
def main():
    p = argparse.ArgumentParser(description="Fetch BESCOM billing for account and print structured JSON to stdout (only).")
    p.add_argument("account", help="ConsumerAccountId, e.g. 3330427000")
    p.add_argument("--verbose", "-v", action="store_true", help="Print diagnostics to stderr")
    args = p.parse_args()

    acct = args.account.strip()
    try:
        pdf_bytes = fetch_and_decrypt(acct, verbose=args.verbose)
    except Exception as e:
        print(json.dumps({"error": "fetch_failed", "message": str(e)}), file=sys.stderr)
        sys.exit(2)

    try:
        rows = parse_pdf_bytes_to_rows(pdf_bytes)
    except Exception as e:
        print(json.dumps({"error": "parse_failed", "message": str(e)}), file=sys.stderr)
        sys.exit(3)

    structured = {
        "account": acct,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "rows": rows
    }

    # Print ONLY the JSON object to stdout (no other prints)
    sys.stdout.write(json.dumps(structured, ensure_ascii=False, indent=2, default=str))
    sys.stdout.flush()

    #Save the JSON
    with open(f"bescom_{acct}_structured.json", "w", encoding="utf-8") as f:
        json.dump(structured, f, ensure_ascii=False, indent=2, default=str)

if __name__ == "__main__":
    main()
