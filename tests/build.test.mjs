import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildLibrary, acquiredSeason } from '../scripts/build.mjs';

async function fixture(t, mutate = () => {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'artifact-library-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content'));
  for (const category of ['podcasts', 'books']) await mkdir(path.join(root, `public/artifacts/${category}/example`), { recursive: true });
  await writeFile(path.join(root, 'public/index.html'), '<title>Library</title>');
  for (const category of ['podcasts', 'books']) await writeFile(path.join(root, `public/artifacts/${category}/example/index.html`), '<h1>Independent HTML</h1>');
  const library = {
    categories: [{ id: 'podcasts', title: 'Podcasts' }, { id: 'books', title: 'Books' }],
    artifacts: ['podcasts', 'books'].map(category => ({
      id: 'example', title: 'Example & companion', category, addedOn: '2026-10-06', file: `/artifacts/${category}/example/index.html`
    }))
  };
  mutate(library);
  if (library.artifacts.some(a => a.file === '/artifacts/acquired/example/index.html')) {
    await mkdir(path.join(root, 'public/artifacts/acquired/example'), { recursive: true });
    await writeFile(path.join(root, 'public/artifacts/acquired/example/index.html'), '<h1>Independent HTML</h1>');
  }
  await writeFile(path.join(root, 'content/library.json'), JSON.stringify(library));
  return root;
}

test('builds independent podcast and book routes, preserves dates and HTML, and clears stale output', async t => {
  const root = await fixture(t);
  const library = await buildLibrary(root);
  assert.deepEqual(library.artifacts.map(a => a.url), ['/podcasts/example/', '/books/example/']);
  const saved = JSON.parse(await readFile(path.join(root, 'dist/library.json'), 'utf8'));
  assert.equal(saved.artifacts[0].addedOn, '2026-10-06');
  assert.equal(await readFile(path.join(root, 'dist/artifacts/podcasts/example/index.html'), 'utf8'), '<h1>Independent HTML</h1>');
  for (const category of ['podcasts', 'books']) {
    assert.equal(await readFile(path.join(root, `dist/${category}/example/index.html`), 'utf8'), '<h1>Independent HTML</h1>');
  }
  await writeFile(path.join(root, 'dist/stale.html'), 'stale');
  await buildLibrary(root);
  await assert.rejects(readFile(path.join(root, 'dist/stale.html')), { code: 'ENOENT' });
});

for (const [name, mutate, error] of [
  ['duplicate routes', l => l.artifacts.push(l.artifacts[0]), /Duplicate route/],
  ['unknown collections', l => l.artifacts[0].category = 'unknown', /Invalid artifact/],
  ['impossible dates', l => l.artifacts[0].addedOn = '2026-02-30', /Invalid addedOn/],
  ['missing dates', l => delete l.artifacts[0].addedOn, /Invalid addedOn/],
  ['path traversal', l => l.artifacts[0].file = '/artifacts/../index.html', /Invalid artifact file/],
  ['missing HTML', l => { l.artifacts[0].id = 'missing'; l.artifacts[0].file = '/artifacts/podcasts/missing/index.html'; }, /ENOENT/],
]) {
  test(`rejects ${name}`, async t => {
    const root = await fixture(t, mutate);
    await assert.rejects(buildLibrary(root), error);
  });
}

test('converts historical numbered seasons by release date using the library convention', () => {
  for (const releasedOn of ['2024-01-22', '2024-02-20', '2024-03-18', '2024-04-22', '2024-06-04', '2024-07-22', '2024-08-31']) {
    assert.equal(acquiredSeason(releasedOn), 'Spring 2024');
  }
  assert.equal(acquiredSeason('2024-09-01'), 'Fall 2024');
  assert.equal(acquiredSeason('2024-12-31'), 'Fall 2024');
});

test('derives Acquired seasons from release dates without changing creation dates', async t => {
  const root = await fixture(t, library => {
    library.categories[0] = { id: 'acquired', title: 'Acquired Podcasts' };
    Object.assign(library.artifacts[0], { category: 'acquired', file: '/artifacts/acquired/example/index.html', releasedOn: '2026-06-22', season: 'Season 14' });
    library.artifacts[1].releasedOn = '2026-09-14';
  });
  const { artifacts } = await buildLibrary(root);
  assert.equal(artifacts[0].season, 'Spring 2026');
  assert.equal(artifacts[0].addedOn, '2026-10-06');
  assert.equal(artifacts[1].releasedOn, '2026-09-14');
  assert.equal(artifacts[1].season, undefined);
});

for (const releasedOn of [undefined, '2026-02-30']) {
  test(`rejects missing or invalid Acquired release dates: ${releasedOn}`, async t => {
    const root = await fixture(t, library => {
      library.categories[0] = { id: 'acquired', title: 'Acquired Podcasts' };
      Object.assign(library.artifacts[0], { category: 'acquired', releasedOn });
    });
    await assert.rejects(buildLibrary(root), /Invalid releasedOn/);
  });
}


test('deploys only listed bundles with images, preserving both public route formats', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'public/artifacts/podcasts/example/images'), { recursive: true });
  await writeFile(path.join(root, 'public/artifacts/podcasts/example/images/cover.png'), 'paint');
  await mkdir(path.join(root, 'public/artifacts/podcasts/unlisted/images'), { recursive: true });
  await writeFile(path.join(root, 'public/artifacts/podcasts/unlisted/index.html'), 'queued');
  await writeFile(path.join(root, 'public/artifacts/podcasts/unlisted/images/cover.png'), 'queued art');
  await buildLibrary(root);
  for (const file of ['dist/artifacts/podcasts/example/images/cover.png', 'dist/podcasts/example/images/cover.png'])
    assert.equal(await readFile(path.join(root, file), 'utf8'), 'paint');
  assert.equal(await readFile(path.join(root, 'dist/artifacts/podcasts/example.html'), 'utf8'), '<h1>Independent HTML</h1>');
  for (const file of ['dist/artifacts/podcasts/unlisted/index.html', 'dist/artifacts/podcasts/unlisted/images/cover.png', 'dist/podcasts/unlisted/index.html'])
    await assert.rejects(readFile(path.join(root, file)), { code: 'ENOENT' });
});
