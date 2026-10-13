// Cloudflare Turnstile, the check that a visitor is a person, for the admin
// sign-in and the newsletter box. It asks the back end for the site key
// (/api/config); if none is set up, or the check can't load, nothing is shown
// and the back end decides what to do.
//
//   SiteTurnstile.mount(container).then(function (check) {
//     check.token()  -> Promise of the token to send with the request ('' if no check)
//     check.reset()  -> ask for a fresh token (each token works once)
//   });
(function () {
  'use strict';

  var apiPromise = null;

  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      window.__saTurnstileReady = resolve;
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__saTurnstileReady';
      script.async = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return apiPromise;
  }

  function siteKey() {
    if (!window.fetch) return Promise.resolve(null);
    return window.fetch('/api/config', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (c) { return c && c.turnstile ? c.turnstile : null; })
      .catch(function () { return null; });
  }

  var none = { enabled: false, token: function () { return Promise.resolve(''); }, reset: function () {} };

  function mount(container) {
    return siteKey().then(function (key) {
      if (!key) return none;
      return loadApi().then(function () {
        var current = '';
        var waiting = [];
        var id = window.turnstile.render(container, {
          sitekey: key,
          appearance: 'interaction-only',
          callback: function (token) {
            current = token;
            waiting.splice(0).forEach(function (done) { done(token); });
          },
          'expired-callback': function () { current = ''; },
          'error-callback': function () { current = ''; waiting.splice(0).forEach(function (done) { done(''); }); }
        });
        return {
          enabled: true,
          token: function () {
            if (current) return Promise.resolve(current);
            return new Promise(function (done) {
              waiting.push(done);
              window.setTimeout(function () { done(current); }, 20000);
            });
          },
          reset: function () {
            current = '';
            try { window.turnstile.reset(id); } catch (e) { /* ignore */ }
          }
        };
      }, function () { return none; });
    });
  }

  window.SiteTurnstile = { mount: mount };
})();
