# Cultr Health Website - Architecture Documentation

## Overview

CULTR Health is a modern HIPAA-compliant telehealth platform for GLP-1 weight loss medications and wellness peptides. Built with Next.js 14 App Router, TypeScript, and integrated with Asher Med Partner Portal.

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React icons
- **State Management:** React Context API
- **Forms:** Native React state management

### Backend
- **Runtime:** Node.js
- **Database:** PostgreSQL (Vercel Postgres)
- **Authentication:** JWT (jose library)
- **Email:** Resend
- **Payments:** Stripe
- **File Storage:** AWS S3 (via Asher Med presigned URLs)

### External Integrations
- **Asher Med Partner Portal** - Patient onboarding and order management
- **Stripe** - Subscription payments
- **Resend** - Transactional emails
- **Cloudflare Turnstile** - Bot protection

## Project Structure

```
app/                          # Next.js 14 App Router pages
├── page.tsx                  # Homepage
├── pricing/                  # Pricing page
├── join/[tier]/              # Checkout pages
├── library/                  # Member dashboard & product catalog
├── provider/                 # Provider tools
├── creators/                 # Creator affiliate portal
│   ├── apply/               # Application form
│   ├── login/               # Creator authentication
│   ├── pending/             # Application pending page
│   └── portal/              # Creator dashboard
│       ├── dashboard/       # Analytics & overview
│       ├── earnings/        # Commission tracking
│       ├── network/         # Referral network
│       ├── payouts/         # Payout history
│       ├── resources/       # Marketing materials
│       ├── settings/        # Account settings
│       ├── share/           # Sharing tools
│       └── support/         # Help & support
├── admin/                   # Admin panel
│   └── creators/            # Creator management
│       ├── approvals/       # Application reviews
│       └── payouts/         # Payout processing
├── api/                     # API routes
│   ├── auth/               # Authentication endpoints
│   ├── checkout/           # Stripe checkout
│   ├── webhook/            # Stripe webhooks
│   ├── creators/           # Creator affiliate API
│   ├── lmn/                # Asher Med integration
│   └── waitlist/           # Waitlist signup

components/                  # React components
├── ui/                     # Reusable UI components
├── site/                   # Marketing site components
│   ├── Header.tsx          # Main navigation (floating pill design)
│   ├── Footer.tsx          # Site footer
│   └── LayoutShell.tsx     # Layout wrapper with conditional chrome
├── library/                # Member dashboard components
├── intake/                 # Medical intake form components
├── creators/               # Creator portal components
└── sections/               # Page sections (Hero, Pricing, etc.)

lib/                        # Utilities and configuration
├── asher-med-api.ts        # Asher Med API client
├── creators/               # Creator affiliate logic
│   ├── db.ts              # Creator database operations
│   ├── attribution.ts     # Click tracking & attribution
│   └── commission.ts      # Commission calculations
├── config/                 # Configuration files
│   ├── asher-med.ts       # Asher Med settings
│   ├── plans.ts           # Membership plans
│   └── affiliate.ts       # Affiliate configuration
├── db.ts                   # Database utilities
├── stripe.ts               # Stripe client
└── utils.ts                # General utilities

migrations/                 # SQL database migrations
public/                     # Static assets
```

## Key Features by Domain

### 1. Public Marketing Site
- **Pages:** Homepage, Pricing, How It Works, FAQ, Science Library
- **Components:** Hero, Services, Testimonials, Pricing Cards
- **Features:**
  - Floating pill navbar with scroll animations
  - Responsive design
  - SEO optimized

### 2. Patient Experience
- **Multi-tier memberships:** Foundational, Pro, Elite
- **Medical intake forms:** Personal info, measurements, medical history
- **Secure uploads:** ID verification, consent signatures
- **Member dashboard:** Order tracking, documentation

### 3. Provider Tools
- **Protocol builder:** Treatment planning interface
- **Dosing calculator:** Peptide dosing with syringe visualization
- **Order review:** Patient approval workflow
- **Asher Med integration:** Automated order submission

### 4. Creator Affiliate Portal (V1)
- **Application system:** Multi-step form with platform verification
- **Dashboard:** Real-time earnings, click tracking, conversion metrics
- **Tracking links:** Custom codes with cookie-based attribution
- **Commission engine:** 20% cap, override system, refund handling
- **Payout management:** Stripe Connect or manual processing

### 5. Admin Panel
- **Creator management:** Application review, approval/rejection
- **Payout processing:** Commission ledger, payout history
- **Order management:** View and manage patient orders

