# AutoByteus Web Frontend
A modern web application built with Nuxt.js, featuring both web and electron builds.

## Prerequisites
- Node.js (v16 or higher)
- Yarn package manager
- Git

## Environment Setup
Create a `.env` file in the root directory with the following variables:
```env
# GraphQL endpoint
NUXT_PUBLIC_GRAPHQL_BASE_URL=http://localhost:8000/graphql
# REST API endpoint
NUXT_PUBLIC_REST_BASE_URL=http://localhost:8000/rest
# WebSocket endpoint
NUXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/graphql
```

> **Note for Electron App**: When running as an Electron application with the integrated backend server, these endpoint URLs are automatically configured with the dynamically allocated port.

## Server Modes
AutoByteus supports two server operation modes: internal and external.

### Internal Server
The internal server is a bundled backend server that runs within the Electron application. This mode is:
- **Default for desktop applications** (Electron builds)
- Completely self-contained with no additional setup required
- Automatically started and managed by the application

#### Data Storage Location
The internal server stores its data in the following locations based on your operating system:

- **Windows**: `C:\Users\<username>\AppData\Roaming\autobyteus\server-data`
- **macOS**: `~/Library/Application Support/autobyteus/server-data`
- **Linux**: `~/.config/autobyteus/server-data`

These directories contain:
- `db/`: Database files
- `logs/`: Server log files
- `download/`: Downloaded content

#### Configuration
No additional configuration is needed for internal server mode. The application automatically:
- Finds an available port
- Starts the server
- Configures the frontend to connect to it

You can force the application to use external server mode by setting `USE_INTERNAL_SERVER=false` in your environment.

### External Server
The external server mode connects to a separately running AutoByteus server. This mode is:
- **Default for web-based development** (browser mode)
- Requires a separately installed and running backend server
- Configured through environment variables

To use external server mode, ensure your `.env` file contains the correct URLs for your server as shown in the Environment Setup section.

## Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd autobyteus-web
```
2. Install dependencies:
```bash
yarn install
```

## Development
### Web Development (Browser-based)
Start the development server:
```bash
yarn dev
```
The application will be available at `http://localhost:3000` in your web browser. Use this command for normal frontend development when you want to work on the web version of the application.

## Building
### Web Build
For deploying the web version:
```bash
yarn build
yarn preview  # To preview the build
```

### Desktop Application Build
To build the desktop application, use the appropriate command for your operating system:
```bash
# For Linux
yarn build:electron:linux
# For Windows
yarn build:electron:windows
# For macOS
yarn build:electron:mac
```
The built applications will be available in the `dist` directory. Use these commands when you want to create a standalone desktop application for distribution.

### Desktop Application with Integrated Backend
The Electron application includes the AutoByteus backend server, which is automatically started when the application launches.

#### Preparing the Server
Before building the Electron application with the integrated server:

1. Ensure the AutoByteus server repository is available at `../autobyteus-server` (relative to this project) or specify the path in the prepare-server script
2. Run the prepare-server script to copy the server files:
```bash
yarn prepare-server
```

This script copies the built backend server and its configurations to the `resources/server` directory.

#### Building with Integrated Server
The standard build commands for Electron automatically include the backend server:
```bash
# For Linux with integrated server
yarn build:electron:linux
# For Windows with integrated server
yarn build:electron:windows
# For macOS with integrated server
yarn build:electron:mac
```

#### Dynamic Port Allocation
When the Electron application starts, it:
1. Finds an available port on the system
2. Starts the backend server on that port
3. Automatically configures the frontend to connect to the server on the allocated port
4. Shows a loading screen until the server is ready

This ensures the application works even if the default port (8000) is already in use on the system.

## Testing
Run all tests:
```bash
yarn test
```

### Running Specific Tests
To run all tests in a specific test file:
```bash
yarn test utils/aiResponseParser/tool_parsing_strategies/__tests__/xmlToolParsingStrategy.spec.ts

```
To run a specific test within a file:
```bash
# Run a specific test by description
yarn test "tests/unit/utils/aiResponseParser/aiResponseSegmentParser.test.ts" -t "should parse text without implementation tags"
# Run all tests matching a pattern
yarn test "tests/unit/utils/aiResponseParser/aiResponseSegmentParser.test.ts" -t "should parse text"
```

### Component Testing Example (Provider API Manager)
The Provider API Manager screen includes a Vitest component spec at `components/settings/__tests__/ProviderAPIKeyManager.spec.ts`. It mounts the component with a testing Pinia store to verify the LLM and audio model sections render correctly.

Run just this spec:
```bash
yarn test components/settings/__tests__/ProviderAPIKeyManager.spec.ts --run
```

If your environment limits worker processes (e.g., containers without thread support), force a single-thread run:
```bash
yarn test components/settings/__tests__/ProviderAPIKeyManager.spec.ts --run --pool threads --maxWorkers 1 --no-file-parallelism --no-isolate
```

## GraphQL Codegen
Generate TypeScript types from GraphQL schema:
```bash
yarn codegen
```

## Available Scripts
- `yarn dev`: Start development server (browser-based)
- `yarn build`: Build for web production
- `yarn test`: Run tests
- `yarn preview`: Preview web production build
- `yarn prepare-server`: Prepare the backend server for packaging with Electron
- `yarn build:electron:linux`: Build desktop application for Linux
- `yarn build:electron:windows`: Build desktop application for Windows
- `yarn build:electron:mac`: Build desktop application for macOS
- `yarn codegen`: Generate GraphQL types

## Project Structure
- `components/`: Vue components
- `pages/`: Application pages and routing
- `store/`: Pinia stores
- `electron/`: Electron-specific code
  - `main.ts`: Main Electron process
  - `preload.ts`: Preload script for renderer process
  - `serverManager.ts`: Backend server lifecycle management
  - `portFinder.ts`: Utility for finding available ports
- `resources/`: External resources
  - `server/`: Backend server files (populated by prepare-server script)
- `test/`: Test files
- `composables/`: Vue composables
  - `useServerConfig.ts`: Server configuration management
