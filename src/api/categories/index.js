import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = await getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);

  try {
    if (request.method === 'GET') {
      const rows = await sql`SELECT * FROM categorias ORDER BY nombre ASC`;
      return json(rows);
    }

    if (request.method === 'POST') {
      const isAdmin = user.rol === 'admin' || user.permisos === 'admin';
      if (!isAdmin) return json({ error: 'Solo administradores pueden crear categorías' }, 403);
      const { nombre, descripcion = '' } = await parseBody(request);
      if (!nombre) return json({ error: 'El nombre es requerido' }, 400);
      const exists = await sql`SELECT id FROM categorias WHERE nombre=${nombre.trim()}`;
      if (exists.length) return json({ error: 'Ya existe una categoría con ese nombre' }, 400);
      const r = await sql`INSERT INTO categorias(nombre,descripcion) VALUES(${nombre.trim()},${descripcion}) RETURNING *`;
      return json(r[0], 201);
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error('[categories]', err);
    return json({ error: err.message }, 500);
  }
}
