# examapp Project Overview

## Purpose
examapp is an AI-driven development-optimized Cloudflare Workers application. It implements a 4-layer verification system designed to support autonomous AI agent development with self-correcting capabilities.

## Technology Stack
- **Runtime**: Cloudflare Workers (Edge computing platform)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: Vite
- **Test Framework**: Vitest (unit tests) + Playwright (E2E tests)
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **Version Control**: Git with Husky pre-commit hooks
- **CI/CD**: GitHub Actions

## Key Features
- Self-correcting development environment with 4-layer validation
- AI agent guidelines in CLAUDE.md
- Automated quality gates via pre-commit hooks
- Full TypeScript strict mode compliance
- Cloudflare Workers optimized (no Node.js APIs)