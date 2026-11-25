(() => {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.scroll-progress');
  const nav = document.querySelector('.nav');
  let scrollQueued = false;
  function updateScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0) + '%';
    nav?.classList.toggle('scrolled', window.scrollY > 10);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-animations');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }, { threshold: .07, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal, .overview-card').forEach(el => revealObserver.observe(el));
  }

  if ('IntersectionObserver' in window) {
    const navLinks = Array.from(document.querySelectorAll('.navlinks a[href^="#"]'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      }
    }, { rootMargin: '-15% 0px -70% 0px' });
    document.querySelectorAll('section[id], footer[id]').forEach(section => observer.observe(section));
  }

  const dialog = document.getElementById('image-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const zoomedImage = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-count');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  const close = dialog.querySelector('.lightbox-close');
  const shots = [];
  let active = -1;
  let focusReturn = null;

  function updateImage(index) {
    if (!shots.length) return;
    active = (index + shots.length) % shots.length;
    const shot = shots[active];
    zoomedImage.src = shot.img.currentSrc || shot.img.src;
    zoomedImage.alt = shot.img.alt || shot.title;
    caption.textContent = shot.title;
    counter.textContent = `${active + 1} / ${shots.length}`;
    previous.hidden = next.hidden = shots.length < 2;
  }
  function openImage(index) {
    focusReturn = document.activeElement;
    updateImage(index);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    close.focus();
  }
  function closeImage() { dialog.close(); }
  document.querySelectorAll('.shot').forEach(figure => {
    const frame = figure.querySelector('.shot-frame');
    const img = figure.querySelector('img');
    if (!frame || !img) return;
    function enableZoom() {
      if (!img.naturalWidth || img.hidden || frame.classList.contains('has-image')) return;
      const title = figure.querySelector('figcaption')?.textContent.trim() || img.alt || 'Screenshot';
      const index = shots.push({ img, title }) - 1;
      frame.classList.add('has-image');
      frame.tabIndex = 0;
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-label', `View full image: ${title}`);
      frame.addEventListener('click', () => openImage(index));
      frame.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openImage(index); }
      });
    }
    if (img.complete) enableZoom();
    img.addEventListener('load', enableZoom);
  });
  close.addEventListener('click', closeImage);
  previous.addEventListener('click', () => updateImage(active - 1));
  next.addEventListener('click', () => updateImage(active + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeImage();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); updateImage(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); updateImage(active + 1); }
  });
  dialog.addEventListener('close', () => {
    zoomedImage.removeAttribute('src');
    document.body.style.overflow = '';
    if (focusReturn && typeof focusReturn.focus === 'function') focusReturn.focus();
  });
})();
