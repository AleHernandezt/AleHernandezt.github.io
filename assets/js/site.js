// Interacciones: nav, reveals 3D, parallax, tilt y reflejo del glass.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  requestAnimationFrame(() => root.classList.add('loaded'));

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
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      el.addEventListener('transitionend', () => el.classList.add('is-done'), { once: true });
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px 6% 0px', threshold: 0 });
  reveals.forEach((el) => io.observe(el));

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
  // Ícono T 3D: extrusión, relieve y rotación entre las combinaciones de marca
  // Orden: rojo, verde, beige, turquesa (los dos verdes nunca van seguidos)
  const T_VARIANTS = [
    { bg: '#D31F26', fg: '#F8ECD4', side: '#A3161C', deep: '#C9B48C', glow: 'rgba(211, 31, 38, .42)' },
    { bg: '#597C6E', fg: '#94D8BF', side: '#3E5B4F', deep: '#5E9C86', glow: 'rgba(31, 46, 40, .38)' },
    { bg: '#F8ECD4', fg: '#D31F26', side: '#E2CCA2', deep: '#9E1419', glow: 'rgba(211, 31, 38, .28)' },
    { bg: '#94D8BF', fg: '#597C6E', side: '#6DB49A', deep: '#3D5A4E', glow: 'rgba(90, 124, 110, .38)' },
  ];
  const paintT = (t, v) => {
    t.style.setProperty('--t-bg', v.bg);
    t.style.setProperty('--t-fg', v.fg);
    t.style.setProperty('--t-side', v.side);
    t.style.setProperty('--t-deep', v.deep);
    t.style.setProperty('--t-glow', v.glow);
  };
  document.querySelectorAll('.t3d').forEach((t) => {
    const face = t.querySelector('.face');
    const glyph = t.querySelector('.glyph');
    const depth = 14;
    for (let i = depth; i >= 1; i--) {
      const layer = document.createElement('span');
      layer.className = i === depth ? 'layer base' : 'layer';
      layer.style.transform = `translateZ(${-i * 1.6}px)`;
      t.insertBefore(layer, face);
    }
    // La T sobresale de la cara con varias copias apiladas
    for (let i = 1; i <= 6; i++) {
      const copy = glyph.cloneNode(true);
      copy.style.transform = `translateZ(${i * 1.4}px)`;
      t.appendChild(copy);
    }
    glyph.style.transform = 'translateZ(0.6px)';

    let index = Number(t.dataset.variant) || 0;
    let spin = 0;
    let visible = true;
    paintT(t, T_VARIANTS[index]);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(t);
    setInterval(() => {
      if (!visible || document.hidden) return;
      index = (index + 1) % T_VARIANTS.length;
      t.classList.remove('morph');
      void t.offsetWidth;
      t.classList.add('morph');
      if (!reduce) {
        spin += 360;
        t.style.setProperty('--spin', `${spin}deg`);
      }
      setTimeout(() => paintT(t, T_VARIANTS[index]), reduce ? 0 : 450);
    }, 4200);
  });

  // Próximas salidas publicadas en tripealo.app (assets/data/trips.json, actualizado por una GitHub Action)
  const tripsBox = document.querySelector('[data-trips]');
  if (tripsBox) {
    const lang = tripsBox.dataset.lang || 'es';
    const t = lang === 'en'
      ? { by: 'with' }
      : { by: 'con' };
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = new Date().toLocaleDateString('en-CA');
    fetch('/assets/data/trips.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const trips = (data.trips || []).filter((trip) => trip.date >= today).slice(0, 3);
        if (!trips.length) return;
        tripsBox.innerHTML = trips.map((trip) => {
          const place = trip.destination && trip.destination !== trip.title ? `${trip.destination} · ` : '';
          return `<a class="trip" data-tilt="7" href="${esc(trip.url)}" target="_blank" rel="noopener">
            <span class="trip-img">
              <img src="${esc(trip.image)}" alt="${esc(trip.title)}" loading="lazy" decoding="async">
            </span>
            <span class="trip-body">
              <b>${esc(trip.title)}</b>
              <span>${esc(place)}${t.by} ${esc(trip.agency)}</span>
              ${trip.tags && trip.tags.length ? `<span class="trip-tags">${trip.tags.map((tag) => `<i>${esc(tag)}</i>`).join('')}</span>` : ''}
            </span>
          </a>`;
        }).join('');
        tripsBox.classList.add('is-ready');
        if (finePointer && !reduce) tripsBox.querySelectorAll('[data-tilt]').forEach((el) => tilt(el, 7));
      })
      .catch(() => {});
  }

  // Puntos de la línea de tiempo
  const tlItems = document.querySelectorAll('.tl-item');
  const tlIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in'));
  }, { rootMargin: '0px 0px -40% 0px' });
  tlItems.forEach((el) => tlIo.observe(el));

  // Scroll: progreso, nav auto-ocultable, parallax y línea de tiempo
  const progress = document.querySelector('.progress');
  const photos = [...document.querySelectorAll('.photo img')];
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

    if (!reduce) {
      photos.forEach((img) => {
        const box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        const t = (box.top + box.height / 2 - vh / 2) / (vh + box.height);
        img.style.setProperty('--py', `${(-t * box.height * 0.18).toFixed(1)}px`);
      });
    }

    if (tl) {
      const r = tl.getBoundingClientRect();
      const v = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      tl.style.setProperty('--tl', v.toFixed(3));
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

  if (finePointer) {
    document.querySelectorAll('[data-tilt]').forEach((el) => tilt(el, Number(el.dataset.tilt) || 10));
  }

  // Retrato del hero: inclinación con el puntero o con el giroscopio implícito del scroll en móvil
  const portrait = document.querySelector('.portrait');
  const hero = document.querySelector('.hero');
  if (portrait && hero) {
    if (finePointer) {
      hero.addEventListener('pointermove', (e) => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        portrait.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
        portrait.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
      });
      hero.addEventListener('pointerleave', () => {
        portrait.style.setProperty('--rx', '0deg');
        portrait.style.setProperty('--ry', '0deg');
      });
    } else {
      addEventListener('scroll', () => {
        const v = Math.min(1, scrollY / innerHeight);
        portrait.style.setProperty('--rx', `${(v * 14).toFixed(2)}deg`);
        portrait.style.setProperty('--ry', `${(-v * 8).toFixed(2)}deg`);
      }, { passive: true });
    }
  }
})();
