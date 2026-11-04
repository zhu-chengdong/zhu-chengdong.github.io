(() => {
  'use strict';
  const body = document.body;
  const controls = [...document.querySelectorAll('[data-language]')];
  let current = 'en';
  function storedLanguage() { try { return localStorage.getItem('cdz-language'); } catch { return null; } }
  function setLanguage(lang, updateURL = true) {
    current = lang === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.textContent = el.dataset[current]; });
    controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === current)));
    document.title = body.dataset[current === 'zh' ? 'titleZh' : 'titleEn'];
    const description = body.dataset[current === 'zh' ? 'descZh' : 'descEn'];
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[property="og:description"]').content = description;
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, window.location.href);
      if (url.origin === location.origin && /\.html$/.test(url.pathname)) {
        url.searchParams.set('lang', current);
        link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
      }
    });
    document.querySelectorAll('.copy-status').forEach(el => { el.textContent = ''; });
    try { localStorage.setItem('cdz-language', current); } catch { /* Optional preference storage. */ }
    if (updateURL) {
      const url = new URL(location.href); url.searchParams.set('lang', current);
      try { history.replaceState(null, '', url); } catch { /* File previews may use an opaque origin. */ }
    }
  }
  const requested = new URLSearchParams(location.search).get('lang');
  setLanguage(requested === 'zh' || requested === 'en' ? requested : storedLanguage() || 'en', Boolean(requested));
  controls.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  const menu = document.querySelector('.menu-toggle');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    body.classList.toggle('nav-open', open);
  });
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); body.classList.remove('nav-open'); }
  document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    const status = button.parentElement.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(target.innerText.trim());
      status.textContent = current === 'zh' ? '已复制' : 'Copied';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange(); range.selectNodeContents(target); selection.removeAllRanges(); selection.addRange(range);
      status.textContent = current === 'zh' ? '已选中，请按 Ctrl/Cmd+C 复制' : 'Text selected. Press Ctrl/Cmd+C to copy.';
    }
  }));
  document.documentElement.classList.add('js');
})();
