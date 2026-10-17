import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const getTokenSecret = () => {
  const key = Buffer.from(import.meta.env.TOKEN_SECRET ?? '', 'hex');
  if (key.length !== 32)
    throw new Error('`TOKEN_SECRET` must be 32 bytes (hex).');

  return key;
}

export const encrypt = (text: string, secret: Buffer<ArrayBuffer>): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, enc]).toString('base64url');
};

export const decrypt = (payload: string, secret: Buffer<ArrayBuffer>): string => {
  const buf = Buffer.from(payload, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);

  const decipher = createDecipheriv('aes-256-gcm', secret, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
};