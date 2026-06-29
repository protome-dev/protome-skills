#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CALLER_DIR="$PWD"
PORT="${PROTO_ME_PORT:-43217}"
PROJECT_DIR="${PROTO_ME_PROJECT_DIR:-${1:-$CALLER_DIR}}"
REQUESTED_CANVAS_SLUG="${PROTO_ME_CANVAS_SLUG:-${2:-}}"

sanitize_canvas_slug() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
    | cut -c 1-50 \
    | sed -E 's/-+$//'
}

CANVAS_SLUG=""
if [ -n "$REQUESTED_CANVAS_SLUG" ]; then
  CANVAS_SLUG="$(sanitize_canvas_slug "$REQUESTED_CANVAS_SLUG")"
  if [ -z "$CANVAS_SLUG" ]; then
    echo "Proto-me canvas slug is invalid after sanitization: ${REQUESTED_CANVAS_SLUG}" >&2
    exit 1
  fi
fi

DEFAULT_CANVAS_DIR="$PROJECT_DIR/canvas"
if [ -n "$CANVAS_SLUG" ]; then
  DEFAULT_CANVAS_DIR="$DEFAULT_CANVAS_DIR/$CANVAS_SLUG"
fi
CANVAS_DIR="${PROTO_ME_CANVAS_DIR:-$DEFAULT_CANVAS_DIR}"

export PROTO_ME_PROJECT_DIR="$PROJECT_DIR"
export PROTO_ME_CANVAS_DIR="$CANVAS_DIR"
if [ -n "$CANVAS_SLUG" ]; then
  export PROTO_ME_CANVAS_SLUG="$CANVAS_SLUG"
fi

cd "$ROOT_DIR"

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  npm install
fi

echo "Proto-me requested canvas port: ${PORT}"
if [ -n "$CANVAS_SLUG" ]; then
  echo "Proto-me canvas slug: ${CANVAS_SLUG}"
fi
echo "Proto-me canvas: use the Vite Local URL printed below. If ${PORT} is busy, Vite may choose a fallback port."
echo "Proto-me canvas data: ${CANVAS_DIR}/pages/<page-id>/proto-me-canvas.json"
echo "Proto-me runtime URL file: ${CANVAS_DIR}/proto-me-runtime.json"
echo "Proto-me page assets: ${CANVAS_DIR}/pages/<page-id>/assets -> /page-assets/<page-id>/ on the active Local URL"
exec npm run dev -- --host 127.0.0.1 --port "$PORT"
