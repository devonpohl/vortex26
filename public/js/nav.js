(function () {
  const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/suggested', label: 'Events' },
    { href: '/directory', label: 'Contacts' },
    { href: '/photos', label: 'Photos' },
    { href: '/poems', label: 'Poems' },
    { href: '/snake', label: 'Snake' },
    { href: '/logout', label: 'Logout' },
  ];

  function currentPath() {
    return window.location.pathname.replace(/\/+$/, '') || '/';
  }

  function isActive(href) {
    const path = currentPath();
    if (href === '/') return path === '/';
    return path.startsWith(href);
  }

  function render() {
    const mount = document.getElementById('site-header');
    if (!mount) return;

    const header = document.createElement('header');

    // Title with icon
    const h1 = document.createElement('h1');
    const icon = document.createElement('img');
    icon.src = '/img/vortex-7.svg';
    icon.alt = 'Pohler Vortex';
    icon.className = 'site-icon';
    h1.appendChild(icon);
    h1.appendChild(document.createTextNode('Pohler Vortex 2026'));
    header.appendChild(h1);

    // Hamburger button (mobile only, toggled via CSS)
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(toggle);

    // Nav
    const nav = document.createElement('nav');
    nav.id = 'main-nav';
    NAV_LINKS.forEach(function (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      if (isActive(link.href)) a.classList.add('active');
      nav.appendChild(a);
    });
    header.appendChild(nav);

    mount.replaceWith(header);

    // Toggle handler
    toggle.addEventListener('click', function () {
      const expanded = nav.classList.toggle('open');
      toggle.classList.toggle('open', expanded);
      toggle.setAttribute('aria-expanded', String(expanded));
    });

    // Close menu when a link is tapped
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
