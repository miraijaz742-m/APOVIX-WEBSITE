/* ==========================================================================
   APOVIX TECHNOLOGIES — Homepage behaviour
   1. Header border on scroll
   2. Mobile overlay menu
   3. Scroll reveal (respects prefers-reduced-motion)
   4. Contact form validation (no backend — logs to console)
   5. Hero matrix rain (canvas, right-weighted, sparse)
   6. Footer year
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. HEADER — hairline border once the page has scrolled
     ---------------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  var scrollQueued = false;
  var wasScrolled = null;

  function applyScrollState() {
    scrollQueued = false;
    if (!header) return;
    var isScrolled = window.scrollY > 8;
    // Only touch the DOM when the state actually flips. A scroll event fires
    // dozens of times a second; writing a class on every one of them forces
    // needless style recalculation.
    if (isScrolled === wasScrolled) return;
    wasScrolled = isScrolled;
    header.classList.toggle('is-scrolled', isScrolled);
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(applyScrollState);
  }

  applyScrollState();
  window.addEventListener('scroll', onScroll, { passive: true });


  /* ------------------------------------------------------------------------
     2. MOBILE MENU — full-screen overlay
     ---------------------------------------------------------------------- */
  var menu      = document.querySelector('[data-menu]');
  var openBtn   = document.querySelector('[data-menu-open]');
  var closeBtn  = document.querySelector('[data-menu-close]');
  var menuLinks = document.querySelectorAll('[data-menu-link]');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    document.body.classList.add('is-locked');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(returnFocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.body.classList.remove('is-locked');
    if (openBtn) {
      openBtn.setAttribute('aria-expanded', 'false');
      if (returnFocus) openBtn.focus();
    }
  }

  if (openBtn)  openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });

  Array.prototype.forEach.call(menuLinks, function (link) {
    link.addEventListener('click', function () { closeMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu(true);
  });

  // Close the overlay if the viewport grows past the desktop breakpoint
  window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) {
    if (e.matches) closeMenu(false);
  });


  /* ------------------------------------------------------------------------
     3. SCROLL REVEAL — fade and rise on entry, once per element
     ---------------------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   // never animates a second time
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    Array.prototype.forEach.call(revealables, function (el) {
      // Anything already on screen when the page loads is shown immediately,
      // with no fade. Animating it produces a flash of empty page on arrival,
      // which reads as the page still loading.
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) {
        el.classList.add('is-visible', 'is-instant');
        return;
      }
      observer.observe(el);
    });

    // Safety net. If the observer never fires for something — an odd browser,
    // a display change, a bug — content would stay invisible while scrolling
    // past it. After five seconds anything still hidden is simply shown.
    window.setTimeout(function () {
      Array.prototype.forEach.call(revealables, function (el) {
        if (!el.classList.contains('is-visible')) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, 5000);
  }


  /* ------------------------------------------------------------------------
     4. CONTACT FORM — client-side validation, inline errors, console output
     ---------------------------------------------------------------------- */
  var form   = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  // field id -> validator returning an error string, or '' when valid
  var rules = {
    name: function (v) {
      if (!v) return 'Please enter your name.';
      if (v.length < 2) return 'That name looks too short.';
      return '';
    },
    email: function (v) {
      if (!v) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Please enter a valid email address.';
      return '';
    },
    'project-type': function (v) {
      if (!v) return 'Please choose a project type.';
      return '';
    },
    message: function (v) {
      if (!v) return 'Please tell us about the project.';
      if (v.length < 10) return 'A little more detail would help — 10 characters minimum.';
      return '';
    }
  };

  function setError(field, message) {
    var errorEl = document.getElementById(field.id + '-error');
    if (!errorEl) return;

    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      field.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.textContent = '';
      errorEl.hidden = true;
      field.removeAttribute('aria-invalid');
    }
  }

  function validateField(id) {
    var field = document.getElementById(id);
    if (!field) return true;
    var message = rules[id](field.value.trim());
    setError(field, message);
    return !message;
  }

  if (form) {
    // Re-validate a field once it has been touched and corrected
    Object.keys(rules).forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;

      field.addEventListener('blur', function () { validateField(id); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validateField(id);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;

      Object.keys(rules).forEach(function (id) {
        var valid = validateField(id);
        if (!valid && !firstInvalid) firstInvalid = document.getElementById(id);
      });

      if (firstInvalid) {
        if (status) status.hidden = true;
        firstInvalid.focus();
        return;
      }

      var payload = {
        name:        document.getElementById('name').value.trim(),
        email:       document.getElementById('email').value.trim(),
        company:     document.getElementById('company').value.trim(),
        projectType: document.getElementById('project-type').value,
        message:     document.getElementById('message').value.trim()
      };

      var submitBtn = form.querySelector('button[type="submit"], .btn');
      var originalLabel = submitBtn ? submitBtn.textContent : '';

      function say(message, isError) {
        if (!status) return;
        status.textContent = message;
        status.hidden = false;
        status.classList.toggle('form__status--error', !!isError);
      }

      // assets/js/enquiry.js registers this once Firebase has loaded. If it is
      // absent — module blocked, offline, Firestore not enabled — fall back to
      // logging so the form never silently swallows an enquiry.
      if (typeof window.apovixSubmitEnquiry !== 'function') {
        console.log('Apovix enquiry (no backend attached):', payload);
        say('Thanks — your enquiry has been captured. We reply within one working day.');
        form.reset();
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      window.apovixSubmitEnquiry(payload).then(function () {
        say('Thanks — your enquiry has reached us. We reply within one working day.');
        form.reset();
      }).catch(function (err) {
        console.error('Apovix enquiry failed:', err);
        say(
          'Sorry — that did not send. Please email us directly at aijazm742@gmail.com ' +
          'or call +91 91034 00985.',
          true
        );
      }).finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      });
    });
  }


  /* ------------------------------------------------------------------------
     5. HERO MATRIX RAIN
     Deliberately sparse: only a fraction of the columns ever run, and the
     chance of a column being active rises towards the right edge. Tune
     RAIN.density / RAIN.alpha to make it heavier or lighter.
     ---------------------------------------------------------------------- */
  var RAIN = {
    colWidth: 16,     // px between columns
    rowHeight: 17,    // px between glyphs in a trail
    fontSize: 13,
    density: 0.95,    // base chance a column is active (rises toward the right)
    alpha: 0.80,      // peak opacity of the orange trail
    fps: 30
  };

  var GLYPHS = ('アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレ' +
                '0101101001{}[]<>/\\*+=;:$#').split('');

  function initRain() {
    var canvas = document.querySelector('[data-rain]');
    if (!canvas || reduceMotion) return;

    // Hidden below 560px in CSS — do not burn a phone's battery animating a
    // canvas nobody can see.
    if (window.matchMedia('(max-width: 560px)').matches) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var columns = [];
    var width = 0, height = 0, rows = 0;
    var running = false, rafId = null, last = 0, acc = 0;
    var frameMs = 1000 / RAIN.fps;

    function makeColumn(index, seeded) {
      // Depth: nearer columns are drawn slightly larger and stronger, farther
      // ones smaller and fainter, so the field reads with some layering
      // instead of as one flat sheet.
      var scale = 0.85 + Math.random() * 0.35;

      return {
        x: index * RAIN.colWidth + RAIN.colWidth / 2,
        // Seeded columns start part-way down so the field is populated on the
        // first frame; recycled ones wait a random beat above the top edge so
        // the columns do not fall into lockstep.
        head: seeded ? Math.random() * rows : -(2 + Math.random() * 9),
        speed: (3.5 + Math.random() * 7) * scale,  // glyph rows per second
        length: 12 + Math.floor(Math.random() * 19),
        hot: Math.random() < 0.3,                  // brighter head on some columns
        scale: scale,
        dim: 0.7 + (scale - 0.85) * 1.45,          // 0.70 → 1.21
        font: Math.round(RAIN.fontSize * scale) +
              'px Consolas, "SFMono-Regular", Menlo, monospace',
        chars: []
      };
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      rows = Math.ceil(height / RAIN.rowHeight) + 2;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = RAIN.fontSize + 'px Consolas, "SFMono-Regular", Menlo, monospace';

      var count = Math.floor(width / RAIN.colWidth);
      columns = [];
      for (var i = 0; i < count; i++) {
        // rightBias: 0 at the left edge of the canvas, 1 at the right
        var rightBias = count > 1 ? i / (count - 1) : 1;
        if (Math.random() < RAIN.density + rightBias * 0.20) {
          columns.push(makeColumn(i, true));
        }
      }
    }

    function draw(dt) {
      ctx.clearRect(0, 0, width, height);

      for (var c = 0; c < columns.length; c++) {
        var col = columns[c];
        col.head += col.speed * dt;

        var headRow = Math.floor(col.head);

        // Recycle once the whole trail has fallen past the bottom
        if (headRow - col.length > rows) {
          columns[c] = makeColumn(Math.round((col.x - RAIN.colWidth / 2) / RAIN.colWidth), false);
          continue;
        }
        if (headRow < 0) continue;

        ctx.font = col.font;

        for (var j = 0; j < col.length; j++) {
          var row = headRow - j;
          if (row < 0 || row > rows) continue;

          // Occasionally mutate a glyph so the trail flickers
          if (!col.chars[row] || Math.random() < 0.06) {
            col.chars[row] = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }

          // Gentler-than-quadratic falloff keeps the tail readable to its end
          var fade = 1 - j / col.length;
          var a = RAIN.alpha * fade * fade * (0.55 + 0.45 * fade) * col.dim;

          // Trail in --accent, head in the deeper --accent-dark so the leading
          // glyph reads as the brightest point of the column.
          if (j === 0) {
            ctx.fillStyle = 'rgba(204, 82, 0, ' +
              (a + (col.hot ? 0.38 : 0.24) * col.dim).toFixed(3) + ')';
          } else {
            ctx.fillStyle = 'rgba(255, 102, 0, ' + a.toFixed(3) + ')';
          }

          ctx.fillText(col.chars[row], col.x, row * RAIN.rowHeight);
        }
      }
    }

    function loop(now) {
      if (!running) return;
      rafId = window.requestAnimationFrame(loop);

      var dt = now - last;
      last = now;
      if (dt > 250) dt = 250;          // tab was backgrounded — do not jump

      acc += dt;
      if (acc < frameMs) return;
      acc = 0;

      draw(dt / 1000);
    }

    function start() {
      if (running || !columns.length) return;
      running = true;
      last = window.performance.now();
      acc = 0;
      rafId = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    resize();

    // Only animate while the hero is actually on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    // Rebuild only when the width really changed.
    //
    // On a phone, scrolling hides and shows the browser's URL bar, which fires
    // resize with a new innerHeight on almost every scroll. Rebuilding there
    // regenerated every column from Math.random() and cleared the canvas, so
    // the hero appeared to restart each time you scrolled. The hero's height is
    // driven by its content and vw-based padding, not by viewport height, so a
    // height-only change needs no work at all.
    var lastWidth = window.innerWidth;
    var resizeTimer;

    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;

      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var wasRunning = running;
        stop();
        resize();
        if (wasRunning) start();
      }, 150);
    });

    // Re-measure once webfonts settle and the hero reaches its final height
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        var wasRunning = running;
        stop();
        resize();
        if (wasRunning) start();
      });
    }
  }

  initRain();


  /* ------------------------------------------------------------------------
     5b. NAV DROPDOWNS
     Click, not hover: hover menus are unusable on touch, and a click target
     behaves the same on every device. The panel starts [hidden] in the markup
     so with JS off nothing dangles open.
     ---------------------------------------------------------------------- */
  var dropdowns = document.querySelectorAll('[data-dropdown]');

  function closeAllDropdowns(except) {
    Array.prototype.forEach.call(dropdowns, function (item) {
      if (item === except) return;
      var trigger = item.querySelector('[data-dropdown-trigger]');
      var panel = item.querySelector('[data-dropdown-panel]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    });
  }

  Array.prototype.forEach.call(dropdowns, function (item) {
    var trigger = item.querySelector('[data-dropdown-trigger]');
    var panel = item.querySelector('[data-dropdown-panel]');
    if (!trigger || !panel) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = trigger.getAttribute('aria-expanded') === 'true';
      closeAllDropdowns(item);
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });

    // Choosing something closes the menu behind you
    panel.addEventListener('click', function (e) {
      if (!e.target.closest('a')) return;
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    });
  });

  if (dropdowns.length) {
    document.addEventListener('click', function () { closeAllDropdowns(null); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllDropdowns(null);
    });
  }


  /* ------------------------------------------------------------------------
     6. FOOTER YEAR
     ---------------------------------------------------------------------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());


  /* ------------------------------------------------------------------------
     7. LEGAL PAGE CONTENTS — open on desktop, collapsed on phones
     The markup is a <details> so it still collapses with JS off; here we just
     force it open from the breakpoint where it sits in the sidebar.
     ---------------------------------------------------------------------- */
  var tocs = document.querySelectorAll('[data-toc]');

  if (tocs.length) {
    var wide = window.matchMedia('(min-width: 960px)');

    function syncToc(e) {
      Array.prototype.forEach.call(tocs, function (toc) { toc.open = e.matches; });
    }

    syncToc(wide);
    wide.addEventListener('change', syncToc);

    // Tapping a clause on a phone should close the list behind you
    Array.prototype.forEach.call(tocs, function (toc) {
      toc.addEventListener('click', function (e) {
        if (wide.matches) return;
        if (e.target.closest('a')) toc.open = false;
      });
    });
  }

})();
