// functions/api/notes/index.js

// Función para extraer el usuario del token JWT
function getUserIdFromToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id || payload.sub;
  } catch {
    return null;
  }
}

// GET - Listar notas
export async function onRequestGet(context) {
  const { env, request } = context;
  const userId = getUserIdFromToken(request);
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, titulo, contenido, fecha, creado_en, updated_at 
       FROM notes 
       WHERE user_id = ? 
       ORDER BY fecha DESC, creado_en DESC`
    ).bind(userId).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Crear nota
export async function onRequestPost(context) {
  const { env, request } = context;
  const userId = getUserIdFromToken(request);
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { titulo, contenido, fecha } = body;

    if (!titulo || !contenido) {
      return new Response(JSON.stringify({ error: 'Título y contenido son obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await env.DB.prepare(
      `INSERT INTO notes (user_id, titulo, contenido, fecha) 
       VALUES (?, ?, ?, ?) 
       RETURNING id, titulo, contenido, fecha, creado_en`
    ).bind(userId, titulo, contenido, fecha || new Date().toISOString().split('T')[0]).all();

    return new Response(JSON.stringify(results[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Actualizar nota
export async function onRequestPut(context) {
  const { env, request } = context;
  const userId = getUserIdFromToken(request);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { titulo, contenido, fecha } = body;

    // Verificar que la nota existe y pertenece al usuario
    const { results: existing } = await env.DB.prepare(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?'
    ).bind(id, userId).all();

    if (!existing.length) {
      return new Response(JSON.stringify({ error: 'Nota no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await env.DB.prepare(
      `UPDATE notes 
       SET titulo = ?, contenido = ?, fecha = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ? 
       RETURNING *`
    ).bind(titulo, contenido, fecha, id, userId).all();

    return new Response(JSON.stringify(results[0]), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Eliminar nota
export async function onRequestDelete(context) {
  const { env, request } = context;
  const userId = getUserIdFromToken(request);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { meta } = await env.DB.prepare(
      'DELETE FROM notes WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    if (meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Nota no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Nota eliminada' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