## Database Schema

### Core Tables
- **users** - Customer accounts
- **subscriptions** - Stripe subscription tracking
- **orders** - Patient orders and fulfillment status
- **intake_forms** - Medical intake data

### Creator Affiliate Tables (8 tables)
- **creators** - Creator profiles and status
- **affiliate_codes** - Unique referral codes
- **tracking_links** - Generated tracking URLs
- **click_events** - Click tracking data
- **order_attributions** - Order-to-creator mapping
- **commission_ledger** - Commission records
- **payouts** - Payout history
- **admin_actions** - Audit log

## Authentication & Authorization

### User Types
1. **Patients** - Regular members (JWT auth)
2. **Providers** - Medical staff (JWT auth with role check)
3. **Creators** - Affiliates (separate JWT auth)
4. **Admins** - Internal staff (JWT auth with admin role)

### Security Features
- JWT token authentication (jose library)
- HIPAA-compliant data handling
- Bot protection (Cloudflare Turnstile)
- Secure file uploads (presigned URLs)

## API Integrations

### Asher Med Partner Portal
**Purpose:** HIPAA-compliant patient onboarding and order management

**Key Endpoints:**
- `POST /api/v1/external/partner/orders/new-order` - Create patient order
- `POST /api/v1/external/partner/orders/renewal` - Renewal orders
- `GET /api/v1/external/partner/patients/phone/{phoneNumber}` - Get patient
- `POST /api/v1/external/upload/presigned-url` - File upload URLs

**Authentication:** X-API-KEY header

### Stripe
**Purpose:** Subscription payments and checkout

**Features:**
- Subscription management
- Checkout sessions
- Webhook handling
- Payment method updates

### Resend
**Purpose:** Transactional emails

**Use Cases:**
- Welcome emails
- Order confirmations
- Creator application status
- Payout notifications

## Recent Changes (February 8, 2026)

### Navbar Redesign
- Floating pill design (1080px max-width, 60px border-radius)
- Scroll-reactive sizing with smooth transitions
- Brand cream background with backdrop blur
- Mobile drawer with grouped sections

### Creator Portal Updates
- Creator auth pages now show site navbar/footer
- Removed from `HIDE_CHROME_PREFIXES` array

### Deployment Configuration
- **Production:** cultrhealth.com (waitlist site on production branch)
- **Staging:** staging.cultrhealth.com (full app on staging branch)
- **Vercel:** Automatic deployments per branch

## Development Guidelines

### Code Standards
- TypeScript strict mode (no `any` types)
- Functional React components with hooks
- Tailwind utility-first CSS
- WCAG 2.1 AA accessibility standards

### Testing
- Test framework: Vitest
- Testing library: @testing-library/react
- Focus on critical user paths
- ~20% effort on tests per development loop

### HIPAA Compliance
- Never log PHI (Protected Health Information)
- Sanitize user input
- Use HTTPS for all communications
- Encrypt sensitive data at rest

## Known Issues & Technical Debt

### Legacy Code
- Old Healthie integration code (deprecated, use Asher Med)
- Some database fields may reference old Healthie IDs

### Untracked Files (from git status)
- .cursor/ directory
- .ralph/ directory (Ralph framework)
- .ralphrc config
- Various image files (PNG, JPG)
- ralph-claude-code/ directory

## Environment Variables

### Required
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `POSTGRES_URL` - Database connection
- `JWT_SECRET` - Token signing
- `SESSION_SECRET` - Session encryption
- `ASHER_MED_API_KEY` - Asher Med authentication
- `ASHER_MED_PARTNER_ID` - Partner identification

### Optional
- `RESEND_API_KEY` - Email service
- `CLOUDFLARE_TURNSTILE_SECRET_KEY` - Bot protection
- `UPSTASH_REDIS_URL` - Caching

## Build & Deployment

### Build Commands
```bash
npm run build          # Production build
npm run dev           # Development server
npm run lint          # ESLint
npm run analyze       # Bundle analyzer
```

### Test Commands
```bash
npm test              # Run test suite
npm test -- --watch   # Watch mode
```

### Deployment Flow
1. Push to branch (staging or production)
2. Vercel auto-builds and deploys
3. Environment variables configured per environment
4. Database migrations run on deploy (if needed)

## Performance Considerations

- Server-side rendering (SSR) for marketing pages
- Client-side rendering for authenticated areas
- Image optimization (Next.js Image component)
- Code splitting per route
- Bundle size monitoring with analyzer
