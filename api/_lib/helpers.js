import { neon } from '@neondatabase/serverless';
import { SignJWT, jwtVerify } from 'jose';

// ── DB ──────────────────────────────────────────────────────
export function getDb(env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  return neon(env.DATABASE_URL);
}

// ── JWT con jose (edge-compatible) ──────────────────────────
function getSecret(env) {
  return new TextEncoder().encode(env.JWT_SECRET || 'secreto-dev-cambiame');
}

export async function signToken(payload, env) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret(env));
}

export async function getUser(request, env) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret(env));
    return payload;
  } catch { return null; }
}

// ── Password hashing con Web Crypto (nativo en Cloudflare) ──
const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  if (stored.startsWith('pbkdf2:')) {
    const [, saltHex, hashHex] = stored.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
      keyMaterial, 256
    );
    const newHash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return newHash === hashHex;
  }
  // Hashes bcrypt legados ($2a$, $2b$) — no soportados en edge sin librería
  return false;
}

// ── HTTP helpers ─────────────────────────────────────────────
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function cors204() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function parseBody(request) {
  try { return await request.json(); } catch { return {}; }
}
