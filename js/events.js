// Renders upcoming and past events from data/events.json.
// Schema per entry: { date: "YYYY-MM-DD", title, speaker?, location?, link?, description? }

(function () {
  const upcomingEl = document.getElementById('events-upcoming');
  const pastEl = document.getElementById('events-past');
  if (!upcomingEl || !pastEl) return;

  fetch('data/events.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(render)
    .catch(() => {
      upcomingEl.innerHTML = '<li class="ev-empty">Could not load events.</li>';
    });

  function render(events) {
    if (!Array.isArray(events)) events = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const parsed = events
      .map(e => ({ ...e, _d: new Date(e.date) }))
      .filter(e => !isNaN(e._d))
      .sort((a, b) => a._d - b._d);

    const upcoming = parsed.filter(e => e._d >= today);
    const past = parsed.filter(e => e._d < today).reverse();

    fill(upcomingEl, upcoming, 'No upcoming events scheduled — check back soon.');
    fill(pastEl, past, 'No past events recorded yet.');
  }

  function fill(el, list, emptyMsg) {
    el.innerHTML = '';
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'ev-empty';
      li.textContent = emptyMsg;
      el.appendChild(li);
      return;
    }
    for (const e of list) el.appendChild(item(e));
  }

  function item(e) {
    const li = document.createElement('li');

    const time = document.createElement('time');
    time.dateTime = e.date;
    time.textContent = formatDate(e._d);
    li.appendChild(time);

    const title = document.createElement('span');
    title.className = 'ev-title';
    if (e.link) {
      const a = document.createElement('a');
      a.href = e.link;
      a.textContent = e.title || '(untitled)';
      a.target = '_blank';
      a.rel = 'noopener';
      title.appendChild(a);
    } else {
      title.textContent = e.title || '(untitled)';
    }
    li.appendChild(title);

    const metaParts = [];
    if (e.speaker) metaParts.push(e.speaker);
    if (e.location) metaParts.push(e.location);
    if (e.description) metaParts.push(e.description);
    if (metaParts.length) {
      const meta = document.createElement('span');
      meta.className = 'ev-meta';
      meta.textContent = metaParts.join(' · ');
      li.appendChild(meta);
    }
    return li;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
})();
