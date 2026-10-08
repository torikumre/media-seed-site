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
