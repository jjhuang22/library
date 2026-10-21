import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { checkEvidence } from '../scripts/check-evidence.mjs';

test('repository retains exactly the evidence maps in this branch catalog', async () => {
  const result = await checkEvidence();
  assert.equal(result.maps, result.artifacts);
});

test('coverage follows the branch catalog across collections and rejects missing, empty and stray maps', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'evidence-coverage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content'));
  const maps = path.join(root, 'docs/evidence/acquired');
  const books = path.join(root, 'docs/evidence/books');
  await mkdir(maps, { recursive: true }); await mkdir(books, { recursive: true });
  await writeFile(path.join(root, 'content/library.json'), JSON.stringify({ artifacts: [{ category: 'acquired', id: 'published' }, { category: 'books', id: 'book' }] }));
  await writeFile(path.join(maps, 'published.md'), '# Real source map');
  await assert.rejects(checkEvidence(root), /Missing: books\/book/);
  await writeFile(path.join(books, 'book.md'), ' ');
  await assert.rejects(checkEvidence(root), /Empty evidence/);
  await writeFile(path.join(books, 'book.md'), '# Book source passages');
  assert.deepEqual(await checkEvidence(root), { maps: 2, artifacts: 2 });
  await writeFile(path.join(maps, 'unpublished.md'), '# Other branch evidence');
  await assert.rejects(checkEvidence(root), /Unregistered: acquired\/unpublished/);
});
