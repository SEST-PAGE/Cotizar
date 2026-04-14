import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);

  // Ensure extra columns exist (run once, ignore errors)
  await Promise.allSettled([
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos VARCHAR(20) DEFAULT 'vendedor'`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_datos BOOLEAN DEFAULT false`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_cotizaciones BOOLEAN DEFAULT false`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_clientes BOOLEAN DEFAULT false`,
    sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_con JSONB DEFAULT '[]'`,
  ]);

  const dbUser = await sql`SELECT rol, permisos FROM usuarios WHERE id=${user.id} AND activo=true`;
  if (!dbUser.length) return json({ error: 'Usuario no encontrado' }, 401);

  const isPrincipalAdmin = dbUser[0].rol === 'admin';

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const todos = url.searchParams.get('todos');

  try {
    if (request.method === 'GET') {
      if (todos === '1') {
        const rows = await sql`
          SELECT id, nombre, email, rol,
                 COALESCE(permisos,'vendedor') as permisos,
                 COALESCE(compartir_datos,false) as compartir_datos,
                 COALESCE(compartir_cotizaciones,false) as compartir_cotizaciones,
                 COALESCE(compartir_clientes,false) as compartir_clientes,
                 COALESCE(compartir_con,'[]'::jsonb) as compartir_con,
                 activo
          FROM usuarios WHERE activo=true ORDER BY nombre ASC`;
        return json(rows);
      }
      if (!isPrincipalAdmin) return json({ error: 'Solo el administrador principal puede gestionar usuarios' }, 403);
      const rows = await sql`
        SELECT id, nombre, email, rol,
               COALESCE(permisos,'vendedor') as permisos,
               COALESCE(compartir_datos,false) as compartir_datos,
               COALESCE(compartir_cotizaciones,false) as compartir_cotizaciones,
               COALESCE(compartir_clientes,false) as compartir_clientes,
               COALESCE(compartir_con,'[]'::jsonb) as compartir_con,
               activo, creado_en
        FROM usuarios ORDER BY creado_en ASC`;
      return json(rows);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const targetId = parseInt(id);
      const { rol, permisos, compartir_datos, compartir_cotizaciones, compartir_clientes, compartir_con } = await parseBody(request);

      if (targetId === user.id && (compartir_datos !== undefined || compartir_cotizaciones !== undefined || compartir_clientes !== undefined || compartir_con !== undefined)) {
        const newCots = compartir_cotizaciones !== undefined ? !!compartir_cotizaciones : null;
        const newClis = compartir_clientes !== undefined ? !!compartir_clientes : null;
        const newLegacy = compartir_datos !== undefined ? !!compartir_datos : null;
        const newCon = compartir_con !== undefined ? JSON.stringify(Array.isArray(compartir_con) ? compartir_con : []) : null;

        const r = await sql`
          UPDATE usuarios SET
            compartir_datos        = COALESCE(${newLegacy}, compartir_datos),
            compartir_cotizaciones = COALESCE(${newCots}, compartir_cotizaciones),
            compartir_clientes     = COALESCE(${newClis}, compartir_clientes),
            compartir_con          = COALESCE(${newCon !== null ? newCon : null}::jsonb, compartir_con)
          WHERE id=${targetId}
          RETURNING id, nombre, email, rol,
                    COALESCE(permisos,'vendedor') as permisos,
                    COALESCE(compartir_datos,false) as compartir_datos,
                    COALESCE(compartir_cotizaciones,false) as compartir_cotizaciones,
                    COALESCE(compartir_clientes,false) as compartir_clientes,
                    COALESCE(compartir_con,'[]'::jsonb) as compartir_con,
                    activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }

      if (!isPrincipalAdmin) return json({ error: 'Solo el administrador principal puede cambiar roles' }, 403);
      if (targetId === user.id) return json({ error: 'No puedes modificar tu propio rol' }, 400);

      if (permisos !== undefined) {
        if (!['admin', 'vendedor'].includes(permisos)) return json({ error: 'Permiso inválido' }, 400);
        const r = await sql`UPDATE usuarios SET permisos=${permisos} WHERE id=${targetId} RETURNING id, nombre, email, rol, COALESCE(permisos,'vendedor') as permisos, activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }
      if (rol !== undefined) {
        if (!['admin', 'vendedor'].includes(rol)) return json({ error: 'Rol inválido' }, 400);
        const r = await sql`UPDATE usuarios SET rol=${rol} WHERE id=${targetId} RETURNING id, nombre, email, rol, COALESCE(permisos,'vendedor') as permisos, activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }
      return json({ error: 'Nada que actualizar' }, 400);
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error('[users]', err);
    return json({ error: err.message }, 500);
  }
}
