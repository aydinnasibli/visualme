import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspHeader = [
  "default-src 'self'",
  // Clerk requires unsafe-inline; Next.js hydration needs it too
  // Cloudflare Turnstile (Clerk CAPTCHA) scripts must also be allowed
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.com https://*.clerk.accounts.dev https://clerk.visualme.ai https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' blob: data: https://img.clerk.com https://images.clerk.dev",
  // Cloudflare Turnstile API calls
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.visualme.ai https://challenges.cloudflare.com",
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
