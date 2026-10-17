import { buildAuthUri } from '../../util/modrinth';

import type { APIRoute } from 'astro';

export const prerender = false;

const allowedActions = ['web:auth', 'app:'];

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const action = url.searchParams.get('action') ?? 'auth:web';
  if (!allowedActions.map(a => action.startsWith(a)))
    return new Response('Invalid action.', { status: 400 });

  const { uri, nonce } = buildAuthUri(action);

  cookies.set('oauth_nonce', nonce, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return redirect(uri, 302);
}