const main = document.querySelector('#main');
const search = document.querySelector('#search');
const menu = document.querySelector('#menu-toggle');
const sidebar = document.querySelector('#sidebar');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalized = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  sidebar.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  sidebar.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

try {
  const response = await fetch('/library.json');
  if (!response.ok) throw new Error('Library could not be loaded');
  const library = await response.json();
  const artifacts = [...library.artifacts].sort((a, b) => a.title.localeCompare(b.title));
  const formatDate = date => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  const categoryTitle = id => library.categories.find(c => c.id === id).title;
  const visibleCategories = library.categories.filter(c => artifacts.some(a => a.category === c.id));
  const seasons = [...new Set(artifacts.filter(a => a.category === 'acquired').map(a => a.season))].sort((a, b) => {
    return Number(b.slice(-4)) - Number(a.slice(-4)) || Number(b.startsWith('Fall')) - Number(a.startsWith('Fall'));
  });
  const entryLinks = entries => entries.map(a => `<a href="${escape(a.url)}">${escape(a.title)}</a>`).join('');
  document.querySelector('#categories').innerHTML = visibleCategories.map(category => {
    const entries = artifacts.filter(a => a.category === category.id);
    const pages = category.id === 'acquired' ? seasons.map(season => {
      const episodes = entries.filter(a => a.season === season).sort((a, b) => b.releasedOn.localeCompare(a.releasedOn) || a.title.localeCompare(b.title));
      return `<details class="season-group" open><summary><span class="chevron" aria-hidden="true">›</span><span>${escape(season)}</span></summary><div class="season-pages">${entryLinks(episodes)}</div></details>`;
    }).join('') : entryLinks(entries);
    return `<details class="collection" ${category.id === visibleCategories[0]?.id ? 'open' : ''}><summary><span class="chevron" aria-hidden="true">›</span><span>${escape(category.title)}</span><span class="count">${entries.length}</span></summary><div class="collection-pages">${pages}</div></details>`;
  }).join('');

  const entry = artifact => `<li><a class="artifact-entry" href="${escape(artifact.url)}"><p class="entry-meta"><span>${escape(artifact.category === 'acquired' ? `Acquired · ${artifact.season}` : categoryTitle(artifact.category))}</span>${artifact.releasedOn ? `<span>Released <time datetime="${artifact.releasedOn}">${formatDate(artifact.releasedOn)}</time></span>` : ''}</p><h3>${escape(artifact.title)}</h3><p class="entry-created">Created <time datetime="${artifact.addedOn}">${formatDate(artifact.addedOn)}</time></p></a></li>`;
  function archive(results, expanded) {
    const years = new Map();
    for (const artifact of results) {
      const year = artifact.addedOn.slice(0, 4);
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(artifact);
    }
    const yearSection = ([year, entries]) => `<section class="archive-year" aria-labelledby="year-${year}"><h2 id="year-${year}">${year}</h2><ul class="artifact-list">${entries.map(entry).join('')}</ul></section>`;
    const currentYear = String(new Date().getFullYear());
    const current = years.has(currentYear) ? yearSection([currentYear, years.get(currentYear)]) : '';
    const older = [...years].filter(([year]) => year !== currentYear).map(yearSection).join('');
    return current + (older ? `<details class="older-years" ${expanded ? 'open' : ''}><summary>Older</summary>${older}</details>` : '');
  }
  function showHome(query = '') {
    const terms = normalized(query.trim()).split(/\s+/).filter(Boolean);
    const results = artifacts.filter(a => {
      const text = normalized([a.title, categoryTitle(a.category), a.season || '', a.releasedOn || ''].join(' '));
      return terms.every(term => text.includes(term));
    }).sort((a, b) => b.addedOn.localeCompare(a.addedOn) || a.title.localeCompare(b.title));
    main.innerHTML = `<div class="home-content"><header class="list-header">${query ? '<h1>Search results</h1>' : ''}<span id="result-count" role="status" aria-live="polite">${results.length} ${results.length === 1 ? 'artifact' : 'artifacts'}</span></header>${query ? `<p class="search-query">Results for “${escape(query)}”</p>` : ''}${results.length ? archive(results, Boolean(query)) : `<div class="empty-state"><p>${query ? 'No matching artifacts.' : 'No artifacts yet.'}</p>${query ? '<button id="clear-search">Clear search</button>' : ''}</div>`}</div>`;
    document.querySelector('#clear-search')?.addEventListener('click', () => {
      search.value = ''; search.focus(); updateSearch();
    });
  }
  function updateSearch() {
    const value = search.value.trim();
    const url = new URL(location.href);
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    url.searchParams.delete('season');
    url.searchParams.delete('sort');
    history.replaceState(null, '', url);
    showHome(value);
  }
  document.querySelector('#search-form').addEventListener('submit', event => {
    event.preventDefault(); updateSearch(); main.focus({ preventScroll: true }); closeMenu();
  });
  search.addEventListener('input', updateSearch);
  function restoreState() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    updateSearch();
  }
  window.addEventListener('popstate', restoreState);
  restoreState();
} catch (error) {
  main.innerHTML = '<div class="home-content"><h1>The shelf is unavailable.</h1><p>Refresh the page to try again.</p></div>';
  console.error(error);
}
