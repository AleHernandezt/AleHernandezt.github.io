// Interacciones: nav, reveals 3D, órbita de Tripealo y Tridi, tilt, reflejo del glass y barra de contacto.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Entrada del hero (con respaldo por si el navegador no pinta frames, p. ej. pestaña en segundo plano)
  requestAnimationFrame(() => root.classList.add('loaded'));
  setTimeout(() => root.classList.add('loaded'), 120);

  // Menú móvil
  const nav = document.querySelector('.nav');
  const menuBtn = document.querySelector('.menu-btn');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  document.addEventListener('click', (e) => !nav.contains(e.target) && setMenu(false));

  // Reveals 3D
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      el.addEventListener('transitionend', () => el.classList.add('is-done'), { once: true });
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px 6% 0px', threshold: 0 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Íconos de app 3D: extrusión, relieve y rotación entre las combinaciones de cada marca
  const VARIANTS = {
    // Tripealo: rojo, verde, beige, turquesa (los dos verdes nunca seguidos)
    tripealo: [
      { '--t-bg': '#D31F26', '--t-fg': '#F8ECD4', '--t-side': '#A3161C', '--t-deep': '#C9B48C', '--t-glow': 'rgba(211, 31, 38, .42)' },
      { '--t-bg': '#597C6E', '--t-fg': '#94D8BF', '--t-side': '#3E5B4F', '--t-deep': '#5E9C86', '--t-glow': 'rgba(31, 46, 40, .38)' },
      { '--t-bg': '#F8ECD4', '--t-fg': '#D31F26', '--t-side': '#E2CCA2', '--t-deep': '#9E1419', '--t-glow': 'rgba(211, 31, 38, .28)' },
      { '--t-bg': '#94D8BF', '--t-fg': '#597C6E', '--t-side': '#6DB49A', '--t-deep': '#3D5A4E', '--t-glow': 'rgba(90, 124, 110, .38)' },
    ],
    // Tridi: grafito con Señal, Señal con grafito, tinta con Señal
    tridi: [
      { '--t-bg': '#08090B', '--t-side': '#1E2125', '--t-deep': '#3A4A10', '--t-glow': 'rgba(159, 214, 28, .35)', '--c1': '#C8FF2E', '--c2': '#9FD61C', '--c3': '#6B8F0E', '--k': '#08090B' },
      { '--t-bg': '#C8FF2E', '--t-side': '#8DB91A', '--t-deep': '#5E7A0C', '--t-glow': 'rgba(159, 214, 28, .45)', '--c1': '#2A2F35', '--c2': '#16191C', '--c3': '#08090B', '--k': '#C8FF2E' },
      { '--t-bg': '#F1F3EE', '--t-side': '#C9CDC4', '--t-deep': '#8E9A6A', '--t-glow': 'rgba(8, 9, 11, .25)', '--c1': '#C8FF2E', '--c2': '#9FD61C', '--c3': '#6B8F0E', '--k': '#08090B' },
    ],
  };
  const paint = (el, v) => Object.entries(v).forEach(([k, val]) => el.style.setProperty(k, val));

  document.querySelectorAll('.t3d').forEach((t) => {
    const brand = t.classList.contains('tridi') ? 'tridi' : 'tripealo';
    const list = VARIANTS[brand];
    const face = t.querySelector('.face');
    const glyph = t.querySelector('.glyph');
    const depth = 12;
    for (let i = depth; i >= 1; i--) {
      const layer = document.createElement('span');
      layer.className = i === depth ? 'layer base' : 'layer';
      layer.style.transform = `translateZ(${-i * 1.5}px)`;
      t.insertBefore(layer, face);
    }
    // El glifo sobresale de la cara con varias copias apiladas; la última lleva los colores
    const copies = 5;
    for (let i = 1; i <= copies; i++) {
      const copy = glyph.cloneNode(true);
      copy.style.transform = `translateZ(${i * 1.3}px)`;
      if (i === copies) copy.classList.add('top');
      t.appendChild(copy);
    }
    glyph.style.transform = 'translateZ(0.6px)';

    let index = Number(t.dataset.variant) || 0;
    let spin = 0;
    let visible = true;
    paint(t, list[index]);
    if (t.hasAttribute('data-static')) return; // íconos fijos (tarjetas)
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(t);
    const delay = Number(t.dataset.offset) || 0;
    setTimeout(() => {
      setInterval(() => {
        if (!visible || document.hidden) return;
        index = (index + 1) % list.length;
        t.classList.remove('morph');
        void t.offsetWidth;
        t.classList.add('morph');
        if (!reduce) {
          spin += 360;
          t.style.setProperty('--spin', `${spin}deg`);
        }
        setTimeout(() => paint(t, list[index]), reduce ? 0 : 450);
      }, 4400);
    }, delay);
  });

  // Órbita: Tripealo y Tridi giran alrededor del retrato, pasando por delante y por detrás
  const stage = document.querySelector('.stage');
  const orbiters = [...document.querySelectorAll('.orbiter')];
  if (stage && orbiters.length) {
    const ring = stage.querySelector('.orbit-ring');
    let rx = 0;
    let ry = 0;
    const measure = () => {
      const w = stage.offsetWidth;
      const icon = orbiters[0].querySelector('.t3d-ring').offsetWidth;
      const room = (document.documentElement.clientWidth - w) / 2;
      rx = Math.min(w * 0.78, w / 2 + room - icon / 2 - 6);
      ry = w * 0.16;
      // El anillo es la misma elipse inclinada en 3D por la que viajan los íconos
      const depthR = rx * 0.5;
      const L = Math.hypot(ry, depthR);
      ring.style.width = `${rx * 2}px`;
      ring.style.height = `${L * 2}px`;
      ring.style.transform = `translate(-50%, -50%) rotateX(${Math.atan2(depthR, ry).toFixed(4)}rad)`;
    };
    measure();
    addEventListener('resize', measure);

    const place = (angle) => {
      orbiters.forEach((o, i) => {
        const a = angle + i * Math.PI;
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;
        const front = Math.sin(a); // 1 = delante del retrato, -1 = detrás
        // Dentro de preserve-3d el orden lo decide la profundidad Z, no el z-index
        const z = front * rx * 0.5;
        const s = 0.88 + 0.08 * (front + 1) / 2;
        o.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${s.toFixed(3)})`;
        o.style.opacity = (0.55 + 0.45 * (front + 1) / 2).toFixed(2);
        o.classList.toggle('is-back', front < -0.05);
      });
    };

    if (reduce) {
      place(0); // quietos, uno a cada lado
    } else {
      let angle = -0.35;
      let last = performance.now();
      let running = true;
      new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(stage);
      const PERIOD = 18000; // ms por vuelta
      const tick = (now) => {
        const dt = Math.min(64, now - last);
        last = now;
        if (running && !document.hidden) angle += (dt / PERIOD) * Math.PI * 2;
        place(angle);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // Puntos de la línea de tiempo
  const tlIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in'));
  }, { rootMargin: '0px 0px -40% 0px' });
  document.querySelectorAll('.tl-item').forEach((el) => tlIo.observe(el));

  // Barra de contacto flotante: aparece cuando los contactos del inicio salen de vista
  const quick = document.querySelector('.quick');
  const heroDock = document.querySelector('.hero .dock');
  const contact = document.querySelector('#contacto');
  if (quick && heroDock && contact) {
    let dockVisible = true;
    let contactVisible = false;
    const sync = () => quick.classList.toggle('is-on', !dockVisible && !contactVisible);
    new IntersectionObserver(([e]) => { dockVisible = e.isIntersecting; sync(); }).observe(heroDock);
    new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(contact);
  }

  // Scroll: progreso, nav auto-ocultable, línea de tiempo y enlace activo
  const progress = document.querySelector('.progress');
  const tl = document.querySelector('.tl');
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
    if (tl) {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--tl', Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height)).toFixed(3));
    }
    let current = null;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.4) current = i; });
    links.forEach((a, i) => a.classList.toggle('is-active', i === current));
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Reflejo del glass que sigue al puntero
  document.querySelectorAll('.sheen').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  if (reduce) return;

  // Tilt 3D con el puntero (desktop)
  const tilt = (el, strength) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(x * strength).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * strength).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  };
  if (finePointer) {
    document.querySelectorAll('[data-tilt]').forEach((el) => tilt(el, Number(el.dataset.tilt) || 8));
  }

  // Retrato: inclinación con el puntero (desktop) o con el scroll (móvil)
  const portrait = document.querySelector('.portrait');
  const hero = document.querySelector('.hero');
  if (portrait && hero) {
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        portrait.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
        portrait.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
      });
      hero.addEventListener('pointerleave', () => {
        portrait.style.setProperty('--rx', '0deg');
        portrait.style.setProperty('--ry', '0deg');
      });
    } else {
      addEventListener('scroll', () => {
        const v = Math.min(1, scrollY / innerHeight);
        portrait.style.setProperty('--rx', `${(v * 12).toFixed(2)}deg`);
        portrait.style.setProperty('--ry', `${(-v * 6).toFixed(2)}deg`);
      }, { passive: true });
    }
  }
})();
