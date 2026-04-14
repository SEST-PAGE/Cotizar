import { json, cors204 } from './_lib/helpers.js';
import { neon } from '@neondatabase/serverless';

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return cors204();

  const resultado = {
    DATABASE_URL: env.DATABASE_URL ? '✅ Configurada' : '❌ FALTA — agrégala en Cloudflare Pages > Variables',
    JWT_SECRET:   env.JWT_SECRET   ? '✅ Configurada' : '⚠️  Falta (usará valor por defecto)',
    db_conexion: null,
    usuarios_en_db: null,
    formato_passwords: null,
  };

  if (env.DATABASE_URL) {
    try {
      const sql = neon(env.DATABASE_URL);
      const r = await sql`SELECT COUNT(*) as total FROM usuarios`;
      resultado.db_conexion = '✅ Conectada correctamente';
      resultado.usuarios_en_db = `${r[0].total} usuarios encontrados`;

      // Verificar formato de hashes
      const hashes = await sql`SELECT password_hash FROM usuarios LIMIT 5`;
      const tipos = hashes.map(u => {
        if (!u.password_hash) return 'null';
        if (u.password_hash.startsWith('$2')) return 'bcrypt (antiguo ❌)';
        if (u.password_hash.startsWith('pbkdf2:')) return 'pbkdf2 (nuevo ✅)';
        return 'desconocido';
      });
      resultado.formato_passwords = tipos;
    } catch (e) {
      resultado.db_conexion = `❌ Error: ${e.message}`;
    }
  }

  return json(resultado);
}
