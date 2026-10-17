import {
  text,
  pgTable,
  varchar,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  boolean
} from 'drizzle-orm/pg-core';

import { snowflake } from './types';
import snowflakeGenerator from '../util/snowflake';
import type { AnalyticsData } from '../util/analytics';

export type UserSettings = UserSettingsV1;
interface UserSettingsV1 {
  version: 1;
  analytics: {
    crashLogs: boolean;
    usage: boolean;
  };
  badges: boolean;
}

export const versionTypeEnum = pgEnum('version_type', [
  'stable',
  'beta',
  'alpha',
  'dev'
]);

export const usersTable = pgTable('users', {
  id: snowflake()
    .primaryKey()
    .$defaultFn(() => snowflakeGenerator.nextId()),

  modrinthId: varchar({ length: 8 }).unique().notNull(),

  settings: jsonb()
    .$type<UserSettings>()
    .default({
      version: 1,
      analytics: {
        crashLogs: true,
        usage: false
      },
      badges: true
    })
    .notNull(),

  supporter: boolean().default(false).notNull(),

  lastLoginAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

  createdAt: timestamp({ withTimezone: true }), // only present if the account was created before the pgsql migration
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
});

export const tokensTable = pgTable('tokens', {
  id: snowflake()
    .primaryKey()
    .$defaultFn(() => snowflakeGenerator.nextId()),

  key: varchar({ length: 64 }).unique().notNull(),
  token: text().notNull(),

  tokenExpiresIn: integer().notNull(),

  expiresAt: timestamp({ withTimezone: true }).notNull()
});

export const analyticsTable = pgTable('analytics', {
  id: snowflake()
    .primaryKey()
    .$defaultFn(() => snowflakeGenerator.nextId()),

  data: jsonb().$type<AnalyticsData>().notNull()
});

export const versionsTable = pgTable('versions', {
  id: snowflake()
    .primaryKey()
    .$defaultFn(() => snowflakeGenerator.nextId()),

  name: varchar({ length: 24 }).unique().notNull(),
  code: integer().unique().notNull(),

  type: versionTypeEnum().notNull().default('stable'),

  changelog: text().notNull()
});
