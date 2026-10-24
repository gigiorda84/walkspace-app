"""Minimal App Store Connect API client (stdlib + openssl), shared by the iOS release scripts.

Reads ASC_KEY_ID / ASC_ISSUER_ID from ~/.appstoreconnect/sonicwalkscape.env and signs the JWT
with ~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8. Never prints the key or the token.
"""
import base64
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

HOME = os.path.expanduser("~")
API = "https://api.appstoreconnect.apple.com/v1"


def _read_env():
    env = {}
    with open(os.path.join(HOME, ".appstoreconnect/sonicwalkscape.env")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v
    return env["ASC_KEY_ID"], env["ASC_ISSUER_ID"]


def _b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _der_to_raw(sig):
    # ECDSA DER: 30 len 02 lenR R 02 lenS S  ->  R||S, 32 bytes each
    i = 2
    assert sig[i] == 0x02
    r_len = sig[i + 1]; r = sig[i + 2:i + 2 + r_len]; i += 2 + r_len
    assert sig[i] == 0x02
    s_len = sig[i + 1]; s = sig[i + 2:i + 2 + s_len]
    return r.lstrip(b"\0").rjust(32, b"\0") + s.lstrip(b"\0").rjust(32, b"\0")


def _make_token():
    key_id, issuer = _read_env()
    key_path = os.path.join(HOME, f".appstoreconnect/private_keys/AuthKey_{key_id}.p8")
    now = int(time.time())
    header = _b64url(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({"iss": issuer, "iat": now, "exp": now + 1200,
                                  "aud": "appstoreconnect-v1"}).encode())
    signing_input = f"{header}.{payload}".encode()
    der = subprocess.run(["openssl", "dgst", "-sha256", "-sign", key_path],
                         input=signing_input, capture_output=True, check=True).stdout
    return f"{header}.{payload}.{_b64url(_der_to_raw(der))}"


_token = None


def call(method, path, body=None, params=None):
    """Call the API; `path` starts with '/', e.g. '/apps'. Returns the decoded JSON (or {})."""
    global _token
    _token = _token or _make_token()
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {_token}",
                                          "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API {method} {path} -> HTTP {e.code}: {e.read().decode()[:1500]}")
