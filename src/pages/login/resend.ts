import type { APIRoute } from 'astro';
import { getEnv } from '../../lib/env';
import { issueCode, normaliseEmail } from '../../lib/auth';
import { sendSignInCode } from '../../lib/mail';
import { personForSignIn } from '../../lib/people';

/**
 * "Send again": the same rules as the first (known address only, three per quarter
 * hour), the same answer either way, back to the code page. POST only.
 */
export const POST: APIRoute = async ({ url }) => {
  const env = getEnv();
  const email = normaliseEmail(url.searchParams.get('email') ?? '');
  const next = url.searchParams.get('next') ?? '';
  if (!email) return new Response(null, { status: 303, headers: { Location: '/login' } });

  const q = new URLSearchParams({ email, resent: '1' });
  if (next) q.set('next', next);

  if (await personForSignIn(env, email)) {
    const issued = await issueCode(env.DB, email);
    if (issued.ok) {
      const sent = await sendSignInCode(env, email, issued.code);
      if (sent.devCode && import.meta.env.DEV) q.set('dev_code', sent.devCode);
    }
  }
  return new Response(null, { status: 303, headers: { Location: `/login/verify?${q}` } });
};

export const GET: APIRoute = () => new Response(null, { status: 303, headers: { Location: '/login' } });
