// The "Website text" and "Pictures" tabs of the admin page: change the words,
// links, descriptions and pictures anywhere on the site, from one place.
//
// What can be edited is listed by the back end (src/content.js) straight from
// the pages, so it is always up to date. An edit is stored against the original
// wording; "Reset" puts the original back.
(function () {
  'use strict';

  var db = window.siteApi;
  var $ = function (id) { return document.getElementById(id); };
  if (!db || !$('admin-tabs')) return;

  var KIND_LABELS = { text: 'Words', meta: 'Description', alt: 'Picture description', link: 'Link' };
  var TEAM = 'team';
  var DEST = 'destinations-cards';
  function isData(path) { return path === TEAM || path === DEST; }
  var views = ['view-list', 'view-text', 'view-images', 'view-partners'];
  var pages = [];
  var loaded = { text: false, images: false };
  var noticeTimers = {};

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
    if (/too large/i.test(msg)) return 'That picture is too large. Try a smaller one.';
    return msg || 'Something went wrong.';
  }

  function notice(id, text) {
    var node = $(id);
    node.textContent = text;
    node.hidden = false;
    window.clearTimeout(noticeTimers[id]);
    noticeTimers[id] = window.setTimeout(function () { node.hidden = true; }, 5000);
  }

  function setError(id, text) {
    $(id).textContent = text || '';
    $(id).hidden = !text;
  }

  // ---------- tabs ----------

  function selectTab(viewId) {
    views.forEach(function (v) { $(v).hidden = v !== viewId; });
    Array.prototype.forEach.call($('admin-tabs').querySelectorAll('button'), function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-tab') === viewId ? 'true' : 'false');
    });
    if (viewId === 'view-text' && !loaded.text) { loaded.text = true; loadPages(); }
    if (viewId === 'view-images' && !loaded.images) { loaded.images = true; loadImages(); }
    document.dispatchEvent(new CustomEvent('admin:tab', { detail: viewId }));
  }

  Array.prototype.forEach.call($('admin-tabs').querySelectorAll('button'), function (b) {
    b.addEventListener('click', function () { selectTab(b.getAttribute('data-tab')); });
  });

  document.addEventListener('admin:signedin', function () {
    $('admin-tabs').hidden = false;
    loaded.text = false;
    loaded.images = false;
    selectTab('view-list');
  });
  document.addEventListener('admin:signedout', function () {
    $('admin-tabs').hidden = true;
    $('view-text').hidden = true;
    $('view-images').hidden = true;
    $('view-partners').hidden = true;
    $('text-groups').textContent = '';
    $('images-groups').textContent = '';
  });

  // ---------- website text ----------

  var current = { path: '/', items: [] };

  function loadPages() {
    db.call('GET', '/api/admin/content/pages').then(function (res) {
      if (res.error) throw res.error;
      pages = res.data;
      var select = $('text-page');
      select.textContent = '';
      pages.forEach(function (p) {
        var o = el('option', '', p.label);
        o.value = p.path;
        select.appendChild(o);
      });
      loadPage(pages[0].path);
    }).catch(function (err) { setError('text-error', friendly(err)); });
  }

  $('text-page').addEventListener('change', function () { loadPage(this.value); });

  function loadPage(path) {
    setError('text-error', '');
    $('text-groups').textContent = '';
    $('text-groups').appendChild(el('p', 'admin-loading', 'Loading…'));
    $('text-open').hidden = isData(path);
    $('text-open').href = isData(path) ? '../' : '..' + (path === '/' ? '/' : path);
    db.call('GET', '/api/admin/content?path=' + encodeURIComponent(path)).then(function (res) {
      if (res.error) throw res.error;
      current = { path: path, items: res.data.items };
      renderText();
    }).catch(function (err) {
      $('text-groups').textContent = '';
      setError('text-error', friendly(err));
    });
  }

  $('text-search').addEventListener('input', renderText);
  $('text-edited').addEventListener('change', renderText);

  function renderText() {
    var box = $('text-groups');
    box.textContent = '';
    var q = $('text-search').value.trim().toLowerCase();
    var onlyEdited = $('text-edited').checked;
    var groups = [];
    var byName = {};
    current.items.forEach(function (item) {
      if (onlyEdited && item.value === null) return;
      var hay = (item.original + ' ' + (item.value || '') + ' ' + (item.label || '')).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      var name = item.section || 'Page';
      if (!byName[name]) { byName[name] = []; groups.push({ name: name, items: byName[name] }); }
      byName[name].push(item);
    });
    if (!groups.length) {
      box.appendChild(el('p', 'admin-empty', onlyEdited ? 'Nothing on this page has been changed yet.' : 'Nothing found.'));
      return;
    }
    groups.forEach(function (g, i) {
      var details = el('details', 'cms-group');
      details.open = !!q || groups.length < 6 || i < 3;
      var summary = el('summary');
      summary.appendChild(el('span', 'cms-group-name', g.name));
      summary.appendChild(el('span', 'cms-group-count', String(g.items.length)));
      details.appendChild(summary);
      g.items.forEach(function (item) { details.appendChild(itemRow(item)); });
      box.appendChild(details);
    });
  }

  function autosize(area) {
    area.style.height = 'auto';
    area.style.height = Math.min(area.scrollHeight + 2, 360) + 'px';
  }

  // the built-in Swahili for some wording, from js/i18n-sw.js
  function builtInSw(item) {
    var dict = window.SA_I18N && window.SA_I18N.sw;
    if (!dict) return '';
    return dict[(item.kind === 'alt' ? 'A:' : '') + item.original] || '';
  }

  function itemRow(item) {
    var data = isData(current.path);
    var row = el('div', 'cms-item');
    var edited = item.value !== null;
    var hasSw = item.kind === 'text' || item.kind === 'alt';
    var swBase = hasSw ? (item.sw || builtInSw(item)) : '';
    if (edited || item.sw) row.classList.add('is-edited');

    var meta = el('div', 'cms-meta');
    meta.appendChild(el('span', 'cms-kind', item.label && item.kind !== 'link' ? item.label : KIND_LABELS[item.kind]));
    if (item.kind === 'link' && item.label) meta.appendChild(el('span', 'cms-label', 'on “' + item.label + '”'));
    if (edited) meta.appendChild(el('span', 'cms-badge', 'Changed'));
    row.appendChild(meta);

    var field = el(item.kind === 'link' ? 'input' : 'textarea', 'cms-input');
    if (item.kind === 'link') field.type = 'text';
    else field.rows = 1;
    field.value = edited ? item.value : item.original;
    field.setAttribute('aria-label', (KIND_LABELS[item.kind] || 'Text') + ': ' + item.original.slice(0, 60));
    field.spellcheck = item.kind !== 'link';
    row.appendChild(field);
    if (field.tagName === 'TEXTAREA') {
      window.setTimeout(function () { autosize(field); }, 0);
      field.addEventListener('input', function () { autosize(field); });
    }

    // the Swahili version
    var swField = null;
    if (hasSw) {
      var details = el('details', 'cms-sw');
      details.open = !!item.sw;
      details.appendChild(el('summary', '', item.sw ? 'Swahili version (changed)' : 'Swahili version'));
      swField = el('textarea', 'cms-input');
      swField.rows = 1;
      swField.value = swBase;
      swField.lang = 'sw';
      swField.setAttribute('aria-label', 'Swahili: ' + item.original.slice(0, 60));
      swField.placeholder = 'No Swahili yet: visitors see the English';
      details.appendChild(swField);
      details.appendChild(el('p', 'cms-hint', 'Shown when a visitor picks Swahili. If you change the English, update this too.'));
      details.addEventListener('toggle', function () { if (details.open) autosize(swField); });
      swField.addEventListener('input', function () { autosize(swField); });
      row.appendChild(details);
    }

    var actions = el('div', 'cms-actions');
    var only = null;
    if (!data) {
      var label = el('label', 'cms-check');
      only = el('input');
      only.type = 'checkbox';
      only.checked = item.scope !== '*';
      label.appendChild(only);
      label.appendChild(document.createTextNode(' Only on this page'));
      label.title = 'Leave this unticked to change it everywhere the same words appear.';
      actions.appendChild(label);
    }
    var save = el('button', 'btn btn-primary cms-save', 'Save');
    save.type = 'button';
    save.disabled = true;
    var reset = el('button', 'btn btn-outline cms-reset', 'Reset to original');
    reset.type = 'button';
    reset.hidden = !(edited || item.sw);
    var status = el('span', 'cms-status');
    status.setAttribute('role', 'status');
    actions.appendChild(save);
    actions.appendChild(reset);
    actions.appendChild(status);
    row.appendChild(actions);

    var original = el('p', 'cms-original');
    var showOriginal = function () {
      original.textContent = '';
      original.hidden = !(item.value !== null);
      if (item.value !== null) {
        original.appendChild(el('strong', '', 'Original: '));
        original.appendChild(document.createTextNode(item.original));
      }
    };
    showOriginal();
    row.appendChild(original);

    var baseline = function () { return edited ? item.value : item.original; };
    var swChanged = function () { return !!swField && swField.value.trim() !== swBase.trim(); };
    var changed = function () {
      var scopeChanged = only && (item.value !== null || item.sw) && (only.checked ? current.path : '*') !== item.scope;
      return field.value.trim() !== baseline().trim() || scopeChanged || swChanged();
    };
    var refresh = function () { save.disabled = !changed(); status.textContent = ''; };
    field.addEventListener('input', refresh);
    if (swField) swField.addEventListener('input', refresh);
    if (only) only.addEventListener('change', refresh);

    function keyFor(scope) {
      return { scope: scope, kind: item.kind, original: item.original };
    }

    function paint() {
      edited = item.value !== null;
      swBase = hasSw ? (item.sw || builtInSw(item)) : '';
      row.classList.toggle('is-edited', edited || !!item.sw);
      reset.hidden = !(edited || item.sw);
      field.value = edited ? item.value : item.original;
      if (swField) {
        swField.value = swBase;
        swField.closest('details').querySelector('summary').textContent = item.sw ? 'Swahili version (changed)' : 'Swahili version';
      }
      showOriginal();
      var badge = meta.querySelector('.cms-badge');
      if (edited && !badge) meta.appendChild(el('span', 'cms-badge', 'Changed'));
      if (!edited && badge) badge.remove();
      autosize(field);
      if (swField) autosize(swField);
    }

    save.addEventListener('click', function () {
      var scope = data ? item.scope : (only.checked ? current.path : '*');
      var body = keyFor(scope);
      body.value = field.value;
      var englishChanged = field.value.trim() !== baseline().trim();
      if (swField && swChanged()) body.sw = swField.value;
      else if (swField && !item.sw) body.sw = null; // nothing of its own to keep
      save.disabled = true;
      status.textContent = 'Saving…';
      var hadSwBuiltIn = hasSw && !item.sw && !!builtInSw(item);
      db.call('PUT', '/api/admin/content', body).then(function (res) {
        if (res.error) throw res.error;
        var oldScope = item.scope;
        var hadOld = item.value !== null || !!item.sw;
        item.value = res.data.value;
        item.sw = res.data.sw;
        item.scope = scope;
        if (hadOld && oldScope !== scope && (item.value !== null || item.sw)) {
          return db.call('DELETE', '/api/admin/content', keyFor(oldScope));
        }
      }).then(function () {
        paint();
        status.textContent = englishChanged && hadSwBuiltIn && !item.sw
          ? 'Saved. Swahili visitors will see the new English until you update the Swahili version.'
          : 'Saved. It shows on the website within a minute.';
      }).catch(function (err) {
        status.textContent = friendly(err);
        save.disabled = false;
      });
    });

    reset.addEventListener('click', function () {
      reset.disabled = true;
      status.textContent = 'Resetting…';
      db.call('DELETE', '/api/admin/content', keyFor(item.scope)).then(function (res) {
        if (res.error) throw res.error;
        item.value = null;
        item.sw = null;
        item.scope = data ? item.scope : '*';
        if (only) only.checked = false;
        paint();
        save.disabled = true;
        status.textContent = 'Back to the original.';
      }).catch(function (err) { status.textContent = friendly(err); })
        .then(function () { reset.disabled = false; });
    });

    return row;
  }

  // ---------- pictures ----------

  var imageList = [];

  function loadImages() {
    setError('images-error', '');
    $('images-groups').textContent = '';
    $('images-groups').appendChild(el('p', 'admin-loading', 'Loading…'));
    db.call('GET', '/api/admin/images').then(function (res) {
      if (res.error) throw res.error;
      imageList = res.data;
      renderImages();
    }).catch(function (err) {
      $('images-groups').textContent = '';
      setError('images-error', friendly(err));
    });
  }

  $('images-search').addEventListener('input', renderImages);
  $('images-edited').addEventListener('change', renderImages);

  function folderOf(path) {
    var parts = path.split('/');
    return parts.length > 2 ? parts[1] : 'other';
  }

  function renderImages() {
    var box = $('images-groups');
    box.textContent = '';
    var q = $('images-search').value.trim().toLowerCase();
    var onlyEdited = $('images-edited').checked;
    var groups = {};
    var order = [];
    imageList.forEach(function (img) {
      if (onlyEdited && !img.value) return;
      if (q && (img.path + ' ' + img.usedOn.join(' ')).toLowerCase().indexOf(q) === -1) return;
      var f = folderOf(img.path);
      if (!groups[f]) { groups[f] = []; order.push(f); }
      groups[f].push(img);
    });
    if (!order.length) {
      box.appendChild(el('p', 'admin-empty', onlyEdited ? 'No picture has been replaced yet.' : 'Nothing found.'));
      return;
    }
    order.forEach(function (f) {
      var section = el('section', 'cms-folder');
      section.appendChild(el('h2', '', f.charAt(0).toUpperCase() + f.slice(1).replace(/-/g, ' ')));
      var grid = el('div', 'cms-images');
      groups[f].forEach(function (img) { grid.appendChild(imageCard(img)); });
      section.appendChild(grid);
      box.appendChild(section);
    });
  }

  function imageCard(img) {
    var card = el('div', 'cms-image' + (img.value ? ' is-edited' : ''));
    var thumb = el('div', 'cms-thumb');
    var pic = el('img');
    pic.alt = '';
    pic.loading = 'lazy';
    pic.src = img.value || '/' + img.path;
    thumb.appendChild(pic);
    card.appendChild(thumb);
    var name = el('p', 'cms-image-path', img.path.replace(/^assets\//, ''));
    card.appendChild(name);
    var used = img.usedOn.length > 3 ? img.usedOn.slice(0, 3).join(', ') + ' and ' + (img.usedOn.length - 3) + ' more' : img.usedOn.join(', ');
    card.appendChild(el('p', 'cms-image-used', 'Used on: ' + used));
    var actions = el('div', 'cms-actions');
    var replace = el('label', 'btn btn-outline cms-replace', img.value ? 'Replace again' : 'Replace');
    var file = el('input');
    file.type = 'file';
    file.accept = 'image/jpeg,image/png,image/webp';
    file.className = 'sr-only';
    replace.appendChild(file);
    var reset = el('button', 'btn btn-outline', 'Reset');
    reset.type = 'button';
    reset.hidden = !img.value;
    var status = el('span', 'cms-status');
    status.setAttribute('role', 'status');
    actions.appendChild(replace);
    actions.appendChild(reset);
    card.appendChild(actions);
    card.appendChild(status);

    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      file.value = '';
      if (!chosen) return;
      status.textContent = 'Preparing the picture…';
      shrink(chosen).then(function (blob) {
        status.textContent = 'Uploading…';
        return db.call('POST', '/api/admin/media', blob, { 'Content-Type': blob.type });
      }).then(function (res) {
        if (res.error) throw res.error;
        return db.call('PUT', '/api/admin/content', { scope: '*', kind: 'image', original: img.path, value: res.data.url });
      }).then(function (res) {
        if (res.error) throw res.error;
        img.value = res.data.value;
        pic.src = img.value;
        card.classList.add('is-edited');
        reset.hidden = false;
        replace.firstChild.nodeValue = 'Replace again';
        status.textContent = 'Saved. It shows on the website within a minute.';
      }).catch(function (err) { status.textContent = friendly(err.message === 'unreadable' ? new Error('That file couldn’t be read as a picture. Use a JPG, PNG or WebP.') : err); });
    });

    reset.addEventListener('click', function () {
      reset.disabled = true;
      db.call('DELETE', '/api/admin/content', { scope: '*', kind: 'image', original: img.path }).then(function (res) {
        if (res.error) throw res.error;
        img.value = null;
        pic.src = '/' + img.path;
        card.classList.remove('is-edited');
        reset.hidden = true;
        replace.firstChild.nodeValue = 'Replace';
        status.textContent = 'Back to the original.';
      }).catch(function (err) { status.textContent = friendly(err); })
        .then(function () { reset.disabled = false; });
    });
    return card;
  }

  // The picture is scaled down in the browser (at most 2000 pixels on the long
  // side) and saved small enough for the database, so any phone photo works.
  var LIMIT = 1800 * 1024;
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
        var w = Math.max(1, Math.round(image.naturalWidth * scale));
        var h = Math.max(1, Math.round(image.naturalHeight * scale));
        var attempt = function (width, height, quality) {
          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          var keepAlpha = file.type === 'image/png';
          if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
          ctx.drawImage(image, 0, 0, width, height);
          var type = keepAlpha && quality > 0.8 ? 'image/png' : 'image/jpeg';
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('unreadable')); return; }
            if (blob.size <= LIMIT) { resolve(blob); return; }
            if (quality > 0.5) attempt(width, height, quality - 0.12);
            else if (width > 400) attempt(Math.round(width * 0.8), Math.round(height * 0.8), 0.8);
            else reject(new Error('That picture is too large.'));
          }, type, quality);
        };
        attempt(w, h, 0.9);
      };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
      image.src = url;
    });
  }
})();
