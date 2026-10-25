#!/bin/sh
# Builds the macOS dmg with electron-builder's own signing and (optionally) API-key notarisation, then verifies it.
# Env: CSC_LINK, CSC_KEY_PASSWORD (required); APPLE_API_KEY (base64 .p8), APPLE_API_KEY_ID, APPLE_API_ISSUER
# (notarise only when all three are set). No args; run from the repo root. Never prints secrets, never `set -x`.
set -eu
umask 077

die() {
    echo "sign-macos: $*" >&2
    exit 1
}

if [ -z "${CSC_LINK:-}" ] || [ -z "${CSC_KEY_PASSWORD:-}" ]; then
    echo "sign-macos: CSC_LINK and CSC_KEY_PASSWORD are required" >&2
    exit 2
fi

work=$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/fi-sign.XXXXXX") || die "cannot create a temp dir"
trap 'rm -rf "$work"' EXIT

notarise=no
if [ -n "${APPLE_API_KEY:-}" ] && [ -n "${APPLE_API_KEY_ID:-}" ] && [ -n "${APPLE_API_ISSUER:-}" ]; then
    notarise=yes
    keyfile="$work/AuthKey_$APPLE_API_KEY_ID.p8"
    printf '%s' "$APPLE_API_KEY" | base64 -d > "$keyfile" 2> /dev/null ||
        printf '%s' "$APPLE_API_KEY" | base64 -D > "$keyfile" 2> /dev/null ||
        die "APPLE_API_KEY is not valid base64"
    [ -s "$keyfile" ] || die "APPLE_API_KEY decoded to an empty file"
    APPLE_API_KEY=$keyfile
    export APPLE_API_KEY
else
    unset APPLE_API_KEY APPLE_API_KEY_ID APPLE_API_ISSUER
    echo "sign-macos: not notarised (APPLE_API_KEY, APPLE_API_KEY_ID and APPLE_API_ISSUER are not all set)"
fi

rm -rf dist
pnpm dist || die "pnpm dist failed"

count() {
    n=0
    for f in "$@"; do
        [ -e "$f" ] && n=$((n + 1))
    done
    echo "$n"
}

# shellcheck disable=SC2086
[ "$(count dist/mac*/*.app)" = 1 ] || die "expected exactly one dist/mac*/*.app"
[ "$(count dist/*.dmg)" = 1 ] || die "expected exactly one dist/*.dmg"
app=$(echo dist/mac*/*.app)
dmg=$(echo dist/*.dmg)

codesign --verify --deep --strict --verbose=2 "$app" || die "codesign verification failed"
info=$(codesign -dv --verbose=2 "$app" 2>&1) || die "codesign -dv failed"
printf '%s\n' "$info" | grep -Eq 'flags=0x[0-9a-f]+\(.*runtime' || die "hardened runtime flag missing"
printf '%s\n' "$info" | grep -q 'Authority=Developer ID Application' || die "not signed with a Developer ID Application identity"
if [ "$notarise" = yes ]; then
    xcrun stapler validate "$app" || die "stapler validation failed"
fi

echo "sign-macos: ok ($(basename "$dmg"), notarised: $notarise)"
