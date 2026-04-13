import { getDb, signToken, hashPassword, json, cors204 } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { nombre, email, password, rol = 'vendedor' } = await request.json().catch(() => ({}));
    if (!nombre || !email || !password) return json({ error: 'Todos los campos son requeridos' }, 400);
    if (password.length < 6) return json({ error: 'Contraseña mínimo 6 caracteres' }, 400);

    const sql = getDb(env);
    const emailLow = email.toLowerCase();
    const exists = await sql`SELECT id FROM usuarios WHERE email=${emailLow}`;
    if (exists.length) return json({ error: 'El email ya está registrado' }, 400);

    const hash = await hashPassword(password);
    const result = await sql`INSERT INTO usuarios(nombre,email,password_hash,rol) VALUES(${nombre},${emailLow},${hash},${rol}) RETURNING id,nombre,email,rol`;
    const user = result[0];
    const token = await signToken(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      env
    );
    return json({ token, usuario: user }, 201);
  } catch (err) {
    console.error(err);
    return json({ error: 'Error interno' }, 500);
  }
}
