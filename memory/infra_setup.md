---
name: infra-setup
description: Required env vars, infrastructure dependencies, and production configuration for VisualMe
metadata:
  type: project
---

## Required env vars not yet set

- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL for rate limiting and caching
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `CLERK_WEBHOOK_SECRET` — Clerk webhook signing secret (register endpoint at /api/webhooks/clerk in Clerk Dashboard, subscribe to user.created / user.updated / user.deleted)

**Why:** Both rate limiting and caching fail open (allow all) when Redis is not configured. Without the webhook secret, the /api/webhooks/clerk endpoint will reject all events from Clerk.

**How to apply:** Remind user to set these before going to production. The app works without them (graceful degradation) but lacks rate limiting and caching.

## MongoDB in production
- `autoIndex: false` is set in production — run index creation separately or via Atlas UI
- Pool size is capped at 10 (appropriate for Vercel serverless)
- `serverSelectionTimeoutMS: 5000` (fail fast for dead connections)
