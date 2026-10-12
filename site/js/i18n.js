// Language switch: English, Kiswahili (SW) and Kalenjin (KAL).
//
// The pages are written in English. When a visitor picks another language, this
// script swaps each piece of text for its translation, found by looking the
// English up in js/i18n-<code>.js (a list of "English": "translation" lines).
// Text with no translation simply stays in English, so a page that has not been
// translated yet still works. The pick is remembered on the device and moves
// with the visitor from page to page.
//
// What is looked up, so a translator knows what to write (the same rules are
// used by tools/i18n.mjs to list the text):
//   - a piece of text with nothing inside it: its text
//   - a paragraph with a link, bold or highlighted word in it: "H:" + its HTML
//     (keep the tags and links exactly as in the English)
//   - a label, placeholder or tooltip: "A:" + the text
//   - the page title: "T:" + the title
//
// A language is listed in the switcher once it is marked reviewed below: do that
// only when a fluent speaker has checked it. A listed language whose file has no
// translations yet (Kalenjin, for now) does not change the page: picking it shows
// a "coming soon" note instead. A language that is not reviewed can still be
// previewed by adding ?lang=<code> to any page address.
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', label: 'EN', name: 'English', htmlLang: 'en', reviewed: true },
    { code: 'sw', label: 'SW', name: 'Kiswahili', htmlLang: 'sw', reviewed: true },
    { code: 'kal', label: 'KAL', name: 'Kalenjin', htmlLang: 'kln', reviewed: true }
  ];

  var root = document.documentElement;
  var thisScript = document.currentScript;
  var base = thisScript && thisScript.src ? thisScript.src.replace(/i18n\.js(\?.*)?$/, '') : 'js/';

  function find(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  // ---- remembering the choice (the same two places the theme uses) ----
  var MARK = /(^|;)sa-lang=([a-z]+)(?=;|$)/;
  function savedLang() {
    // the device keeps only a reviewed language; the tab may also be holding one
    // being previewed with ?lang=
    var v = null;
    try { v = localStorage.getItem('lang'); } catch (e) { /* storage blocked */ }
    var l = find(v);
    if (l && l.reviewed) return l.code;
    var m = MARK.exec(window.name || '');
    l = m ? find(m[2]) : null;
    return l ? l.code : null;
  }
  function saveLang(code) {
    try { if (code === 'en') localStorage.removeItem('lang'); else localStorage.setItem('lang', code); } catch (e) { /* storage blocked: the tab still carries it */ }
    var name = (window.name || '').replace(MARK, '').replace(/^;+|;+$/g, '');
    if (code !== 'en') name = name ? name + ';sa-lang=' + code : 'sa-lang=' + code;
    try { window.name = name; } catch (e) { /* not allowed here */ }
  }
  function urlLang() {
    var m = /[?&]lang=([a-z]+)/.exec(window.location.search);
    return m && find(m[1]) ? m[1] : null;
  }

  // ---- swapping the text ----
  var SKIP = /^(SCRIPT|STYLE|SVG|NOSCRIPT|TEMPLATE|TEXTAREA|INPUT|SELECT|OPTION|CODE)$/i;
  var INLINE = /^(STRONG|EM|B|I|A|SPAN|BR|WBR|SVG|SMALL|SUP|CODE)$/i;
  var EMPHASIS = /^(STRONG|EM|B|I|A)$/i;
  var dict = {};
  var records = [];       // everything changed, so English can be put back
  var current = 'en';
  var observer = null;
  var originalTitle = null;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function setHtml(el, html) {
    // keep the element's own children (their classes, links and any script
    // watching them) and only swap the words in and around them
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var originals = Array.prototype.slice.call(el.children);
    var out = [];
    var i = 0;
    Array.prototype.slice.call(tpl.content.childNodes).forEach(function (n) {
      if (n.nodeType === 1) {
        var o = originals[i++];
        if (o) { o.innerHTML = n.innerHTML; out.push(o); } else out.push(n);
      } else out.push(n);
    });
    el.textContent = '';
    out.forEach(function (n) { el.appendChild(n); });
  }

  function textNode(n) {
    var key = norm(n.data);
    var t = key && dict[key];
    if (!t) return;
    var lead = /^\s*/.exec(n.data)[0];
    var trail = /\s*$/.exec(n.data)[0];
    records.push({ node: n, text: n.data });
    n.data = lead + t + trail;
  }

  function walk(el) {
    if (el.nodeType !== 1 || SKIP.test(el.tagName) || el.hasAttribute('data-no-i18n') || el.closest('svg')) return;
    var kids = el.children;
    if (!kids.length) {
      var key = norm(el.textContent);
      var t = key && dict[key];
      if (t) { records.push({ el: el, text: el.textContent }); el.textContent = t; }
      return;
    }
    var nodes = Array.prototype.slice.call(el.childNodes);
    var hasText = nodes.some(function (n) { return n.nodeType === 3 && norm(n.data); });
    if (hasText) {
      var all = Array.prototype.every.call(kids, function (k) { return INLINE.test(k.tagName); });
      var marked = Array.prototype.some.call(kids, function (k) { return EMPHASIS.test(k.tagName) || (k.tagName === 'SPAN' && k.classList.contains('hero-mark')); });
      if (all && marked) {
        var h = dict['H:' + norm(el.innerHTML)];
        if (h) { records.push({ el: el, html: el.innerHTML }); setHtml(el, h); return; }
      }
      nodes.forEach(function (n) { if (n.nodeType === 3) textNode(n); });
    }
    Array.prototype.slice.call(kids).forEach(walk);
  }

  function attributes(scope) {
    var list = scope.querySelectorAll ? scope.querySelectorAll('[placeholder],[aria-label],[title]') : [];
    var all = Array.prototype.slice.call(list);
    if (scope.getAttribute && (scope.hasAttribute('placeholder') || scope.hasAttribute('aria-label') || scope.hasAttribute('title'))) all.unshift(scope);
    all.forEach(function (el) {
      ['placeholder', 'aria-label', 'title'].forEach(function (a) {
        var v = el.getAttribute(a);
        var t = v && dict['A:' + norm(v)];
        if (t) { records.push({ el: el, attr: a, text: v }); el.setAttribute(a, t); }
      });
    });
  }

  function translate(scope) {
    walk(scope);
    attributes(scope);
  }

  function restore() {
    while (records.length) {
      var r = records.pop();
      if (r.node) r.node.data = r.text;
      else if (r.attr) r.el.setAttribute(r.attr, r.text);
      else if (r.html != null) setHtml(r.el, r.html);
      else r.el.textContent = r.text;
    }
    if (originalTitle != null) document.title = originalTitle;
  }

  function apply(code) {
    if (observer) observer.disconnect();
    restore();
    originalTitle = null;
    current = code;
    var lang = find(code);
    root.setAttribute('lang', lang ? lang.htmlLang : 'en');
    if (code !== 'en') {
      dict = (window.SA_I18N && window.SA_I18N[code]) || {};
      // the whole page, so pop-ups that are added straight to the body (the
      // consultation chooser, the "coming soon" note) are translated too
      Array.prototype.slice.call(document.body.children).forEach(translate);
      var t = dict['T:' + norm(document.title)];
      if (t) { originalTitle = document.title; document.title = t; }
      // text that other scripts add later (the testimonials, the team and so on)
      if (window.MutationObserver) {
        observer = new MutationObserver(function (list) {
          list.forEach(function (m) {
            Array.prototype.forEach.call(m.addedNodes, function (n) {
              if (n.nodeType === 1) translate(n);
              else if (n.nodeType === 3 && n.parentNode) textNode(n);
            });
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
    syncButtons();
  }

  function load(code, done) {
    if (code === 'en' || (window.SA_I18N && window.SA_I18N[code])) { done(); return; }
    var s = document.createElement('script');
    s.src = base + 'i18n-' + code + '.js';
    s.onload = done;
    s.onerror = done;
    document.head.appendChild(s);
  }

  function hasWords(code) {
    var d = window.SA_I18N && window.SA_I18N[code];
    return !!d && Object.keys(d).length > 0;
  }

  // a short note for a language that has no translations yet
  var noteTimer = null;
  function comingSoon(lang) {
    var old = document.querySelector('.lang-note');
    if (old) old.parentNode.removeChild(old);
    var note = document.createElement('div');
    note.className = 'lang-note';
    note.setAttribute('role', 'status');
    note.setAttribute('data-no-i18n', '');
    note.textContent = lang.name + ' is coming soon. Tafsiri ya ' + lang.name + ' inakuja hivi karibuni.';
    document.body.appendChild(note);
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 6000);
  }

  function ready() { root.className = root.className.replace(/\s*i18n-wait/, ''); }

  function choose(code, remember) {
    load(code, function () {
      // nothing written yet: leave the page as it is and say so (and do not
      // remember it, so the visitor is not left on a language with no words)
      if (code !== 'en' && !hasWords(code)) {
        if (remember) comingSoon(find(code));
        ready();
        return;
      }
      apply(code);
      ready();
      if (remember) saveLang(code);
    });
  }

  // ---- the switcher ----
  var switchers = [];
  function syncButtons() {
    switchers.forEach(function (box) {
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-lang') === current ? 'true' : 'false');
      });
    });
  }

  function build(className) {
    var shown = LANGS.filter(function (l) { return l.reviewed; });
    if (shown.length < 2) return null;
    var box = document.createElement('div');
    box.className = 'lang-switch ' + className;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Language');
    shown.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = l.label;
      b.setAttribute('data-lang', l.code);
      b.setAttribute('lang', l.htmlLang);
      b.setAttribute('aria-label', l.name);
      b.addEventListener('click', function () { choose(l.code, true); });
      box.appendChild(b);
    });
    switchers.push(box);
    return box;
  }

  function addSwitchers() {
    var cta = document.querySelector('.header-cta');
    var nav = document.querySelector('.primary-nav');
    var a = build('lang-switch-bar');
    if (a && cta) cta.insertBefore(a, cta.firstChild);
    var b = build('lang-switch-menu');
    if (b && nav) (nav.querySelector('.nav-actions') || nav).appendChild(b);
  }

  function start() {
    addSwitchers();
    // a language in the address (even one not yet reviewed) is remembered too,
    // so a reviewer can click through the site in it
    var fromUrl = urlLang();
    var code = fromUrl || savedLang() || 'en';
    if (fromUrl && fromUrl !== 'en') saveLangPreview(fromUrl);
    syncButtons();
    if (code !== 'en') choose(code, false);
    else ready();
  }

  function saveLangPreview(code) {
    // only the tab remembers an unreviewed language (not the device)
    var name = (window.name || '').replace(MARK, '').replace(/^;+|;+$/g, '');
    name = name ? name + ';sa-lang=' + code : 'sa-lang=' + code;
    try { window.name = name; } catch (e) { /* not allowed here */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
