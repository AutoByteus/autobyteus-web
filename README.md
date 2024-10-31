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

## Testing
Run all tests:
```bash
yarn test
```

### Running Specific Tests
To run all tests in a specific test file:
```bash
yarn test tests/unit/utils/aiResponseParser/aiResponseSegmentParser.test.ts
```

To run a specific test within a file:
```bash
# Run a specific test by description
yarn test "tests/unit/utils/aiResponseParser/aiResponseSegmentParser.test.ts" -t "should parse text without implementation tags"

# Run all tests matching a pattern
yarn test "tests/unit/utils/aiResponseParser/aiResponseSegmentParser.test.ts" -t "should parse text"
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
- `yarn build:electron:linux`: Build desktop application for Linux
- `yarn build:electron:windows`: Build desktop application for Windows
- `yarn build:electron:mac`: Build desktop application for macOS
- `yarn codegen`: Generate GraphQL types

## Project Structure

- `components/`: Vue components
- `pages/`: Application pages and routing
- `store/`: Pinia stores
- `electron/`: Electron-specific code
- `test/`: Test files