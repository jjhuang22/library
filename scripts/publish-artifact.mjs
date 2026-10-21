import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLibrary } from './build.mjs';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const validKey = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const catalogFile = 'content/library.json';
const keyOf = item => `${item.category}/${item.id}`;
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 }).trim();
const showJSON = (root, ref, file) => JSON.parse(git(root, 'show', `${ref}:${file}`));
const saveJSON = (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n');
const exists = async file => { try { await lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };

function checkKey(key) {
  if (!validKey.test(key)) throw new Error('Use a collection/id, for example acquired/vanguard');
}
function fetchSources(root) {
  git(root, 'fetch', '--prune', 'origin', '+refs/heads/main:refs/remotes/origin/main', '+refs/heads/queue/*:refs/remotes/origin/queue/*');
}
function sourceRef(root, branch) {
  try { return git(root, 'rev-parse', '--verify', `refs/remotes/origin/${branch}^{commit}`); }
  catch { throw new Error(`Queue branch ${branch} is unavailable. Commit and push its source before publishing.`); }
}
function sourceReview(root, source, key) {
  let text;
  try { text = git(root, 'show', `${source}:docs/evidence/${key}.md`); }
  catch { return { status: 'needs-source-review', notes: 'Missing evidence map' }; }
  const header = text.match(/^<!-- artifact-review: (.+) -->\r?\n/);
  if (!header) return { status: 'needs-source-review', notes: 'Missing review record' };
  let review;
  try { review = JSON.parse(header[1]); } catch { return { status: 'needs-source-review', notes: 'Invalid review record' }; }
  if (!review || typeof review !== 'object' || !['draft', 'needs-source-review', 'blocked', 'verified'].includes(review.status))
    return { status: 'needs-source-review', notes: 'Invalid review status' };
  if (review.status !== 'verified') return { status: review.status, notes: review.blocker || '' };
  let bundleTree;
  try {
    bundleTree = git(root, 'rev-parse', `${source}:public/artifacts/${key}`);
    if (git(root, 'cat-file', '-t', bundleTree) !== 'tree') throw new Error('Not a bundle directory');
  } catch { return { status: 'needs-source-review', notes: 'Missing bundle directory' }; }
  if (review.bundleTree !== bundleTree || !text.slice(header[0].length).trim())
    return { status: 'needs-source-review', notes: 'Bundle changed after review or source map is empty' };
  return { status: 'verified', bundleTree, notes: '' };
}
function changedFiles(root, ...revisions) {
  const raw = execFileSync('git', ['diff', '--name-only', '-z', ...revisions], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  return raw.toString().split('\0').filter(Boolean);
}
function assertScope(files, key) {
  const bundle = `public/artifacts/${key}/`;
  const evidence = `docs/evidence/${key}.md`;
  for (const file of files) {
    if (file !== catalogFile && file !== evidence && !file.startsWith(bundle))
      throw new Error(`Publication includes unrelated file ${file}; publish shared maintenance separately.`);
  }
}
function planPath(root) {
  return git(root, 'rev-parse', '--path-format=absolute', '--git-path', 'artifact-publication.json');
}
function pointerPath(root, key) {
  return git(root, 'rev-parse', '--path-format=absolute', '--git-common-dir') + `/artifact-publications/${key.replace('/', '--')}.json`;
}
async function readPointer(root, key) {
  return JSON.parse(await readFile(pointerPath(root, key), 'utf8'));
}

export async function listQueue(root = defaultRoot, { fetch = true } = {}) {
  if (fetch) fetchSources(root);
  const published = new Set(showJSON(root, 'refs/remotes/origin/main', catalogFile).artifacts.map(keyOf));
  const refs = git(root, 'for-each-ref', '--format=%(refname)', 'refs/remotes/origin/queue/').split('\n').filter(Boolean);
  const items = [];
  for (const ref of refs) {
    const branch = ref.slice('refs/remotes/origin/'.length);
    const key = branch.slice('queue/'.length);
    if (!validKey.test(key) || published.has(key)) continue;
    const [category, id] = key.split('/');
    let selected;
    try { selected = showJSON(root, ref, catalogFile).artifacts.find(item => keyOf(item) === key); } catch { /* incomplete draft */ }
    const review = selected ? sourceReview(root, ref, key) : { status: 'draft', notes: 'Missing catalog entry' };
    items.push({ category, id, title: selected?.title || id, branch, reviewStatus: review.status, notes: review.notes });
  }
  return items;
}

export async function preparePublication({ root = defaultRoot, key, fetch = true, fresh = false, worktreeBase } = {}) {
  checkKey(key);
  if (fetch) fetchSources(root);
  const base = git(root, 'rev-parse', 'refs/remotes/origin/main');
  const catalog = showJSON(root, base, catalogFile);
  if (catalog.artifacts.some(item => keyOf(item) === key)) return { status: 'already-published', key, base };
  const source = sourceRef(root, `queue/${key}`);
  const review = sourceReview(root, source, key);
  if (review.status !== 'verified') throw new Error(`${key} needs a complete source review and evidence map before publication: ${review.notes || review.status}`);
  const sourceCatalog = showJSON(root, source, catalogFile);
  const selected = sourceCatalog.artifacts.filter(item => keyOf(item) === key);
  if (selected.length !== 1 || selected[0].file !== `/artifacts/${key}/index.html`) throw new Error('Missing or invalid episode catalog entry');
  const mergeBase = git(root, 'merge-base', base, source);
  assertScope(changedFiles(root, mergeBase, source), key);
  const evidence = `docs/evidence/${key}.md`;
  const evidenceText = git(root, 'show', `${source}:${evidence}`);
  if (!evidenceText.trim()) throw new Error('A retained source evidence map is required');
  if (!fresh && await exists(pointerPath(root, key))) {
    const prior = await readPointer(root, key);
    if (prior.base !== base || prior.source !== source) throw new Error('Main or queue source changed. Prepare again with --fresh, then repeat browser checks.');
    await readFile(planPath(prior.worktree), 'utf8');
    return { status: 'prepared', ...prior };
  }
  const parent = worktreeBase || path.join(path.dirname(root), 'library-publications');
  await mkdir(parent, { recursive: true });
  const worktree = await mkdtemp(path.join(parent, `${key.replace('/', '--')}-`));
  const branch = `publish/${key}-${path.basename(worktree).split('-').at(-1)}`;
  git(root, 'worktree', 'add', '-b', branch, worktree, base);
  const bundle = `public/artifacts/${key}/`;
  const entries = execFileSync('git', ['ls-tree', '-rz', source, '--', bundle, evidence], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString().split('\0').filter(Boolean);
  if (!entries.some(entry => entry.endsWith(`\t${bundle}index.html`))) throw new Error('Queue bundle has no index.html');
  for (const entry of entries) {
    const match = entry.match(/^(100644|100755) blob ([0-9a-f]+)\t(.+)$/s);
    if (!match) throw new Error('Episode bundles may contain only ordinary committed files');
    const file = match[3];
    if (file !== evidence && !file.startsWith(bundle)) throw new Error('Unexpected selected file');
    const destination = path.join(worktree, file);
    if (!destination.startsWith(worktree + path.sep)) throw new Error('Invalid bundle path');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, execFileSync('git', ['cat-file', 'blob', match[2]], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 }));
  }
  catalog.artifacts.push(selected[0]);
  await saveJSON(path.join(worktree, catalogFile), catalog);
  git(worktree, 'add', '--', bundle, evidence, catalogFile);
  assertScope(changedFiles(worktree, '--cached'), key);
  git(worktree, 'diff', '--cached', '--check');
  await buildLibrary(worktree);
  execFileSync(process.execPath, ['--test'], { cwd: worktree, stdio: ['ignore', 'pipe', 'pipe'] });
  const plan = { key, base, source, worktree, branch, title: selected[0].title };
  await saveJSON(planPath(worktree), plan);
  const pointer = pointerPath(root, key);
  await mkdir(path.dirname(pointer), { recursive: true });
  await saveJSON(pointer, plan);
  return { status: 'prepared', ...plan };
}

export async function publishPrepared({ root = defaultRoot, key, fetch = true } = {}) {
  checkKey(key);
  if (fetch) fetchSources(root);
  const current = git(root, 'rev-parse', 'refs/remotes/origin/main');
  const catalog = showJSON(root, current, catalogFile);
  if (catalog.artifacts.some(item => keyOf(item) === key)) return { status: 'already-published', key, commit: current };
  let pointer;
  try { pointer = await readPointer(root, key); } catch (error) { if (error.code === 'ENOENT') throw new Error('Run --prepare and browser-check the printed worktree before --push'); throw error; }
  const plan = JSON.parse(await readFile(planPath(pointer.worktree), 'utf8'));
  if (plan.key !== key || plan.worktree !== pointer.worktree) throw new Error('Publication plan mismatch');
  if (current !== plan.base) throw new Error('Main advanced after preparation. Run --prepare --fresh and repeat browser checks; never force-push.');
  const currentSource = sourceRef(root, `queue/${key}`);
  if (currentSource !== plan.source) throw new Error('Queue source changed after preparation. Run --prepare --fresh and repeat review and browser checks.');
  const currentReview = sourceReview(root, currentSource, key);
  if (currentReview.status !== 'verified') throw new Error('Source review is no longer verified');
  const worktree = plan.worktree;
  if (git(worktree, 'branch', '--show-current') !== plan.branch) throw new Error('Prepared worktree changed branch');
  if (!plan.commit && git(worktree, 'rev-parse', 'HEAD') !== plan.base) throw new Error('Prepared worktree has unexpected commits');
  const untracked = git(worktree, 'ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
  assertScope([...changedFiles(worktree, plan.base), ...untracked], key);
  const publishedCatalog = JSON.parse(await readFile(path.join(worktree, catalogFile), 'utf8'));
  const baseCatalog = showJSON(root, plan.base, catalogFile);
  const beforeOther = baseCatalog.artifacts;
  const afterOther = publishedCatalog.artifacts.filter(item => keyOf(item) !== key);
  if (JSON.stringify(beforeOther) !== JSON.stringify(afterOther) || publishedCatalog.artifacts.length !== beforeOther.length + 1 || JSON.stringify(baseCatalog.categories) !== JSON.stringify(publishedCatalog.categories))
    throw new Error('Prepared catalog changes other publications or collections');
  const expectedCatalog = structuredClone(baseCatalog);
  expectedCatalog.artifacts.push(showJSON(root, currentSource, catalogFile).artifacts.find(item => keyOf(item) === key));
  if (JSON.stringify(publishedCatalog) !== JSON.stringify(expectedCatalog)) throw new Error('Prepared catalog changes selected source metadata or unrelated catalog fields');
  const evidencePath = path.join(worktree, `docs/evidence/${key}.md`);
  if (!(await lstat(evidencePath)).isFile() || !(await readFile(evidencePath, 'utf8')).trim()) throw new Error('A nonempty ordinary evidence map is required');
  async function checkBundle(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) await checkBundle(path.join(directory, entry.name));
      else if (!entry.isFile()) throw new Error('Episode bundles may contain only ordinary files');
    }
  }
  const bundlePath = path.join(worktree, `public/artifacts/${key}`);
  if (!(await lstat(bundlePath)).isDirectory()) throw new Error('Episode bundle must be an ordinary directory');
  await checkBundle(bundlePath);
  await buildLibrary(worktree);
  execFileSync(process.execPath, ['--test'], { cwd: worktree, stdio: ['ignore', 'pipe', 'pipe'] });
  if (!plan.commit) {
    git(worktree, 'add', '--', `public/artifacts/${key}/`, `docs/evidence/${key}.md`, catalogFile);
    assertScope(changedFiles(worktree, '--cached', plan.base), key);
    const stagedTree = git(worktree, 'write-tree');
    if (git(worktree, 'rev-parse', `${stagedTree}:public/artifacts/${key}`) !== currentReview.bundleTree ||
        git(worktree, 'show', `${stagedTree}:docs/evidence/${key}.md`) !== git(root, 'show', `${currentSource}:docs/evidence/${key}.md`))
      throw new Error('Prepared artifact or evidence changed after source review. Update and review the queue branch, then prepare again.');
    git(worktree, 'diff', '--cached', '--check');
    git(worktree, 'commit', '-m', `Publish ${plan.title} reading companion`);
    plan.commit = git(worktree, 'rev-parse', 'HEAD');
    await saveJSON(planPath(worktree), plan);
  } else if (git(worktree, 'rev-parse', 'HEAD') !== plan.commit || git(worktree, 'status', '--porcelain')) throw new Error('Prepared publication commit changed; inspect before retrying');
  // A normal push rejects concurrent main changes. Never force.
  git(worktree, 'push', 'origin', `${plan.commit}:refs/heads/main`);
  return { status: 'pushed', key, commit: plan.commit, worktree };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (args[0] === '--list') {
      for (const item of await listQueue()) console.log(`${keyOf(item)}\t${item.reviewStatus}\t${item.branch}\t${item.title}\t${item.notes || ''}`);
    } else {
      const [key, ...flags] = args;
      if (flags.some(flag => !['--prepare', '--push', '--fresh'].includes(flag)) || flags.includes('--prepare') && flags.includes('--push') || flags.includes('--fresh') && flags.includes('--push')) throw new Error('Use collection/id with --prepare [--fresh] or --push');
      const result = flags.includes('--push') ? await publishPrepared({ key }) : await preparePublication({ key, fresh: flags.includes('--fresh') });
      console.log(JSON.stringify(result, null, 2));
      if (result.status === 'prepared') console.log('Review the staged diff and browser-check this worktree, then run this command with --push.');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
