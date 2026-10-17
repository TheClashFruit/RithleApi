import { randomBytes, timingSafeEqual } from 'node:crypto';

import { acquireToken } from '../../util/modrinth';

import type { APIRoute } from 'astro';
import { encrypt, getTokenSecret } from '../../util/crypto';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');
  const cookie = cookies.get('oauth_nonce')?.value;

  // stupid insecure ways just to make it backwards compatible
  // this should be removed once all active user actions report a version
  let state: { action: string; nonce: string } | undefined = undefined;
  if (code && rawState && rawState.startsWith('app:'))
    state = { action: rawState, nonce: '' };
  else if (!code || !rawState || !cookie)
    return new Response('Bad request.', { status: 400 });

  if (!state && cookie) {
    try {
      state = JSON.parse(Buffer.from(rawState, 'base64').toString());
    } catch {
      return new Response('Bad state.', { status: 400 });
    }

    const a = Buffer.from(state!.nonce ?? '');
    const b = Buffer.from(cookie);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      return new Response('State mismatch.', { status: 403 });
  }

  const tkn = await acquireToken(
    code,
    import.meta.env.REDIRECT || 'http://localhost:3000/oauth/callback'
  );
  if (!tkn) return new Response('Failed to acquire token.', { status: 500 });

  if (state!.action === 'web:auth') {
    cookies.set('rthl_session', tkn.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return redirect('/settings', 302);
  } else if (state!.action.startsWith('app:')) {
    const secureToken = encrypt(tkn.access_token, getTokenSecret());
    const secureTokenKey = randomBytes(32).toString('base64url');

    // TODO: SAVE TO DB

    return redirect(
      `rithle://oauth/callback?code=${secureTokenKey}&state=${state.action.replace('app:', '')}`,
      302
    );
  } else return new Response('Invalid action.', { status: 403 });
};
