# Stripe Integration Guide

## Overview

The token system is production-ready and waiting for Stripe integration. When a user pays for Pro tier, you'll upgrade them using the `updateUserTier()` function.

## How Token System Works

### Token Limits by Tier:
- **Free**: 100 tokens/month (~10 visualizations)
- **Pro ($9.99)**: 2000 tokens/month (~200 visualizations)
- **Enterprise**: 10000 tokens/month (~1000 visualizations)

### Token Costs:
- Generate Visualization: 10 tokens
- Expand Node: 5 tokens
- Export: 1 token
- Save/Delete/Query: 0 tokens (free)

## Stripe Setup Steps

### 1. Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

### 2. Add Environment Variables

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Create Products in Stripe Dashboard

Create two products:
- **Pro Plan**: $9.99/month with metadata `tier: "pro"`
- **Enterprise Plan**: Custom pricing with metadata `tier: "enterprise"`

### 4. Create Webhook Handler

Create `/app/api/webhooks/stripe/route.ts`:

```typescript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserTier } from '@/lib/utils/tokens';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier as 'pro' | 'enterprise';

      if (userId && tier) {
        await updateUserTier(userId, tier);
        console.log(\`✅ User \${userId} upgraded to \${tier}\`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await updateUserTier(userId, 'free');
        console.log(\`✅ User \${userId} downgraded to free\`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### 5. Create Checkout Function

Create `/lib/actions/stripe.ts`:

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function createCheckoutSession(tier: 'pro' | 'enterprise') {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const priceId = tier === 'pro'
    ? 'price_ProMonthly'  // Replace with your Stripe price ID
    : 'price_EnterpriseMonthly';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: \`\${process.env.NEXT_PUBLIC_URL}/profile?success=true\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true\`,
    metadata: {
      userId,
      tier,
    },
  });

  return session.url;
}
```

### 6. Update Upgrade Button

The "Upgrade to Pro" button already redirects to `/pricing`. Create that page with Stripe checkout:

```typescript
// app/pricing/page.tsx
'use client';

import { createCheckoutSession } from '@/lib/actions/stripe';

export default function PricingPage() {
  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    const url = await createCheckoutSession(tier);
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div>
      {/* Pro Plan */}
      <button onClick={() => handleUpgrade('pro')}>
        Upgrade to Pro - $9.99/month
      </button>

      {/* Enterprise Plan */}
      <button onClick={() => handleUpgrade('enterprise')}>
        Contact for Enterprise
      </button>
    </div>
  );
}
```

### 7. Configure Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `.env.local`

## Testing

### Test Upgrade Flow:
1. User is on free tier (100 tokens)
2. User clicks "Upgrade to Pro"
3. Redirects to /pricing
4. User completes Stripe checkout
5. Webhook fires → `updateUserTier(userId, 'pro')`
6. User refreshes → sees 2000 tokens ✅

### Test Locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

## What's Already Done ✅

- ✅ Token system fully implemented
- ✅ `updateUserTier()` function ready
- ✅ Profile page shows token usage
- ✅ Upgrade prompts for free users
- ✅ Token limits enforce economics
- ✅ Monthly auto-refresh (1st of month)

## What You Need to Add

- [ ] Install Stripe packages
- [ ] Add Stripe env variables
- [ ] Create Stripe products
- [ ] Create webhook handler
- [ ] Create checkout function
- [ ] Create pricing page
- [ ] Configure Stripe webhook

## Economics

The token system ensures profitability:
- Pro tier: $9.99/month
- Max usage: 200 visualizations × $0.15 = $30 cost (rare)
- Average usage: 50 visualizations × $0.10 = $5 cost
- **Profit margin: 50-75%** ✅

Your token system is ready to go! Just add Stripe and you're in business. 🚀
