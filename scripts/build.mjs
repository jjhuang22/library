import { readFile, mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateDate(value, field) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${field} date`);
}

// Library convention: the first eight months belong to Spring; Fall starts in September.
// Derive this from each episode's release date, including older numbered seasons.
export function acquiredSeason(releasedOn) {
  validateDate(releasedOn, 'releasedOn');
  return `${Number(releasedOn.slice(5, 7)) < 9 ? 'Spring' : 'Fall'} ${releasedOn.slice(0, 4)}`;
}

// Only this explicit metadata marker is interpreted; the rest of each HTML stays opaque.
export function renderCreatedDate(html, addedOn, { required = false } = {}) {
  validateDate(addedOn, 'addedOn');
  let count = 0;
  const label = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${addedOn}T12:00:00Z`));
  let rendered = html.replace(/<time\b([^>]*\sdata-created-date(?=[\s=>])[^>]*)>[^<]*<\/time>/g, (_, attributes) => {
    count++;
    const kept = attributes.replace(/\sdatetime\s*=\s*(?:"[^"]*"|'[^']*')/g, '');
    return `<time${kept} datetime="${addedOn}">${label}</time>`;
  });
  // Existing saved queue branches use these cover spans; normalize only their date metadata.
  if (!count) rendered = html.replace(/(<span\b[^>]*>(?:<b>)?Created(?:<\/b>)?\s*(?:·\s*)?)(?:<time\b[^>]*>[^<]*<\/time>|(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4})(?=<\/span>)/g, (_, prefix) => {
    count++;
    return `${prefix}<time data-created-date datetime="${addedOn}">${label}</time>`;
  });
  if (required && count !== 1) throw new Error('Cover needs exactly one <time data-created-date> marker; update and review the queue bundle before publishing.');
  return rendered;
}

export async function buildLibrary(root = defaultRoot) {
  const library = JSON.parse(await readFile(path.join(root, 'content/library.json'), 'utf8'));
  const categories = new Set();
  for (const category of library.categories) {
    if (!slug.test(category.id) || !category.title || categories.has(category.id)) throw new Error('Invalid or duplicate category');
    categories.add(category.id);
  }
  const routes = new Set();
  for (const artifact of library.artifacts) {
    if (!categories.has(artifact.category) || !slug.test(artifact.id) || !artifact.title) throw new Error('Invalid artifact');
    validateDate(artifact.addedOn, 'addedOn');
    if (artifact.releasedOn !== undefined || artifact.category === 'acquired') validateDate(artifact.releasedOn, 'releasedOn');
    if (artifact.category === 'acquired') artifact.season = acquiredSeason(artifact.releasedOn);
    artifact.url = `/${artifact.category}/${artifact.id}/`;
    if (routes.has(artifact.url)) throw new Error(`Duplicate route: ${artifact.url}`);
    routes.add(artifact.url);
    // Standalone story HTML remains independent of the library shell.
    if (artifact.file !== `/artifacts/${artifact.category}/${artifact.id}/index.html`) throw new Error('Invalid artifact file');
    await readFile(path.join(root, 'public', artifact.file.slice(1)));
  }
  const dist = path.join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  // Copy the shell and shared assets, never every source artifact folder.
  const publicRoot = path.join(root, 'public');
  await cp(publicRoot, dist, {
    recursive: true,
    filter: source => source !== path.join(publicRoot, 'artifacts')
  });
  await writeFile(path.join(dist, 'library.json'), JSON.stringify(library));
  for (const artifact of library.artifacts) {
    const folder = path.join(dist, artifact.url.slice(1));
    await mkdir(folder, { recursive: true });
    const source = path.join(root, 'public', path.dirname(artifact.file).slice(1));
    const bundle = path.join(dist, path.dirname(artifact.file).slice(1));
    await cp(source, bundle, { recursive: true });
    await cp(source, folder, { recursive: true });
    const html = renderCreatedDate(await readFile(path.join(source, 'index.html'), 'utf8'), artifact.addedOn);
    // Use the same catalog date in reader, bundle and compatibility URLs.
    for (const file of [path.join(folder, 'index.html'), path.join(bundle, 'index.html'), path.join(dist, 'artifacts', artifact.category, `${artifact.id}.html`)])
      await writeFile(file, html);
  }
  return library;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const library = await buildLibrary();
  console.log(`Built ${library.artifacts.length} artifact page(s) and the library index.`);
}
