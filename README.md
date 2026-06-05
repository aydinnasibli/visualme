# VisualMe

AI-powered visualization platform. Describe anything in plain English and get a professional diagram in seconds — automatically choosing the best format from 19 types.

## What it does

- **Natural language → diagrams**: Type a prompt, the AI picks the right format and generates structured data
- **19 diagram types**: network graphs, mind maps, flowcharts, timelines, Gantt charts, Sankey diagrams, line/bar/scatter/pie/radar charts, heatmaps, word clouds, and more
- **Edit and iterate**: Manually edit JSON data or use AI chat to refine any visualization
- **Save and share**: Persist visualizations to your account, generate public share links, export as PNG / SVG / PDF / JSON / CSV / HTML
- **Token-based usage**: Free (110 tokens/month), Pro (5,400 tokens/month), Enterprise (27,000 tokens/month)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Auth | Clerk |
| Database | MongoDB Atlas + Mongoose |
| AI | OpenAI (`gpt-5.4-mini`) |
| Rate limiting / cache | Upstash Redis |
| Visualization libs | D3, Recharts, ReactFlow, Markmap, Vis-Timeline |
| Monitoring | Sentry |
| Deployment | Vercel |

## Local setup

**1. Clone and install**
```bash
git clone <repo>
cd visualme
npm install
```

**2. Environment variables**

Create `.env.local`:
```env
# OpenAI
OPENAI_API_KEY=sk-...

# MongoDB Atlas
MONGODB_URI=mongodb+srv://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App URL (used for share links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (optional — error monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=visualme
SENTRY_AUTH_TOKEN=sntrys_...
```

**3. Run**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Clerk webhook (local dev)

The app syncs Clerk users to MongoDB via webhook. To test locally, forward events using the [Clerk CLI](https://clerk.com/docs/testing/webhooks) or ngrok:

```bash
clerk webhooks forward --route /api/webhooks/clerk
```

## Project structure

```
app/
  dashboard/       # Main playground
  admin/           # Admin dashboard (role-gated)
  share/[shareId]/ # Public shared visualizations
  api/webhooks/    # Clerk webhook handler
components/
  visualizations/  # 19 visualization components + modal
  dashboard/       # Sidebar, input, history panels
  admin/           # Admin UI
lib/
  actions/         # Server Actions (visualize, profile, export)
  services/        # AI format selector + visualization generator
  database/        # MongoDB models (User, Visualization, UserUsage)
  utils/           # Tokens, rate limiting, caching, validation
```

## Sentry setup

1. Create a project at [sentry.io](https://sentry.io)
2. Copy the DSN and add the environment variables above
3. Add `SENTRY_AUTH_TOKEN` to your Vercel environment for source map uploads

## Deployment (Vercel)

```bash
vercel --prod
```

All environment variables must be added to Vercel before deploying. The Clerk webhook URL should point to `https://your-domain.com/api/webhooks/clerk`.
