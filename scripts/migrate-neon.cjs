/**
 * Run Payload + Drizzle migrations against Neon using DATABASE_URL from .env.local.
 * Node CLI does not load .env.local automatically — this fixes "relation does not exist" when
 * users ran `drizzle-kit migrate` without DATABASE_URL set.
 *
 * Usage:
 *   node scripts/migrate-neon.cjs           # payload + drizzle
 *   node scripts/migrate-neon.cjs payload # payload only
 *   node scripts/migrate-neon.cjs drizzle # drizzle only
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    console.error(
      '[migrate-neon] Missing .env.local in repo root.\n' +
        '  Copy .env.example → .env.local and set DATABASE_URL (Neon connection string).'
    );
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const mode = (process.argv[2] || 'all').toLowerCase();
const runPayload = mode === 'all' || mode === 'payload';
const runDrizzle = mode === 'all' || mode === 'drizzle';

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error('[migrate-neon] DATABASE_URL is not set in .env.local.');
  process.exit(1);
}

if (runPayload) {
  console.log('\n[migrate-neon] → npx payload migrate\n');
  execSync('npx payload migrate', { stdio: 'inherit', cwd: root, env: process.env });
}

if (runDrizzle) {
  console.log('\n[migrate-neon] → npx drizzle-kit migrate\n');
  execSync('npx drizzle-kit migrate', { stdio: 'inherit', cwd: root, env: process.env });
}

console.log('\n[migrate-neon] Done.\n');
