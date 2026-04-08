# Agent Browser Setup

## Overview

Agent Browser is a headless browser automation CLI designed for AI agents. It's installed globally and ready to use for testing web applications, automating interactions, and debugging.

## Installation Status

✅ **Installed globally**: `agent-browser` is available system-wide
✅ **Chromium browser**: Downloaded and ready (v145.0.7632.6)
✅ **Cursor skill**: Added to `~/.cursor/skills/agent-browser/`

## Quick Start

### Basic Workflow

```bash
# 1. Navigate to your local development site
agent-browser open http://localhost:3000

# 2. Get interactive elements with refs
agent-browser snapshot -i

# 3. Interact using refs from snapshot
agent-browser click @e1
agent-browser fill @e2 "test@example.com"

# 4. Take screenshots
agent-browser screenshot --full

# 5. Close when done
agent-browser close
```

## Common Use Cases for This Project

### Test Waitlist Form

```bash
# Navigate to waitlist page
agent-browser open http://localhost:3000

# Get interactive elements
agent-browser snapshot -i --json

# Fill out the form (use actual refs from snapshot)
agent-browser fill @e1 "John"
agent-browser fill @e2 "Doe"
agent-browser fill @e3 "john@example.com"
agent-browser click @e4

# Wait for submission
agent-browser wait --text "Thank you"

# Screenshot confirmation
agent-browser screenshot waitlist-success.png
```

### Test Payment Flow

```bash
# Navigate to pricing page
agent-browser open http://localhost:3000

# Snapshot to find buttons
agent-browser snapshot -i

# Click a pricing tier
agent-browser click @e2

# Fill payment form
agent-browser snapshot -i
agent-browser fill @e10 "4111111111111111"  # Test card
agent-browser fill @e11 "12/25"
agent-browser fill @e12 "123"

# Submit payment
agent-browser click @e13

# Wait for confirmation
agent-browser wait --url "**/success"
```

### Test Product Library

```bash
# Open library page
agent-browser open http://localhost:3000/library

# Get catalog structure
agent-browser snapshot -i --json

# Test category filtering
agent-browser click @e5  # Category button
agent-browser wait --load networkidle

# Screenshot filtered results
agent-browser screenshot library-filtered.png
```

### Debug Production Issues

```bash
# Connect to production site
agent-browser open https://cultrhealth.com

# Enable debug mode
agent-browser --headed --debug open https://cultrhealth.com

# Monitor console errors
agent-browser console

# Check page errors
agent-browser errors

# Take diagnostic screenshots
agent-browser screenshot --full production-issue.png
```

## Testing with Sessions

Run multiple isolated browser instances for parallel testing:

```bash
# Test different user scenarios
agent-browser --session user1 open http://localhost:3000
agent-browser --session user2 open http://localhost:3000

# Each session has isolated:
# - Cookies
# - localStorage
# - Navigation history
# - Authentication state
```

## Video Recording

Record user flows for documentation:

```bash
# Start recording
agent-browser record start ./demo-waitlist.webm http://localhost:3000

# Perform actions
agent-browser snapshot -i
agent-browser fill @e1 "demo@example.com"
agent-browser click @e2

# Stop recording
agent-browser record stop
```

## Integration with Cursor

The agent-browser skill is now available in Cursor. You can:

1. Ask Cursor AI to test features using agent-browser
2. Have AI agents automate browser testing
3. Generate test scripts that use agent-browser

Example prompt:
```
Use agent-browser to test the waitlist form submission on localhost:3000
```

## Environment Variables

Add to your `.env.local` if needed:

```bash
# Use headed mode by default (useful for debugging)
AGENT_BROWSER_HEADED=true

# Custom session name
AGENT_BROWSER_SESSION=cultr-dev

# Enable streaming (for live preview)
AGENT_BROWSER_STREAM_PORT=9223
```

## Advanced Features

### Authenticate Once, Reuse State

```bash
# Login and save state
agent-browser open http://localhost:3000/login
agent-browser snapshot -i
agent-browser fill @e1 "admin@cultr.com"
agent-browser fill @e2 "password"
agent-browser click @e3
agent-browser state save auth-state.json

# Later: Load saved state
agent-browser state load auth-state.json
agent-browser open http://localhost:3000/dashboard
```

### Test Mobile Views

```bash
# Emulate iPhone
agent-browser set device "iPhone 14"
agent-browser open http://localhost:3000

# Take mobile screenshot
agent-browser screenshot mobile-view.png
```

### Monitor Network Requests

```bash
# Track API calls
agent-browser network requests

# Block specific requests
agent-browser network route "**/analytics" --abort

# Mock API responses
agent-browser network route "**/api/products" --body '{"products":[]}'
```

## Troubleshooting

### Browser Not Responding

```bash
# Close all sessions
agent-browser close

# Reconnect if needed
agent-browser connect 9222
```

### Elements Not Found

```bash
# Use headed mode to see what's happening
agent-browser --headed open http://localhost:3000

# Increase wait times
agent-browser wait --load networkidle
agent-browser wait 5000
```

### HTTPS Errors (localhost)

```bash
agent-browser open https://localhost:3000 --ignore-https-errors
```

## Resources

- **CLI Help**: `agent-browser --help`
- **Command Help**: `agent-browser <command> --help`
- **GitHub**: https://github.com/vercel-labs/agent-browser
- **Skill Location**: `~/.cursor/skills/agent-browser/SKILL.md`

## Next Steps

1. Start your dev server: `npm run dev`
2. Test the waitlist form with agent-browser
3. Create automated test scripts for critical flows
4. Use with Cursor AI for automated testing
