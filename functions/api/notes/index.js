// functions/api/notes/index.js
// Usa Neon PostgreSQL igual que el resto de la app

import { getDb, getUser, json, cors204 } from '../_lib/helpers.js';

// GET - Listar notas del usuario
export async function onRequestGet({ env, request }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'No autorizado' }, 401);

    const sql = getDb(env);
    const results = await sql`
      SELECT id, titulo, contenido, fecha, creado_en, updated_at
      FROM notes
      WHERE user_id = ${user.id}
      ORDER BY fecha DESC, creado_en DESC
    `;

    return json(results);
  } catch (error) {
    console.error('GET notes error:', error);
    return json({ error: error.message }, 500);
  }
}

// POST - Crear nota
export async function onRequestPost({ env, request }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'No autorizado' }, 401);

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

    const sql = getDb(env);
    const fechaValor = fecha || new Date().toISOString().split('T')[0];

    const [nota] = await sql`
      INSERT INTO notes (user_id, titulo, contenido, fecha)
      VALUES (${user.id}, ${titulo.trim()}, ${contenido.trim()}, ${fechaValor})
      RETURNING *
    `;

    return json(nota, 201);
  } catch (error) {
    console.error('POST notes error:', error);
    return json({ error: error.message }, 500);
  }
}

// PUT - Actualizar nota
export async function onRequestPut({ env, request }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'No autorizado' }, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID requerido' }, 400);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'JSON inválido' }, 400);
    }

    const { titulo, contenido, fecha } = body;

    const sql = getDb(env);

    // Verificar que la nota pertenece al usuario
    const [existing] = await sql`
      SELECT id FROM notes WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!existing) {
      return json({ error: 'Nota no encontrada o sin permisos' }, 404);
    }

    const [updated] = await sql`
      UPDATE notes
      SET titulo = ${titulo?.trim()},
          contenido = ${contenido?.trim()},
          fecha = ${fecha},
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    return json(updated);
  } catch (error) {
    console.error('PUT notes error:', error);
    return json({ error: error.message }, 500);
  }
}

// DELETE - Eliminar nota
export async function onRequestDelete({ env, request }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'No autorizado' }, 401);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID requerido' }, 400);

    const sql = getDb(env);

    const [deleted] = await sql`
      DELETE FROM notes
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (!deleted) {
      return json({ error: 'Nota no encontrada o sin permisos' }, 404);
    }

    return json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    console.error('DELETE notes error:', error);
    return json({ error: error.message }, 500);
  }
}

// OPTIONS - CORS preflight
export async function onRequestOptions() {
  return cors204();
}

function toggleNotasSidebar() {
  const sidebar = document.querySelector('.notas-sidebar'); // o el ID/clase que tenga tu sidebar
  const btn = document.querySelector('.notas-sidebar-toggle');
  
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    
    // Cambiar icono (opcional)
    const icon = btn.querySelector('i');
    if (icon) {
      if (sidebar.classList.contains('collapsed')) {
        icon.setAttribute('data-lucide', 'panel-left-open');
      } else {
        icon.setAttribute('data-lucide', 'panel-left');
      }
      refreshIcons(); // Si usas lucide
    }
  }
}

// Al cargar la página en móvil, colapsar automáticamente para ver notas
window.addEventListener('load', function() {
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.notas-sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }
});
