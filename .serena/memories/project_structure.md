# Project Structure

## Directory Layout
```
examapp/
├── src/                        # Source code
│   ├── index.ts               # Main Worker entry point
│   └── __tests__/             # Unit tests
│       └── index.test.ts      # Tests for main Worker
├── e2e/                       # End-to-end tests
│   └── sample.spec.ts         # Playwright E2E test
├── .github/                   # GitHub configuration
│   └── workflows/             
│       └── ci.yml            # CI/CD pipeline
├── .husky/                    # Git hooks
├── .serena/                   # Serena MCP configuration
├── .claude/                   # Claude-specific files
├── docs/                      # Documentation
├── .gitignore                 # Git ignore rules
├── .prettierignore           # Prettier ignore rules
├── .prettierrc               # Prettier configuration
├── CLAUDE.md                 # AI agent guidelines
├── README.md                 # Project documentation
├── eslint.config.js          # ESLint configuration
├── package.json              # Node dependencies and scripts
├── playwright.config.ts      # Playwright E2E configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for Node tools
├── vite.config.ts           # Vite build configuration
└── wrangler.toml            # Cloudflare Workers configuration
```

## Key Files
- **src/index.ts**: Main application logic, exports Worker fetch handler
- **CLAUDE.md**: Critical AI development context and guidelines
- **package.json**: Defines all npm scripts and dependencies
- **wrangler.toml**: Cloudflare Workers deployment configuration

## Test Organization
- Unit tests: Located alongside source files in `__tests__` directories
- E2E tests: Separate `e2e/` directory for Playwright tests

## Configuration Files
- TypeScript: `tsconfig.json` (strict mode)
- ESLint: `eslint.config.js` (with TypeScript plugin)
- Prettier: `.prettierrc` (formatting rules)
- Vite: `vite.config.ts` (build and test configuration)
- Playwright: `playwright.config.ts` (E2E test setup)