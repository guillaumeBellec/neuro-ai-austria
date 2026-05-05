// Renders upcoming and past events from data/events.json.
// Schema per entry: { date: "YYYY-MM-DD", title, speaker?, location?, link?, description? }

(function () {
  const listEl = document.getElementById('events-list');
  if (!listEl) return;

  fetch('data/events.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(render)
    .catch(() => {
      listEl.innerHTML = '<li class="ev-empty">Could not load events.</li>';
    });

  function render(events) {
    if (!Array.isArray(events)) events = [];
    const parsed = events
      .map(e => ({ ...e, _d: new Date(e.date) }))
      .filter(e => !isNaN(e._d))
      .sort((a, b) => a._d - b._d);

    fill(listEl, parsed, 'No events scheduled — check back soon.');
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

    if (Array.isArray(e.agenda) && e.agenda.length) {
      const det = document.createElement('details');
      det.className = 'ev-agenda';
      const sum = document.createElement('summary');
      sum.textContent = 'Agenda';
      det.appendChild(sum);
      const ul = document.createElement('ul');
      for (const line of e.agenda) {
        const item = document.createElement('li');
        item.textContent = line;
        ul.appendChild(item);
      }
      det.appendChild(ul);
      li.appendChild(det);
    }

    return li;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
})();
