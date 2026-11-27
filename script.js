const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.querySelector('.sr-only').textContent = expanded ? 'Open menu' : 'Close menu';
  nav.classList.toggle('menu-open', !expanded);
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  nav.classList.remove('menu-open');
}));

document.querySelectorAll('[data-placeholder-player] .play-toggle').forEach(button => button.addEventListener('click', () => {
  const paused = button.classList.toggle('is-paused');
  button.setAttribute('aria-pressed', String(!paused));
  button.setAttribute('aria-label', paused ? 'Play video placeholder' : 'Pause video placeholder');
  button.querySelector('.control-caption').textContent = paused ? 'Play' : 'Pause';
}));
document.querySelectorAll('[data-placeholder-player] .sound-toggle').forEach(button => button.addEventListener('click', () => {
  const soundOn = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(soundOn));
  button.setAttribute('aria-label', soundOn ? 'Sound on. Video footage not yet supplied' : 'Turn sound on');
  button.firstElementChild.textContent = soundOn ? 'Sound on' : 'Sound off';
}));

const player = document.querySelector('.player-dialog');
document.querySelectorAll('[data-open-player]').forEach(button => button.addEventListener('click', () => player?.showModal()));
document.querySelector('.dialog-close')?.addEventListener('click', () => player?.close());
player?.addEventListener('click', event => { if (event.target === player) player.close(); });
document.querySelector('.dialog-play')?.addEventListener('click', event => {
  event.currentTarget.textContent = event.currentTarget.textContent === 'Play' ? 'Pause' : 'Play';
});
document.querySelector('.dialog-sound')?.addEventListener('click', event => {
  event.currentTarget.textContent = event.currentTarget.textContent === 'Sound on' ? 'Sound off' : 'Sound on';
});

const stickyCta = document.querySelector('.mobile-sticky-cta');
const heroSection = document.querySelector('.hero, .page-hero');
if (stickyCta && heroSection && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => stickyCta.classList.toggle('is-visible', !entry.isIntersecting), { threshold: 0 }).observe(heroSection);
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const interest = contactForm.elements.namedItem('interest');
  const params = new URLSearchParams(window.location.search);
  if (params.get('offer') === 'proof-shoot' && interest) interest.value = 'Proof Shoot';
  const status = contactForm.querySelector('[data-form-status]');
  const sent = document.querySelector('[data-form-sent]');
  const button = contactForm.querySelector('button[type="submit"]');
  contactForm.elements.namedItem('started').value = Date.now();
  const showSent = () => { contactForm.hidden = true; if (sent) { sent.hidden = false; sent.querySelectorAll('.mark').forEach(m => m.classList.add('is-in')); } };
  if (params.get('sent') === '1') showSent();
  const fallback = () => {
    const f = new FormData(contactForm);
    const body = `Name: ${f.get('name')}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone') || ''}\nInterested in: ${f.get('interest')}\nNext job: ${f.get('next-job') || ''}`;
    return `mailto:hello@mediaseed.co?subject=${encodeURIComponent('Book a 15-minute jobsite content plan')}&body=${encodeURIComponent(body)}`;
  };
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const label = button.textContent;
    button.disabled = true; button.textContent = 'Sending...';
    status.textContent = '';
    try {
      const res = await fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), headers: { accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not send');
      showSent();
    } catch (err) {
      status.innerHTML = `That did not go through. Please try again, or <a class="text-link" href="${fallback()}">email me directly</a>.`;
      button.disabled = false; button.textContent = label;
    }
  });
}

