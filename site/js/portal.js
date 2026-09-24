// Student portal behaviour (site/portal/*.html, built by tools/generate-portal.mjs).
//
// The portal is a front end with SAMPLE DATA: nothing here talks to a server.
// What a student types (the application form, shortlisted courses) is kept in
// this browser's localStorage so the preview feels real; anything that would
// need the server (submitting, paying, downloading receipts) says so in a toast.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key));
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
    return value;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---- sample state: a student part-way through, or brand new ----
  var root = document.documentElement;
  function sampleState() { return root.getAttribute('data-sample') === 'new' ? 'new' : 'progress'; }
  $$('.p-sample').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = sampleState() === 'new' ? 'progress' : 'new';
      root.setAttribute('data-sample', next);
      try { localStorage.setItem('sa-portal-sample', next); } catch (e) { /* private mode */ }
      document.dispatchEvent(new CustomEvent('portal:sample'));
      toast(next === 'new' ? 'Showing the portal as a brand-new student sees it.' : 'Showing the portal for a student part-way through.');
    });
  });

  // ---- toast ----
  var toastEl = $('.p-toast');
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-shown');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove('is-shown'); }, 4200);
  }
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-toast]');
    if (!trigger) return;
    event.preventDefault();
    toast(trigger.getAttribute('data-toast'));
  });

  // ---- sidebar drawer (tablet and phone) ----
  var side = $('#p-side');
  var menuBtn = $('.p-menu');
  var scrim = $('.p-scrim');
  function setDrawer(open) {
    if (!side || !menuBtn) return;
    side.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (scrim) scrim.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('a', side); if (first) first.focus(); } else { menuBtn.focus(); }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setDrawer(!side.classList.contains('is-open')); });
    if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && side.classList.contains('is-open')) setDrawer(false);
    });
    var wide = window.matchMedia('(min-width: 1081px)');
    var onWide = function () { if (wide.matches && side.classList.contains('is-open')) { side.classList.remove('is-open'); if (scrim) scrim.hidden = true; document.body.style.overflow = ''; menuBtn.setAttribute('aria-expanded', 'false'); } };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  // ---- notifications ----
  var bell = $('.p-bell');
  var notes = $('#p-notes');
  function setNotes(open) {
    notes.hidden = !open;
    bell.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (bell && notes) {
    bell.addEventListener('click', function (event) { event.stopPropagation(); setNotes(notes.hidden); });
    document.addEventListener('click', function (event) { if (!notes.hidden && !notes.contains(event.target)) setNotes(false); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !notes.hidden) { setNotes(false); bell.focus(); } });
  }

  // ---- dialogs (native <dialog>: focus trap and Escape for free) ----
  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-dialog-open]');
    if (opener) {
      var dialog = document.getElementById(opener.getAttribute('data-dialog-open'));
      if (dialog && dialog.showModal) { event.preventDefault(); dialog.showModal(); }
      return;
    }
    var closer = event.target.closest('[data-dialog-close]');
    if (closer) { var d = closer.closest('dialog'); if (d) d.close(); return; }
    if (event.target.tagName === 'DIALOG') event.target.close(); // click on the backdrop
  });

  // ---- tabs (arrow keys move between them) ----
  function tabs(list, onSelect) {
    var items = $$('[role="tab"]', list);
    function select(tab, focus) {
      items.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    }
    items.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (event) {
        var key = event.key, next = null;
        if (key === 'ArrowRight' || key === 'ArrowDown') next = items[(i + 1) % items.length];
        else if (key === 'ArrowLeft' || key === 'ArrowUp') next = items[(i - 1 + items.length) % items.length];
        else if (key === 'Home') next = items[0];
        else if (key === 'End') next = items[items.length - 1];
        if (next) { event.preventDefault(); select(next, true); }
      });
    });
    return select;
  }

  // ---- sign in ----
  var signin = $('[data-signin-form]');
  if (signin) {
    var err = $('.p-form-error', signin);
    signin.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = signin.elements.email, pw = signin.elements.password;
      var problem = '';
      if (!email.value.trim() || !email.checkValidity()) problem = 'Enter the email address your counsellor gave you.';
      else if (!pw.value) problem = 'Enter your password.';
      email.setAttribute('aria-invalid', problem && problem.indexOf('email') > -1 ? 'true' : 'false');
      pw.setAttribute('aria-invalid', problem && problem.indexOf('password') > -1 ? 'true' : 'false');
      if (problem) { err.textContent = problem; err.hidden = false; (email.getAttribute('aria-invalid') === 'true' ? email : pw).focus(); return; }
      err.hidden = true;
      window.location.href = 'dashboard.html';
    });
    var forgot = $('[data-forgot]', signin);
    if (forgot) forgot.addEventListener('click', function () {
      var help = document.getElementById(forgot.getAttribute('aria-controls'));
      help.hidden = !help.hidden;
      forgot.setAttribute('aria-expanded', help.hidden ? 'false' : 'true');
    });
  }

  // ---- course suggestions: shortlist + tabs ----
  var courseList = $('.p-courses');
  if (courseList) {
    var SHORT_KEY = 'sa-portal-shortlist';
    var shortlist = store(SHORT_KEY);
    if (!Array.isArray(shortlist)) {
      shortlist = $$('.p-course.is-shortlisted', courseList).map(function (c) { return c.getAttribute('data-course'); });
    }
    var none = $('.p-courses-none');
    var panel = $('#course-panel');
    function renderShortlist() {
      $$('.p-course', courseList).forEach(function (card) {
        var on = shortlist.indexOf(card.getAttribute('data-course')) > -1;
        card.classList.toggle('is-shortlisted', on);
        $('[data-shortlist]', card).setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('[data-shortlist-count]').forEach(function (el) { el.textContent = String(shortlist.length); });
      if (none) none.hidden = !(courseList.getAttribute('data-filter') === 'shortlisted' && shortlist.length === 0);
    }
    courseList.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-shortlist]');
      if (!btn) return;
      var id = btn.getAttribute('data-shortlist');
      var at = shortlist.indexOf(id);
      if (at > -1) shortlist.splice(at, 1); else shortlist.push(id);
      store(SHORT_KEY, shortlist);
      renderShortlist();
    });
    var tabList = $('.p-tabs');
    if (tabList) tabs(tabList, function (tab) {
      courseList.setAttribute('data-filter', tab.getAttribute('data-course-filter'));
      if (panel) panel.setAttribute('aria-labelledby', tab.id);
      renderShortlist();
    });
    renderShortlist();
  }

  // ---- resources: category tabs ----
  var cats = $('.p-cats-list');
  if (cats) tabs(cats, function (tab) {
    $$('[role="tabpanel"]', cats.closest('.p-resources')).forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
  });

  // ---- table search (fees) ----
  $$('[data-table-search]').forEach(function (input) {
    var table = document.getElementById(input.getAttribute('data-table-search'));
    var rows = $$('tbody tr[data-search]', table);
    var noneRow = $('.p-table-none', table);
    var count = $('[data-table-count="' + table.id + '"]');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) { var hit = !q || row.getAttribute('data-search').indexOf(q) > -1; row.hidden = !hit; if (hit) shown++; });
      if (noneRow) noneRow.hidden = shown > 0;
      if (count) count.textContent = shown ? 'Showing 1 to ' + shown + ' of ' + rows.length + ' invoices' : 'Showing 0 of ' + rows.length + ' invoices';
    });
  });

  // ---- visa: request a service opens WhatsApp with the message written ----
  var serviceForm = $('[data-service-form]');
  if (serviceForm) {
    var serviceDialog = serviceForm.closest('dialog');
    serviceForm.addEventListener('submit', function (event) {
      var submitter = event.submitter;
      if (submitter && submitter.value === 'cancel') return; // closes the dialog
      event.preventDefault();
      var chosen = $('input[name="service"]:checked', serviceForm);
      if (!chosen) { toast('Choose the service you need.'); $('input[name="service"]', serviceForm).focus(); return; }
      var note = serviceForm.elements.note.value.trim();
      var text = 'Hello ' + serviceForm.getAttribute('data-counsellor') + ', I would like to request: ' + chosen.value + '.' + (note ? ' ' + note : '') + ' (Sent from the student portal)';
      var number = serviceForm.getAttribute('data-wa');
      window.open(number ? 'https://wa.me/' + number + '?text=' + encodeURIComponent(text) : 'mailto:admissions@studiesandawardsltd.com?subject=' + encodeURIComponent('Service request: ' + chosen.value) + '&body=' + encodeURIComponent(text), '_blank', 'noopener');
      serviceDialog.close();
      serviceForm.reset();
    });
  }

  // ---- account ----
  var avatarInput = $('[data-avatar-input]');
  if (avatarInput) avatarInput.addEventListener('change', function () {
    var file = avatarInput.files && avatarInput.files[0];
    if (!file) return;
    var img = $('[data-avatar-img]');
    img.src = URL.createObjectURL(file);
    img.hidden = false;
    $('[data-avatar-initials]').hidden = true;
    toast('Photo shown here only: it isn’t saved while the portal is a preview.');
  });
  var accountForm = $('[data-account-form]');
  if (accountForm) accountForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var bad = $$('[required]', accountForm).filter(function (f) { return !f.value.trim() || !f.checkValidity(); });
    $$('[required]', accountForm).forEach(function (f) { f.setAttribute('aria-invalid', bad.indexOf(f) > -1 ? 'true' : 'false'); });
    if (bad.length) { bad[0].focus(); toast('Fill in the fields marked with a star.'); return; }
    toast('Looks good. Saving isn’t connected yet: this is a preview.');
  });
  var pwForm = $('[data-password-form]');
  if (pwForm) pwForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var fields = $$('input', pwForm);
    var errBox = $('.p-form-error', pwForm);
    var problem = '';
    if (fields.some(function (f) { return !f.value; })) problem = 'Fill in all three fields.';
    else if (fields[1].value.length < 8) problem = 'Your new password needs at least 8 characters.';
    else if (fields[1].value !== fields[2].value) problem = 'The new passwords don’t match.';
    if (problem) { errBox.textContent = problem; errBox.hidden = false; return; }
    errBox.hidden = true;
    pwForm.reset();
    pwForm.closest('dialog').close();
    toast('Changing passwords isn’t connected yet: this is a preview. Your counsellor can reset it for you.');
  });

  // ---- sign out ----
  $$('[data-signout]').forEach(function (a) { a.addEventListener('click', function () { store('sa-portal-signed-in', null); }); });

  // ---- apply: steps, sections, saved draft, progress ----
  var form = $('#apply-form');
  if (form) {
    var DRAFT_KEY = function () { return 'sa-portal-apply-' + sampleState(); };
    // What a student part-way through has already filled in (3 of 8 profile sections).
    var SEED = {
      first_name: 'Amina', last_name: 'Chebet', gender: 'Female', marital: 'Single', dob: '2006-03-14',
      nationality: 'Kenya', citizenship: 'Kenya', education_country: 'Kenya', education_level: 'KCSE (secondary school)',
      plan_country: 'Australia', plan_level: 'Undergraduate (Bachelor’s)', plan_intake: 'January 2027', plan_field: 'Nursing',
      perm_country: 'Kenya', perm_county: 'Uasin Gishu', perm_town: 'Eldoret', perm_street: 'Kapsoya Estate, House 14',
    };
    var stepBtns = $$('[data-step]');
    var sections = $$('[data-section]', form);
    var savedText = $('[data-saved-text]');
    var lastSaved = null;

    function values() {
      var out = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.type === 'file') return;
        if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; return; }
        if (el.value) out[el.name] = el.value;
      });
      return out;
    }
    function fill(data) {
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.type === 'file') return;
        if (el.type === 'radio') el.checked = data[el.name] === el.value;
        else el.value = data[el.name] || '';
      });
    }
    function filled(el) {
      if (el.type === 'radio') return !!$('input[name="' + el.name + '"]:checked', form);
      return !!el.value.trim();
    }
    function sectionState(section) {
      var req = $$('[required]', section);
      var any = $$('input, select, textarea', section).some(function (el) { return el.name && el.type !== 'file' && filled(el); });
      var done = req.length > 0 && req.every(filled);
      return done ? 'complete' : any ? 'started' : 'empty';
    }
    function update() {
      var done = 0;
      sections.forEach(function (section) {
        var state = sectionState(section);
        if (state === 'complete') done++;
        section.classList.toggle('is-complete', state === 'complete');
        section.classList.toggle('is-started', state === 'started');
        $('[data-state-text]', section).textContent = state === 'complete' ? 'Complete' : state === 'started' ? 'In progress' : 'Not started';
      });
      var pct = Math.round(done / sections.length * 100);
      $('[data-progress-pct]').textContent = pct + '%';
      $('[data-progress-bar]').style.width = pct + '%';
      setStepState('profile', done === sections.length, done + ' of ' + sections.length + ' sections done', done > 0);

      var prefPanel = $('#panel-courses');
      var prefReq = $$('[required]', prefPanel);
      var prefDone = prefReq.every(filled);
      var prefAny = $$('input, select, textarea', prefPanel).some(function (el) { return el.name && filled(el); });
      setStepState('courses', prefDone, prefDone ? 'Complete' : prefAny ? 'In progress' : 'Not started', prefAny);

      var docs = $$('.p-doc', form);
      var docsDone = docs.filter(function (d) { return d.classList.contains('is-picked') || (sampleState() === 'progress' && d.hasAttribute('data-sample-done')); }).length;
      setStepState('documents', docsDone === docs.length, docsDone + ' of ' + docs.length + ' uploaded', docsDone > 0);
      var count = $('[data-docs-count]');
      if (count) count.textContent = docsDone + ' of ' + docs.length + ' uploaded';
    }
    function setStepState(step, complete, text, started) {
      var btn = $('[data-step="' + step + '"]');
      $('[data-step-state="' + step + '"]').textContent = text;
      btn.classList.toggle('is-complete', complete);
      btn.classList.toggle('is-started', !!started);
    }
    function save(quiet) {
      store(DRAFT_KEY(), values());
      lastSaved = Date.now();
      renderSaved();
      if (!quiet) toast('Draft saved on this device. It isn’t sent to your counsellor while the portal is a preview.');
    }
    function renderSaved() {
      if (!savedText || !lastSaved) return;
      var mins = Math.floor((Date.now() - lastSaved) / 60000);
      savedText.textContent = 'Saved on this device · ' + (mins < 1 ? 'just now' : mins === 1 ? '1 minute ago' : mins + ' minutes ago');
    }
    window.setInterval(renderSaved, 30000);
    function load() {
      var draft = store(DRAFT_KEY());
      fill(draft && typeof draft === 'object' ? draft : sampleState() === 'progress' ? SEED : {});
      $$('.p-doc', form).forEach(function (d) { d.classList.remove('is-picked'); $('.p-doc-file', d).hidden = true; $('.p-doc-picked', d).hidden = true; $('.p-doc-btn-text', d).textContent = 'Upload'; });
      update();
    }

    var saveTimer = null;
    form.addEventListener('input', function (event) {
      if (event.target.type === 'file') return;
      event.target.removeAttribute('aria-invalid');
      update();
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(function () { save(true); }, 600);
    });
    form.addEventListener('change', function (event) { if (event.target.type === 'radio') { update(); save(true); } });
    $$('[data-save-draft]').forEach(function (b) { b.addEventListener('click', function () { save(false); }); });

    // sections open and close
    $$('.p-acc-btn', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
      });
    });

    // the three steps
    var selectStep = tabs($('.p-apply-steps'), function (tab) {
      var step = tab.getAttribute('data-step');
      $$('[role="tabpanel"]', form).forEach(function (p) { p.hidden = p.id !== 'panel-' + step; });
      $$('[data-need]').forEach(function (u) { u.hidden = u.getAttribute('data-need') !== step; });
      if (window.history.replaceState) window.history.replaceState(null, '', '#' + step);
    });
    function goStep(step, focus) {
      var btn = $('[data-step="' + step + '"]');
      if (!btn) return;
      selectStep(btn, false);
      if (focus) {
        var top = $('.p-apply-steps').getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
        btn.focus({ preventScroll: true });
      }
    }
    $$('[data-go-step]').forEach(function (b) { b.addEventListener('click', function () { save(true); goStep(b.getAttribute('data-go-step'), true); }); });
    var fromHash = (window.location.hash || '').slice(1);
    if (stepBtns.some(function (b) { return b.getAttribute('data-step') === fromHash; })) goStep(fromHash, false);

    // passport photo preview
    var photoInput = $('[data-photo-input]', form);
    if (photoInput) photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast('That photo is over 2MB. Choose a smaller JPG.'); photoInput.value = ''; return; }
      var img = $('.p-photo-preview img', form);
      img.src = URL.createObjectURL(file);
      img.hidden = false;
    });
    // documents: show what was chosen (not sent anywhere in the preview)
    $$('[data-doc-input]', form).forEach(function (input) {
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var row = input.closest('.p-doc');
        if (file.size > 5 * 1024 * 1024) { toast('That file is over 5MB. Try a smaller scan or photo.'); input.value = ''; return; }
        row.classList.add('is-picked');
        var name = $('.p-doc-file', row);
        name.textContent = file.name + ' (kept on this device while the portal is a preview)';
        name.hidden = false;
        $('.p-doc-picked', row).hidden = false;
        $('.p-doc-btn-text', row).textContent = 'Replace';
        update();
      });
    });
    document.addEventListener('portal:sample', load);
    load();

    // "Apply" on a suggested course fills in preference 1 (after the draft has loaded)
    var applyCourse = store('sa-portal-apply-course');
    if (applyCourse) {
      store('sa-portal-apply-course', null);
      var f = form.elements;
      if (f.pref1_course && !f.pref1_course.value) {
        f.pref1_course.value = applyCourse.name;
        f.pref1_uni.value = applyCourse.uni;
        if (f.pref1_country) f.pref1_country.value = applyCourse.country;
        update();
        save(true);
      }
    }
  }

  // remember which course "Apply" was pressed on
  document.addEventListener('click', function (event) {
    var a = event.target.closest('[data-apply-course]');
    if (!a) return;
    var card = a.closest('.p-course');
    store('sa-portal-apply-course', {
      name: $('h2', card).textContent,
      uni: $('.p-course-uni', card).textContent,
      country: ($('.p-course-city', card).textContent.split(', ')[1] || ''),
    });
  });
})();
