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
    if (artifact.published !== undefined && typeof artifact.published !== 'boolean') throw new Error('Invalid published flag');
    validateDate(artifact.addedOn, 'addedOn');
    if (artifact.releasedOn !== undefined || artifact.category === 'acquired') validateDate(artifact.releasedOn, 'releasedOn');
    if (artifact.category === 'acquired') artifact.season = acquiredSeason(artifact.releasedOn);
    artifact.url = `/${artifact.category}/${artifact.id}/`;
    if (routes.has(artifact.url)) throw new Error(`Duplicate route: ${artifact.url}`);
    routes.add(artifact.url);
    // Standalone HTML is opaque to the library; no assumptions about its scripts or markup.
    if (!/^\/artifacts\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(artifact.file)) throw new Error('Invalid artifact file');
    await readFile(path.join(root, 'public', artifact.file.slice(1)));
  }
  // Keep queued companions in source control, but exclude both their raw HTML
  // and generated routes from deployment, as well as the public catalog.
  const unpublishedFiles = new Set(library.artifacts
    .filter(artifact => artifact.published === false)
    .map(artifact => path.resolve(root, 'public', artifact.file.slice(1))));
  library.artifacts = library.artifacts.filter(artifact => artifact.published !== false);
  const dist = path.join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await cp(path.join(root, 'public'), dist, {
    recursive: true,
    filter: source => !unpublishedFiles.has(path.resolve(source))
  });
  await writeFile(path.join(dist, 'library.json'), JSON.stringify(library));
  for (const artifact of library.artifacts) {
    const folder = path.join(dist, artifact.url.slice(1));
    await mkdir(folder, { recursive: true });
    await cp(path.join(root, 'public', artifact.file.slice(1)), path.join(folder, 'index.html'));
  }
  return library;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const library = await buildLibrary();
  console.log(`Built ${library.artifacts.length} artifact page(s) and the library index.`);
}
