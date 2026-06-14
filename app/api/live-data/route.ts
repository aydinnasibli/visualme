import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { fetchAndParseSheet } from '@/lib/utils/sheet-fetch';

/*
 * Client IP — NextRequest.ip was removed in Next 15+. `x-real-ip` is the
 * single client IP as calculated by the Vercel Proxy (trusted); `x-forwarded-for`
 * is a client-appendable chain and only used as a local-dev fallback.
 */
function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

export async function GET(request: NextRequest) {
  // ── Rate limiting (per-IP, before any outbound fetch) ──────────────────────
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(ip, 'live-data');
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rateCheck.retryAfter ?? 60} seconds before trying again.` },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter ?? 60) } }
    );
  }

  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // searchParams.get() already percent-decodes — do NOT call decodeURIComponent again
  const result = await fetchAndParseSheet(rawUrl);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    rawCsv: result.rawCsv,
    headers: result.headers,
    rowCount: result.rowCount,
    schema: result.schema,
    truncated: result.truncated,
    fetchedAt: new Date().toISOString(),
  });
}
