# Ralph Agent Configuration

## Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL database (Vercel Postgres)
- Environment variables configured in `.env`

## Environment Setup

Before building or running, ensure `.env` file exists with required variables:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
POSTGRES_URL=postgres://...
JWT_SECRET=your-random-secret
SESSION_SECRET=your-random-secret
ASHER_MED_API_KEY=your-api-key
ASHER_MED_PARTNER_ID=your-partner-id
```

## Build Instructions

```bash
# Install dependencies (first time only)
npm install

# Production build
npm run build

# Development build with hot reload
npm run dev
```

## Test Instructions

```bash
# Run test suite (Vitest)
npm test

# Watch mode for development
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage
```

## Run Instructions

```bash
# Development server (http://localhost:3000)
npm run dev

# Production server (requires build first)
npm run build
npm start
```

## Additional Commands

```bash
# Lint code with ESLint
npm run lint

# Analyze bundle size
npm run analyze

# Setup Stripe products (one-time)
npm run setup:stripe
```

## Testing Strategy

- **Framework:** Vitest with React Testing Library
- **Coverage target:** Critical user paths (auth, checkout, intake forms)
- **Test location:** `tests/` directory or `*.test.tsx` co-located with components
- **Priority:** Focus on business logic and API integrations

## Common Issues

### Build Failures
- Ensure all environment variables are set
- Check TypeScript errors with `npm run lint`
- Verify Node.js version (18+)

### Test Failures
- Database connection required for integration tests
- Mock external APIs (Stripe, Asher Med) in unit tests
- Clear test cache: `npm test -- --clearCache`

### Development Server Issues
- Port 3000 may be in use (change with `PORT=3001 npm run dev`)
- Hot reload not working: restart dev server
- Missing dependencies: run `npm install` again

## Notes
- Update this file when build process changes
- Always run tests before committing code
- Use `npm run build` to verify production build before deploying
- Check bundle size with `npm run analyze` for performance optimization
