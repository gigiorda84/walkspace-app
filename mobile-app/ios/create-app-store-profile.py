"""Create (or reuse) an App Store provisioning profile that includes this Mac's Apple Distribution
certificate, via the App Store Connect API, and install it for Xcode.

Stdlib only; the JWT is signed with `openssl` using the .p8 key. Never prints the key or the token.
"""
import base64
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

BUNDLE_ID = "com.bandite.SonicWalkscape"
PROFILE_NAME = "SonicWalkscape App Store CLI"
CERT_NAME = "Apple Distribution: Giuseppe Giordano (V7Q6885JT4)"
HOME = os.path.expanduser("~")
API = "https://api.appstoreconnect.apple.com/v1"


def read_env():
    env = {}
    with open(os.path.join(HOME, ".appstoreconnect/sonicwalkscape.env")) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v
    return env["ASC_KEY_ID"], env["ASC_ISSUER_ID"]


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def der_to_raw(sig):
    # ECDSA DER: 30 len 02 lenR R 02 lenS S  ->  R||S, 32 bytes each
    i = 2
    assert sig[i] == 0x02
    r_len = sig[i + 1]; r = sig[i + 2:i + 2 + r_len]; i += 2 + r_len
    assert sig[i] == 0x02
    s_len = sig[i + 1]; s = sig[i + 2:i + 2 + s_len]
    return r.lstrip(b"\0").rjust(32, b"\0") + s.lstrip(b"\0").rjust(32, b"\0")


def make_token(key_id, issuer):
    key_path = os.path.join(HOME, f".appstoreconnect/private_keys/AuthKey_{key_id}.p8")
    now = int(time.time())
    header = b64url(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}).encode())
    payload = b64url(json.dumps({"iss": issuer, "iat": now, "exp": now + 600,
                                 "aud": "appstoreconnect-v1"}).encode())
    signing_input = f"{header}.{payload}".encode()
    der = subprocess.run(["openssl", "dgst", "-sha256", "-sign", key_path],
                         input=signing_input, capture_output=True, check=True).stdout
    return f"{header}.{payload}.{b64url(der_to_raw(der))}"


def call(token, method, path, body=None):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API {method} {path} -> HTTP {e.code}: {e.read().decode()[:500]}")


def local_cert_serial():
    pem = subprocess.run(["security", "find-certificate", "-c", CERT_NAME, "-p"],
                         capture_output=True, check=True).stdout
    out = subprocess.run(["openssl", "x509", "-noout", "-serial"], input=pem,
                         capture_output=True, check=True).stdout.decode()
    return out.strip().split("=", 1)[1].upper().lstrip("0")


def main():
    key_id, issuer = read_env()
    token = make_token(key_id, issuer)

    bundles = call(token, "GET", "/bundleIds?" + urllib.parse.urlencode(
        {"filter[identifier]": BUNDLE_ID, "limit": 20}))["data"]
    bundle = next(b for b in bundles if b["attributes"]["identifier"] == BUNDLE_ID)
    print("bundleId resource:", bundle["id"])

    serial = local_cert_serial()
    certs = call(token, "GET", "/certificates?" + urllib.parse.urlencode(
        {"filter[certificateType]": "DISTRIBUTION,IOS_DISTRIBUTION", "limit": 200}))["data"]
    cert = next((c for c in certs
                 if c["attributes"]["serialNumber"].upper().lstrip("0") == serial), None)
    if cert is None:
        raise SystemExit(f"Local distribution certificate (serial {serial}) not found in the account")
    print("certificate:", cert["attributes"]["displayName"], cert["attributes"]["certificateType"],
          "expires", cert["attributes"]["expirationDate"])

    profiles = call(token, "GET", "/profiles?" + urllib.parse.urlencode(
        {"filter[name]": PROFILE_NAME, "limit": 20}))["data"]
    profile = next((p for p in profiles if p["attributes"]["profileState"] == "ACTIVE"), None)
    if profile is None:
        profile = call(token, "POST", "/profiles", {"data": {
            "type": "profiles",
            "attributes": {"name": PROFILE_NAME, "profileType": "IOS_APP_STORE"},
            "relationships": {
                "bundleId": {"data": {"type": "bundleIds", "id": bundle["id"]}},
                "certificates": {"data": [{"type": "certificates", "id": cert["id"]}]},
            }}})["data"]
        print("created profile")
    else:
        print("reusing existing profile")

    attrs = profile["attributes"]
    dest_dir = os.path.join(HOME, "Library/Developer/Xcode/UserData/Provisioning Profiles")
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, f"{attrs['uuid']}.mobileprovision")
    with open(dest, "wb") as f:
        f.write(base64.b64decode(attrs["profileContent"]))
    print("installed:", attrs["name"], attrs["uuid"], "expires", attrs["expirationDate"])


if __name__ == "__main__":
    main()
