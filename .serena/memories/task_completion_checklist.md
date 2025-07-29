# Task Completion Checklist

When you complete any coding task in this project, you MUST follow this checklist:

## 1. Run Verification Sequence (Required)
Execute these commands in order:
```bash
npm run typecheck    # Must pass with no errors
npm run lint         # Must pass with no errors
npm run test:unit    # Must pass with all tests green
```

If any command fails, fix the errors before proceeding to the next step.

## 2. Additional Checks (As Needed)

### For UI/Frontend Changes
```bash
npm run test:e2e     # Run E2E tests if UI was modified
```

### For Code Style Issues
```bash
npm run format       # Auto-format code
npm run lint:fix     # Auto-fix linting issues
```

### For Test Coverage
```bash
npm run test:coverage # Check test coverage metrics
```

## 3. Pre-commit Validation
The project has Husky pre-commit hooks that will automatically:
- Run ESLint on staged TypeScript files
- Run Prettier formatting
- Run related Vitest tests

## 4. Important Reminders
- **Data Consistency**: Test data must exactly match implementation
- **Cloudflare Workers**: No Node.js APIs, only Web Standard APIs
- **Error Handling**: Fix errors at each layer before proceeding
- **Type Safety**: Leverage TypeScript strict mode

## 5. CI/CD Pipeline
When pushing to GitHub:
- GitHub Actions will run all tests automatically
- Main branch pushes trigger automatic deployment to Cloudflare Workers
- Ensure all checks pass before merging PRs