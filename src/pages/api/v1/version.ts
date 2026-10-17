// TODO: DATABASE

import semver from 'semver';

import { versionsTable } from '../../../db/schema';
import db from '../../../util/db';

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({}) => {
  const versions = await db.select().from(versionsTable);

  const stableSorted = semver.rsort(versions.filter((v) => v.type === 'stable').map((v) => v.name));
  const stable = stableSorted.length > 0 ? versions.find(v => v.name === stableSorted[0])!.code : -1;
 
  return new Response(
    JSON.stringify({
      latest: stable,
      versions: Object.fromEntries(
        versions.map((v) => [
          v.code,
          {
            name: v.name,
            changelog: v.changelog,
            release: v.type,
            download: {
              direct: `https://dl.theclashfruit.me/apps/me.theclashfruit.rithle/${v.code}/app-release.apk`,
              github: `https://github.com/TheClashFruit/Rithle/releases/tag/${v.name}`
            }
          }
        ])
      )
    }),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
