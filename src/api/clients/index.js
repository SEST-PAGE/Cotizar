import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);
  await Promise.allSettled([
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_datos BOOLEAN DEFAULT false`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_clientes BOOLEAN DEFAULT false`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_con JSONB DEFAULT '[]'`,
  ]);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const equipo = url.searchParams.get('equipo');

  try {
    if (request.method === 'GET') {
      if (equipo === '1') {
        const rows = await sql`
          SELECT c.*, u.nombre AS usuario_nombre
          FROM clientes c JOIN usuarios u ON c.usuario_id=u.id
          WHERE u.id != ${user.id}
            AND (COALESCE(u.compartir_clientes,false)=true OR COALESCE(u.compartir_datos,false)=true)
            AND (
              jsonb_array_length(COALESCE(u.compartir_con,'[]'::jsonb)) = 0
              OR u.compartir_con @> ${JSON.stringify([user.id])}::jsonb
            )
          ORDER BY c.nombre ASC LIMIT 500`;
        return json(rows);
      }
      const rows = await sql`SELECT * FROM clientes WHERE usuario_id=${user.id} ORDER BY nombre ASC LIMIT 500`;
      return json(rows);
    }

    if (request.method === 'POST') {
      const { nombre, empresa, email, telefono, direccion, ruc_cedula, notas } = await parseBody(request);
      if (!nombre) return json({ error: 'El nombre es requerido' }, 400);
      const r = await sql`INSERT INTO clientes(nombre,empresa,email,telefono,direccion,ruc_cedula,notas,usuario_id) VALUES(${nombre},${empresa||''},${email||''},${telefono||''},${direccion||''},${ruc_cedula||''},${notas||''},${user.id}) RETURNING *`;
      return json(r[0], 201);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const { nombre, empresa, email, telefono, direccion, ruc_cedula, notas } = await parseBody(request);
      if (!nombre) return json({ error: 'Nombre requerido' }, 400);
      const own = await sql`SELECT id FROM clientes WHERE id=${parseInt(id)} AND usuario_id=${user.id}`;
      if (!own.length) return json({ error: 'No tienes permiso' }, 403);
      const r = await sql`UPDATE clientes SET nombre=${nombre},empresa=${empresa||''},email=${email||''},telefono=${telefono||''},direccion=${direccion||''},ruc_cedula=${ruc_cedula||''},notas=${notas||''} WHERE id=${parseInt(id)} AND usuario_id=${user.id} RETURNING *`;
      return json(r[0]);
    }

    if (request.method === 'DELETE') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const own = await sql`SELECT id FROM clientes WHERE id=${parseInt(id)} AND usuario_id=${user.id}`;
      if (!own.length) return json({ error: 'No tienes permiso' }, 403);
      await sql`DELETE FROM clientes WHERE id=${parseInt(id)} AND usuario_id=${user.id}`;
      return json({ success: true });
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error('[clients]', err);
    return json({ error: err.message }, 500);
  }
}
