import { randomBytes } from 'node:crypto';

export const buildAuthUri = (
  action: string,
  scopes: string[] = ['USER_READ']
): { uri: string; nonce: string } => {
  const uri = new URL('https://modrinth.com/auth/authorize');

  const nonce = randomBytes(16).toString('base64url');

  uri.searchParams.append('response_type', 'code');
  uri.searchParams.append('client_id', import.meta.env.CLIENT_ID!);
  uri.searchParams.append('redirect_uri', import.meta.env.REDIRECT!);
  uri.searchParams.append('scope', scopes.join(' '));
  uri.searchParams.append(
    'state',
    Buffer.from(JSON.stringify({ action, nonce })).toString('base64url')
  );

  return {
    uri: uri.toString(),
    nonce
  };
};

export const acquireToken = async (code: string, redirect: string) => {
  const response = await fetch(`https://api.modrinth.com/_internal/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': import.meta.env.CLIENT_SECRET || '',
      'User-Agent': 'RithleApi/2.0.0 (https://github.com/TheClashFruit/RithleApi)',
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: redirect,
      client_id: import.meta.env.CLIENT_ID || '',
      grant_type: 'authorization_code',
    }).toString()
  });

  if (response.status === 401) return null;

  return await response.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export const getUser = async (token: string) => {
  const response = await fetch('https://api.modrinth.com/v2/user', {
    headers: {
      Authorization: token,
      'User-Agent': 'RithleApi/2.0.0 (https://github.com/TheClashFruit/RithleApi)',
    },
  });

  if (!response.ok)
    throw new Error(`Failed to fetch Modrinth user: ${response.status}`);

  return response.json() as Promise<{ id: string; [key: string]: unknown }>;
}