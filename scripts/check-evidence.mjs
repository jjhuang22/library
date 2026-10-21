import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
export async function checkEvidence(root = defaultRoot) {
  const catalog = JSON.parse(await readFile(path.join(root, 'content/library.json'), 'utf8'));
  const queue = JSON.parse(await readFile(path.join(root, 'content/queue.json'), 'utf8'));
  const key = item => `${item.category}/${item.id}`;
  const expected = new Set([...catalog.artifacts, ...queue.artifacts.filter(item => item.reviewStatus === 'verified')].map(key));
  const actual = new Set();
  const base = path.join(root, 'docs/evidence');
  for (const collection of await readdir(base, { withFileTypes: true })) {
    if (!collection.isDirectory()) throw new Error(`Unexpected evidence entry: ${collection.name}`);
    for (const file of await readdir(path.join(base, collection.name))) {
      const name = `${collection.name}/${file}`;
      const destination = path.join(base, name);
      if (!file.endsWith('.md') || !(await lstat(destination)).isFile()) throw new Error(`Unexpected evidence entry: ${name}`);
      if (!(await readFile(destination, 'utf8')).trim()) throw new Error(`Empty evidence map: ${name}`);
      actual.add(name.slice(0, -3));
    }
  }
  const missing = [...expected].filter(key => !actual.has(key));
  const extra = [...actual].filter(key => !expected.has(key));
  if (missing.length || extra.length) throw new Error(`Evidence coverage mismatch. Missing: ${missing.join(', ') || 'none'}. Unregistered: ${extra.join(', ') || 'none'}.`);
  return { maps: actual.size, published: catalog.artifacts.length, queued: queue.artifacts.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await checkEvidence())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
