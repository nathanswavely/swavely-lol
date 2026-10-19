import type { Person, Viewer } from './contract';
import { sha256Hex } from './auth';

/**
 * The People the Hub knows and who manages whom. Hub Admins are named in
 * configuration (ADMIN_EMAILS) and also have a row here, made the first time they sign
 * in, so that Tools can refer to them like anyone else.
 */

const now = () => Math.floor(Date.now() / 1000);

export function newId(prefix: string): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return prefix + [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export function adminEmails(env: HubEnv): Set<string> {
  return new Set(
    (env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

interface Row { id: string; name: string; email: string | null }
interface PersonRow extends Row { manager_ids: string }

const marks = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `?${i + from}`).join(',');

/** A Person and who manages them, in one query: the managers come back as a JSON array. */
const PERSON = `SELECT p.id, p.name, p.email,
  (SELECT json_group_array(manager_id) FROM managers m WHERE m.person_id = p.id) AS manager_ids
  FROM people p`;

const toPerson = (r: PersonRow): Person => ({ id: r.id, name: r.name, email: r.email, managerIds: JSON.parse(r.manager_ids) as string[] });

async function withManagers(db: D1Database, rows: Row[]): Promise<Person[]> {
  return getPeople(db, rows.map((r) => r.id));
}

export async function getPeople(db: D1Database, ids: string[]): Promise<Person[]> {
  const unique = [...new Set(ids)].slice(0, 500);
  if (unique.length === 0) return [];
  const { results } = await db.prepare(`${PERSON} WHERE p.id IN (${marks(unique.length)})`).bind(...unique).all<PersonRow>();
  return results.map(toPerson);
}

export async function allPeople(db: D1Database): Promise<Person[]> {
  const { results } = await db.prepare(`${PERSON} ORDER BY p.name COLLATE NOCASE`).all<PersonRow>();
  return results.map(toPerson);
}

export async function personByEmail(db: D1Database, email: string): Promise<Row | null> {
  return db.prepare('SELECT id, name, email FROM people WHERE email = ?1').bind(email).first<Row>();
}

/**
 * Who holds this session cookie value, in one query: the session, its Person, who
 * manages them and whom they manage. Null for an unknown, expired or malformed session,
 * or a Person who has gone. Touches last_seen_at at most hourly, the one extra write.
 */
export async function viewerForSession(env: HubEnv, sessionId: string): Promise<(Viewer & { sessionIdHash: string }) | null> {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(sessionId)) return null;
  const idHash = await sha256Hex(sessionId);
  const t = now();
  const row = await env.DB
    .prepare(`SELECT p.id, p.name, p.email, s.last_seen_at,
        (SELECT json_group_array(manager_id) FROM managers WHERE person_id = p.id) AS manager_ids,
        (SELECT json_group_array(person_id) FROM managers WHERE manager_id = p.id) AS manages
      FROM sessions s JOIN people p ON p.id = s.person_id
      WHERE s.id_hash = ?1 AND s.expires_at > ?2`)
    .bind(idHash, t)
    .first<PersonRow & { last_seen_at: number; manages: string }>();
  if (!row) return null;
  if (t - row.last_seen_at > 3600) {
    await env.DB.prepare('UPDATE sessions SET last_seen_at = ?1 WHERE id_hash = ?2').bind(t, idHash).run();
  }
  const p = toPerson(row);
  return { ...p, isHubAdmin: !!p.email && adminEmails(env).has(p.email), manages: JSON.parse(row.manages) as string[], sessionIdHash: idHash };
}

/**
 * May this address be sent a code? Someone the Hub knows, or a Hub Admin. A Hub Admin
 * with no row yet gets one here, named from their address until they rename themselves.
 */
export async function personForSignIn(env: HubEnv, email: string): Promise<Row | null> {
  const row = await personByEmail(env.DB, email);
  if (row) return row;
  if (!adminEmails(env).has(email)) return null;
  const local = email.split('@')[0].replace(/[._-]+/g, ' ');
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  const id = newId('p_');
  await env.DB.prepare('INSERT INTO people (id, name, email, added_by, added_at) VALUES (?1, ?2, ?3, NULL, ?4)').bind(id, name, email, now()).run();
  return { id, name, email };
}

export async function addPerson(db: D1Database, input: { name: string; email?: string | null; addedBy: string | null }): Promise<{ person: Person; existed: boolean }> {
  const name = input.name.trim().slice(0, 80);
  const email = input.email?.trim().toLowerCase() || null;
  if (email) {
    const found = await personByEmail(db, email);
    if (found) return { person: (await withManagers(db, [found]))[0], existed: true };
  }
  const id = newId('p_');
  await db.prepare('INSERT INTO people (id, name, email, added_by, added_at) VALUES (?1, ?2, ?3, ?4, ?5)').bind(id, name || email || 'Someone', email, input.addedBy, now()).run();
  return { person: { id, name: name || email || 'Someone', email, managerIds: [] }, existed: false };
}

/**
 * Remove a Person from swavely.lol (ADR-0003): their row, and with it their sessions and
 * who they manage or are managed by; any code still waiting for their address; and a
 * tombstone of their bare id, from which every Tool removes what it holds of them.
 */
export async function removePerson(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare('SELECT email FROM people WHERE id = ?1').bind(id).first<{ email: string | null }>();
  if (!row) return false;
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO removed_people (id, removed_at) VALUES (?1, ?2)').bind(id, now()),
    db.prepare('DELETE FROM login_codes WHERE email = ?1').bind(row.email ?? ''),
    db.prepare('DELETE FROM sessions WHERE person_id = ?1').bind(id),
    db.prepare('DELETE FROM managers WHERE person_id = ?1 OR manager_id = ?1').bind(id),
    db.prepare('DELETE FROM people WHERE id = ?1').bind(id),
  ]);
  return true;
}

/** Everyone removed at or after `since` (unix seconds), oldest first. */
export async function removedSince(db: D1Database, since: number): Promise<{ id: string; removedAt: number }[]> {
  const { results } = await db
    .prepare('SELECT id, removed_at FROM removed_people WHERE removed_at >= ?1 ORDER BY removed_at LIMIT 500')
    .bind(Math.max(0, Math.floor(since) || 0))
    .all<{ id: string; removed_at: number }>();
  return results.map((r) => ({ id: r.id, removedAt: r.removed_at }));
}

export async function setManagers(db: D1Database, personId: string, managerIds: string[]): Promise<boolean> {
  const target = await db.prepare('SELECT email FROM people WHERE id = ?1').bind(personId).first<{ email: string | null }>();
  if (!target || target.email) return false; // only a Managed Person has managers
  const candidates = await getPeople(db, managerIds.filter((m) => m !== personId));
  const valid = candidates.filter((c) => c.email).map((c) => c.id);
  await db.batch([
    db.prepare('DELETE FROM managers WHERE person_id = ?1').bind(personId),
    ...valid.map((m) => db.prepare('INSERT INTO managers (person_id, manager_id) VALUES (?1, ?2)').bind(personId, m)),
  ]);
  return true;
}
