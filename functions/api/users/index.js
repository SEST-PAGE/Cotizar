import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos VARCHAR(20) DEFAULT 'vendedor'`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_datos BOOLEAN DEFAULT false`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_cotizaciones BOOLEAN DEFAULT false`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_clientes BOOLEAN DEFAULT false`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_con JSONB DEFAULT '[]'`; } catch (e) {}

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
          SELECT id, nombre, email, rol, permisos,
                 compartir_datos, compartir_cotizaciones, compartir_clientes,
                 compartir_con, activo
          FROM usuarios WHERE activo=true ORDER BY nombre ASC`;
        return json(rows);
      }
      if (!isPrincipalAdmin) return json({ error: 'Solo el administrador principal puede gestionar usuarios' }, 403);
      const rows = await sql`
        SELECT id, nombre, email, rol, permisos,
               compartir_datos, compartir_cotizaciones, compartir_clientes,
               compartir_con, activo, creado_en
        FROM usuarios ORDER BY creado_en ASC`;
      return json(rows);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const targetId = parseInt(id);
      const { rol, permisos, compartir_datos, compartir_cotizaciones, compartir_clientes, compartir_con } = await parseBody(request);

      if (
        targetId === user.id &&
        (compartir_datos !== undefined || compartir_cotizaciones !== undefined || compartir_clientes !== undefined || compartir_con !== undefined)
      ) {
        const newCots = compartir_cotizaciones !== undefined ? !!compartir_cotizaciones : undefined;
        const newClis = compartir_clientes !== undefined ? !!compartir_clientes : undefined;
        const newLegacy = compartir_datos !== undefined ? !!compartir_datos : (newCots !== undefined || newClis !== undefined ? (newCots || newClis) : undefined);
        const newCon = compartir_con !== undefined ? JSON.stringify(Array.isArray(compartir_con) ? compartir_con : []) : undefined;

        const r = await sql`
          UPDATE usuarios SET
            compartir_datos        = COALESCE(${newLegacy ?? null}, compartir_datos),
            compartir_cotizaciones = COALESCE(${newCots ?? null}, compartir_cotizaciones),
            compartir_clientes     = COALESCE(${newClis ?? null}, compartir_clientes),
            compartir_con          = COALESCE(${newCon !== undefined ? newCon : null}::jsonb, compartir_con)
          WHERE id=${targetId}
          RETURNING id, nombre, email, rol, permisos,
                    compartir_datos, compartir_cotizaciones, compartir_clientes, compartir_con, activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }

      if (!isPrincipalAdmin) return json({ error: 'Solo el administrador principal puede cambiar roles y permisos' }, 403);
      if (targetId === user.id) return json({ error: 'No puedes modificar tu propio rol/permiso' }, 400);

      if (permisos !== undefined) {
        if (!['admin', 'vendedor'].includes(permisos)) return json({ error: 'Permiso inválido' }, 400);
        const r = await sql`UPDATE usuarios SET permisos=${permisos} WHERE id=${targetId} RETURNING id, nombre, email, rol, permisos, compartir_datos, activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }
      if (rol !== undefined) {
        if (!['admin', 'vendedor'].includes(rol)) return json({ error: 'Rol inválido' }, 400);
        const r = await sql`UPDATE usuarios SET rol=${rol} WHERE id=${targetId} RETURNING id, nombre, email, rol, permisos, compartir_datos, activo`;
        if (!r.length) return json({ error: 'Usuario no encontrado' }, 404);
        return json(r[0]);
      }
      return json({ error: 'Nada que actualizar' }, 400);
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}
