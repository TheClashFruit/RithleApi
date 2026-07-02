import 'dotenv/config';

import { unified } from 'unified';

import express from 'express';
import cors from 'cors';

import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import matter from 'gray-matter';

import * as z from 'zod';

import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { getModrinthUserFromToken, token, upsertUser } from './utils';
import remarkFillVariables from './varplugin';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'db.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    hasDonated INTEGER,
    created TEXT,
    lastLogin TEXT
  ) STRICT
`);

const tokenMap = new Map();

const PORT = parseInt(process.env.PORT!) || 3000;

const app = express();

app.use(
  cors({
    maxAge: 86400
  })
);

// Delete inactive accounts
setInterval(() => {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    
    const deleteStmt = db.prepare(`
      DELETE FROM users 
      WHERE lastLogin < ? AND hasDonated = 0
    `);
    
    deleteStmt.run(oneYearAgo);
  } catch (err) {
    console.error('Failed to delete inactive accounts:', err);
  }
}, 1 * 60 * 60 * 1000);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', async (req, res) => {
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const totalResult = totalStmt.get() as { count: number };

  const activeStmt = db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE lastLogin >= ?
  `);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const activeResult = activeStmt.get(ninetyDaysAgo) as { count: number };

  const md = unified()
    .use(remarkParse)
    .use(remarkFillVariables, { variables: { totalUsers: totalResult.count, activeUsers: activeResult.count } })
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const raw = fs.readFileSync(path.join(__dirname, 'pages', 'index.md'), 'utf8');

  const { data, content } = matter(raw);
  const output = await md.process(content);
  
  res.render('main', {
    page: {
      ...data,
      content: output,
      extra: {
        totalUsers: totalResult.count,
        activeUsers: activeResult.count
      }
    },
  });
});

app.get('/privacy', async (req, res) => {
  const md = unified()
    .use(remarkParse)
    .use(remarkFillVariables, { variables: { } })
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const raw = fs.readFileSync(path.join(__dirname, 'pages', 'privacy.md'), 'utf8');

  const { data, content } = matter(raw);
  const output = await md.process(content);

  res.render('main', {
    page: {
      ...data,
      content: output,
      extra: {}
    }
  });
});

app.get('/opt-out', async (req, res) => {
  const uri = new URL('https://modrinth.com/auth/authorize');

  uri.searchParams.append('response_type', 'code');
  uri.searchParams.append('client_id', process.env.CLIENT_ID!);
  uri.searchParams.append('redirect_uri', process.env.REDIRECT!);
  uri.searchParams.append('scope', 'USER_READ');
  uri.searchParams.append('state', 'web:delete');

  const md = unified()
    .use(remarkParse)
    .use(remarkFillVariables, { variables: { uri } })
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true });

  const raw = fs.readFileSync(path.join(__dirname, 'pages', 'opt-out.md'), 'utf8');

  const { data, content } = matter(raw);
  const output = await md.process(req.query.success !== undefined ? '<font style="color: green;">Successfully deleted account data.</font>' : (req.query.error !== undefined ? '<font style="color: red;">Failed to delete account data, please try again.</font>\n\n' + content : content));

  res.render('main', {
    page: {
      ...data,
      content: output,
      extra: {}
    }
  });
});

const callbackQuery = z.object({
  code: z.string(),
  state: z.string(),
}); 

app.get('/oauth/callback', async (req, res) => {
  const { code, state } = callbackQuery.parse(req.query);
   
  if (state.startsWith('app:')) {
    const c = crypto.randomBytes(32)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 32);

    const tkn = await token(code, process.env.REDIRECT || 'http://localhost:3000/oauth/callback');
    if (tkn) {
      tokenMap.set(c, tkn)

      const modrinthUser = await getModrinthUserFromToken(`${tkn.token_type} ${tkn.access_token}`);
      upsertUser(db, modrinthUser.id);
      
      res.redirect(`rithle://oauth/callback?code=${c}&state=${state.replace('app:', '')}`)
    } else {
      res.status(401).send({ error: 'Unautorized' })
    }
  } else if (state.startsWith('web:')) {
    const splat = state.split(':');

    if (splat[1].toLocaleLowerCase() === 'delete') {
      try {
        const tkn = await token(code, process.env.REDIRECT || 'http://localhost:3000/oauth/callback');

        if (!tkn) {
          return res.redirect('/opt-out?error');
        }

        const modrinthUser = await getModrinthUserFromToken(`${tkn.token_type} ${tkn.access_token}`);

        const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = deleteStmt.run(modrinthUser.id);

        if (result.changes === 0) {
          return res.redirect('/opt-out?error');
        }

        res.redirect('/opt-out?success');
      } catch (err) {
        res.redirect('/opt-out?error');
      }
    } else {
      res.status(400).send({ error: 'Bad Request' });
    }
  } else
    res.status(401).send({ error: 'Unautorized' })
});

const tokenBody = z.object({
  code: z.string()
}); 

app.post('/oauth/token', (req, res) => {
  if (!(/^Rithle\/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))? \(https:\/\/github\.com\/TheClashFruit\/Rithle\)$/.test(req.header('user-agent') || '')))
    return res.status(401).send({ error: 'Unautorized' });
  
  const { code } = tokenBody.parse(req.body);
  
  const token = tokenMap.get(code);
  tokenMap.delete(code);

  if (token) {
    res.json(token);
  } else {
    res.status(404).json({ error: 'Token not found.' });
  }
});

app.get('/user/:id', (req, res) => {
  const stmt = db.prepare('SELECT created, hasDonated FROM users WHERE id = ?');
  const user = stmt.get(req.params.id) as { created: string; hasDonated: number } | undefined;

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    created: user.created,
    donated: Boolean(user.hasDonated),
  });
});

app.post('/analytics/login', async (req, res) => {
  const authHeader = req.header('authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const modrinthUser = await getModrinthUserFromToken(authHeader);

    const stmt = db.prepare('UPDATE users SET lastLogin = ? WHERE id = ?');
    const result = stmt.run(new Date().toISOString(), modrinthUser.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update lastLogin:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.listen(PORT, () => {
  console.log('○ Port:', PORT);
});