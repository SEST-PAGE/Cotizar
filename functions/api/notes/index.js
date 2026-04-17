// functions/api/notes/index.js

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function getUserId(request) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  
  try {
    const token = auth.split(' ')[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id || payload.sub;
  } catch {
    return null;
  }
}

// Verificar conexión a BD
function getDB(env) {
  if (!env.DB) {
    throw new Error('Database not configured. Check wrangler.toml [[d1_databases]] binding.');
  }
  return env.DB;
}

// GET - Listar notas
export async function onRequestGet({ env, request }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: 'No autorizado' }, 401);

    const db = getDB(env);
    const { results } = await db.prepare(
      `SELECT id, titulo, contenido, fecha, creado_en, updated_at 
       FROM notes 
       WHERE user_id = ? 
       ORDER BY fecha DESC, creado_en DESC`
    ).bind(userId).all();

    return json(results || []);
  } catch (error) {
    console.error('GET Error:', error);
    return json({ error: error.message }, 500);
  }
}

// POST - Crear nota
export async function onRequestPost({ env, request }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: 'No autorizado' }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON inválido' }, 400);
    }

    const { titulo, contenido, fecha } = body;
    if (!titulo?.trim() || !contenido?.trim()) {
      return json({ error: 'Título y contenido son obligatorios' }, 400);
    }

    const db = getDB(env);
    const fechaValor = fecha || new Date().toISOString().split('T')[0];
    
    const result = await db.prepare(
      `INSERT INTO notes (user_id, titulo, contenido, fecha) 
       VALUES (?, ?, ?, ?)`
    ).bind(userId, titulo.trim(), contenido.trim(), fechaValor).run();

    // Recuperar la nota creada
    const { results } = await db.prepare(
      `SELECT * FROM notes WHERE id = last_insert_rowid()`
    ).all();

    return json(results[0], 201);
  } catch (error) {
    console.error('POST Error:', error);
    return json({ error: error.message }, 500);
  }
}

// PUT - Actualizar nota
export async function onRequestPut({ env, request }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: 'No autorizado' }, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID requerido' }, 400);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON inválido' }, 400);
    }

    const db = getDB(env);

    // Verificar propiedad
    const { results: existing } = await db.prepare(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?'
    ).bind(id, userId).all();

    if (!existing?.length) {
      return json({ error: 'Nota no encontrada o sin permisos' }, 404);
    }

    const { titulo, contenido, fecha } = body;
    
    await db.prepare(
      `UPDATE notes 
       SET titulo = ?, contenido = ?, fecha = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`
    ).bind(titulo?.trim(), contenido?.trim(), fecha, id, userId).run();

    const { results } = await db.prepare(
      'SELECT * FROM notes WHERE id = ?'
    ).bind(id).all();

    return json(results[0]);
  } catch (error) {
    console.error('PUT Error:', error);
    return json({ error: error.message }, 500);
  }
}

// DELETE - Eliminar nota
export async function onRequestDelete({ env, request }) {
  try {
    const userId = getUserId(request);
    if (!userId) return json({ error: 'No autorizado' }, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID requerido' }, 400);

    const db = getDB(env);
    
    const result = await db.prepare(
      'DELETE FROM notes WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    if (result.meta?.changes === 0) {
      return json({ error: 'Nota no encontrada o sin permisos' }, 404);
    }

    return json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return json({ error: error.message }, 500);
  }
}
