// Talks to the site's back end (/api/*, see src/worker.js) for the testimonials
// admin page. It offers the small set of calls admin.js uses, so the page's own
// code stays simple: db.auth (sign in and out, password), db.from('testimonials')
// (read, add, change, delete) and db.storage (photos). Every call answers
// { data, error } and never throws.
(function () {
  'use strict';

  var listeners = [];
  var SIGNAL = 'sa-admin-signal';

  function fire(event) {
    listeners.forEach(function (fn) { try { fn(event); } catch (e) { /* ignore */ } });
  }

  function call(method, path, body, headers) {
    var options = { method: method, credentials: 'same-origin', headers: headers || {} };
    if (body !== undefined) {
      if (body instanceof Blob) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      }
    }
    return window.fetch(path, options)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.status === 401 && path !== '/api/login' && path !== '/api/me') fire('SIGNED_OUT');
          if (!res.ok) return { data: null, error: new Error(data.error || ('HTTP ' + res.status)), status: res.status };
          return { data: data, error: null, status: res.status };
        });
      })
      .catch(function (err) { return { data: null, error: err, status: 0 }; });
  }

  // db.from('testimonials').select() / .update(v).eq('id', x).select().single() / .insert(v) / .delete().eq('id', x)
  function Query() {
    this.op = 'select';
    this.values = null;
    this.id = null;
    this.one = false;
  }
  Query.prototype.select = function () { return this; };
  Query.prototype.order = function () { return this; }; // the server already sends them in order
  Query.prototype.single = function () { this.one = true; return this; };
  Query.prototype.eq = function (column, value) { this.id = value; return this; };
  Query.prototype.update = function (values) { this.op = 'update'; this.values = values; return this; };
  Query.prototype.insert = function (values) { this.op = 'insert'; this.values = values; return this; };
  Query.prototype.delete = function () { this.op = 'delete'; return this; };
  Query.prototype.then = function (resolve, reject) {
    var base = '/api/admin/testimonials';
    var self = this;
    var request;
    if (this.op === 'select') request = call('GET', base);
    else if (this.op === 'insert') request = call('POST', base, this.values);
    else if (this.op === 'update') request = call('PATCH', base + '/' + this.id, this.values);
    else {
      request = call('DELETE', base + '/' + this.id).then(function (res) {
        // no row deleted is an empty answer, as admin.js expects
        if (res.status === 404) return { data: [], error: null };
        return res.error ? res : { data: [res.data], error: null };
      });
    }
    return request.then(function (res) {
      if (self.op === 'update' && !res.error && !self.one) res.data = [res.data];
      return res;
    }).then(resolve, reject);
  };

  var auth = {
    signInWithPassword: function (credentials) {
      return call('POST', '/api/login', credentials).then(function (res) {
        if (res.error) return { data: null, error: res.error };
        try { window.localStorage.setItem(SIGNAL, 'in' + Date.now()); } catch (e) { /* ignore */ }
        return { data: { session: { user: { email: res.data.email } } }, error: null };
      });
    },
    signOut: function () {
      return call('POST', '/api/logout', {}).then(function () {
        try { window.localStorage.setItem(SIGNAL, 'out' + Date.now()); } catch (e) { /* ignore */ }
        fire('SIGNED_OUT');
        return { error: null };
      });
    },
    getSession: function () {
      return call('GET', '/api/me').then(function (res) {
        return { data: { session: res.error ? null : { user: { email: res.data.email } } }, error: null };
      });
    },
    updateUser: function (changes) {
      return call('POST', '/api/admin/password', { password: changes.password }).then(function (res) {
        return { data: res.data, error: res.error };
      });
    },
    onAuthStateChange: function (fn) { listeners.push(fn); }
  };

  // signing in or out in another tab
  window.addEventListener('storage', function (event) {
    if (event.key !== SIGNAL || !event.newValue) return;
    fire(event.newValue.indexOf('out') === 0 ? 'SIGNED_OUT' : 'SIGNED_IN');
  });

  var storage = {
    from: function () {
      return {
        upload: function (path, blob) {
          return call('POST', '/api/admin/photo', blob, { 'Content-Type': 'image/jpeg' }).then(function (res) {
            return { data: res.data, error: res.error };
          });
        },
        remove: function (paths) {
          return Promise.all(paths.map(function (p) { return call('DELETE', '/api/admin/photo/' + encodeURIComponent(p)); }))
            .then(function () { return { error: null }; });
        }
      };
    }
  };

  window.siteApi = {
    auth: auth,
    storage: storage,
    from: function () { return new Query(); },
    rpc: function () { // "is this account an admin?": a valid sign-in is one
      return call('GET', '/api/me').then(function (res) { return { data: !res.error, error: null }; });
    },
    audit: function () { return call('GET', '/api/admin/audit'); },
    subscribers: function () { return call('GET', '/api/admin/subscribers'); },
    removeSubscriber: function (email) { return call('DELETE', '/api/admin/subscribers', { email: email }); },
    photoUrl: function (path) { return path ? '/api/photo/' + encodeURIComponent(path) : ''; }
  };
})();
