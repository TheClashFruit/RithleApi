import { bigint } from 'drizzle-orm/pg-core';

export const snowflake = (name?: string) => {
  return name !== undefined
    ? bigint(name, { mode: 'bigint' })
    : bigint({ mode: 'bigint' });
};