import type { APIRoute } from 'astro';
import db from '../../util/db';
import { tokensTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, getTokenSecret } from '../../util/crypto';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (
    !/^Rithle\/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))? \(https:\/\/github\.com\/TheClashFruit\/Rithle\)$/.test(
      request.headers.get('user-agent') || ''
    )
  )
    return new Response(JSON.stringify({ error: 'Unautorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });

  const data = await request.formData();
  const code = data.get('code') ?? '';

  const tokenRaw = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.key, code.toString()));

  if (tokenRaw.length !== 1)
    return new Response(JSON.stringify({ error: 'Token not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  await db.delete(tokensTable).where(eq(tokensTable.id, tokenRaw[0].id));
  
  return new Response(JSON.stringify({ 
    access_token: decrypt(tokenRaw[0].token, getTokenSecret()),
    token_type: 'Bearer',
    expires_in: tokenRaw[0].tokenExpiresIn
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
