import { WorkerEntrypoint } from 'cloudflare:workers';
import server from '@astrojs/cloudflare/entrypoints/server';
import { readSession } from './lib/auth';
import type { HubApiContract, Notice, Person, Viewer } from './lib/contract';
import { notify } from './lib/mail';
import { addPerson, getPeople, setManagers, viewer } from './lib/people';

/**
 * The Hub's Worker: the Astro app for every request on swavely.lol, and HubApi, the
 * RPC a Tool reaches over its `HUB` service binding (ADR-0001). A service binding is
 * the only way in; nothing here is reachable from the public internet.
 *
 * The Hub trusts a bound Tool to have decided whether its Viewer may ask: an Organizer
 * adding someone to their Group, say. It still refuses what no Tool should do, such as
 * giving an emailed Person managers.
 */
export class HubApi extends WorkerEntrypoint<HubEnv> implements HubApiContract {
  async whoIs(sessionId: string): Promise<Viewer | null> {
    const session = await readSession(this.env.DB, sessionId);
    return session ? viewer(this.env, session.personId) : null;
  }

  async people(ids: string[]): Promise<Person[]> {
    return getPeople(this.env.DB, ids);
  }

  async addPerson(input: { name: string; email?: string | null; addedBy: string }) {
    return addPerson(this.env.DB, input);
  }

  async renameManaged(personId: string, name: string): Promise<boolean> {
    const clean = name.trim().slice(0, 80);
    if (!clean) return false;
    const r = await this.env.DB.prepare('UPDATE people SET name = ?1 WHERE id = ?2 AND email IS NULL').bind(clean, personId).run();
    return (r.meta.changes ?? 0) > 0;
  }

  async setManagers(personId: string, managerIds: string[]): Promise<boolean> {
    return setManagers(this.env.DB, personId, managerIds);
  }

  async notify(personIds: string[], notice: Notice) {
    const origin = this.env.TOOLS_ORIGIN || 'https://swavely.lol';
    return notify(this.env, origin, personIds, notice);
  }
}

export default server;
