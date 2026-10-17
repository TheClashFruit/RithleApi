import type { APIRoute } from 'astro';
import db from '../../../../util/db';
import { usersTable } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.modrinthId, params.id!));
  if (user.length !== 1)
    return new Response(JSON.stringify({ error: 'User not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  const timestamp =
    (user[0].id >> 22n) +
    BigInt(new Date('2026-10-01T00:00:00.000Z').getTime());

  return new Response(
    JSON.stringify({
      ...(user[0]),
      createdAt: user[0].createdAt ?? new Date(Number(timestamp)),
      lastLoginAt: undefined,
      updatedAt: undefined,
      settings: undefined
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
