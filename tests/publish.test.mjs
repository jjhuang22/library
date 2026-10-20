import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preparePublication, publishPrepared } from '../scripts/publish-artifact.mjs';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const json = (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n');

async function fixture(t, { status = 'verified', sharedChange = false, missingEvidence = false } = {}) {
  const base = await mkdtemp(path.join(tmpdir(), 'selective-publish-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const remote = path.join(base, 'remote.git'), root = path.join(base, 'repo');
  await mkdir(root); git(base, 'init', '--bare', remote); git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Publication test'); git(root, 'config', 'user.email', 'test@example.invalid');
  await mkdir(path.join(root, 'content')); await mkdir(path.join(root, 'public'));
  await mkdir(path.join(root, 'scripts'));
  await cp(path.join(sourceRoot, 'scripts/build.mjs'), path.join(root, 'scripts/build.mjs'));
  await writeFile(path.join(root, 'public/index.html'), '<h1>Library</h1>');
  await writeFile(path.join(root, '.gitignore'), 'dist/\n');
  await json(path.join(root, 'package.json'), { type: 'module' });
  const registry = { artifacts: ['one', 'two'].map(id => ({ id, title: id, category: 'acquired', branch: `queue/acquired/${id}`, reviewStatus: status })) };
  await json(path.join(root, 'content/queue.json'), registry);
  await json(path.join(root, 'content/library.json'), { categories: [{ id: 'acquired', title: 'Acquired' }], artifacts: [] });
  git(root, 'add', '.'); git(root, 'commit', '-m', 'Main foundation');
  git(root, 'remote', 'add', 'origin', remote); git(root, 'push', 'origin', 'main');
  const main = git(root, 'rev-parse', 'HEAD');
  git(root, 'switch', '-c', 'queue/acquired/one');
  await mkdir(path.join(root, 'public/artifacts/acquired/one/images'), { recursive: true });
  await writeFile(path.join(root, 'public/artifacts/acquired/one/index.html'), '<h1>One</h1>');
  await writeFile(path.join(root, 'public/artifacts/acquired/one/images/cover.png'), 'watercolor');
  const catalog = { categories: [{ id: 'acquired', title: 'Acquired' }], artifacts: [{ id: 'one', category: 'acquired', title: 'One', addedOn: '2026-10-18', releasedOn: '2024-03-18', file: '/artifacts/acquired/one/index.html' }] };
  await json(path.join(root, 'content/library.json'), catalog);
  if (!missingEvidence) { await mkdir(path.join(root, 'docs/evidence/acquired'), { recursive: true }); await writeFile(path.join(root, 'docs/evidence/acquired/one.md'), '# Source map\n\nVerified source passages.\n'); }
  if (sharedChange) await writeFile(path.join(root, 'public/styles.css'), 'unapproved shared change');
  git(root, 'add', '.'); git(root, 'commit', '-m', 'Queue one'); git(root, 'push', 'origin', 'queue/acquired/one');
  git(root, 'switch', 'main'); git(root, 'fetch', 'origin');
  return { root, base, remote, main, worktreeBase: path.join(base, 'publications'), key: 'acquired/one' };
}

test('selects one episode from an older queue branch and publishes exactly one isolated commit', async t => {
  const f = await fixture(t);
  // A newer main change must survive publication without reusing the old catalog.
  const lib = JSON.parse(await readFile(path.join(f.root, 'content/library.json'), 'utf8'));
  lib.artifacts.push({ id: 'newer', category: 'acquired', title: 'Newer', addedOn: '2026-10-19', releasedOn: '2024-06-04', file: '/artifacts/acquired/newer/index.html' });
  await mkdir(path.join(f.root, 'public/artifacts/acquired/newer'), { recursive: true });
  await writeFile(path.join(f.root, 'public/artifacts/acquired/newer/index.html'), 'newer publication');
  await json(path.join(f.root, 'content/library.json'), lib);
  git(f.root, 'add', '.'); git(f.root, 'commit', '-m', 'Publish another episode first'); git(f.root, 'push', 'origin', 'main');
  const prior = git(f.root, 'rev-parse', 'HEAD');
  const prepared = await preparePublication(f);
  assert.equal(prepared.status, 'prepared');
  const saved = JSON.parse(await readFile(path.join(prepared.worktree, 'content/library.json'), 'utf8'));
  assert.deepEqual(saved.artifacts.map(a => a.id), ['newer', 'one']);
  assert.equal(saved.artifacts[1].addedOn, '2026-10-18');
  assert.deepEqual(JSON.parse(await readFile(path.join(prepared.worktree, 'content/queue.json'), 'utf8')).artifacts.map(a => a.id), ['two']);
  assert.equal(await readFile(path.join(prepared.worktree, 'dist/acquired/one/images/cover.png'), 'utf8'), 'watercolor');
  const pushed = await publishPrepared(f);
  assert.equal(pushed.status, 'pushed');
  assert.equal(git(f.root, 'show', '-s', '--format=%P', pushed.commit), prior);
  assert.equal(git(f.root, 'rev-list', '--count', `${prior}..${pushed.commit}`), '1');
  const files = git(f.root, 'diff', '--name-only', prior, pushed.commit).split('\n');
  assert.ok(files.every(file => ['content/library.json', 'content/queue.json', 'docs/evidence/acquired/one.md'].includes(file) || file.startsWith('public/artifacts/acquired/one/')));
  const again = await preparePublication(f);
  assert.equal(again.status, 'already-published');
  assert.equal((await publishPrepared(f)).status, 'already-published');
});

for (const [name, options, pattern] of [
  ['pending source reviews', { status: 'needs-source-review' }, /complete source review/],
  ['shared file changes hidden in a queue branch', { sharedChange: true }, /unrelated file/],
  ['missing retained evidence', { missingEvidence: true }, /does not exist|exists on disk|path/]
]) test(`refuses ${name}`, async t => {
  const f = await fixture(t, options);
  await assert.rejects(preparePublication(f), pattern);
  assert.equal(git(f.root, 'rev-parse', 'origin/main'), f.main);
});

test('refuses stale prepared bases and preserves prior work for inspection', async t => {
  const f = await fixture(t); const prepared = await preparePublication(f);
  await writeFile(path.join(f.root, 'public/app.js'), '// newer main shell change');
  git(f.root, 'add', '.'); git(f.root, 'commit', '-m', 'New main change'); git(f.root, 'push', 'origin', 'main');
  await assert.rejects(publishPrepared(f), /Main advanced/);
  await assert.rejects(preparePublication(f), /Main or queue source changed/);
  const fresh = await preparePublication({ ...f, fresh: true });
  assert.notEqual(fresh.worktree, prepared.worktree);
  assert.equal(await readFile(path.join(fresh.worktree, 'public/app.js'), 'utf8'), '// newer main shell change');
});

test('refuses collateral catalog edits and unrelated files after preparation', async t => {
  const f = await fixture(t); const prepared = await preparePublication(f);
  await writeFile(path.join(prepared.worktree, 'public/accidental.txt'), 'not this episode');
  await assert.rejects(publishPrepared(f), /unrelated file/);
  await rm(path.join(prepared.worktree, 'public/accidental.txt'));
  const p = path.join(prepared.worktree, 'content/library.json'); const lib = JSON.parse(await readFile(p, 'utf8'));
  lib.categories[0].title = 'Unexpected rename'; await json(p, lib);
  await assert.rejects(publishPrepared(f), /other publications or collections/);
});

test('requires preparation and rejects malformed artifact identifiers', async t => {
  const f = await fixture(t);
  await assert.rejects(publishPrepared(f), /Run --prepare/);
  await assert.rejects(preparePublication({ ...f, key: '../one' }), /collection\/id/);
});


test('rejects unrelated staged edits even when working bytes match main', async t => {
  const f = await fixture(t); const prepared = await preparePublication(f);
  const file = path.join(prepared.worktree, 'public/index.html');
  const original = await readFile(file, 'utf8');
  await writeFile(file, '<h1>Unrelated staged change</h1>');
  git(prepared.worktree, 'add', 'public/index.html');
  await writeFile(file, original);
  await assert.rejects(publishPrepared(f), /unrelated file public\/index.html/);
  assert.equal(git(f.root, 'rev-parse', 'origin/main'), f.main);
});

test('requires renewed preparation when the selected queue changes or review is revoked', async t => {
  const f = await fixture(t); await preparePublication(f);
  git(f.root, 'switch', 'queue/acquired/one');
  const file = path.join(f.root, 'content/queue.json'); const registry = JSON.parse(await readFile(file, 'utf8'));
  registry.artifacts[0].reviewStatus = 'needs-source-review'; await json(file, registry);
  git(f.root, 'add', '.'); git(f.root, 'commit', '-m', 'Revoke incomplete source review'); git(f.root, 'push', 'origin', 'queue/acquired/one');
  git(f.root, 'switch', 'main');
  await assert.rejects(publishPrepared(f), /Queue source changed/);
  await assert.rejects(preparePublication({ ...f, fresh: true }), /complete source review/);
});

test('rejects evidence deleted or emptied after preparation', async t => {
  const f = await fixture(t); const prepared = await preparePublication(f);
  const file = path.join(prepared.worktree, 'docs/evidence/acquired/one.md');
  await rm(file);
  await assert.rejects(publishPrepared(f), /ENOENT/);
  await writeFile(file, '   ');
  await assert.rejects(publishPrepared(f), /nonempty ordinary evidence/);
});
