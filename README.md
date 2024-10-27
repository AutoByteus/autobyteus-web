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

### Web Development
Start the development server:
```bash
yarn dev
```
The application will be available at `http://localhost:3000`

### Electron Development
Run the electron development environment:
```bash
yarn electron:dev
```

## Building

### Web Build
```bash
yarn build
yarn preview  # To preview the build
```

### Electron Build
```bash
yarn electron:build
```
The built applications will be available in the `dist` directory.

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

- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn test`: Run tests
- `yarn preview`: Preview production build
- `yarn electron:dev`: Start electron development
- `yarn electron:build`: Build electron application
- `yarn codegen`: Generate GraphQL types

## Project Structure

- `components/`: Vue components
- `pages/`: Application pages and routing
- `store/`: Pinia stores
- `electron/`: Electron-specific code
- `test/`: Test files