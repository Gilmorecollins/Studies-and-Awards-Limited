// The testimonials admin page (admin/index.html): sign in, then add, edit,
// reorder, show or hide, and delete the testimonials on the home page.
//
// The testimonials live in the Supabase database (js/supabase-config.js). The
// database's own rules decide who may change them: only confirmed accounts on
// its admin list (public.admins). This page only offers the tools; it cannot
// let anyone else make changes, whatever happens in the browser.
//
// Photos are cropped square (480 x 480, from near the top, where the face
// usually is) and saved as JPEGs in the testimonial-photos storage bucket
// under a random name; a replaced or removed photo is deleted once the change
// is saved.
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  if (!cfg || !window.supabase || !window.supabase.createClient || !window.TestimonialCard) {
    $('view-loading').textContent = 'The admin page could not start: a script is missing. Check that js/vendor/supabase.js, js/supabase-config.js and js/testimonial-card.js are on the site.';
    return;
  }

  var db = window.supabase.createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  var BUCKET = cfg.photoBucket;
  var PHOTO_SIZE = 480;

  var views = ['view-loading', 'view-signin', 'view-denied', 'view-list'];
  var items = []; // the testimonials, in their order on the page
  var editing = null; // the testimonial in the editor, or null when adding one
  var newPhoto = null; // a photo chosen in the editor, not yet saved: { blob, url }
  var photoRemoved = false;
  var formAtOpen = '';
  var toDelete = null;
  var busy = false;

  // ---------- small helpers ----------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function showView(id) {
    views.forEach(function (v) { $(v).hidden = v !== id; });
  }

  function setError(node, text) {
    node.textContent = text || '';
    node.hidden = !text;
  }

  var noticeTimer = null;
  function notice(text) {
    var node = $('list-notice');
    node.textContent = text;
    node.hidden = false;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(function () { node.hidden = true; }, 6000);
  }

  function photoUrl(path) {
    return path ? cfg.url + '/storage/v1/object/public/' + BUCKET + '/' + encodeURIComponent(path) : '';
  }

  function possessive(name) {
    return name + '’s';
  }

  // an error from Supabase or the network, in plain words
  function friendly(error) {
    var msg = String((error && (error.message || error.error_description || error.msg)) || error || '');
    if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match an account.';
    if (/email not confirmed/i.test(msg)) return 'This account’s email address hasn’t been confirmed yet.';
    if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) return 'Couldn’t reach the server. Check your internet connection and try again.';
    if (/published_only_with_consent/i.test(msg)) return 'Tick that they have agreed before showing it on the website.';
    if (/rate limit|too many requests/i.test(msg)) return 'Too many tries in a short time. Wait a minute, then try again.';
    if (/jwt|session|refresh token/i.test(msg)) return 'You’ve been signed out. Sign in again, then try once more.';
    if (/row-level security|permission denied|not authorized|unauthorized/i.test(msg)) return 'This account isn’t allowed to make that change.';
    if (/PGRST116|no\) rows|0 rows/i.test(msg)) return 'That testimonial couldn’t be changed: it may have just been deleted. Reload the page and try again.';
    if (/password should be|weak password|at least/i.test(msg)) return 'That password is too weak. Use at least 10 characters, mixing letters and numbers.';
    if (/same password|different from the old/i.test(msg)) return 'Choose a password different from your current one.';
    return 'Something went wrong: ' + msg;
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    var b = new Uint8Array(16);
    window.crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  // ---------- signing in and out ----------

  function signedIn(session) {
    $('admin-email').textContent = session.user.email;
    $('admin-user').hidden = false;
    return db.rpc('is_admin').then(function (res) {
      if (res.error) throw res.error;
      if (!res.data) {
        $('denied-email').textContent = session.user.email;
        showView('view-denied');
        return null;
      }
      showView('view-list');
      return load();
    });
  }

  function signedOut() {
    $('admin-user').hidden = true;
    items = [];
    $('admin-list').textContent = '';
    // A sign-out (or a session that can no longer be renewed) must not leave
    // an editor dialog open over the now-inert sign-in card with a client's
    // details in it, nor leave Save able to fire a write with no session.
    editing = null;
    toDelete = null;
    busy = false;
    Array.prototype.forEach.call(document.querySelectorAll('dialog[open]'), function (d) { d.close(); });
    showView('view-signin');
  }

  $('signin-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var email = $('signin-email').value.trim();
    var password = $('signin-password').value;
    if (!email || !password) {
      setError($('signin-error'), 'Enter your email and password.');
      return;
    }
    setError($('signin-error'), '');
    var button = event.target.querySelector('[type="submit"]');
    button.disabled = true;
    db.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        $('signin-password').value = '';
        return signedIn(res.data.session);
      })
      .catch(function (err) { setError($('signin-error'), friendly(err)); })
      .then(function () { button.disabled = false; });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-signout]'), function (button) {
    button.addEventListener('click', function () {
      db.auth.signOut().then(signedOut, signedOut);
    });
  });

  // a sign-out in another tab, or a session that can no longer be renewed
  db.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') { signedOut(); return; }
    // A sign-in in another tab: adopt it here too, so this tab doesn't sit on
    // a stale sign-in card while the browser holds a valid session.
    if (event === 'SIGNED_IN' && !$('view-signin').hidden) {
      db.auth.getSession().then(function (res) {
        var session = res && res.data && res.data.session;
        if (session) signedIn(session);
      });
    }
  });

  // ---------- the list ----------

  function load() {
    return db.from('testimonials')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res.error) throw res.error;
        items = res.data || [];
        renderList();
      })
      .catch(function (err) {
        renderList();
        notice('The testimonials couldn’t be loaded. ' + friendly(err));
      });
  }

  function iconButton(label, path, onClick, disabled) {
    var button = el('button', 'admin-icon-btn');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
    button.disabled = !!disabled;
    button.addEventListener('click', onClick);
    return button;
  }

  function textButton(label, className, ariaLabel, onClick) {
    var button = el('button', className, label);
    button.type = 'button';
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    button.addEventListener('click', onClick);
    return button;
  }

  // focus: { id, action } to put the focus back on after the list is redrawn
  function renderList(focus) {
    var list = $('admin-list');
    list.textContent = '';
    var shown = items.filter(function (t) { return t.published; }).length;
    $('list-summary').textContent = items.length
      ? shown + ' on the website, ' + (items.length - shown) + ' hidden'
      : '';
    $('admin-empty').hidden = items.length > 0;

    items.forEach(function (t, i) {
      var item = el('li', 'admin-item' + (t.published ? ' is-on' : ''));
      item.setAttribute('data-id', t.id);

      var avatar = el('span', 'admin-avatar');
      avatar.setAttribute('aria-hidden', 'true');
      if (t.photo_path) {
        var img = document.createElement('img');
        img.src = photoUrl(t.photo_path);
        img.alt = '';
        img.width = 56;
        img.height = 56;
        avatar.appendChild(img);
      } else {
        avatar.textContent = window.TestimonialCard.initials(t.name);
      }
      item.appendChild(avatar);

      var text = el('div', 'admin-item-text');
      var nameLine = el('p', 'admin-item-name', t.name);
      text.appendChild(nameLine);
      if (t.detail) text.appendChild(el('p', 'admin-item-detail', t.detail));
      text.appendChild(el('p', 'admin-item-quote', '“' + t.quote + '”'));
      var meta = el('p', 'admin-item-meta');
      meta.appendChild(el('span', 'admin-pill' + (t.published ? ' is-on' : ''), t.published ? 'On the website' : 'Hidden'));
      if (t.rating != null) meta.appendChild(el('span', 'admin-item-rating', '★ ' + Number(t.rating).toFixed(1)));
      if (!t.consent) meta.appendChild(el('span', 'admin-item-warn', 'Agreement not ticked'));
      text.appendChild(meta);
      item.appendChild(text);

      var actions = el('div', 'admin-item-actions');
      actions.appendChild(iconButton('Move ' + t.name + ' up', 'M6 15l6-6 6 6', function () { move(i, -1); }, i === 0));
      actions.appendChild(iconButton('Move ' + t.name + ' down', 'M6 9l6 6 6-6', function () { move(i, 1); }, i === items.length - 1));
      actions.appendChild(textButton(t.published ? 'Hide' : 'Show on website', 'btn btn-outline admin-small-btn',
        (t.published ? 'Hide ' : 'Show ') + possessive(t.name) + ' testimonial' + (t.published ? ' from the website' : ' on the website'),
        function () { setShown(t, !t.published); }));
      actions.appendChild(textButton('Edit', 'btn btn-outline admin-small-btn', 'Edit ' + possessive(t.name) + ' testimonial', function () { openEditor(t); }));
      actions.appendChild(textButton('Delete', 'admin-link-btn admin-delete-link', 'Delete ' + possessive(t.name) + ' testimonial', function () { askDelete(t); }));
      item.appendChild(actions);
      list.appendChild(item);
    });

    if (focus) {
      var target = list.querySelector('[data-id="' + focus.id + '"]');
      if (target) {
        var buttons = target.querySelectorAll('button');
        var pick = focus.action === 'up' ? buttons[0] : focus.action === 'down' ? buttons[1] : focus.action === 'show' ? buttons[2] : buttons[3];
        if (pick && pick.disabled) pick = focus.action === 'up' ? buttons[1] : buttons[0];
        if (pick && !pick.disabled) pick.focus();
      }
    }
  }

  function replaceItem(row) {
    var found = false;
    items = items.map(function (t) {
      if (t.id !== row.id) return t;
      found = true;
      return row;
    });
    if (!found) items.push(row);
  }

  function setShown(t, on) {
    if (on && !t.consent) {
      openEditor(t, 'Tick that they have agreed before showing it on the website.');
      return;
    }
    db.from('testimonials').update({ published: on }).eq('id', t.id).select().single()
      .then(function (res) {
        if (res.error) throw res.error;
        replaceItem(res.data);
        renderList({ id: t.id, action: 'show' });
        notice(on ? possessive(t.name) + ' testimonial is now on the website.' : possessive(t.name) + ' testimonial is hidden from the website.');
      })
      .catch(function (err) { notice(friendly(err)); });
  }

  // moves item i one place up (-1) or down (1), then saves every position that changed
  function move(i, dir) {
    if (busy) return; // one reorder at a time: overlapping write sets can collide
    var j = i + dir;
    if (j < 0 || j >= items.length) return;
    var order = items.slice();
    var moved = order[i];
    order[i] = order[j];
    order[j] = moved;
    var changes = [];
    order.forEach(function (t, k) {
      if (t.position !== k) changes.push({ id: t.id, position: k });
    });
    items = order.map(function (t, k) {
      var copy = {};
      for (var key in t) if (Object.prototype.hasOwnProperty.call(t, key)) copy[key] = t[key];
      copy.position = k;
      return copy;
    });
    renderList({ id: moved.id, action: dir < 0 ? 'up' : 'down' });
    busy = true;
    Promise.all(changes.map(function (c) {
      return db.from('testimonials').update({ position: c.position }).eq('id', c.id).select('id').single();
    })).then(function (results) {
      results.forEach(function (res) { if (res.error) throw res.error; });
      notice('New order saved.');
    }).catch(function (err) {
      notice('The new order couldn’t be saved. ' + friendly(err));
      load();
    }).then(function () { busy = false; });
  }

  $('add-btn').addEventListener('click', function () { openEditor(null); });

  // ---------- deleting ----------

  function askDelete(t) {
    toDelete = t;
    $('confirm-text').textContent = 'Delete ' + possessive(t.name) + ' testimonial' + (t.photo_path ? ' and their photo' : '') + '? This can’t be undone.';
    setError($('confirm-error'), '');
    $('confirm').showModal();
  }

  $('confirm-delete').addEventListener('click', function () {
    var t = toDelete;
    if (!t || busy) return;
    busy = true;
    var button = this;
    button.disabled = true;
    db.from('testimonials').delete().eq('id', t.id).select('id')
      .then(function (res) {
        if (res.error) throw res.error;
        if (!res.data || !res.data.length) throw new Error('0 rows');
        if (t.photo_path) removePhoto(t.photo_path);
        items = items.filter(function (x) { return x.id !== t.id; });
        $('confirm').close();
        renderList();
        $('add-btn').focus();
        notice(possessive(t.name) + ' testimonial was deleted.');
      })
      .catch(function (err) { setError($('confirm-error'), friendly(err)); })
      .then(function () { busy = false; button.disabled = false; });
  });

  // ---------- photos ----------

  // a square JPEG from the photo `file`, cropped from near the top
  function squarePhoto(file) {
    return new Promise(function (resolve, reject) {
      var source = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var side = Math.min(w, h);
        var size = Math.min(PHOTO_SIZE, side);
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var g = canvas.getContext('2d');
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, size, size);
        g.drawImage(img, (w - side) / 2, (h - side) * 0.2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(source);
        canvas.toBlob(function (blob) {
          if (blob) resolve({ blob: blob, small: side < 200 });
          else reject(new Error('The photo could not be converted.'));
        }, 'image/jpeg', 0.86);
      };
      img.onerror = function () {
        URL.revokeObjectURL(source);
        reject(new Error('unreadable'));
      };
      img.src = source;
    });
  }

  function uploadPhoto(blob) {
    var path = uuid() + '.jpg';
    return db.storage.from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
      .then(function (res) {
        if (res.error) throw res.error;
        return path;
      });
  }

  // best effort: a leftover photo is harmless, so a failure here is not shown
  function removePhoto(path) {
    db.storage.from(BUCKET).remove([path]).then(function () {}, function () {});
  }

  function clearNewPhoto() {
    if (newPhoto) URL.revokeObjectURL(newPhoto.url);
    newPhoto = null;
  }

  function currentPhotoUrl() {
    if (newPhoto) return newPhoto.url;
    if (editing && editing.photo_path && !photoRemoved) return photoUrl(editing.photo_path);
    return '';
  }

  function updatePhotoUi() {
    var url = currentPhotoUrl();
    var thumb = $('photo-thumb');
    thumb.textContent = '';
    if (url) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = '';
      thumb.appendChild(img);
    } else {
      thumb.textContent = window.TestimonialCard.initials($('f-name').value.trim() || '?');
    }
    $('photo-remove').hidden = !url;
    $('f-consent-photo').hidden = !url;
    document.querySelector('label[for="f-photo"]').textContent = url ? 'Choose another photo' : 'Choose a photo';
  }

  $('f-photo').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    setError($('editor-error'), '');
    squarePhoto(file)
      .then(function (result) {
        clearNewPhoto();
        newPhoto = { blob: result.blob, url: URL.createObjectURL(result.blob) };
        photoRemoved = false;
        updatePhotoUi();
        updatePreview();
        if (result.small) setError($('editor-error'), 'This photo is quite small, so it may look blurry. A larger one would be better.');
      })
      .catch(function () {
        setError($('editor-error'), 'That photo couldn’t be read here. Use a JPG or PNG photo (a phone’s HEIC photo may need converting first).');
      });
  });

  $('photo-remove').addEventListener('click', function () {
    clearNewPhoto();
    photoRemoved = true;
    updatePhotoUi();
    updatePreview();
    $('f-photo').focus();
  });

  // ---------- the editor ----------

  function formValues() {
    var text = function (id) {
      var v = $(id).value.trim();
      return v || null;
    };
    return {
      name: text('f-name'),
      detail: text('f-detail'),
      quote: text('f-quote'),
      story: text('f-story'),
      rating: $('f-rating').value ? Number($('f-rating').value) : null,
      consent: $('f-consent').checked,
      published: $('f-published').checked
    };
  }

  function formSnapshot() {
    return JSON.stringify(formValues()) + '|' + (newPhoto ? newPhoto.url : '') + '|' + photoRemoved;
  }

  function updateCounts() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-count-for]'), function (node) {
      var field = $(node.getAttribute('data-count-for'));
      node.textContent = field.value.length + ' of ' + field.maxLength + ' characters';
    });
  }

  function updatePreview() {
    var v = formValues();
    var draft = {
      name: v.name || 'Their name',
      detail: v.detail,
      quote: v.quote || 'Their words will show here.',
      story: v.story,
      rating: v.rating,
      photo: currentPhotoUrl()
    };
    // the average as the home page would show it, with this one as it is now
    var others = items.filter(function (t) { return t.published && (!editing || t.id !== editing.id); });
    if (v.published) others = others.concat([draft]);
    var preview = $('preview');
    preview.textContent = '';
    preview.appendChild(window.TestimonialCard.build(draft, window.TestimonialCard.average(others)));
  }

  function openEditor(t, message) {
    editing = t || null;
    clearNewPhoto();
    photoRemoved = false;
    $('editor-heading').textContent = t ? 'Edit ' + possessive(t.name) + ' testimonial' : 'Add a testimonial';
    $('f-name').value = t ? t.name : '';
    $('f-detail').value = t && t.detail ? t.detail : '';
    $('f-quote').value = t ? t.quote : '';
    $('f-story').value = t && t.story ? t.story : '';
    // A stored rating that isn't one of the fixed options (set outside this
    // page) must not display as "No rating" and then be written back as null
    // on an unrelated save, so carry it as an extra option.
    var ratingSel = $('f-rating');
    Array.prototype.forEach.call(ratingSel.querySelectorAll('option[data-custom-rating]'), function (o) { o.remove(); });
    var ratingValue = t && t.rating != null ? String(Number(t.rating)) : '';
    var ratingKnown = Array.prototype.some.call(ratingSel.options, function (o) { return o.value === ratingValue; });
    if (ratingValue && !ratingKnown) {
      var extra = document.createElement('option');
      extra.value = ratingValue;
      extra.textContent = ratingValue;
      extra.setAttribute('data-custom-rating', '');
      ratingSel.appendChild(extra);
    }
    ratingSel.value = ratingValue;
    $('f-consent').checked = !!(t && t.consent);
    $('f-published').checked = !!(t && t.published);
    setError($('editor-error'), message || '');
    updateCounts();
    updatePhotoUi();
    updatePreview();
    formAtOpen = formSnapshot();
    $('editor').showModal();
    (message ? $('f-consent') : $('f-name')).focus();
  }

  function closeEditor() {
    clearNewPhoto();
    $('editor').close();
  }

  // leaving with unsaved changes asks first
  function leaveEditor() {
    if (formSnapshot() !== formAtOpen && !window.confirm('Leave without saving your changes?')) return;
    closeEditor();
  }

  $('editor').addEventListener('cancel', function (event) {
    event.preventDefault();
    if (!busy) leaveEditor();
  });

  // a message about the last try goes once something is changed
  $('editor-form').addEventListener('input', function (event) {
    if (event.target.id === 'f-name') updatePhotoUi();
    setError($('editor-error'), '');
    updateCounts();
    updatePreview();
  });
  $('editor-form').addEventListener('change', function (event) {
    if (event.target.type === 'checkbox' || event.target.tagName === 'SELECT') setError($('editor-error'), '');
    updatePreview();
  });

  $('editor-form').addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy) return;
    var values = formValues();
    if (!values.name) { setError($('editor-error'), 'Add their name.'); $('f-name').focus(); return; }
    if (!values.quote) { setError($('editor-error'), 'Add their words.'); $('f-quote').focus(); return; }
    if (values.published && !values.consent) {
      setError($('editor-error'), 'Tick that they have agreed before showing it on the website.');
      $('f-consent').focus();
      return;
    }
    setError($('editor-error'), '');
    busy = true;
    var save = $('editor-save');
    save.disabled = true;
    save.textContent = 'Saving…';

    var oldPath = editing ? editing.photo_path : null;
    var uploaded = null;
    (newPhoto ? uploadPhoto(newPhoto.blob) : Promise.resolve(null))
      .then(function (path) {
        uploaded = path;
        values.photo_path = path || (photoRemoved ? null : oldPath);
        var query;
        if (editing) {
          query = db.from('testimonials').update(values).eq('id', editing.id);
        } else {
          values.position = items.reduce(function (max, t) { return Math.max(max, t.position + 1); }, 0);
          query = db.from('testimonials').insert(values);
        }
        return query.select().single();
      })
      .then(function (res) {
        if (res.error) throw res.error;
        var row = res.data;
        if (oldPath && oldPath !== row.photo_path) removePhoto(oldPath);
        replaceItem(row);
        closeEditor();
        renderList({ id: row.id, action: 'edit' });
        notice(row.published
          ? 'Saved. ' + possessive(row.name) + ' testimonial is on the website.'
          : 'Saved. ' + possessive(row.name) + ' testimonial stays hidden until you show it on the website.');
      })
      .catch(function (err) {
        if (uploaded) removePhoto(uploaded);
        setError($('editor-error'), friendly(err));
      })
      .then(function () {
        busy = false;
        save.disabled = false;
        save.textContent = 'Save';
      });
  });

  // ---------- changing the password ----------

  $('admin-password-btn').addEventListener('click', function () {
    $('new-password').value = '';
    $('new-password-2').value = '';
    setError($('password-error'), '');
    $('password').showModal();
    $('new-password').focus();
  });

  $('password-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var p1 = $('new-password').value;
    var p2 = $('new-password-2').value;
    if (p1.length < 10) { setError($('password-error'), 'Use at least 10 characters.'); return; }
    if (p1 !== p2) { setError($('password-error'), 'The two passwords don’t match.'); return; }
    var button = event.target.querySelector('[type="submit"]');
    button.disabled = true;
    db.auth.updateUser({ password: p1 })
      .then(function (res) {
        if (res.error) throw res.error;
        $('password').close();
        notice('Your password was changed.');
      })
      .catch(function (err) { setError($('password-error'), friendly(err)); })
      .then(function () { button.disabled = false; });
  });

  // ---------- closing dialogs ----------

  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (button) {
    button.addEventListener('click', function () {
      var dialog = button.closest('dialog');
      if (dialog.id === 'editor') leaveEditor();
      else dialog.close();
    });
  });

  // ---------- start ----------

  db.auth.getSession()
    .then(function (res) {
      var session = res.data && res.data.session;
      if (!session) { signedOut(); return null; }
      return signedIn(session);
    })
    .catch(function (err) {
      signedOut();
      setError($('signin-error'), friendly(err));
    });
})();
