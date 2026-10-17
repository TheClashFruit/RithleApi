export const prerender = false;

import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(import.meta.env.DATABASE_URL!);

// :3
// Override default toString()s to return stuff in a 'better' way.
(Date.prototype as any).toJSON = function () {
  return this.toISOString();
};

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export default db;
