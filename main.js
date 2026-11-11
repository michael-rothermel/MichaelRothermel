/* ==========================================================
   Michael Rothermel — site script
   Reads your projects from data/projects.json and your site
   details from data/site.json, then builds the page.
   You normally never need to edit this file: add and edit
   projects in Pages CMS (see README.md).
   ========================================================== */

(function () {
  'use strict';

  // Category colors. Projects are grouped in this order.
  var CATEGORIES = {
    Documentary: { color: '#2FA4D9', highlight: '#E3F3FB', accent: '#FFE14D' },
    Commercial:  { color: '#FF5FB4', highlight: '#FFE9F4', accent: '#2FA4D9' },
    Narrative:   { color: '#F2A93B', highlight: '#FDF0DA', accent: '#FF5FB4' }
  };
  var FALLBACK_CATEGORY = { color: '#9AA0A6', highlight: '#EEEAE2', accent: '#FFE14D' };
  var MAX_FEATURED = 3;
  var PLACEHOLDERS = ['', 'arch', 'alt'];

  var PLAY_ICON = '<svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true"><polygon points="8,4 22,13 8,22" fill="#1E1E2A"/></svg>';

  var ordered = [];      // every project, in index order (used by the lightbox)
  var current = -1;      // index of the project open in the lightbox
  var lastFocus = null;  // element to return focus to when the lightbox closes

  // ---------- helpers ----------
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clean(value) { return value == null ? '' : String(value).trim(); }
  function imagePath(path) {
    path = clean(path);
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return path.replace(/^\/+/, ''); // relative, so it works on any host
  }
  function cat(name) { return CATEGORIES[name] || FALLBACK_CATEGORY; }
  function metaLine(p) { return [p.client, p.status].filter(Boolean).join(' · '); }

  function stillHTML(src, placeholderIndex) {
    if (src) return '<img src="' + esc(src) + '" alt="" loading="lazy">';
    var variant = PLACEHOLDERS[placeholderIndex % PLACEHOLDERS.length];
    return '<span class="ph ' + variant + '"></span>';
  }

  // Turn a Vimeo or YouTube link into an embeddable player address.
  function embedFor(url) {
    url = clean(url);
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i))) {
      return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0' };
    }
    if ((m = url.match(/player\.vimeo\.com\/video\/(\d+)(?:\?(?:.*&)?h=([\w]+))?/i)) ||
        (m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)(?:\/([\w]+))?/i))) {
      var src = 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&dnt=1';
      if (m[2]) src += '&h=' + m[2];
      return { type: 'iframe', src: src };
    }
    if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) return { type: 'video', src: url };
    return null;
  }

  // ---------- normalize the data from the CMS ----------
  function normalize(data) {
    // Current layout: one list per category, e.g. { "documentary": [...], "commercial": [...], "narrative": [...] }.
    // Older layouts ({ "projects": [...] } or a bare list with a "category" on each project) still work.
    var list = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.projects)) list = data.projects;
    else if (data && typeof data === 'object') {
      Object.keys(data).forEach(function (key) {
        if (!Array.isArray(data[key])) return;
        var name = key.charAt(0).toUpperCase() + key.slice(1);
        data[key].forEach(function (p) { list.push(Object.assign({}, p, { category: name })); });
      });
    }
    return list
      .map(function (p) {
        return {
          title: clean(p.title),
          category: clean(p.category) || 'Other',
          client: clean(p.client),
          status: clean(p.status),
          thumbnail: imagePath(p.thumbnail),
          secondStill: imagePath(p.second_still),
          video: clean(p.video),
          credits: clean(p.credits),
          featured: p.featured === true || p.featured === 'true',
          note: clean(p.edit_note),
          hidden: p.hidden === true || p.hidden === 'true'
        };
      })
      .filter(function (p) { return p.title && !p.hidden; });
  }

  // ---------- index ----------
  function buildIndex(projects) {
    var names = Object.keys(CATEGORIES);
    projects.forEach(function (p) { if (names.indexOf(p.category) === -1) names.push(p.category); });

    var html = '';
    ordered = [];
    names.forEach(function (name) {
      var items = projects.filter(function (p) { return p.category === name; });
      if (!items.length) return;
      var c = cat(name);
      html += '<div class="group-head"><span class="swatch" aria-hidden="true" style="background:' + c.color + '"></span>' +
              '<h3>' + esc(name) + '</h3><span class="group-count">' + String(items.length).padStart(2, '0') + '</span></div>';
      html += '<div class="rows">';
      items.forEach(function (p) {
        var i = ordered.length;
        ordered.push(p);
        p.order = i;
        html += '<button type="button" class="row" data-open="' + i + '" style="--hl:' + c.highlight + '" aria-label="Watch ' + esc(p.title) + '">' +
          '<span class="row-title">' + esc(p.title) +
            (p.status ? '<span class="row-status">' + esc(p.status) + '</span>' : '') +
            '<span class="row-arrow" aria-hidden="true">▶</span></span>' +
          '<span class="row-meta">' + esc(p.client) + '</span>' +
          '<span class="pv" aria-hidden="true">' +
            '<span class="pv-bar pv-bar-1"></span>' +
            '<span class="pv-bar pv-bar-2" style="background:' + c.color + '"></span>' +
            '<span class="pv-still">' + stillHTML(p.thumbnail, i) +
              (p.thumbnail ? '' : '<span class="tint" style="background:' + c.color + '"></span>') +
            '</span>' +
            '<span class="play">' + PLAY_ICON + '</span>' +
          '</span>' +
        '</button>';
      });
      html += '</div>';
    });
    document.getElementById('index-list').innerHTML = html || '<p>Projects coming soon.</p>';
  }

  // ---------- featured: Two Shots ----------
  function buildFeatured(projects) {
    var section = document.getElementById('work');
    var picks = projects.filter(function (p) { return p.featured; }).slice(0, MAX_FEATURED);
    if (!picks.length) {
      // No featured projects ticked: hide this section and point "Work" at the index.
      section.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('a[href="#work"]'), function (a) { a.setAttribute('href', '#index'); });
      return;
    }

    document.getElementById('featured-list').innerHTML = picks.map(function (p, n) {
      var c = cat(p.category);
      var num = String(n + 1).padStart(2, '0');
      var a = p.thumbnail, b = p.secondStill || p.thumbnail;
      return '<article class="feat">' +
        '<div class="feat-copy">' +
          '<span class="feat-num">' + num + ' · ' + esc(p.category) + '</span>' +
          '<h3><a href="#" data-open="' + p.order + '">' + esc(p.title) + '</a></h3>' +
          (metaLine(p) ? '<p>' + esc(metaLine(p)) + '</p>' : '') +
          (p.note ? '<p class="feat-note">' + esc(p.note) + '</p>' : '') +
          '<a href="#" class="feat-watch" data-open="' + p.order + '">Watch →</a>' +
        '</div>' +
        '<button type="button" class="dip" data-open="' + p.order + '" aria-label="Watch ' + esc(p.title) + '">' +
          '<span class="s s-a">' + stillHTML(a, n) + '<span class="tint" style="background:' + c.color + '"></span></span>' +
          '<span class="s s-b">' + stillHTML(b, n + 1) + '<span class="tint" style="background:' + c.accent + '"></span></span>' +
          '<span class="cutline" aria-hidden="true"></span>' +
          '<span class="play" aria-hidden="true">' + PLAY_ICON + '</span>' +
        '</button>' +
      '</article>';
    }).join('');
  }

  // ---------- site details ----------
  function applySite(site) {
    site = site || {};
    var email = clean(site.email);
    if (email) {
      var link = document.getElementById('email-link');
      link.href = 'mailto:' + email;
      link.textContent = email;
    }
    var availability = clean(site.availability);
    if (availability) {
      document.getElementById('availability').textContent =
        'Booking freelance edits for ' + availability + '. Tell me the project type, timeline and deliverables.';
    }
    var quote = clean(site.testimonial_quote);
    if (quote) {
      document.getElementById('testimonial-quote').textContent = '“' + quote.replace(/^["“]|["”]$/g, '') + '”';
      document.getElementById('testimonial-name').textContent = clean(site.testimonial_name);
      document.getElementById('testimonial').hidden = false;
    }
    var social = [['Instagram', site.instagram], ['Vimeo', site.vimeo], ['LinkedIn', site.linkedin]]
      .filter(function (s) { return clean(s[1]); })
      .map(function (s) { return '<a href="' + esc(clean(s[1])) + '">' + s[0] + '</a>'; }).join('');
    document.getElementById('social-links').innerHTML = social;
  }

  // ---------- lightbox ----------
  var lb = document.getElementById('lightbox');
  var player = document.getElementById('lb-player');

  function show(i) {
    var n = ordered.length;
    if (!n) return;
    current = (i + n) % n;
    var p = ordered[current];
    var c = cat(p.category);
    lb.style.setProperty('--lb-color', c.color);
    lb.style.setProperty('--lb-accent', c.accent);
    document.getElementById('lb-cat').textContent = p.category;
    document.getElementById('lb-title').textContent = p.title;
    document.getElementById('lb-count').textContent = (current + 1) + ' / ' + n;
    document.getElementById('lb-meta').textContent = [p.category, metaLine(p)].filter(Boolean).join(' · ');
    var credits = document.getElementById('lb-credits');
    credits.textContent = p.credits;
    credits.hidden = !p.credits;

    var embed = embedFor(p.video);
    var bar = '<span aria-hidden="true" style="position:absolute;left:0;top:0;bottom:0;width:6px;z-index:2;background:' + c.color + '"></span>';
    if (embed && embed.type === 'iframe') {
      player.innerHTML = bar + '<iframe src="' + esc(embed.src) + '" title="' + esc(p.title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    } else if (embed && embed.type === 'video') {
      player.innerHTML = bar + '<video src="' + esc(embed.src) + '" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;background:#000"></video>';
    } else {
      player.innerHTML = bar + (p.thumbnail ? '<img class="poster" src="' + esc(p.thumbnail) + '" alt="">' : '') +
        '<span class="soon">Video coming soon</span>';
    }
  }

  function open(i, trigger) {
    lastFocus = trigger || document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    show(i);
    lb.querySelector('.lb-close').focus();
  }

  function close() {
    lb.hidden = true;
    player.innerHTML = ''; // stops the video
    document.body.classList.remove('lb-open');
    current = -1;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t) { e.preventDefault(); open(parseInt(t.getAttribute('data-open'), 10), t); }
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && e.target.tagName !== 'IFRAME') show(current - 1);
    else if (e.key === 'ArrowRight' && e.target.tagName !== 'IFRAME') show(current + 1);
    else if (e.key === 'Tab') {
      // keep keyboard focus inside the lightbox
      var f = lb.querySelectorAll('button, iframe, video, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- interactions ----------
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Hero: the lines become timeline clips, dodge the cursor, and a playhead follows it.
  (function heroLines() {
    var art = document.getElementById('hero-art');
    if (!art || !canHover || reduceMotion) return;
    art.classList.add('interactive');

    // Layouts in % of the art area (must match styles.css).
    var REST = {
      yellow: { l: 4, t: 40, w: 94, h: 22, r: 0 },
      blue:   { l: 38, t: 4, w: 24, h: 92, r: 0 },
      pink:   { l: 10, t: 42, w: 86, h: 20, r: -40 }
    };
    var TIMELINE = {
      pink:   { l: 30, t: 26.5, w: 44, h: 14, r: 0 },
      blue:   { l: 14, t: 43.5, w: 40, h: 14, r: 0 },
      yellow: { l: 9,  t: 60.5, w: 72, h: 14, r: 0 }
    };
    var bars = {};
    Array.prototype.forEach.call(art.querySelectorAll('[data-bar]'), function (el) { bars[el.getAttribute('data-bar')] = el; });
    var playhead = art.querySelector('.playhead');
    var timecode = art.querySelector('.timecode');
    var tcText = document.getElementById('timecode');
    var pending = null, frame = 0;

    function update() {
      frame = 0;
      var m = pending;
      if (!m) return;
      var limit = 0.05, maxTilt = 4, range = 0.45; // gentle dodge on the timeline
      Object.keys(bars).forEach(function (key) {
        var b = TIMELINE[key];
        var cx = (b.l + b.w / 2) / 100, cy = (b.t + b.h / 2) / 100;
        var a = b.r * Math.PI / 180;
        var u = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)];
        var px = m.x - cx * m.w, py = m.y - cy * m.h;
        var d = px * n[0] + py * n[1];
        var along = (px * u[0] + py * u[1]) / m.w;
        var strength = Math.max(0, 1 - Math.abs(d) / (range * m.w));
        var side = d < 0 ? -1 : 1;
        var push = -side * strength * limit * Math.min(m.w, m.h);
        var tilt = Math.max(-maxTilt, Math.min(maxTilt, -along * side * strength * 26));
        bars[key].style.transform = 'translate(' + (n[0] * push).toFixed(1) + 'px,' + (n[1] * push).toFixed(1) + 'px) rotate(' + (b.r + tilt).toFixed(2) + 'deg)';
      });
      var x = Math.max(0.08 * m.w, Math.min(0.98 * m.w, m.x));
      playhead.style.left = x + 'px';
      timecode.style.left = x + 'px';
      var secs = ((x / m.w - 0.08) / 0.9) * 30;
      var s = Math.floor(secs), f = Math.floor((secs - s) * 24);
      tcText.textContent = '00:00:' + String(s).padStart(2, '0') + ':' + String(f).padStart(2, '0');
    }

    art.addEventListener('mousemove', function (e) {
      var r = art.getBoundingClientRect();
      pending = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
      art.classList.add('is-timeline');
      if (!frame) frame = requestAnimationFrame(update);
    });
    art.addEventListener('mouseleave', function () {
      pending = null;
      art.classList.remove('is-timeline');
      Object.keys(bars).forEach(function (key) { bars[key].style.transform = ''; });
    });
    void REST; // resting layout lives in styles.css
  })();

  // 2. Approach circles: rotate one position at a time, alternating tight and spread.
  (function circles() {
    var venn = document.getElementById('venn');
    if (!venn || reduceMotion) return;
    venn.classList.add('interactive');
    var dots = venn.querySelectorAll('.c');
    var base = [-150, -30, 90], step = 0, timer = null;

    function place() {
      var R = step % 2 === 1 ? 12.4 : 23.3; // % of the box
      Array.prototype.forEach.call(dots, function (dot, i) {
        var ang = (base[i] + step * 120) * Math.PI / 180;
        dot.style.left = (50 + R * Math.cos(ang) - 30).toFixed(2) + '%';
        dot.style.top = (50 + R * Math.sin(ang) - 30).toFixed(2) + '%';
      });
    }
    function advance() { step++; place(); }

    if (canHover) {
      venn.addEventListener('mouseenter', function () {
        advance();
        clearInterval(timer);
        timer = setInterval(advance, 1300);
      });
      venn.addEventListener('mouseleave', function () { clearInterval(timer); timer = null; });
    } else {
      venn.addEventListener('click', advance); // phones: tap to rotate
    }
  })();

  // 3. Contact bars are pure CSS (see "Contact bars" in styles.css).

  // ---------- load ----------
  document.getElementById('year').textContent = new Date().getFullYear();

  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }

  Promise.all([getJSON('data/projects.json'), getJSON('data/site.json').catch(function () { return {}; })])
    .then(function (res) {
      var projects = normalize(res[0]);
      buildIndex(projects);   // sets each project's position for the lightbox
      buildFeatured(projects);
      applySite(res[1]);
    })
    .catch(function (err) {
      console.error(err);
      document.getElementById('index-list').innerHTML =
        '<p>Projects couldn’t load. If you opened this file directly from your computer, view it on the live site or a local server instead (see README).</p>';
    });
})();
