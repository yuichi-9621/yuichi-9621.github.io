// Encrypts the resume PDF so the site can serve it behind a code.
// Usage: RESUME_CODE=... node tools/lock-resume.mjs <resume.pdf> public/resume.bin
// Output: 16 byte salt, 12 byte iv, then AES-GCM ciphertext. src/resume.js reverses it.
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as c } from 'node:crypto';

const [, , inPath, outPath] = process.argv;
const code = (process.env.RESUME_CODE || '').trim().toLowerCase();
if (!inPath || !outPath || !code) throw new Error('usage: RESUME_CODE=... node tools/lock-resume.mjs <in.pdf> <out.bin>');

const ITER = 600000;
const salt = c.getRandomValues(new Uint8Array(16));
const iv = c.getRandomValues(new Uint8Array(12));
const base = await c.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
const key = await c.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await c.subtle.encrypt({ name: 'AES-GCM', iv }, key, readFileSync(inPath)));
writeFileSync(outPath, Buffer.concat([salt, iv, data]));
