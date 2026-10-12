/* One interaction model for every companion, following the Disney timeline. */
(() => {
  const root = document.querySelector('.episode-timeline');
  if (!root) return;
  const { chapters, end } = JSON.parse(root.querySelector('.episode-timeline-data').textContent);
  const track = root.querySelector('.episode-track');
  const preview = root.querySelector('.episode-preview');
  const title = preview.querySelector('strong');
  const hoverTime = preview.querySelector('.episode-hover-time');
  const range = preview.querySelector('.episode-range');
  const position = root.querySelector('.episode-current-time');
  const currentTitle = root.querySelector('.episode-current-title');
  const cursor = root.querySelector('.episode-playhead');
  const buttons = [...track.querySelectorAll('.episode-segment')];
  const header = root.closest('.topbar, .nav, .navigation') || root.closest('nav');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const stamp = value => {
    const n = Math.round(clamp(value, 0, end));
    return `${Math.floor(n / 3600)}:${String(Math.floor(n % 3600 / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  };
  const chapterAt = value => {
    let i = 0;
    for (let n = 1; n < chapters.length; n++) if (chapters[n].start <= value) i = n;
    return i;
  };
  const chapterEnd = i => chapters[i + 1]?.start ?? end;
  let suppressedFocus = null;
  function hidePreview() {
    preview.hidden = true;
  }
  function showPreview(value, pointerX) {
    const i = chapterAt(value), chapter = chapters[i];
    title.textContent = chapter.title;
    hoverTime.textContent = stamp(value);
    range.textContent = `${stamp(chapter.start)} – ${stamp(chapterEnd(i))}`;
    buttons.forEach((button, n) => {
      if (n === i) button.setAttribute('aria-describedby', preview.id);
      else button.removeAttribute('aria-describedby');
    });
    preview.hidden = false;
    const rect = track.getBoundingClientRect();
    const width = preview.getBoundingClientRect().width;
    const wanted = pointerX ?? rect.left + (chapter.start + chapterEnd(i)) / 2 / end * rect.width;
    preview.style.left = `${clamp(wanted - width / 2, 16, Math.max(16, innerWidth - width - 16))}px`;
    preview.style.top = `${rect.bottom + 10}px`;
  }
  function pointerPreview(event) {
    if (event.pointerType === 'touch') return;
    const rect = track.getBoundingClientRect();
    // The full track, including its themed edges, maps to the actual time axis.
    const value = clamp((event.clientX - rect.left) / rect.width, 0, 1) * end;
    showPreview(value, event.clientX);
  }
  track.addEventListener('pointerenter', pointerPreview);
  track.addEventListener('pointermove', pointerPreview);
  track.addEventListener('pointerleave', () => {
    const focused = buttons.indexOf(document.activeElement);
    if (focused >= 0 && document.activeElement !== suppressedFocus) showPreview(chapters[focused].start, undefined);
    else hidePreview();
  });
  function anchors() {
    const offset = header.getBoundingClientRect().height + 20;
    const bottom = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return chapters.map((chapter, i) => {
      const element = document.getElementById(chapter.target);
      if (!element || !element.getClientRects().length) return null;
      return { i, start: chapter.start, y: clamp(element.getBoundingClientRect().top + scrollY - offset, 0, bottom) };
    }).filter(Boolean);
  }
  let scheduled = false;
  function updateReadingPosition() {
    scheduled = false;
    const points = anchors(), bottom = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    let value = 0;
    if (scrollY > 0 && points.length && bottom > 0) {
      let current = 0;
      for (let n = 0; n < points.length; n++) if (points[n].y <= scrollY + 1) current = n;
      const point = points[current], next = points[current + 1];
      const lastY = next?.y ?? bottom;
      // Interpolate reading progress only between separate, ordered text anchors.
      const fraction = lastY > point.y ? clamp((scrollY - point.y) / (lastY - point.y), 0, 1) : 0;
      value = point.start + fraction * ((next?.start ?? end) - point.start);
      if (scrollY >= bottom - 1) value = end;
    }
    const i = chapterAt(value);
    position.textContent = stamp(value);
    currentTitle.textContent = chapters[i].title;
    const fraction = clamp(value / end, 0, 1);
    cursor.style.left = `calc(${fraction * 100}% - ${fraction * 2}px)`;
    buttons.forEach((button, n) => {
      if (i === n) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
  }
  function scheduleUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateReadingPosition); }
  }
  buttons.forEach((button, i) => {
    button.addEventListener('focus', () => {
      suppressedFocus = null;
      showPreview(chapters[i].start, undefined);
    });
    button.addEventListener('blur', hidePreview);
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') { suppressedFocus = button; hidePreview(); }
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : clamp(i + (event.key === 'ArrowRight' ? 1 : -1), 0, buttons.length - 1);
        buttons[next].focus();
      }
    });
  });
  function seekTarget(target, focusArticle = false) {
    for (let ancestor = target.closest('details'); ancestor; ancestor = ancestor.parentElement?.closest('details')) ancestor.open = true;
    header.querySelectorAll('details[open]').forEach(menu => menu.open = false);
    const bottom = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const y = clamp(target.getBoundingClientRect().top + scrollY - header.getBoundingClientRect().height - 20, 0, bottom);
    window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (focusArticle) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    hidePreview();
    scheduleUpdate();
  }
  header.addEventListener('click', event => {
    const link = event.target.closest('details a[href^="#"]');
    if (!link || event.defaultPrevented) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    seekTarget(target, true);
  });
  let pointerActivationTime = null;
  function rememberPointer(event) {
    const rect = track.getBoundingClientRect();
    pointerActivationTime = clamp((event.clientX - rect.left) / rect.width, 0, 1) * end;
  }
  track.addEventListener('pointerdown', rememberPointer);
  track.addEventListener('pointerup', rememberPointer);
  track.addEventListener('pointercancel', () => pointerActivationTime = null);
  track.addEventListener('click', event => {
    const button = event.target.closest('.episode-segment');
    if (!button) return;
    // Pointer clicks resolve from the same coordinate as the preview, including
    // tiny interval boundaries. PointerEvent preserves subpixel coordinates that
    // the legacy click MouseEvent rounds. Enter/Space activate the focused chapter.
    const i = event.detail === 0 || pointerActivationTime === null
      ? Number(button.dataset.episode)
      : chapterAt(pointerActivationTime);
    pointerActivationTime = null;
    const target = document.getElementById(chapters[i].target);
    if (!target) return;
    seekTarget(target);
    suppressedFocus = document.activeElement;
    hidePreview();
    scheduleUpdate();
  });
  header.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', hidePreview));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePreview(); });
  addEventListener('scroll', () => { hidePreview(); scheduleUpdate(); }, { passive: true });
  addEventListener('resize', () => { hidePreview(); scheduleUpdate(); });
  document.fonts.ready.then(scheduleUpdate);
  document.querySelectorAll('img').forEach(image => image.addEventListener('load', scheduleUpdate));
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', scheduleUpdate));
  updateReadingPosition();
})();
