import { DatabaseSync } from "node:sqlite";

export async function token(code: string, redirect: string) {
  const response = await fetch(`https://api.modrinth.com/_internal/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': process.env.CLIENT_SECRET || '',
      'User-Agent': 'RithleApi/1.0.0 (https://github.com/TheClashFruit/RithleApi)',
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: redirect,
      client_id: process.env.CLIENT_ID || '',
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (response.status === 401) return null;

  return await response.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export async function getModrinthUserFromToken(accessToken: string) {
  const response = await fetch('https://api.modrinth.com/v2/user', {
    headers: {
      Authorization: accessToken,
      'User-Agent': 'RithleApi/1.0.0 (https://github.com/TheClashFruit/RithleApi)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Modrinth user: ${response.status}`);
  }

  return response.json() as Promise<{ id: string; [key: string]: unknown }>;
}

export async function getModrinthUser(id: string) {
  const response = await fetch(`https://api.modrinth.com/v2/user/${id}`, {
    headers: {
      'User-Agent': 'RithleApi/1.0.0 (https://github.com/TheClashFruit/RithleApi)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Modrinth user: ${response.status}`);
  }

  return response.json() as Promise<{ id: string; [key: string]: unknown }>;
}

export function upsertUser(db: DatabaseSync, userId: string) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, hasDonated, created, lastLogin)
    VALUES (?, 0, ?, ?)
    ON CONFLICT(id) DO UPDATE SET lastLogin = excluded.lastLogin
  `);

  stmt.run(userId, now, now);
}