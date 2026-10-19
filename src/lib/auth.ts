/**
 * Sign-in by email code, and sessions. Copied from the client-ops Portal's
 * src/lib/auth.ts (ADR-0001), with sessions keyed by Person rather than by email. The
 * rules are client-ops ADR-0009's:
 *
 *  - codes: six digits, stored hashed, expire in 10 minutes, five wrong guesses end
 *    them, at most three issued per address per 15 minutes;
 *  - sessions: 256 random bits, stored hashed, 30 days, HttpOnly Secure SameSite=Lax,
 *    host-only (no Domain=), so a Sandbox at <name>.swavely.lol never receives it;
 *  - every POST is checked against its Origin by the middleware, not here.
 *
 * Nothing in this file sends mail or renders a page.
 */

export const CODE_TTL_S = 10 * 60;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_ISSUE_LIMIT = 3; // per address, per CODE_ISSUE_WINDOW_S
export const CODE_ISSUE_WINDOW_S = 15 * 60;
export const SESSION_TTL_S = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = 'lol_session';

const now = () => Math.floor(Date.now() / 1000);

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normaliseEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  // Enough to refuse garbage; the real test is whether a code arrives.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

// ---------------------------------------------------------------- codes ----

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'rate_limited'; retryAfterS: number };

/** Mint a code for this address, replacing any live one. The caller sends it. */
export async function issueCode(db: D1Database, email: string): Promise<IssueResult> {
  const t = now();
  const since = t - CODE_ISSUE_WINDOW_S;

  const recent = await db
    .prepare('SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM login_codes WHERE email = ?1 AND created_at > ?2')
    .bind(email, since)
    .first<{ n: number; oldest: number | null }>();
  if (recent && recent.n >= CODE_ISSUE_LIMIT) {
    const retryAfterS = Math.max(60, (recent.oldest ?? t) + CODE_ISSUE_WINDOW_S - t);
    return { ok: false, reason: 'rate_limited', retryAfterS };
  }

  // Six digits from a CSPRNG, uniformly: reject the top of the range rather than mod it.
  let n: number;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4_294_000_000);
  const code = String(n % 1_000_000).padStart(6, '0');

  const hash = await sha256Hex(`${email}:${code}`);
  await db.batch([
    // Keep the issue count honest: expired rows older than the window go, live ones for
    // this address are replaced so only the newest code works.
    db.prepare('DELETE FROM login_codes WHERE expires_at < ?1 AND created_at < ?2').bind(t, since),
    db.prepare('DELETE FROM login_codes WHERE email = ?1 AND expires_at >= ?2').bind(email, t),
    db.prepare('INSERT INTO login_codes (email, code_hash, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)').bind(email, hash, t, t + CODE_TTL_S),
  ]);
  return { ok: true, code };
}

export type VerifyResult = 'ok' | 'wrong' | 'expired' | 'locked' | 'none';

/** Check a code. A wrong guess counts; the fifth ends the code. */
export async function verifyCode(db: D1Database, email: string, code: string): Promise<VerifyResult> {
  const t = now();
  const row = await db
    .prepare('SELECT code_hash, attempts, expires_at FROM login_codes WHERE email = ?1 ORDER BY created_at DESC LIMIT 1')
    .bind(email)
    .first<{ code_hash: string; attempts: number; expires_at: number }>();
  if (!row) return 'none';
  if (row.expires_at < t) return 'expired';
  if (row.attempts >= CODE_MAX_ATTEMPTS) return 'locked';

  const hash = await sha256Hex(`${email}:${code.replace(/\D/g, '')}`);
  if (hash !== row.code_hash) {
    await db.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?1 AND code_hash = ?2').bind(email, row.code_hash).run();
    return row.attempts + 1 >= CODE_MAX_ATTEMPTS ? 'locked' : 'wrong';
  }
  await db.prepare('DELETE FROM login_codes WHERE email = ?1').bind(email).run();
  return 'ok';
}

// ------------------------------------------------------------- sessions ----

export interface Session {
  personId: string;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  userAgent: string | null;
  idHash: string;
}

function randomId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Start a session; returns the id to put in the cookie, which is never stored. */
export async function createSession(db: D1Database, personId: string, userAgent: string | null): Promise<string> {
  const id = randomId();
  const t = now();
  await db
    .prepare('INSERT INTO sessions (id_hash, person_id, created_at, expires_at, last_seen_at, user_agent) VALUES (?1, ?2, ?3, ?4, ?3, ?5)')
    .bind(await sha256Hex(id), personId, t, t + SESSION_TTL_S, userAgent?.slice(0, 200) ?? null)
    .run();
  return id;
}

/** The session behind a cookie value, or null. Touches last_seen_at hourly at most. */
export async function readSession(db: D1Database, id: string): Promise<Session | null> {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(id)) return null;
  const idHash = await sha256Hex(id);
  const t = now();
  const row = await db
    .prepare('SELECT person_id, created_at, expires_at, last_seen_at, user_agent FROM sessions WHERE id_hash = ?1 AND expires_at > ?2')
    .bind(idHash, t)
    .first<{ person_id: string; created_at: number; expires_at: number; last_seen_at: number; user_agent: string | null }>();
  if (!row) return null;
  if (t - row.last_seen_at > 3600) {
    await db.prepare('UPDATE sessions SET last_seen_at = ?1 WHERE id_hash = ?2').bind(t, idHash).run();
  }
  return { personId: row.person_id, createdAt: row.created_at, expiresAt: row.expires_at, lastSeenAt: row.last_seen_at, userAgent: row.user_agent, idHash };
}

export async function endSession(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id_hash = ?1').bind(await sha256Hex(id)).run();
}

/** End every session for a Person: what removing someone or losing a phone needs. */
export async function endAllSessions(db: D1Database, personId: string): Promise<number> {
  const r = await db.prepare('DELETE FROM sessions WHERE person_id = ?1').bind(personId).run();
  return r.meta.changes ?? 0;
}

// -------------------------------------------------------------- cookies ----

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(id: string, url: URL, maxAgeS = SESSION_TTL_S): string {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${id}; Path=/; Max-Age=${maxAgeS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearSessionCookie(url: URL): string {
  return sessionCookie('', url, 0);
}
