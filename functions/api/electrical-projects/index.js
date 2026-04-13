import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS electrical_projects (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER,
      nombre     TEXT NOT NULL,
      cliente    TEXT,
      ubicacion  TEXT,
      tipo       TEXT DEFAULT 'residencial',
      temp_f     TEXT DEFAULT '1.0',
      sistema    TEXT DEFAULT '120',
      cargas     JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    await ensureTable(sql);

    if (request.method === 'GET') {
      const rows = await sql`
        SELECT id, user_id, nombre, cliente, ubicacion,
               tipo, temp_f, sistema, cargas,
               created_at AS "createdAt",
               updated_at AS "updatedAt"
        FROM electrical_projects
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC
      `;
      return json(rows);
    }

    if (request.method === 'POST') {
      const { nombre, cliente, ubicacion, tipo, temp_f, sistema, cargas } = await parseBody(request);
      if (!nombre?.trim()) return json({ error: 'El nombre es requerido' }, 400);
      const rows = await sql`
        INSERT INTO electrical_projects
          (user_id, nombre, cliente, ubicacion, tipo, temp_f, sistema, cargas)
        VALUES (
          ${user.id},
          ${nombre.trim()},
          ${cliente?.trim() || null},
          ${ubicacion?.trim() || null},
          ${tipo || 'residencial'},
          ${temp_f || '1.0'},
          ${sistema || '120'},
          ${JSON.stringify(cargas || [])}
        )
        RETURNING
          id, user_id, nombre, cliente, ubicacion, tipo, temp_f, sistema, cargas,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      return json(rows[0]);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const { nombre, cliente, ubicacion, tipo, temp_f, sistema, cargas } = await parseBody(request);
      if (!nombre?.trim()) return json({ error: 'El nombre es requerido' }, 400);
      const check = await sql`SELECT id FROM electrical_projects WHERE id=${parseInt(id)} AND user_id=${user.id}`;
      if (!check.length) return json({ error: 'Proyecto no encontrado' }, 404);
      const rows = await sql`
        UPDATE electrical_projects SET
          nombre    = ${nombre.trim()},
          cliente   = ${cliente?.trim() || null},
          ubicacion = ${ubicacion?.trim() || null},
          tipo      = ${tipo || 'residencial'},
          temp_f    = ${temp_f || '1.0'},
          sistema   = ${sistema || '120'},
          cargas    = ${JSON.stringify(cargas || [])},
          updated_at = NOW()
        WHERE id = ${parseInt(id)} AND user_id = ${user.id}
        RETURNING
          id, user_id, nombre, cliente, ubicacion, tipo, temp_f, sistema, cargas,
          created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      return json(rows[0]);
    }

    if (request.method === 'DELETE') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const check = await sql`SELECT id FROM electrical_projects WHERE id=${parseInt(id)} AND user_id=${user.id}`;
      if (!check.length) return json({ error: 'Proyecto no encontrado' }, 404);
      await sql`DELETE FROM electrical_projects WHERE id=${parseInt(id)} AND user_id=${user.id}`;
      return json({ deleted: true, id });
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (e) {
    console.error('[electrical-projects] ERROR:', e.message);
    return json({ error: `Error interno: ${e.message}` }, 500);
  }
}
