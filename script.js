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
  if (new URLSearchParams(window.location.search).get('offer') === 'proof-shoot' && interest) {
    interest.value = 'Proof Shoot';
  }
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(contactForm);
    const body = [
      `Name: ${fields.get('name')}`,
      `Email: ${fields.get('email')}`,
      `Interested in: ${fields.get('interest')}`,
      `Next job: ${fields.get('next-job') || ''}`
    ].join('\n');
    const subject = 'Book a 15-minute jobsite content plan';
    window.location.href = `mailto:hello@mediaseed.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
  document.querySelectorAll('h1').forEach(h => {
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
  const groups = ['.clip-card', '.tier-card', '.inside-item', '.trade-proof-card', '.process-list > li', '.steps-list > li', '.value-row > *', '.experience-row > *'];
  groups.forEach(sel => document.querySelectorAll(sel).forEach((el, i, all) => {
    el.classList.add('rv'); el.style.setProperty('--i', [...el.parentElement.children].indexOf(el) % 6);
  }));
  document.querySelectorAll('main h2, .section-heading > p, .proof-card, .invite-card, .steps-invite, .page-cta').forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv, h1, .mark').forEach(el => io.observe(el));

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
