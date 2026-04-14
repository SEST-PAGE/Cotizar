import { build } from 'esbuild';
import { readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

// Collect all entry points from src/api/
function getEntries(dir, base = '') {
  const entries = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    const rel  = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) {
      entries.push(...getEntries(full, rel));
    } else if (item.name.endsWith('.js') && !item.name.startsWith('_')) {
      entries.push({ in: full, out: rel.replace(/\.js$/, '') });
    }
  }
  return entries;
}

const entries = getEntries('src/api');
console.log('Building', entries.length, 'function files...');

await build({
  entryPoints: entries,
  bundle: true,
  outdir: 'functions/api',
  format: 'esm',
  platform: 'browser',   // Cloudflare edge = browser-like runtime
  target: 'es2022',
  minify: false,
  conditions: ['worker', 'browser'],
  define: { 'process.env.NODE_ENV': '"production"' },
  external: [],           // bundle everything — no external deps needed
}).catch(e => { console.error(e); process.exit(1); });

console.log('Build complete! functions/api/ is ready.');
