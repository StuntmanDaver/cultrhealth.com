# Documentation Index

This folder contains documentation for CULTR Health Website integrations and setup guides.

## Healthie EHR Integration

### Quick Start
**[HEALTHIE-SSO-QUICKSTART.md](./HEALTHIE-SSO-QUICKSTART.md)** - Start here!
- Environment variable setup
- Minimal configuration needed to get SSO working
- Common troubleshooting
- **Read this first** if you want to get SSO working quickly

### Complete Setup Guide
**[HEALTHIE-SSO-SETUP.md](./HEALTHIE-SSO-SETUP.md)** - Comprehensive guide
- Step-by-step Healthie account configuration
- Detailed SSO setup instructions
- Webhook configuration
- Testing procedures
- Production deployment checklist
- **Read this** for complete understanding and production setup

### Implementation Reference
**[HEALTHIE-SSO-IMPLEMENTATION.md](./HEALTHIE-SSO-IMPLEMENTATION.md)** - Technical details
- Code architecture overview
- Files modified/created
- Data flow diagrams
- Security considerations
- **Read this** if you need to understand or modify the implementation

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

1. **Read:** `HEALTHIE-SSO-QUICKSTART.md` (5 minutes)
2. **Configure:** Add Healthie credentials to `.env.local`
3. **Test:** Run `npm run dev` and click Member Portal buttons
4. **Deploy:** Follow `HEALTHIE-SSO-SETUP.md` for production
5. **Optional:** Set up BNPL if offering financing

## Support

- **Healthie Issues:** support@gethealthie.com
- **Stripe Issues:** https://support.stripe.com
- **Code Issues:** Check GitHub issues or create new one

## Contributing

When adding new integrations or features:

1. Create a setup guide (like `HEALTHIE-SSO-SETUP.md`)
2. Create a quickstart (like `HEALTHIE-SSO-QUICKSTART.md`)
3. Document implementation details
4. Update this index

---

Last updated: January 2026
