# CULTR Health Website

A modern, HIPAA-compliant telehealth platform for GLP-1 weight loss medications and wellness peptides. Built with Next.js 14, TypeScript, and integrated with the Asher Med Partner Portal for secure patient onboarding and order management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Asher Med Integration](#asher-med-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

CULTR Health provides physician-supervised GLP-1 weight loss medications (Tirzepatide, Semaglutide) and premium wellness peptides through a seamless digital experience. The platform handles:

- **Membership subscriptions** via Stripe
- **Patient intake forms** with medical questionnaires
- **Provider consultations** and prescription management
- **Order fulfillment** through Asher Med Partner Portal
- **Member dashboard** with order tracking and documentation

---

## Features

### Patient Experience
- Multi-tier membership plans (Foundational, Pro, Elite)
- Comprehensive medical intake forms with signature capture
- Real-time BMI calculation and health assessments
- Secure ID verification and document upload
- Member dashboard with order history and treatment tracking
- Product catalog with detailed peptide information

### Provider Tools
- Protocol builder for treatment planning
- Peptide dosing calculator with syringe visualization
- Patient order review and approval workflow
- Automated Asher Med API integration for order submission

### Technical Features
- HIPAA-compliant data handling
- Stripe payment processing with subscription management
- Cloudflare Turnstile bot protection
- PostgreSQL database with Prisma ORM
- JWT authentication and role-based access control
- Mobile-optimized responsive design
- Server-side rendering with Next.js 14 App Router

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Headless UI, Radix UI
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js
- **Database:** PostgreSQL (Vercel Postgres)
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Email:** Resend
- **Payments:** Stripe
- **File Storage:** AWS S3 (via Asher Med presigned URLs)

### External Integrations
- **Asher Med Partner Portal** - Patient onboarding and order management
- **Stripe** - Subscription payments and checkout
- **Resend** - Transactional emails
- **Cloudflare Turnstile** - Bot protection

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (or Vercel Postgres)
- Stripe account (test mode for development)
- Asher Med Partner Portal credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/cultr-health-website.git
   cd cultr-health-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your credentials (see [Environment Setup](#environment-setup))

4. **Set up the database**
   ```bash
   # Run migrations
   npm run db:migrate

   # Seed the database (optional)
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Setup

### Required Variables

Copy `.env.example` to `.env` and configure the following:

#### Stripe (Required)
```env
STRIPE_SECRET_KEY=sk_test_...          # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        # Set up webhook endpoint
```

#### Database (Required)
```env
POSTGRES_URL=postgres://...            # PostgreSQL connection string
```

#### Authentication (Required)
```env
JWT_SECRET=your-random-secret          # Generate with `openssl rand -base64 32`
SESSION_SECRET=your-random-secret      # Generate with `openssl rand -base64 32`
```

#### Asher Med Integration (Required for Production)
```env
ASHER_MED_API_KEY=your-api-key        # From Asher Med Partner Portal
ASHER_MED_API_URL=https://prod-api.asherweightloss.com
ASHER_MED_PARTNER_ID=your-partner-id
ASHER_MED_ENVIRONMENT=production       # or 'sandbox' for testing
```

#### Email (Optional for Development)
```env
RESEND_API_KEY=re_...                  # From Resend dashboard
FROM_EMAIL=hello@cultrhealth.com
FOUNDER_EMAIL=founder@cultrhealth.com
```

### Optional Variables

See `.env.example` for additional optional configuration including:
- Cloudflare Turnstile (bot protection)
- Upstash Redis (caching)
- BNPL integrations (Klarna, Affirm)
- Staging access bypass

---

## Project Structure

```
cultr-health-website/
├── app/                        # Next.js 14 App Router pages
│   ├── page.tsx               # Homepage
│   ├── pricing/               # Pricing page
│   ├── join/[tier]/           # Checkout pages
│   ├── library/               # Member dashboard & product catalog
│   ├── provider/              # Provider tools (protocol builder)
│   ├── api/                   # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── checkout/         # Stripe checkout
│   │   ├── webhook/          # Stripe webhooks
│   │   └── waitlist/         # Waitlist signup
│   └── legal/                # Privacy & Terms
│
├── components/                # React components
│   ├── ui/                   # Reusable UI components (Button, Input, etc.)
│   ├── site/                 # Marketing site components
│   ├── library/              # Member dashboard components
│   └── sections/             # Page sections
│
├── lib/                       # Utilities and configuration
│   ├── asher-med-api.ts      # Asher Med API client
│   ├── config/               # Configuration files
│   │   ├── asher-med.ts     # Asher Med settings
│   │   ├── plans.ts         # Membership plans
│   │   └── product-to-asher-mapping.ts
│   ├── db.ts                 # Database utilities
│   ├── stripe.ts             # Stripe client
│   └── utils.ts              # General utilities
│
├── migrations/                # SQL database migrations
├── prisma/                    # Prisma schema
├── public/                    # Static assets
└── tests/                     # Test files
```

---

## Asher Med Integration

CULTR Health uses the Asher Med Partner Portal API for HIPAA-compliant patient onboarding and order management.

### Key Integration Points

1. **Patient Intake Flow**
   - Patient completes intake form on CULTR website
   - Form data is validated and structured
   - Data sent to Asher Med API via `POST /api/v1/external/partner/orders/new-order`
   - Patient record and order created in Asher Med system

2. **File Uploads**
   - ID verification photos
   - Medical consent signatures
   - Prescription label photos (for renewals)
   - Files uploaded to Asher Med S3 via presigned URLs

3. **Order Management**
   - View order status via Asher Med API
   - Track prescription fulfillment
   - Retrieve patient medical records
   - Handle renewal orders

### API Documentation

Complete Asher Med API documentation is available in:
- [asher-med-api-documentation.md](./asher-med-api-documentation.md)

Key endpoints:
```typescript
// Create new patient order
POST /api/v1/external/partner/orders/new-order

// Create renewal order
POST /api/v1/external/partner/orders/renewal

// Get patient by phone number
GET /api/v1/external/partner/patients/phone/{phoneNumber}

// Get presigned upload URL
POST /api/v1/external/upload/presigned-url
```

### Authentication

All Asher Med API requests require an API key in the header:
```
X-API-KEY: your-asher-med-api-key
```

---

## Development

### Database Migrations

Run migrations to create/update database schema:
```bash
npm run db:migrate

# Or create a new migration
npx prisma migrate dev --name description_of_changes
```

### Type Generation

Regenerate TypeScript types from Prisma schema:
```bash
npx prisma generate
```

### Testing

Run the test suite:
```bash
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Code Quality

Format code with Prettier:
```bash
npm run format
```

Lint code with ESLint:
```bash
npm run lint
```

### Debugging

Enable debug logging:
```env
DEBUG=cultr:*
```

---

## Deployment

### Vercel (Recommended)

1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Set up Postgres database** (Vercel Postgres or external)
4. **Deploy** - automatic deployments on push to main

### Environment Configuration

- **Production:** `main` branch → `cultrhealth.com`
- **Staging:** `staging` branch → `staging.cultrhealth.com`
- **Preview:** Pull requests → auto-generated preview URLs

### Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Stripe webhook endpoint configured
- [ ] Asher Med API key set and working
- [ ] Email sending configured (Resend)
- [ ] SSL certificate active
- [ ] DNS records configured
- [ ] Error tracking enabled (Sentry recommended)

---

## Migration from Healthie

This project was previously integrated with Healthie and has been migrated to Asher Med Partner Portal. Legacy Healthie code remains in the codebase for reference:

- `lib/healthie-api.ts` - Old Healthie API client (deprecated)
- Tests referencing Healthie
- Some database fields may still reference Healthie IDs

**Important:** New development should use the Asher Med integration exclusively. The Healthie integration is no longer maintained.

---

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Run linting and formatting
5. Create a pull request
6. Request review from team

### Coding Standards

- **TypeScript:** Strict mode enabled, no `any` types
- **React:** Functional components with hooks
- **CSS:** Tailwind utility classes, custom classes in `globals.css`
- **Accessibility:** Follow WCAG 2.1 AA standards
- **Security:** Never commit secrets, sanitize user input
- **HIPAA Compliance:** Handle PHI data according to regulations

---

## License

Proprietary - CULTR Health © 2024

---

## Support

For technical issues or questions:
- **Email:** dev@cultrhealth.com
- **Asher Med Support:** support@ashermed.com
- **Emergency:** Contact team leads directly

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
