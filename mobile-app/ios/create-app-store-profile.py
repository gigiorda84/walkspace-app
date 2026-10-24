"""Create (or reuse) an App Store provisioning profile that includes this Mac's Apple Distribution
certificate, via the App Store Connect API, and install it for Xcode.

Usage: python3 -I mobile-app/ios/create-app-store-profile.py
Needs the API key set up as in TESTFLIGHT-DEPLOYMENT.md (see asc_api.py).
"""
import base64
import os
import subprocess
import sys

sys.dont_write_bytecode = True  # no __pycache__ in the repo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asc_api import HOME, call  # noqa: E402

BUNDLE_ID = "com.bandite.SonicWalkscape"
PROFILE_NAME = "SonicWalkscape App Store CLI"
CERT_NAME = "Apple Distribution: Giuseppe Giordano (V7Q6885JT4)"


def local_cert_serial():
    pem = subprocess.run(["security", "find-certificate", "-c", CERT_NAME, "-p"],
                         capture_output=True, check=True).stdout
    out = subprocess.run(["openssl", "x509", "-noout", "-serial"], input=pem,
                         capture_output=True, check=True).stdout.decode()
    return out.strip().split("=", 1)[1].upper().lstrip("0")


def main():
    bundles = call("GET", "/bundleIds", params={"filter[identifier]": BUNDLE_ID, "limit": 20})["data"]
    bundle = next(b for b in bundles if b["attributes"]["identifier"] == BUNDLE_ID)
    print("bundleId resource:", bundle["id"])

    serial = local_cert_serial()
    certs = call("GET", "/certificates", params={
        "filter[certificateType]": "DISTRIBUTION,IOS_DISTRIBUTION", "limit": 200})["data"]
    cert = next((c for c in certs
                 if c["attributes"]["serialNumber"].upper().lstrip("0") == serial), None)
    if cert is None:
        raise SystemExit(f"Local distribution certificate (serial {serial}) not found in the account")
    print("certificate:", cert["attributes"]["displayName"], cert["attributes"]["certificateType"],
          "expires", cert["attributes"]["expirationDate"])

    profiles = call("GET", "/profiles", params={"filter[name]": PROFILE_NAME, "limit": 20})["data"]
    profile = next((p for p in profiles if p["attributes"]["profileState"] == "ACTIVE"), None)
    if profile is None:
        profile = call("POST", "/profiles", {"data": {
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