// Hero video: play/pause and sound
document.querySelectorAll('[data-hero-player]').forEach(frame => {
  const video = frame.querySelector('video');
  const play = frame.querySelector('.play-toggle');
  const sound = frame.querySelector('.sound-toggle');
  if (!video) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { video.removeAttribute('autoplay'); video.pause(); play?.classList.add('is-paused'); play?.querySelector('.control-caption') && (play.querySelector('.control-caption').textContent = 'Play'); }
  play?.addEventListener('click', () => {
    if (video.paused) { video.play(); } else { video.pause(); }
    const paused = video.paused;
    play.classList.toggle('is-paused', paused);
    play.setAttribute('aria-pressed', String(!paused));
    play.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    play.querySelector('.control-caption').textContent = paused ? 'Play' : 'Pause';
  });
  sound?.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play();
    sound.setAttribute('aria-pressed', String(!video.muted));
    sound.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    sound.firstElementChild.textContent = video.muted ? 'Sound off' : 'Sound on';
  });
});

// Butter yellow reveal: highlights and step lines draw in as they scroll into view
(() => {
  const targets = document.querySelectorAll('h1, h2, .mark, .process-list li, .steps-list li');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-motion');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.4 });
  targets.forEach(t => io.observe(t));
})();

// ===== Intro: remember per session, tap to skip =====
(() => {
  const intro = document.querySelector('.intro');
  if (!intro || document.documentElement.classList.contains('intro-seen')) return;
  try { sessionStorage.setItem('ms-intro', '1'); } catch (e) {}
  intro.addEventListener('click', () => {
    intro.classList.add('skip');
    document.documentElement.style.setProperty('--intro-delay', '.35s');
  });
  intro.addEventListener('animationend', e => { if (e.animationName === 'intro-out') intro.remove(); });
})();

// ===== Motion: split h1 words, scroll reveals, progress line =====
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-motion');
  let wi = 0;
  document.querySelectorAll('h1.word-split').forEach(h => {
    h.classList.add('split');
    [...h.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--wi', wi++);
          w.append(inner); frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) {
        const w = document.createElement('span'); w.className = 'w';
        const inner = document.createElement('span'); inner.style.setProperty('--wi', wi++);
        node.replaceWith(w); inner.append(node); w.append(inner);
      }
    });
  });
  // Every section enters differently
  const tagAll = (sel, cls, extra) => document.querySelectorAll(sel).forEach(el => {
    const i = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--i', i % 6); el.classList.add('rv', cls); if (extra) extra(el, i);
  });
  tagAll('.clip-card', 'rv-wipe');
  tagAll('.tier-card', 'rv-deal', (el, i) => el.style.setProperty('--rot', ((i % 2 ? 1 : -1) * (5 + i * 3)) + 'deg'));
  tagAll('.inside-item', 'rv-side', (el, i) => el.style.setProperty('--dx', ((i % 2 ? 1 : -1) * 70) + 'px'));
  tagAll('.trade-proof-card', 'rv-slide');
  tagAll('.process-list > li, .steps-list > li', 'rv-drop');
  tagAll('.proof-card', 'rv-tilt');
  tagAll('.invite-card, .steps-invite', 'rv-open');

  // Headings: split into letters, each section gets its own entrance
  const effects = ['fx-drop', 'fx-scatter', 'fx-flip', 'fx-focus', 'fx-skew', 'fx-rise'];
  const seed = [...location.pathname].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max) => (Math.random() * (max - min) + min).toFixed(1);
  const splitChars = h => {
    let ci = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const wd = document.createElement('span'); wd.className = 'wd';
          [...part].forEach(ch => {
            const c = document.createElement('span'); c.className = 'ch'; c.textContent = ch;
            c.style.cssText = `--ci:${ci++};--rx:${rand(-160, 160)}px;--ry:${rand(-120, 120)}px;--rr:${rand(-45, 45)}deg`;
            wd.append(c);
          });
          frag.append(wd);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    h.setAttribute('aria-label', h.textContent.trim());
    walk(h);
  };
  document.querySelectorAll('main h2').forEach((h, n) => {
    splitChars(h);
    h.classList.add('rv', 'fx', effects[(n + seed) % effects.length]);
  });
  document.querySelectorAll('h1').forEach(h => {
    splitChars(h);
    // The homepage hero headline always assembles from every angle
    h.classList.add('fx', h.closest('.hero') ? 'fx-scatter' : effects[(seed + 3) % effects.length]);
  });

  // Everything else (subheads, paragraphs, small labels): one calm, satisfying rise
  const cardSel = '.clip-card, .tier-card, .inside-item, .trade-proof-card, .proof-card, .invite-card, .steps-invite, .process-list > li, .steps-list > li, .kinetic, h1, h2';
  document.querySelectorAll('main p, main h3, main h4, main .eyebrow, main .hero-actions, main .page-cta .button, main ul:not([class]) > li').forEach(el => {
    if (el.closest(cardSel)) return;
    const i = [...el.parentElement.children].indexOf(el);
    el.classList.add('rv', 'rv-text'); el.style.setProperty('--i', i % 6);
  });
  const proxies = new Map();
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { (proxies.get(e.target) || [e.target]).forEach(t => t.classList.add('is-in')); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  // Clip-path reveals hide the element from the observer, so watch its parent instead
  document.querySelectorAll('.rv, h1, .mark').forEach(el => {
    if (el.matches('.rv-wipe, .rv-open')) {
      const host = el.parentElement;
      if (!proxies.has(host)) { proxies.set(host, []); io.observe(host); }
      proxies.get(host).push(el);
    } else io.observe(el);
  });


  const header = document.querySelector('.site-header');
  if (header) {
    const bar = document.createElement('div'); bar.className = 'scroll-progress'; header.append(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
    };
    addEventListener('scroll', update, { passive: true }); update();
  }
})();

