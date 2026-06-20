import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/share/(.*)',
  '/robots.txt',
  '/sitemap.xml',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(
  async (auth, request) => {
    if (isAdminRoute(request)) {
      const { sessionClaims, userId } = await auth();
      if (!userId || sessionClaims?.metadata?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return;
    }

    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  // TODO: Re-enable frontendApiProxy once visuologia.vercel.app is added as a
  // production domain in Clerk Dashboard and pk_live_ keys are set in Vercel env vars.
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
