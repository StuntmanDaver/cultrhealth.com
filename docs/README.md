# Documentation Index

This folder contains documentation for CULTR Health Website integrations and setup guides.

## EMR Integration

### Asher Med Partner Portal
The platform uses **Asher Med** for HIPAA-compliant patient onboarding and order fulfillment.
- API client: `lib/asher-med-api.ts`
- Configuration: `lib/config/asher-med.ts`
- Environment vars: `ASHER_MED_API_KEY`, `ASHER_MED_API_URL`, `ASHER_MED_PARTNER_ID`

> **Note:** Healthie EHR was fully removed in March 2026. See CHANGELOG.md for migration details.

## Payment Processing

### BNPL (Buy Now, Pay Later) Integrations
**[BNPL-MERCHANT-SETUP.md](./BNPL-MERCHANT-SETUP.md)**
- Klarna setup guide
- Affirm configuration
- Merchant account requirements

**[BNPL-TESTING-GUIDE.md](../BNPL-TESTING-GUIDE.md)** *(in root)*
- Testing payment flows
- Sandbox credentials
- Test scenarios

**[BNPL-MOBILE-SDK.md](./BNPL-MOBILE-SDK.md)**
- Mobile payment integration
- SDK configuration

## Browser Testing
**[AGENT-BROWSER.md](./AGENT-BROWSER.md)**
- Automated browser testing
- Agent browser MCP integration
- Web scraping capabilities

## Getting Started Order

If you're setting up a new CULTR Health instance:

1. **Configure:** Add Asher Med + Stripe credentials to `.env.local` (see `.env.example`)
2. **Database:** Run migrations via `node scripts/run-migration.mjs`
3. **Test:** Run `npm run dev` and verify checkout + intake flows
4. **Deploy:** Push to `staging` branch for Vercel auto-deploy
5. **Optional:** Set up BNPL if offering financing

## Support

- **Asher Med:** Partner portal at https://asherweightloss.com
- **Stripe:** https://support.stripe.com
- **Code Issues:** Check GitHub issues or create new one

## Contributing

When adding new integrations or features:

1. Create a setup guide in this folder
2. Document implementation details
3. Update this index

---

Last updated: March 2026
