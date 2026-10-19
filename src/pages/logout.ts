import type { APIRoute } from 'astro';
import { getEnv } from '../lib/env';
import { SESSION_COOKIE, clearSessionCookie, endSession, readCookie } from '../lib/auth';

/** Sign out: the session row goes, the cookie goes, back to the sign-in page. POST only. */
export const POST: APIRoute = async ({ request, url }) => {
  const env = getEnv();
  const id = readCookie(request, SESSION_COOKIE);
  if (id) await endSession(env.DB, id);
  return new Response(null, { status: 303, headers: { Location: '/login', 'Set-Cookie': clearSessionCookie(url) } });
};

export const GET: APIRoute = () => new Response('Sign out is a POST.', { status: 405 });
