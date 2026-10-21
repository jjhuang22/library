import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { checkEvidence } from '../scripts/check-evidence.mjs';

test('repository retains maps for every published and completed queued artifact', async () => {
  const result = await checkEvidence();
  assert.ok(result.maps > 0);
});

test('coverage includes completed queues, excludes future plans, and detects missing, empty and stray maps', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'evidence-coverage-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content'));
  const maps = path.join(root, 'docs/evidence/acquired');
  await mkdir(maps, { recursive: true });
  await writeFile(path.join(root, 'content/library.json'), JSON.stringify({ artifacts: [{ category: 'acquired', id: 'published' }] }));
  await writeFile(path.join(root, 'content/queue.json'), JSON.stringify({ artifacts: [{ category: 'acquired', id: 'queued', reviewStatus: 'verified' }], authoring: { episodes: [{ id: 'future', status: 'pending' }] } }));
  await writeFile(path.join(maps, 'published.md'), '# Real source map');
  await assert.rejects(checkEvidence(root), /Missing: acquired\/queued/);
  await writeFile(path.join(maps, 'queued.md'), ' ');
  await assert.rejects(checkEvidence(root), /Empty evidence/);
  await writeFile(path.join(maps, 'queued.md'), '# Verified queued source');
  assert.deepEqual(await checkEvidence(root), { maps: 2, published: 1, queued: 1 });
  await writeFile(path.join(maps, 'future.md'), '# Placeholder');
  await assert.rejects(checkEvidence(root), /Unregistered: acquired\/future/);
});
