import { getDb, signToken, verifyPassword, json, cors204 } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) return json({ error: 'Email y contraseña requeridos' }, 400);
    if (!env.DATABASE_URL) return json({ error: 'DATABASE_URL no configurada' }, 500);

    const sql = getDb(env);
    await Promise.allSettled([
      sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos VARCHAR(20) DEFAULT 'vendedor'`,
    ]);

    const users = await sql`
      SELECT id,nombre,email,password_hash,rol,COALESCE(permisos,'vendedor') as permisos
      FROM usuarios WHERE email=${email.toLowerCase()} AND activo=true`;
    if (!users.length) return json({ error: 'Credenciales incorrectas' }, 401);

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      if (user.password_hash?.startsWith('$2')) {
        return json({ error: 'Contraseña en formato antiguo. Usa el endpoint /api/auth/reset-password para resetearla.' }, 401);
      }
      return json({ error: 'Credenciales incorrectas' }, 401);
    }

    const token = await signToken(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, permisos: user.permisos },
      env
    );
    return json({ token, usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos: user.permisos } });
  } catch (err) {
    console.error('[login]', err);
    return json({ error: `Error interno: ${err.message}` }, 500);
  }
}
