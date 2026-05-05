// Cortex-like background: a sheet of pyramidal-cell nodes connected to neighbours.
// Activity propagates as wavefronts that travel toward the mouse cursor.
// Decorative only — guarded by `prefers-reduced-motion` in CSS.

(function () {
  const canvas = document.getElementById('cortex');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let nodes = [];
  let waves = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function layout() {
    nodes = [];
    const spacing = 58;
    const cols = Math.ceil(W / spacing) + 2;
    const rows = Math.ceil(H / spacing) + 2;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * spacing + (j % 2 ? spacing / 2 : 0) + (Math.random() - 0.5) * spacing * 0.45;
        const y = j * spacing + (Math.random() - 0.5) * spacing * 0.45;
        nodes.push({ x, y, a: 0 });
      }
    }
    // Nearest-neighbour graph (~3 edges per node).
    const maxD2 = (spacing * 1.45) ** 2;
    for (const n of nodes) {
      const cands = [];
      for (const m of nodes) {
        if (m === n) continue;
        const dx = m.x - n.x, dy = m.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxD2) cands.push({ m, d2 });
      }
      cands.sort((a, b) => a.d2 - b.d2);
      n.nbrs = cands.slice(0, 3).map(c => c.m);
    }
  }

  function spawnWave() {
    // Origin sits roughly opposite the mouse w.r.t. the canvas centre,
    // so the wavefront naturally propagates toward the cursor.
    const cx = W / 2, cy = H / 2;
    let dx = mouse.x - cx, dy = mouse.y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); }
    const nx = dx / (len || 1), ny = dy / (len || 1);
    const reach = Math.hypot(W, H) * 0.55;
    const jitter = Math.min(W, H) * 0.35;
    const ox = cx - nx * reach + (Math.random() - 0.5) * jitter;
    const oy = cy - ny * reach + (Math.random() - 0.5) * jitter;
    waves.push({
      x: ox, y: oy,
      tx: mouse.x, ty: mouse.y,
      r: 0,
      speed: 230 + Math.random() * 140,   // px / s
      thickness: 70,
      life: 1,
    });
  }

  let lastSpawn = 0;
  function update(dt, t) {
    mouse.x += (mouse.tx - mouse.x) * 0.07;
    mouse.y += (mouse.ty - mouse.y) * 0.07;

    if (t - lastSpawn > 700) { spawnWave(); lastSpawn = t; }

    const maxR = Math.hypot(W, H) * 1.4;
    for (const w of waves) {
      w.r += w.speed * dt;
      w.life -= dt * 0.35;
    }
    waves = waves.filter(w => w.life > 0 && w.r < maxR);

    for (const n of nodes) {
      let act = 0;
      for (const w of waves) {
        const dx = n.x - w.x, dy = n.y - w.y;
        const d = Math.hypot(dx, dy);
        const diff = d - w.r;
        const env = Math.exp(-(diff * diff) / (w.thickness * w.thickness));
        // Forward bias: only fire on the half-plane facing the mouse-target direction.
        const fdx = w.tx - w.x, fdy = w.ty - w.y;
        const flen = Math.hypot(fdx, fdy) || 1;
        const dot = (dx * fdx + dy * fdy) / (flen * (d || 1));
        const fwd = Math.max(0, dot);
        act += env * fwd * w.life;
      }
      // Decay + clamp; prevents flicker between frames.
      n.a = Math.max(n.a * 0.9, Math.min(1, act));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Edges.
    ctx.lineWidth = 0.7;
    for (const n of nodes) {
      for (const m of n.nbrs) {
        const a = (n.a + m.a) * 0.5;
        const base = 0.05;
        const alpha = base + a * 0.55;
        if (alpha <= base + 0.005 && Math.random() > 0.4) continue;
        ctx.strokeStyle = `rgba(80, 130, 200, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
      }
    }

    // Nodes drawn as little pyramidal-cell shapes:
    // a triangular soma with a thin apical dendrite pointing up.
    for (const n of nodes) {
      const a = n.a;
      const alpha = 0.12 + a * 0.85;
      ctx.fillStyle = `rgba(60, 120, 195, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y - 4);
      ctx.lineTo(n.x - 3, n.y + 2.5);
      ctx.lineTo(n.x + 3, n.y + 2.5);
      ctx.closePath();
      ctx.fill();

      if (a > 0.04) {
        ctx.strokeStyle = `rgba(40, 170, 210, ${a * 0.85})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y - 4);
        ctx.lineTo(n.x, n.y - 11 - a * 7);
        ctx.stroke();
      }
    }
  }

  let last = performance.now();
  let running = true;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (running) { update(dt, t); draw(); }
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', (e) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      mouse.tx = e.touches[0].clientX;
      mouse.ty = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; // Honour the OS-level setting; CSS already hides the canvas.
  }

  mouse.tx = mouse.x = window.innerWidth / 2;
  mouse.ty = mouse.y = window.innerHeight / 2;
  resize();
  requestAnimationFrame(frame);
})();