// ===== Video scrubber: drag to any point (hero + any [data-video]) =====
document.querySelectorAll('[data-hero-player], [data-video]').forEach(frame => {
  const video = frame.querySelector('video');
  if (!video) return;
  const scrub = document.createElement('input');
  scrub.type = 'range'; scrub.className = 'scrub'; scrub.min = 0; scrub.max = 1000; scrub.step = 1; scrub.value = 0;
  scrub.setAttribute('aria-label', 'Seek video');
  frame.append(scrub);
  let dragging = false;
  const paint = () => { const pct = video.duration ? video.currentTime / video.duration : 0; scrub.style.setProperty('--pct', (pct * 100) + '%'); if (!dragging) scrub.value = Math.round(pct * 1000); };
  video.addEventListener('timeupdate', paint);
  video.addEventListener('loadedmetadata', paint);
  const seek = () => { if (video.duration) { video.currentTime = scrub.value / 1000 * video.duration; scrub.style.setProperty('--pct', (scrub.value / 10) + '%'); } };
  scrub.addEventListener('pointerdown', () => { dragging = true; });
  scrub.addEventListener('input', seek);
  scrub.addEventListener('change', () => { dragging = false; seek(); });
  addEventListener('pointerup', () => { dragging = false; });
});

// Kinetic word bands drift sideways as you scroll (slow, eased)
(() => {
  const bands = [...document.querySelectorAll('.kinetic')];
  if (!bands.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const TRAVEL = 18; // percent of the row width over a full pass
  const state = bands.map(() => ({ cur: 0, target: 0 }));
  const measure = () => bands.forEach((b, i) => {
    const r = b.getBoundingClientRect();
    state[i].target = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
  });
  const tick = () => {
    bands.forEach((b, i) => {
      const s = state[i];
      s.cur += (s.target - s.cur) * 0.06;
      b.querySelectorAll('.kinetic-row').forEach(row => {
        const dir = Number(row.dataset.dir);
        row.firstElementChild.style.transform = `translate3d(${dir < 0 ? -s.cur * TRAVEL : -TRAVEL + s.cur * TRAVEL}%,0,0)`;
      });
    });
    requestAnimationFrame(tick);
  };
  addEventListener('scroll', measure, { passive: true }); addEventListener('resize', measure);
  measure(); bands.forEach((b, i) => { state[i].cur = state[i].target; }); tick();
})();
