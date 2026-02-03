#!/bin/bash
# Script to prepare the server files for Electron packaging

# Exit on error
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${WEB_ROOT}/.." && pwd)"
SERVER_REPO_DIR="${WORKSPACE_ROOT}/autobyteus-server-ts"
TARGET_DIR="${WEB_ROOT}/resources/server"
export TMPDIR="${TMPDIR:-/tmp}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}   Preparing AutoByteus Server Files   ${NC}"
echo -e "${GREEN}=======================================${NC}"

# Check if server repository exists
if [ ! -d "$SERVER_REPO_DIR" ]; then
  echo -e "${RED}Error: Server repository not found at $SERVER_REPO_DIR${NC}"
  echo "Please specify the correct path to the server repository"
  exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"
echo -e "${GREEN}✓${NC} Created target directory: $TARGET_DIR"

echo -e "\n${YELLOW}Building server and dependencies...${NC}"
pnpm -C "$WORKSPACE_ROOT" -r --filter autobyteus-ts --filter repository_prisma build
pnpm -C "$SERVER_REPO_DIR" install --frozen-lockfile
pnpm -C "$SERVER_REPO_DIR" build

echo -e "\n${YELLOW}Deploying server package into Electron resources...${NC}"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
pnpm --filter autobyteus-server-ts deploy "$TARGET_DIR" --legacy

echo -e "\n${YELLOW}Generating Prisma client (ensures engines are bundled)...${NC}"
PRISMA_BIN="${TARGET_DIR}/node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ] && [ -f "${PRISMA_BIN}.cmd" ]; then
  PRISMA_BIN="${PRISMA_BIN}.cmd"
fi
if [ -x "$PRISMA_BIN" ]; then
  "$PRISMA_BIN" generate --schema "${TARGET_DIR}/prisma/schema.prisma"
else
  echo -e "${YELLOW}Warning: Prisma CLI not found at ${PRISMA_BIN}; skipping generate.${NC}"
fi

if [ -f "$SERVER_REPO_DIR/.env" ]; then
  cp "$SERVER_REPO_DIR/.env" "$TARGET_DIR/.env"
fi

if [ -d "$SERVER_REPO_DIR/download" ]; then
  mkdir -p "$TARGET_DIR/download"
  cp -R "$SERVER_REPO_DIR/download/." "$TARGET_DIR/download/"
fi

echo -e "\n${YELLOW}Rebuilding native modules for Electron...${NC}"
ELECTRON_VERSION=$(node -p "require('${WEB_ROOT}/package.json').devDependencies.electron.replace(/^\\^/, '')")
pnpm -C "$WEB_ROOT" exec electron-rebuild -v "$ELECTRON_VERSION" -m "$TARGET_DIR" -w node-pty

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}   Server files prepared successfully!   ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "Target directory: ${YELLOW}$TARGET_DIR${NC}"
echo -e "You can now build the Electron app with the server included"
