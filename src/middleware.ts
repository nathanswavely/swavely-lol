import { defineMiddleware } from 'astro:middleware';
import { getEnv } from './lib/env';
import { viewerForSession } from './lib/people';
import { SESSION_COOKIE, readCookie } from './lib/auth';
import { toolAt, toolHref } from './lib/tools';
import { refuseCrossOrigin, setHeaders } from '@swavely-lol/kit/guard';

/**
 * Who is this, and do they need to be anyone (ADR-0002). The Shelf and sign-in are open
 * to all; a session cookie, when present, names a Person so the Shelf can greet them.
 * Only /people needs a Person: signed out it goes to /login, and to anyone but a Hub
 * Admin it is a 404. Invite-only Tools guard themselves.
 *
 * Every POST must come from this origin (Sec-Fetch-Site, or Origin). The cookie is
 * SameSite=Lax, which already keeps a cross-site form from carrying it; this is the
 * second lock. Only the Shelf is indexed; every other response is noindex.
 */
const ADMIN_ONLY = ['/people'];
const INDEXED = ['/'];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  const env = getEnv();

  // www.swavely.lol is routed here only to send people to the apex, where the session
  // cookie (host-only) lives.
  if (ctx.url.hostname === 'www.swavely.lol' || ctx.request.headers.get('Host') === 'www.swavely.lol') {
    return Response.redirect(`https://swavely.lol${pathname}${ctx.url.search}`, 301);
  }

  const refused = refuseCrossOrigin(ctx.request, ctx.url);
  if (refused) return refused;

  const id = readCookie(ctx.request, SESSION_COOKIE);
  const who = id ? await viewerForSession(env, id) : null;
  if (who) ctx.locals.viewer = who;

  const adminOnly = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (adminOnly && !who) return ctx.redirect(`/login?next=${encodeURIComponent(pathname + ctx.url.search)}`, 302);
  if (adminOnly && !who?.isHubAdmin) return new Response('Not found.', { status: 404 });

  if (who && (pathname === '/login' || pathname === '/login/verify')) {
    const next = ctx.url.searchParams.get('next') ?? '';
    const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/';
    return ctx.redirect(toolAt(safe) ? toolHref(env, safe) : safe, 302);
  }

  const res = await next();
  return setHeaders(res, pathname, { indexed: INDEXED.includes(pathname) });
});
