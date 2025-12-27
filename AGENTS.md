# AutoByteus Web - Agent Guidelines

## Testing Guidelines

### Test Organization (Best Practice)

Tests are **colocated** with their source files in `__tests__` directories. Do not separate tests into a top-level `tests/` folder unless they are true integration/e2e tests.

**Structure:**

```
utils/
  fileExplorer/
    TreeNode.ts
    __tests__/               # Colocated test directory
      treeNode.test.ts       # Tests for TreeNode.ts
components/
  fileExplorer/
    FileItem.vue
    __tests__/               # Colocated test directory
      FileItem.spec.ts       # Tests for FileItem.vue
```

### Running Tests

- **Run all tests:** `yarn test` (Runs both Nuxt and Electron tests)
- **Run Nuxt/Web tests (Recommended):** `yarn test:nuxt`
- **Run specific file:** `yarn test:nuxt path/to/file.spec.ts --run`
- **Run specific test case:** `yarn test:nuxt path/to/file.spec.ts -t "test name pattern" --run`

> **Note:** Always use the `--run` flag when running specific tests to avoid starting the watch mode.

## Project Structure

- `components/`: Vue components
- `stores/`: Pinia stores
- `utils/`: Helper functions and classes
- `pages/`: Application pages
