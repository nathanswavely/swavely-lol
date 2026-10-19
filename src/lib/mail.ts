import type { Notice } from './contract';
import { getPeople } from './people';

/**
 * Every email the Hub and its Tools send, through Resend from send.swavely.lol, on one
 * text-first template. In development nothing is sent unless DEV_SEND_MAIL=1: the
 * email is logged and a code is shown on the page instead.
 */

export const SITE = 'swavely.lol';

export interface SendResult {
  sent: boolean;
  dev?: boolean;
  devCode?: string;
  error?: string;
}

interface Email {
  to: string;
  subject: string;
  lines: string[];
  callout?: string;
  cta?: { label: string; href: string };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function render(e: Email): { text: string; html: string } {
  const text = [
    ...e.lines,
    ...(e.callout ? ['', e.callout, ''] : ['']),
    ...(e.cta ? [`${e.cta.label}: ${e.cta.href}`, ''] : []),
    SITE,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f5efe6;padding:24px 12px;font:16px/1.55 -apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b2420">
<div style="max-width:520px;margin:0 auto">
  <div style="font-weight:800;font-size:18px;padding:0 4px 14px;color:#2d6a4f">${SITE}</div>
  <div style="background:#fbf7f1;border:1px dashed #cbbcaa;border-radius:10px;box-shadow:3px 3px 0 rgba(43,36,32,0.16);padding:22px 22px 18px">
    ${e.lines.map((l) => `<p style="margin:0 0 12px">${esc(l)}</p>`).join('')}
    ${e.callout ? `<p style="margin:8px 0 16px;font:700 34px/1.1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:0.14em">${esc(e.callout)}</p>` : ''}
    ${e.cta ? `<p style="margin:16px 0 4px"><a href="${esc(e.cta.href)}" style="display:inline-block;background:#2d6a4f;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:6px">${esc(e.cta.label)}</a></p>` : ''}
  </div>
</div></body></html>`;
  return { text, html };
}

async function deliver(env: HubEnv, e: Email): Promise<SendResult> {
  if (import.meta.env.DEV && env.DEV_SEND_MAIL !== '1') {
    console.log(`[dev] email to ${e.to}: ${e.subject}${e.callout ? ` [${e.callout}]` : ''}${e.cta ? ` -> ${e.cta.href}` : ''}\n  ${e.lines.join('\n  ')}`);
    return { sent: false, dev: true, devCode: e.callout };
  }
  const key = env.RESEND_API_KEY?.trim();
  if (!key) return { sent: false, error: 'RESEND_API_KEY is not set' };

  const from = env.MAIL_FROM?.trim() || `${SITE} <hello@send.swavely.lol>`;
  const { text, html } = render(e);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [e.to], ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}), subject: e.subject, text, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`Resend ${res.status}: ${body.slice(0, 300)}`);
    return { sent: false, error: `Resend HTTP ${res.status}` };
  }
  return { sent: true };
}

export function sendSignInCode(env: HubEnv, to: string, code: string): Promise<SendResult> {
  return deliver(env, {
    to,
    subject: `${code} is your sign-in code`,
    lines: ['Your swavely.lol sign-in code, valid for 10 minutes:'],
    callout: code,
  });
}

/**
 * A Tool's notice, to each Person, or to a Managed Person's managers on their behalf.
 * `origin` makes the notice's path a full link.
 */
export async function notify(env: HubEnv, origin: string, personIds: string[], notice: Notice): Promise<{ sent: number; unreachable: string[] }> {
  const people = await getPeople(env.DB, personIds);
  const managerIds = people.flatMap((p) => (p.email ? [] : p.managerIds));
  const managers = new Map((await getPeople(env.DB, managerIds)).map((m) => [m.id, m]));
  const cta = notice.cta ? { label: notice.cta.label, href: new URL(notice.cta.path, origin).toString() } : undefined;

  let sent = 0;
  const unreachable: string[] = [];
  for (const p of people) {
    const targets = p.email
      ? [{ to: p.email, subject: notice.subject, lines: notice.lines }]
      : p.managerIds
          .map((id) => managers.get(id)?.email)
          .filter((e): e is string => !!e)
          .map((to) => ({ to, subject: `${notice.subject} (for ${p.name})`, lines: [`For ${p.name}, whom you look after:`, ...notice.lines] }));
    if (targets.length === 0) unreachable.push(p.id);
    for (const t of targets) {
      const r = await deliver(env, { ...t, cta });
      if (r.sent || r.dev) sent++;
    }
  }
  for (const id of personIds) if (!people.some((p) => p.id === id)) unreachable.push(id);
  return { sent, unreachable };
}
