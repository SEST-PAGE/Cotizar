import { getDb, signToken, verifyPassword, json, cors204 } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) return json({ error: 'Email y contraseña requeridos' }, 400);

    const sql = getDb(env);
    try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos VARCHAR(20) DEFAULT 'vendedor'`; } catch (e) {}

    const users = await sql`SELECT id,nombre,email,password_hash,rol,permisos FROM usuarios WHERE email=${email.toLowerCase()} AND activo=true`;
    if (!users.length) return json({ error: 'Credenciales incorrectas' }, 401);

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: 'Credenciales incorrectas' }, 401);

    const permisos = user.permisos || 'vendedor';
    const token = await signToken(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, permisos },
      env
    );
    return json({ token, usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos } });
  } catch (err) {
    console.error(err);
    return json({ error: 'Error interno' }, 500);
  }
}
