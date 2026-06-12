import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

const cspHeader = [
  "default-src 'self'",
  // Clerk requires unsafe-inline; Next.js hydration needs it too
  // Cloudflare Turnstile (Clerk CAPTCHA) scripts must also be allowed
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.com https://*.clerk.accounts.dev https://clerk.visualme.ai https://challenges.cloudflare.com`,
  // Clerk's bot-detection runs in a blob: web worker
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' blob: data: https://img.clerk.com https://images.clerk.dev",
  // Cloudflare Turnstile + Sentry tunnel (via /sentry-tunnel proxied through own domain)
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.visualme.ai https://challenges.cloudflare.com https://*.sentry.io",
  // Clerk CAPTCHA and OAuth popups run in iframes
  "frame-src https://challenges.cloudflare.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk.visualme.ai",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/sentry-tunnel",
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
