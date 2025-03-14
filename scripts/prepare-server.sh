#!/bin/bash
# Script to prepare the server files for Electron packaging

# Exit on error
set -e

# Configuration
SERVER_REPO_DIR="../autobyteus-server"  # Path to the server repository
TARGET_DIR="../autobyteus-web/resources/server"          # Target directory within the Electron app

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

# Run the deploy script from the server repository
echo -e "\n${YELLOW}Running deploy script from server repository...${NC}"
cd "$SERVER_REPO_DIR"
./deploy.sh "$TARGET_DIR"

# Return to the original directory
cd - > /dev/null

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}   Server files prepared successfully!   ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "Target directory: ${YELLOW}$TARGET_DIR${NC}"
echo -e "You can now build the Electron app with the server included"
