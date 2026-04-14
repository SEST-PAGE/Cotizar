import { getDb, getUser, json, cors204, parseBody } from '../_lib/helpers.js';

async function checkAdmin(sql, userId) {
  try { await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permisos VARCHAR(20) DEFAULT 'vendedor'`; } catch (e) {}
  const rows = await sql`SELECT rol, permisos FROM usuarios WHERE id=${userId}`;
  if (!rows.length) return false;
  return rows[0].rol === 'admin' || rows[0].permisos === 'admin';
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const user = getUser(request, env);
  if (!user) return json({ error: 'No autorizado' }, 401);

  const sql = getDb(env);
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const categoria = url.searchParams.get('categoria');
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '200';
  const id = url.searchParams.get('id');

  try {
    if (request.method === 'GET') {
      const l = parseInt(limit), off = (parseInt(page) - 1) * l;
      let mats;
      if (q && categoria) {
        mats = await sql`SELECT m.*,c.nombre AS categoria_nombre FROM materiales m LEFT JOIN categorias c ON m.categoria_id=c.id WHERE m.activo=true AND (m.nombre ILIKE ${'%'+q+'%'} OR m.codigo ILIKE ${'%'+q+'%'}) AND m.categoria_id=${parseInt(categoria)} ORDER BY m.nombre LIMIT ${l} OFFSET ${off}`;
      } else if (q) {
        mats = await sql`SELECT m.*,c.nombre AS categoria_nombre FROM materiales m LEFT JOIN categorias c ON m.categoria_id=c.id WHERE m.activo=true AND (m.nombre ILIKE ${'%'+q+'%'} OR m.codigo ILIKE ${'%'+q+'%'}) ORDER BY m.nombre LIMIT ${l} OFFSET ${off}`;
      } else if (categoria) {
        mats = await sql`SELECT m.*,c.nombre AS categoria_nombre FROM materiales m LEFT JOIN categorias c ON m.categoria_id=c.id WHERE m.activo=true AND m.categoria_id=${parseInt(categoria)} ORDER BY m.nombre LIMIT ${l} OFFSET ${off}`;
      } else {
        mats = await sql`SELECT m.*,c.nombre AS categoria_nombre FROM materiales m LEFT JOIN categorias c ON m.categoria_id=c.id WHERE m.activo=true ORDER BY m.nombre LIMIT ${l} OFFSET ${off}`;
      }
      const cats = await sql`SELECT * FROM categorias ORDER BY nombre`;
      return json({ materiales: mats, categorias: cats });
    }

    if (request.method === 'POST') {
      const { codigo, nombre, descripcion, categoria_id, unidad, precio_costo, precio_venta, stock } = await parseBody(request);
      if (!codigo || !nombre || precio_venta === undefined) return json({ error: 'Código, nombre y precio son requeridos' }, 400);
      const r = await sql`INSERT INTO materiales(codigo,nombre,descripcion,categoria_id,unidad,precio_costo,precio_venta,stock) VALUES(${codigo},${nombre},${descripcion||''},${categoria_id||null},${unidad||'unidad'},${precio_costo||0},${precio_venta},${stock||0}) RETURNING *`;
      return json(r[0], 201);
    }

    if (request.method === 'PUT') {
      if (!id) return json({ error: 'ID requerido' }, 400);
      const { nombre, descripcion, categoria_id, unidad, precio_costo, precio_venta, stock } = await parseBody(request);
      const r = await sql`UPDATE materiales SET nombre=${nombre},descripcion=${descripcion||''},categoria_id=${categoria_id||null},unidad=${unidad},precio_costo=${precio_costo},precio_venta=${precio_venta},stock=${stock},actualizado_en=NOW() WHERE id=${parseInt(id)} RETURNING *`;
      return json(r[0]);
    }

    if (request.method === 'DELETE') {
      const isAdmin = await checkAdmin(sql, user.id);
      if (!isAdmin) return json({ error: 'Solo los administradores pueden eliminar materiales' }, 403);
      if (!id) return json({ error: 'ID requerido' }, 400);
      await sql`UPDATE materiales SET activo=false WHERE id=${parseInt(id)}`;
      return json({ success: true });
    }

    return json({ error: 'Método no permitido' }, 405);
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}
