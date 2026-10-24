#!/bin/bash
# Upload an Xcode archive to App Store Connect (TestFlight) with the team App Store Connect API key.
#
# Usage: mobile-app/ios/upload-to-app-store.sh <path/to/archive.xcarchive> [--dry-run]
#   --dry-run  export a signed .ipa locally instead of uploading (checks the key + signing)
#
# Needs (outside the iCloud-synced repo, see TESTFLIGHT-DEPLOYMENT.md):
#   ~/.appstoreconnect/sonicwalkscape.env            ASC_KEY_ID=... and ASC_ISSUER_ID=...
#   ~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8
set -euo pipefail

ARCHIVE="${1:?usage: $0 <archive.xcarchive> [--dry-run]}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$HOME/.appstoreconnect/sonicwalkscape.env"

[ -d "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE"; exit 1; }
source "$ENV_FILE"
: "${ASC_KEY_ID:?ASC_KEY_ID is empty in $ENV_FILE}"
: "${ASC_ISSUER_ID:?ASC_ISSUER_ID is empty in $ENV_FILE}"
KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
[ -f "$KEY_PATH" ] || { echo "Missing $KEY_PATH"; exit 1; }

OPTIONS="$SCRIPT_DIR/SonicWalkscape/ExportOptions-AppStore.plist"
EXPORT_DIR="$(mktemp -d)"
if [ "${2:-}" = "--dry-run" ]; then
    # Same options, but write the signed .ipa locally instead of uploading it
    cp "$OPTIONS" "$EXPORT_DIR/ExportOptions.plist"
    /usr/libexec/PlistBuddy -c "Set :destination export" "$EXPORT_DIR/ExportOptions.plist"
    OPTIONS="$EXPORT_DIR/ExportOptions.plist"
fi

xcodebuild -exportArchive \
    -archivePath "$ARCHIVE" \
    -exportOptionsPlist "$OPTIONS" \
    -exportPath "$EXPORT_DIR" \
    -allowProvisioningUpdates \
    -authenticationKeyPath "$KEY_PATH" \
    -authenticationKeyID "$ASC_KEY_ID" \
    -authenticationKeyIssuerID "$ASC_ISSUER_ID"

echo "Done. Export output: $EXPORT_DIR"
