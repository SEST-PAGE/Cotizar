import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export function getDb(env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  return neon(env.DATABASE_URL);
}

export function getUser(request, env) {
  try {
    const auth = request.headers.get('authorization') || '';
    return jwt.verify(auth.replace('Bearer ', ''), env.JWT_SECRET || 'secreto-dev');
  } catch { return null; }
}

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
