import { getDb, hashPassword, json, cors204 } from '../_lib/helpers.js';

// Endpoint para resetear contraseña de un usuario dado su email
// POST /api/auth/reset-password  { email, nueva_password, admin_secret }
export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { email, nueva_password, admin_secret } = await request.json().catch(() => ({}));

    // Protección simple con un secreto de admin
    const secret = env.ADMIN_SECRET || 'reset-secreto-123';
    if (admin_secret !== secret) return json({ error: 'No autorizado' }, 401);

    if (!email || !nueva_password) return json({ error: 'email y nueva_password requeridos' }, 400);
    if (nueva_password.length < 6) return json({ error: 'Mínimo 6 caracteres' }, 400);

    const sql = getDb(env);
    const hash = await hashPassword(nueva_password);
    const r = await sql`UPDATE usuarios SET password_hash=${hash} WHERE email=${email.toLowerCase()} RETURNING id, nombre, email`;
    if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);

    return json({ ok: true, usuario: r[0] });
  } catch (err) {
    return json({ error: `Error: ${err.message}` }, 500);
  }
}
