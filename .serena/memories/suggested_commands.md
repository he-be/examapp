# Suggested Commands for examapp

## Essential Development Commands

### Development Server
```bash
npm run dev          # Start local dev server at http://localhost:8787
```

### Required Verification Sequence (Run in this order after code changes)
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint static analysis
npm run test:unit    # Vitest unit tests
```

### Testing Commands
```bash
npm run test:unit    # Run unit tests once
npm run test:watch   # Run unit tests in watch mode
npm run test:coverage # Generate test coverage report
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright tests with UI
```

### Code Quality Commands
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
```

### Build & Deploy
```bash
npm run build        # Build the project
npm run deploy       # Deploy to Cloudflare Workers
```

### Git Commands (Linux)
```bash
git status           # Check repository status
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to remote
git pull             # Pull from remote
git log --oneline    # View commit history
```

### System Commands (Linux)
```bash
ls -la               # List files with details
cd <directory>       # Change directory
pwd                  # Print working directory
cat <file>           # Display file contents
grep -r "pattern" .  # Search for pattern in files
find . -name "*.ts"  # Find TypeScript files
```

## Important Notes
- Always run the verification sequence (typecheck → lint → test:unit) after making changes
- The project uses Husky for pre-commit hooks that automatically run linting and related tests
- Deployment to Cloudflare Workers happens automatically on push to main branch via GitHub Actions