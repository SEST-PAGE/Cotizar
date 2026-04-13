import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

function numCot() {
  const d = new Date();
  return `COT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_datos BOOLEAN DEFAULT false`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_cotizaciones BOOLEAN DEFAULT false`; } catch (e) {}
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS compartir_con JSONB DEFAULT '[]'`; } catch (e) {}

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const equipo = url.searchParams.get('equipo');

  try {
    if (request.method === 'GET') {
      if (equipo === '1') {
        const rows = await sql`
          SELECT c.id,c.numero,c.titulo,c.estado,c.total,c.subtotal,c.iva_valor,c.descuento_valor,c.creado_en,
            cl.nombre AS cliente_nombre, cl.empresa AS cliente_empresa,
            u.nombre AS usuario_nombre
          FROM cotizaciones c
          LEFT JOIN clientes cl ON c.cliente_id=cl.id
          JOIN usuarios u ON c.usuario_id=u.id
          WHERE u.id != ${user.id}
            AND (u.compartir_cotizaciones=true OR u.compartir_datos=true)
            AND (
              jsonb_array_length(COALESCE(u.compartir_con,'[]'::jsonb)) = 0
              OR u.compartir_con @> ${JSON.stringify([user.id])}::jsonb
            )
          ORDER BY c.creado_en DESC LIMIT 500`;
        return json(rows);
      }

      if (id) {
        const idInt = parseInt(id);
        const own = await sql`
          SELECT c.*,
            cl.nombre AS cliente_nombre, cl.empresa AS cliente_empresa,
            cl.email AS cliente_email, cl.telefono AS cliente_telefono,
            cl.ruc_cedula AS cliente_ruc, cl.direccion AS cliente_direccion,
            u.nombre AS usuario_nombre
          FROM cotizaciones c
          LEFT JOIN clientes cl ON c.cliente_id=cl.id
          LEFT JOIN usuarios u ON c.usuario_id=u.id
          WHERE c.id=${idInt} AND c.usuario_id=${user.id}`;
        if (own.length) {
          const items = await sql`
            SELECT ci.*, m.codigo, m.nombre AS material_nombre, m.unidad AS material_unidad
            FROM cotizacion_items ci LEFT JOIN materiales m ON ci.material_id=m.id
            WHERE ci.cotizacion_id=${idInt} ORDER BY ci.id`;
          return json({ ...own[0], items });
        }
        const shared = await sql`
          SELECT c.*,
            cl.nombre AS cliente_nombre, cl.empresa AS cliente_empresa,
            cl.email AS cliente_email, cl.telefono AS cliente_telefono,
            cl.ruc_cedula AS cliente_ruc, cl.direccion AS cliente_direccion,
            u.nombre AS usuario_nombre
          FROM cotizaciones c
          LEFT JOIN clientes cl ON c.cliente_id=cl.id
          JOIN usuarios u ON c.usuario_id=u.id
          WHERE c.id=${idInt}
            AND (u.compartir_cotizaciones=true OR u.compartir_datos=true)
            AND (
              jsonb_array_length(COALESCE(u.compartir_con,'[]'::jsonb)) = 0
              OR u.compartir_con @> ${JSON.stringify([user.id])}::jsonb
            )`;
        if (!shared.length) return json({ error: 'No encontrada' }, 404);
        const items = await sql`
          SELECT ci.*, m.codigo, m.nombre AS material_nombre, m.unidad AS material_unidad
          FROM cotizacion_items ci LEFT JOIN materiales m ON ci.material_id=m.id
          WHERE ci.cotizacion_id=${idInt} ORDER BY ci.id`;
        return json({ ...shared[0], items, _compartida: true });
      }

      const rows = await sql`
        SELECT c.id,c.numero,c.titulo,c.estado,c.total,c.subtotal,c.iva_valor,c.descuento_valor,c.creado_en,
          cl.nombre AS cliente_nombre, cl.empresa AS cliente_empresa
        FROM cotizaciones c
        LEFT JOIN clientes cl ON c.cliente_id=cl.id
        WHERE c.usuario_id=${user.id}
        ORDER BY c.creado_en DESC LIMIT 500`;
      return json(rows);
    }

    if (request.method === 'POST') {
      const { cliente_id, titulo, descripcion = '', items = [], descuento_pct = 0, iva_pct = 15, notas = '', validez_dias = 30 } = await parseBody(request);
      if (!titulo) return json({ error: 'El título es requerido' }, 400);
      const sub = items.reduce((s, i) => s + i.cantidad * i.precio_unitario * (1 - (i.descuento_pct || 0) / 100), 0);
      const dv = sub * (descuento_pct / 100);
      const base = sub - dv;
      const iv = base * (iva_pct / 100);
      const total = base + iv;
      const num = numCot();
      const cliId = cliente_id ? parseInt(cliente_id) : null;
      const cot = await sql`
        INSERT INTO cotizaciones(numero,cliente_id,usuario_id,titulo,descripcion,estado,subtotal,descuento_pct,descuento_valor,iva_pct,iva_valor,total,notas,validez_dias)
        VALUES(${num},${cliId},${user.id},${titulo},${descripcion},'borrador',${sub},${descuento_pct},${dv},${iva_pct},${iv},${total},${notas},${validez_dias})
        RETURNING *`;
      for (const item of items) {
        await sql`INSERT INTO cotizacion_items(cotizacion_id,material_id,descripcion,cantidad,unidad,precio_unitario,descuento_pct) VALUES(${cot[0].id},${item.material_id||null},${item.descripcion||''},${item.cantidad},${item.unidad||'unidad'},${item.precio_unitario},${item.descuento_pct||0})`;
      }
      return json(cot[0], 201);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const idInt = parseInt(id);

      const own = await sql`SELECT id FROM cotizaciones WHERE id=${idInt} AND usuario_id=${user.id}`;
      if (!own.length) {
        const shared = await sql`
          SELECT c.id FROM cotizaciones c
          JOIN usuarios u ON c.usuario_id=u.id
          WHERE c.id=${idInt}
            AND (u.compartir_cotizaciones=true OR u.compartir_datos=true)
            AND (
              jsonb_array_length(COALESCE(u.compartir_con,'[]'::jsonb)) = 0
              OR u.compartir_con @> ${JSON.stringify([user.id])}::jsonb
            )`;
        if (!shared.length) return json({ error: 'No tienes permiso para editar esta cotización' }, 403);
      }

      const body = await parseBody(request);
      const { estado, titulo, notas, _fullEdit, items, descuento_pct, iva_pct, validez_dias, descripcion, cliente_id } = body;

      if (_fullEdit && items) {
        const dp = parseFloat(descuento_pct) || 0;
        const ip = parseFloat(iva_pct) || 0;
        const sub = items.reduce((s, i) => s + (parseFloat(i.cantidad)||0) * (parseFloat(i.precio_unitario)||0) * (1 - (parseFloat(i.descuento_pct)||0) / 100), 0);
        const dv = sub * (dp / 100);
        const base = sub - dv;
        const iv = base * (ip / 100);
        const total = base + iv;
        const cliId = cliente_id ? parseInt(cliente_id) : null;
        const r = await sql`UPDATE cotizaciones SET
          titulo=COALESCE(${titulo||null},titulo),
          descripcion=COALESCE(${descripcion||null},descripcion),
          notas=COALESCE(${notas||null},notas),
          cliente_id=COALESCE(${cliId},cliente_id),
          subtotal=${sub}, descuento_pct=${dp}, descuento_valor=${dv},
          iva_pct=${ip}, iva_valor=${iv}, total=${total},
          validez_dias=COALESCE(${validez_dias||null},validez_dias),
          actualizado_en=NOW()
          WHERE id=${idInt} RETURNING *`;
        await sql`DELETE FROM cotizacion_items WHERE cotizacion_id=${idInt}`;
        for (const item of items) {
          await sql`INSERT INTO cotizacion_items(cotizacion_id,material_id,descripcion,cantidad,unidad,precio_unitario,descuento_pct) VALUES(${idInt},${item.material_id||null},${item.descripcion||''},${parseFloat(item.cantidad)||1},${item.unidad||'unidad'},${parseFloat(item.precio_unitario)||0},${parseFloat(item.descuento_pct)||0})`;
        }
        return json(r[0]);
      }

      const r = await sql`UPDATE cotizaciones SET estado=COALESCE(${estado||null},estado),titulo=COALESCE(${titulo||null},titulo),notas=COALESCE(${notas||null},notas),actualizado_en=NOW() WHERE id=${idInt} RETURNING *`;
      return json(r[0]);
    }

    if (request.method === 'DELETE') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const own = await sql`SELECT id FROM cotizaciones WHERE id=${parseInt(id)} AND usuario_id=${user.id}`;
      if (!own.length) return json({ error: 'No tienes permiso' }, 403);
      await sql`DELETE FROM cotizacion_items WHERE cotizacion_id=${parseInt(id)}`;
      await sql`DELETE FROM cotizaciones WHERE id=${parseInt(id)} AND usuario_id=${user.id}`;
      return json({ success: true });
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}
