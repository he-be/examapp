# Code Style and Conventions

## TypeScript Configuration
- **Strict mode**: Enabled with all strict type checking options
- **Target**: ESNext (latest ECMAScript features)
- **Module**: ESNext with bundler resolution
- **Type checking only**: noEmit is true (Vite handles compilation)
- **Cloudflare Workers types**: Included via @cloudflare/workers-types

## Naming Conventions
- **Functions**: camelCase (e.g., `getRandomItem`, `generateHTML`)
- **Variables**: camelCase (e.g., `randomIndex`, `message`)
- **Constants**: camelCase for exported data (e.g., `sampleData`)
- **CSS classes**: kebab-case (e.g., `reload-button`)
- **Files**: camelCase for source files, `*.test.ts` for tests

## Code Formatting (Prettier)
- **Line width**: 100 characters
- **Indentation**: 2 spaces
- **Semicolons**: Always required
- **Quotes**: Single quotes (double for JSX)
- **Trailing commas**: ES5 style
- **Arrow functions**: Always use parentheses `(x) => x`
- **Line endings**: Unix-style (LF)

## ESLint Rules
- **Unused variables**: Error (except those starting with `_`)
- **Explicit return types**: Not required (type inference allowed)
- **Any type**: Warning level (discouraged but allowed)
- **Console statements**: Allowed
- **Debugger statements**: Forbidden

## Code Patterns
- **Exports**: Named exports for utilities, default export for Worker handler
- **Type annotations**: Explicit return types for functions
- **Async/await**: Preferred over Promise chains
- **Template literals**: Used for multi-line strings
- **Comments**: Japanese comments allowed for documentation

## Cloudflare Workers Specifics
- Default export object with `fetch` method
- Use Web Standard APIs (Request, Response, URL)
- No Node.js specific APIs
- Proper HTTP headers for content types
- CORS headers for API endpoints

## Testing Patterns
- Vitest with `describe`/`test`/`expect`
- Test files in `__tests__` directory
- Mock Cloudflare Workers Request/Response
- Comprehensive coverage including edge cases