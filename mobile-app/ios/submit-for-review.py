"""Submit an uploaded iOS build for App Store review via the App Store Connect API.

Usage: python3 -I mobile-app/ios/submit-for-review.py <version> <build> [--submit]
  e.g. python3 -I mobile-app/ios/submit-for-review.py 1.7 16            (dry run: reads only)
       python3 -I mobile-app/ios/submit-for-review.py 1.7 16 --submit   (does it)

With --submit: creates the App Store version if missing (released automatically after approval,
like previous versions), attaches the build, sets "What's New" for every store localization from
mobile-app/ios/release-notes/<locale>.txt, then creates and submits the review submission.
Expedited Review has no API: request it at https://developer.apple.com/contact/app-store/?topic=expedite
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # no __pycache__ in the repo
sys.path.insert(0, HERE)
from asc_api import call  # noqa: E402

BUNDLE_ID = "com.bandite.SonicWalkscape"
EDITABLE = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED",
            "INVALID_BINARY"}


def release_notes(locale):
    path = os.path.join(HERE, "release-notes", f"{locale}.txt")
    if not os.path.exists(path):
        raise SystemExit(f"Missing release notes for store locale '{locale}': {path}")
    text = open(path, encoding="utf-8").read().strip()
    if not text:
        raise SystemExit(f"Empty release notes: {path}")
    return text


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 2:
        raise SystemExit(__doc__)
    version, build_number = args
    submit = "--submit" in sys.argv

    app = call("GET", "/apps", params={"filter[bundleId]": BUNDLE_ID})["data"][0]
    print(f"app: {app['attributes']['name']} ({app['id']})")

    builds = call("GET", "/builds", params={"filter[app]": app["id"], "filter[version]": build_number,
                                            "filter[preReleaseVersion.version]": version})["data"]
    if not builds:
        raise SystemExit(f"Build {version} ({build_number}) not found (still uploading?)")
    build = builds[0]
    state = build["attributes"]["processingState"]
    print(f"build {version} ({build_number}): {state}")
    if state != "VALID":
        raise SystemExit("Build is not processed yet (needs VALID) — try again later")

    versions = call("GET", f"/apps/{app['id']}/appStoreVersions",
                    params={"filter[platform]": "IOS", "limit": 10})["data"]
    store_version = next((v for v in versions if v["attributes"]["versionString"] == version), None)
    if store_version and store_version["attributes"]["appStoreState"] not in EDITABLE:
        raise SystemExit(f"Version {version} is {store_version['attributes']['appStoreState']} — "
                         "nothing to submit")
    other = next((v for v in versions if v["attributes"]["appStoreState"] in EDITABLE
                  and v["attributes"]["versionString"] != version), None)
    if other:
        raise SystemExit(f"Another editable version exists ({other['attributes']['versionString']}, "
                         f"{other['attributes']['appStoreState']}) — resolve it in App Store Connect")

    # Locales: those of the version being submitted, or (new version) of the latest one
    source = store_version or versions[0]
    locales = [l["attributes"]["locale"] for l in
               call("GET", f"/appStoreVersions/{source['id']}/appStoreVersionLocalizations")["data"]]
    notes = {loc: release_notes(loc) for loc in locales}
    for loc, text in notes.items():
        print(f"What's New [{loc}]: {text}")

    if not submit:
        print(f"\nDry run. With --submit this would: "
              f"{'use' if store_version else 'create'} App Store version {version}, attach build "
              f"{build_number}, set What's New for {', '.join(locales)}, and submit for review.")
        return

    if store_version is None:
        release_type = versions[0]["attributes"].get("releaseType") or "AFTER_APPROVAL"
        store_version = call("POST", "/appStoreVersions", {"data": {
            "type": "appStoreVersions",
            "attributes": {"platform": "IOS", "versionString": version, "releaseType": release_type},
            "relationships": {"app": {"data": {"type": "apps", "id": app["id"]}}},
        }})["data"]
        print(f"created App Store version {version} (release: {release_type})")

    call("PATCH", f"/appStoreVersions/{store_version['id']}/relationships/build",
         {"data": {"type": "builds", "id": build["id"]}})
    print(f"attached build {build_number}")

    for loc in call("GET", f"/appStoreVersions/{store_version['id']}/appStoreVersionLocalizations")["data"]:
        locale = loc["attributes"]["locale"]
        text = notes.get(locale) or release_notes(locale)
        call("PATCH", f"/appStoreVersionLocalizations/{loc['id']}", {"data": {
            "type": "appStoreVersionLocalizations", "id": loc["id"],
            "attributes": {"whatsNew": text}}})
        print(f"set What's New [{locale}]")

    pending = call("GET", "/reviewSubmissions", params={
        "filter[app]": app["id"], "filter[platform]": "IOS", "filter[state]": "READY_FOR_REVIEW"})["data"]
    submission = pending[0] if pending else call("POST", "/reviewSubmissions", {"data": {
        "type": "reviewSubmissions", "attributes": {"platform": "IOS"},
        "relationships": {"app": {"data": {"type": "apps", "id": app["id"]}}}}})["data"]

    items = call("GET", f"/reviewSubmissions/{submission['id']}/items",
                 params={"include": "appStoreVersion"})
    has_version = any((i.get("relationships", {}).get("appStoreVersion", {}).get("data") or {}).get("id")
                      == store_version["id"] for i in items["data"])
    if not has_version:
        call("POST", "/reviewSubmissionItems", {"data": {
            "type": "reviewSubmissionItems",
            "relationships": {
                "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": submission["id"]}},
                "appStoreVersion": {"data": {"type": "appStoreVersions", "id": store_version["id"]}},
            }}})

    result = call("PATCH", f"/reviewSubmissions/{submission['id']}", {"data": {
        "type": "reviewSubmissions", "id": submission["id"], "attributes": {"submitted": True}}})
    print(f"submitted for review: state {result['data']['attributes']['state']}")


if __name__ == "__main__":
    main()
