import { defineMiddleware } from 'astro:middleware';
import { getEnv } from './lib/env';
import { viewer } from './lib/people';
import { SESSION_COOKIE, readCookie, readSession } from './lib/auth';
import { TOOLS, toolHref } from './lib/tools';

/**
 * Who is this, and may they be here. A session cookie names a row in D1, that row
 * names a Person. Open without one: /healthz, /login and its steps, built assets.
 * Everything else redirects to /login. /people is a Hub Admin's, and a 404 to anyone
 * else.
 *
 * Every POST must come from this origin (Sec-Fetch-Site, or Origin). The cookie is
 * SameSite=Lax, which already keeps a cross-site form from carrying it; this is the
 * second lock. Every response is noindex (client-ops ADR-0012).
 */
const OPEN = ['/healthz', '/login', '/login/verify', '/login/resend'];
const ADMIN_ONLY = ['/people'];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  const env = getEnv();

  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    const site = ctx.request.headers.get('Sec-Fetch-Site');
    const origin = ctx.request.headers.get('Origin');
    const sameOrigin = site === 'same-origin' || (origin !== null && origin === ctx.url.origin);
    if (!sameOrigin) return new Response('Cross-origin request refused.', { status: 403 });
  }

  const open = OPEN.includes(pathname) || pathname.startsWith('/_astro/') || pathname.startsWith('/fonts/') || pathname === '/favicon.svg' || pathname === '/robots.txt';

  const id = readCookie(ctx.request, SESSION_COOKIE);
  const session = id ? await readSession(env.DB, id) : null;
  const who = session ? await viewer(env, session.personId) : null;
  if (session && who) ctx.locals.viewer = { ...who, sessionIdHash: session.idHash };

  if (!who && !open) {
    const back = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + ctx.url.search)}`;
    return ctx.redirect(`/login${back}`, 302);
  }
  if (who && (pathname === '/login' || pathname === '/login/verify')) {
    const next = ctx.url.searchParams.get('next') ?? '';
    const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/';
    const tool = TOOLS.some((t) => safe === t.path || safe.startsWith(t.path + '/'));
    return ctx.redirect(tool ? toolHref(env, safe) : safe, 302);
  }
  if (who && !who.isHubAdmin && ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return new Response('Not found.', { status: 404 });
  }

  const res = await next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (!pathname.startsWith('/_astro/')) res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('Referrer-Policy', 'same-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
});
