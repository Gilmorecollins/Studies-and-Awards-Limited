// The "Partner institutions" tab of the admin page: add, rename, change the
// courses of, or remove the schools shown in "View partners & courses" on the
// destination pages. The back end (src/worker.js) keeps the changes next to the
// original list, so "Reset" always brings the original back.
(function () {
  'use strict';

  var db = window.siteApi;
  var $ = function (id) { return document.getElementById(id); };
  if (!db || !$('view-partners')) return;

  var NAMES = { 'australia': 'Australia', 'canada': 'Canada', 'germany': 'Germany', 'united-kingdom': 'United Kingdom' };
  var data = { country: '', cities: {} };
  var loadedOnce = false;
  var noticeTimer = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function friendly(error) {
    var msg = String((error && error.message) || error || '');
    if (/failed to fetch|network/i.test(msg)) return 'Couldn’t reach the server. Check your internet connection and try again.';
    if (/session|unauthorized/i.test(msg)) return 'You’ve been signed out. Sign in again, then try once more.';
    return msg || 'Something went wrong.';
  }

  function notice(text) {
    var n = $('partners-notice');
    n.textContent = text;
    n.hidden = false;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(function () { n.hidden = true; }, 5000);
  }
  function setError(text) {
    $('partners-error').textContent = text || '';
    $('partners-error').hidden = !text;
  }

  document.addEventListener('admin:tab', function (event) {
    if (event.detail === 'view-partners' && !loadedOnce) { loadedOnce = true; load(''); }
  });
  document.addEventListener('admin:signedout', function () {
    loadedOnce = false;
    $('partners-list').textContent = '';
  });

  function load(country) {
    setError('');
    db.call('GET', '/api/admin/partners' + (country ? '?country=' + encodeURIComponent(country) : '')).then(function (res) {
      if (res.error) throw res.error;
      if (!country) {
        var select = $('partners-country');
        select.textContent = '';
        res.data.countries.forEach(function (c) {
          var o = el('option', '', NAMES[c] || c);
          o.value = c;
          select.appendChild(o);
        });
        return load(res.data.countries[0]);
      }
      data = { country: country, cities: res.data.cities };
      var citySelect = $('partners-city');
      var keep = citySelect.value;
      citySelect.textContent = '';
      Object.keys(data.cities).forEach(function (c) {
        var o = el('option', '', c + ' (' + data.cities[c].length + ')');
        o.value = c;
        citySelect.appendChild(o);
      });
      if (keep && data.cities[keep]) citySelect.value = keep;
      render();
    }).catch(function (err) { setError(friendly(err)); });
  }

  $('partners-country').addEventListener('change', function () { $('partners-city').textContent = ''; load(this.value); });
  $('partners-city').addEventListener('change', render);
  $('partners-search').addEventListener('input', render);
  $('partners-add').addEventListener('click', function () {
    var city = $('partners-city').value;
    if (!city) return;
    $('partners-search').value = '';
    var list = $('partners-list');
    var card = card0({ key: '', name: '', courses: [], state: 'new' }, city);
    list.insertBefore(card, list.firstChild);
    card.querySelector('input').focus();
  });

  function render() {
    var list = $('partners-list');
    list.textContent = '';
    var city = $('partners-city').value;
    var q = $('partners-search').value.trim().toLowerCase();
    var items = (data.cities[city] || []).filter(function (i) {
      return !q || (i.name + ' ' + i.courses.join(' ')).toLowerCase().indexOf(q) !== -1;
    });
    if (!items.length) { list.appendChild(el('p', 'admin-empty', q ? 'Nothing found.' : 'No schools in this city yet.')); return; }
    items.forEach(function (i) { list.appendChild(card0(i, city)); });
  }

  // one school
  function card0(item, city) {
    var card = el('div', 'cms-item cms-partner');
    var state = item.state;
    var removed = state === 'removed';
    card.classList.toggle('is-edited', state !== 'original');
    if (removed) card.classList.add('is-removed');

    var meta = el('div', 'cms-meta');
    meta.appendChild(el('span', 'cms-kind', 'School'));
    var badges = { added: 'Added', changed: 'Changed', removed: 'Removed', new: 'New' };
    if (badges[state]) meta.appendChild(el('span', 'cms-badge', badges[state]));
    card.appendChild(meta);

    var name = el('input', 'cms-input');
    name.type = 'text';
    name.value = item.name;
    name.maxLength = 120;
    name.placeholder = 'School name';
    name.setAttribute('aria-label', 'School name');
    name.disabled = removed;
    card.appendChild(name);

    var courses = el('textarea', 'cms-input');
    courses.rows = 4;
    courses.value = item.courses.join('\n');
    courses.placeholder = 'Courses, one per line';
    courses.setAttribute('aria-label', 'Courses for ' + (item.name || 'this school') + ', one per line');
    courses.disabled = removed;
    card.appendChild(courses);

    var actions = el('div', 'cms-actions');
    var save = el('button', 'btn btn-primary cms-save', state === 'new' ? 'Add school' : 'Save');
    save.type = 'button';
    save.disabled = state !== 'new';
    var remove = el('button', 'btn btn-outline cms-reset', state === 'added' ? 'Delete' : 'Remove');
    remove.type = 'button';
    remove.hidden = removed || state === 'new';
    var reset = el('button', 'btn btn-outline cms-reset', removed ? 'Bring it back' : 'Reset to original');
    reset.type = 'button';
    reset.hidden = !(state === 'changed' || removed);
    var status = el('span', 'cms-status');
    status.setAttribute('role', 'status');
    [save, remove, reset, status].forEach(function (n) { actions.appendChild(n); });
    card.appendChild(actions);

    var current = function () { return item.courses.join('\n'); };
    var refresh = function () {
      save.disabled = removed || (state !== 'new' && name.value.trim() === item.name && courses.value.trim() === current().trim());
      status.textContent = '';
    };
    name.addEventListener('input', refresh);
    courses.addEventListener('input', refresh);

    function keyBody() { return { country: data.country, city: city, key: item.key }; }
    function reloadKeep() { return load(data.country); }

    save.addEventListener('click', function () {
      var body = keyBody();
      body.name = name.value;
      body.courses = courses.value.split('\n');
      save.disabled = true;
      status.textContent = 'Saving…';
      db.call('PUT', '/api/admin/partners', body).then(function (res) {
        if (res.error) throw res.error;
        notice('Saved. It shows on the website within a minute.');
        return reloadKeep();
      }).catch(function (err) { status.textContent = friendly(err); save.disabled = false; });
    });

    remove.addEventListener('click', function () {
      var what = state === 'added' ? 'Delete ' : 'Remove ';
      if (!window.confirm(what + (item.name || 'this school') + ' from the website list?')) return;
      var body = keyBody();
      body.mode = state === 'added' ? 'reset' : 'remove';
      remove.disabled = true;
      db.call('DELETE', '/api/admin/partners', body).then(function (res) {
        if (res.error) throw res.error;
        notice((state === 'added' ? 'Deleted. ' : 'Removed. You can bring it back at any time. ') + 'The website updates within a minute.');
        return reloadKeep();
      }).catch(function (err) { status.textContent = friendly(err); remove.disabled = false; });
    });

    reset.addEventListener('click', function () {
      var body = keyBody();
      body.mode = 'reset';
      reset.disabled = true;
      db.call('DELETE', '/api/admin/partners', body).then(function (res) {
        if (res.error) throw res.error;
        notice('Back to the original.');
        return reloadKeep();
      }).catch(function (err) { status.textContent = friendly(err); reset.disabled = false; });
    });

    return card;
  }
})();
