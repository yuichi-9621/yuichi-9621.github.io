#!/usr/bin/env node
// traffic-snapshot.mjs — pull GoatCounter stats and emit an encrypted blob.
//
// Runs in GitHub Actions on a cron (see .github/workflows/traffic-snapshot.yml).
// The GoatCounter API sends no CORS headers, so the browser can't call it
// directly; instead this snapshots the numbers server-side and encrypts them
// with AES-256-GCM. The ciphertext is published to the `traffic-data` branch,
// where the site's hidden `traffic` terminal command fetches and decrypts it
// client-side. Only the passphrase holder (the owner) can read it.
//
// env: GC_API_TOKEN        GoatCounter API token (read statistics)
//      TRAFFIC_PASSPHRASE  encryption passphrase (same one typed on the site)

import { writeFileSync } from 'node:fs';

const HOST = 'https://yuichiokuhama.goatcounter.com';
const TOKEN = process.env.GC_API_TOKEN;
const PASS = process.env.TRAFFIC_PASSPHRASE;
if (!TOKEN || !PASS) {
  console.error('missing GC_API_TOKEN or TRAFFIC_PASSPHRASE');
  process.exit(1);
}

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400_000);

async function gc(path, params) {
  const url = new URL(`${HOST}/api/v0${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

async function range(days) {
  const params = { start: iso(daysAgo(days)), end: iso(new Date()) };
  const [total, hits, refs] = await Promise.all([
    gc('/stats/total', params),
    gc('/stats/hits', { ...params, limit: 20 }),
    gc('/stats/toprefs', { ...params, limit: 8 }).catch(() => ({ stats: [] })),
  ]);
  const rows = (hits.hits ?? []).map((h) => ({
    path: h.path ?? '?',
    count: h.count ?? 0,
    event: !!h.event,
  }));
  return {
    total: total.total ?? rows.filter((r) => !r.event).reduce((a, r) => a + r.count, 0),
    pages: rows.filter((r) => !r.event).slice(0, 10).map((r) => [r.path, r.count]),
    events: rows.filter((r) => r.event).slice(0, 10).map((r) => [r.path, r.count]),
    refs: (refs.stats ?? []).map((s) => [s.name ?? s.path ?? s.id ?? '(direct)', s.count ?? 0]),
  };
}

async function encrypt(json, pass) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
  );
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(json))));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt); out.set(iv, 16); out.set(ct, 28);
  return Buffer.from(out).toString('base64');
}

const snapshot = {
  generated: new Date().toISOString(),
  ranges: { '7d': await range(7), '30d': await range(30) },
};
writeFileSync('traffic.enc', await encrypt(snapshot, PASS));
console.log(`traffic.enc written (${snapshot.ranges['7d'].total} views/7d, ${snapshot.ranges['30d'].total} views/30d)`);
