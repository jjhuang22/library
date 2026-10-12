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
  const buttonChapter = button => Number(button.dataset.episode);
  const geometry = root.dataset.geometry || 'linear';
  const route = track.querySelector('.episode-route');
  const viewBox = route?.ownerSVGElement.viewBox.baseVal;
  const routeLength = route?.getTotalLength();
  const routePoints = geometry === 'path' ? Array.from({ length: 513 }, (_, i) => route.getPointAtLength(routeLength * i / 512)) : [];
  function projectRoute(x, y, scaleX = 1, scaleY = 1) {
    let closest = { distance: Infinity, fraction: 0 };
    for (let i = 0; i < routePoints.length - 1; i++) {
      const a = routePoints[i], b = routePoints[i + 1];
      const dx = (b.x - a.x) * scaleX, dy = (b.y - a.y) * scaleY;
      const px = (x - a.x) * scaleX, py = (y - a.y) * scaleY;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)));
      const distance = (px - t * dx) ** 2 + (py - t * dy) ** 2;
      if (distance < closest.distance) closest = { distance, fraction: (i + t) / 512 };
    }
    return closest;
  }
  // The circuit keeps its original corner layout. Its known cues calibrate the
  // time axis along that route, rather than replacing the circuit with a bar.
  const routeCues = geometry === 'path' ? [{ fraction: 0, time: 0 }, ...buttons.map(button => ({
    fraction: projectRoute(Number(button.dataset.x), Number(button.dataset.y)).fraction,
    time: chapters[buttonChapter(button)].start
  })), { fraction: 1, time: end }] : [];
  function interpolate(value, points, from, to) {
    let i = 0;
    for (let n = 1; n < points.length - 1; n++) if (points[n][from] <= value) i = n;
    const a = points[i], b = points[i + 1];
    const t = Math.max(0, Math.min(1, (value - a[from]) / (b[from] - a[from] || 1)));
    return a[to] + t * (b[to] - a[to]);
  }
  function eventTime(event) {
    const rect = track.getBoundingClientRect();
    if (geometry === 'path') {
      const hit = projectRoute((event.clientX - rect.left) / rect.width * viewBox.width, (event.clientY - rect.top) / rect.height * viewBox.height, rect.width / viewBox.width, rect.height / viewBox.height);
      if (hit.distance > 24 ** 2 && !event.target.closest('.episode-segment')) return null;
      return interpolate(hit.fraction, routeCues, 'fraction', 'time');
    }
    if (geometry === 'gauge') {
      const x = (event.clientX - rect.left) / rect.width * viewBox.width;
      const y = (event.clientY - rect.top) / rect.height * viewBox.height;
      const fraction = Math.max(0, Math.min(1, (x - 80) / 840));
      const arcY = 70 - 200 * fraction * (1 - fraction);
      if (Math.abs((y - arcY) * rect.height / viewBox.height) > 24 && !event.target.closest('.episode-segment')) return null;
      return fraction * end;
    }
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * end;
  }
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
      if (buttonChapter(button) === i) button.setAttribute('aria-describedby', preview.id);
      else button.removeAttribute('aria-describedby');
    });
    preview.hidden = false;
    const rect = track.getBoundingClientRect();
    const width = preview.getBoundingClientRect().width;
    const marker = buttons.find(button => buttonChapter(button) === i);
    const wanted = pointerX ?? (marker ? marker.getBoundingClientRect().left + marker.getBoundingClientRect().width / 2 : rect.left);
    preview.style.left = `${clamp(wanted - width / 2, 16, Math.max(16, innerWidth - width - 16))}px`;
    preview.style.top = `${rect.bottom + 10}px`;
  }
  function pointerPreview(event) {
    if (event.pointerType === 'touch') return;
    const value = eventTime(event);
    if (value === null) { hidePreview(); return; }
    showPreview(value, event.clientX);
  }
  track.addEventListener('pointerenter', pointerPreview);
  track.addEventListener('pointermove', pointerPreview);
  track.addEventListener('pointerleave', () => {
    const focused = buttons.indexOf(document.activeElement);
    if (focused >= 0 && document.activeElement !== suppressedFocus) showPreview(chapters[buttonChapter(buttons[focused])].start, undefined);
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
    if (geometry === 'path') {
      const distance = interpolate(value, routeCues, 'time', 'fraction');
      const point = route.getPointAtLength(distance * routeLength);
      cursor.style.left = `${point.x / viewBox.width * 100}%`;
      cursor.style.top = `${point.y / viewBox.height * 100}%`;
    } else if (geometry === 'gauge') {
      cursor.setAttribute('x2', 80 + 840 * fraction);
      cursor.setAttribute('y2', 70 - 200 * fraction * (1 - fraction));
    } else cursor.style.left = `calc(${fraction * 100}% - ${fraction * 2}px)`;
    buttons.forEach((button, n) => {
      if (i === buttonChapter(button)) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
  }
  function scheduleUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateReadingPosition); }
  }
  buttons.forEach((button, i) => {
    button.addEventListener('focus', () => {
      suppressedFocus = null;
      showPreview(chapters[buttonChapter(button)].start, undefined);
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
    pointerActivationTime = eventTime(event);
  }
  track.addEventListener('pointerdown', rememberPointer);
  track.addEventListener('pointerup', rememberPointer);
  track.addEventListener('pointercancel', () => pointerActivationTime = null);
  track.addEventListener('click', event => {
    const button = event.target.closest('.episode-segment');
    if (!button && (event.detail === 0 || pointerActivationTime === null)) return;
    // Pointer clicks resolve from the same coordinate as the preview, including
    // tiny interval boundaries. PointerEvent preserves subpixel coordinates that
    // the legacy click MouseEvent rounds. Enter/Space activate the focused chapter.
    const i = event.detail === 0 || pointerActivationTime === null
      ? buttonChapter(button)
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
