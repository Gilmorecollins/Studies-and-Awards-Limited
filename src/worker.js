// The site's back end, running on Cloudflare next to the pages in site/.
//
// It answers /api/* only; every other address is served as a file from site/
// (see wrangler.jsonc). It holds the testimonials, the admin sign-in, and the
// testimonial photos, all in the D1 database bound as DB.
//
//   public   GET  /api/testimonials        the switched-on testimonials
//            GET  /api/photo/<name>.jpg    a testimonial photo
//   sign in  POST /api/login  /api/logout    GET /api/me
//   admin    GET/POST /api/admin/testimonials, PATCH/DELETE .../<id>
//            POST /api/admin/photo, DELETE /api/admin/photo/<name>.jpg
//            POST /api/admin/password, POST /api/admin/admins
//
// Passwords are stored as salted PBKDF2 hashes. A sign-in is a signed cookie
// (HttpOnly, Secure, SameSite=Strict) that lasts 7 days; the signing key is
// created once and kept in the database, so there is nothing to configure.

const enc = new TextEncoder();
const SESSION_DAYS = 7;
const PBKDF2_ROUNDS = 100000; // the most Workers allows
const MAX_PHOTO = 400 * 1024;
const MAX_PASSWORD = 200;
const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;
const ACCOUNT = /^[a-z0-9._@+-]{3,254}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response;
    try {
      response = await route(request, env, url);
    } catch (err) {
      console.error(err);
      response = json({ error: 'Something went wrong on the server.' }, 500);
    }
    return withSecurityHeaders(response);
  }
};

// ---------- routing ----------

async function route(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  // A browser says where a request came from. Anything that changes data must
  // come from this site itself (on top of the SameSite cookie).
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ error: 'Bad request' }, 403);
  }

  if (method === 'GET' && path === '/api/testimonials') {
    const { results } = await env.DB.prepare(
      'SELECT name, detail, quote, story, rating, photo_path FROM testimonials ' +
      'WHERE published = 1 ORDER BY position, created_at'
    ).all();
    return json(results, 200, { 'Cache-Control': 'public, max-age=30' });
  }

  if (method === 'GET' && path.startsWith('/api/photo/')) {
    const name = decodeURIComponent(path.slice('/api/photo/'.length));
    if (!PHOTO_NAME.test(name)) return json({ error: 'Not found' }, 404);
    const row = await env.DB.prepare('SELECT data FROM photos WHERE path = ?').bind(name).first();
    if (!row) return json({ error: 'Not found' }, 404);
    return new Response(row.data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'; sandbox"
      }
    });
  }

  if (method === 'POST' && path === '/api/login') return login(request, env);
  if (method === 'POST' && path === '/api/logout') {
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
  }

  // everything below needs a signed-in admin
  const email = await signedInEmail(request, env);
  if (path === '/api/me') return email ? json({ email }) : json({ error: 'session expired' }, 401);
  if (!path.startsWith('/api/admin/')) return json({ error: 'Not found' }, 404);
  if (!email) return json({ error: 'session expired' }, 401);
  if (method !== 'GET' && !isJson(request, path)) return json({ error: 'Bad request' }, 400);
  if (path !== '/api/admin/photo' && Number(request.headers.get('Content-Length') || 0) > 16 * 1024) {
    return json({ error: 'That is too large.' }, 413);
  }

  if (path === '/api/admin/testimonials') {
    if (method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM testimonials ORDER BY position, created_at').all();
      return json(results.map(out));
    }
    if (method === 'POST') return saveTestimonial(env, null, await readJson(request));
  }

  const one = path.match(/^\/api\/admin\/testimonials\/([0-9a-f-]{36})$/);
  if (one) {
    if (method === 'PATCH') return saveTestimonial(env, one[1], await readJson(request));
    if (method === 'DELETE') {
      const row = await env.DB.prepare('DELETE FROM testimonials WHERE id = ? RETURNING id').bind(one[1]).first();
      return row ? json({ id: row.id }) : json({ error: '0 rows' }, 404);
    }
  }

  if (method === 'POST' && path === '/api/admin/photo') {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_PHOTO) return json({ error: 'That photo is too large.' }, 413);
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return json({ error: 'The photo must be a JPEG.' }, 415);
    const name = crypto.randomUUID() + '.jpg';
    await env.DB.prepare('INSERT INTO photos (path, data) VALUES (?, ?)').bind(name, bytes).run();
    return json({ path: name });
  }
  const photo = path.match(/^\/api\/admin\/photo\/([a-z0-9-]+\.jpg)$/);
  if (photo && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM photos WHERE path = ?').bind(photo[1]).run();
    return json({ ok: true });
  }

  if (method === 'POST' && path === '/api/admin/password') {
    const { password } = await readJson(request);
    if (!goodPassword(password)) return json({ error: 'password should be at least 10 characters' }, 400);
    const row = await env.DB.prepare('SELECT salt, hash FROM admins WHERE email = ?').bind(email).first();
    if (row && (await hashPassword(password, row.salt)) === row.hash) return json({ error: 'same password' }, 400);
    await setAdmin(env, email, password);
    // every other device is signed out by the change; keep this one signed in
    const fresh = await env.DB.prepare('SELECT hash FROM admins WHERE email = ?').bind(email).first();
    const token = await sign(env, { e: email, f: fresh.hash.slice(0, 16), x: Date.now() + SESSION_DAYS * 86400000 });
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, SESSION_DAYS * 86400) });
  }

  if (method === 'POST' && path === '/api/admin/admins') {
    const body = await readJson(request);
    const who = String(body.email || '').trim().toLowerCase();
    if (!ACCOUNT.test(who)) return json({ error: 'Enter a valid email address.' }, 400);
    if (!goodPassword(body.password)) return json({ error: 'password should be at least 10 characters' }, 400);
    // adding someone must never overwrite an existing account's password
    const taken = await env.DB.prepare('SELECT 1 AS x FROM admins WHERE email = ?').bind(who).first();
    if (taken) return json({ error: 'That account already exists.' }, 409);
    await setAdmin(env, who, body.password);
    return json({ ok: true });
  }

  return json({ error: 'Not found' }, 404);
}

// ---------- testimonials ----------

function out(row) {
  return { ...row, published: !!row.published, consent: !!row.consent };
}

async function saveTestimonial(env, id, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Bad request' }, 400);
  if (id) {
    // a change may carry only some fields (show/hide, or a new place in the order)
    const current = await env.DB.prepare('SELECT * FROM testimonials WHERE id = ?').bind(id).first();
    if (!current) return json({ error: '0 rows' }, 404);
    body = { ...out(current), ...body };
  }
  const text = (v, max) => {
    if (v == null) return null;
    if (typeof v !== 'string') return undefined; // numbers, lists and objects are refused
    const s = v.trim();
    return s ? s.slice(0, max + 1) : null;
  };
  const v = {
    name: text(body.name, 80),
    detail: text(body.detail, 120),
    quote: text(body.quote, 400),
    story: text(body.story, 1200),
    rating: body.rating == null || body.rating === '' ? null : body.rating,
    photo_path: body.photo_path == null || body.photo_path === '' ? null : body.photo_path,
    published: body.published,
    consent: body.consent
  };
  if ([v.name, v.detail, v.quote, v.story].includes(undefined) ||
      (v.rating !== null && typeof v.rating !== 'number') ||
      (v.photo_path !== null && typeof v.photo_path !== 'string') ||
      typeof v.published !== 'boolean' || typeof v.consent !== 'boolean') {
    return json({ error: 'Bad request' }, 400);
  }
  v.published = v.published ? 1 : 0;
  v.consent = v.consent ? 1 : 0;
  if (!v.name || v.name.length > 80) return json({ error: 'Add their name (80 characters at most).' }, 400);
  if (!v.quote || v.quote.length > 400) return json({ error: 'Add their words (400 characters at most).' }, 400);
  if (v.detail && v.detail.length > 120) return json({ error: 'The line under their name is too long.' }, 400);
  if (v.story && v.story.length > 1200) return json({ error: 'Their story is too long.' }, 400);
  if (v.rating != null && !(v.rating >= 1 && v.rating <= 5 && v.rating * 2 === Math.floor(v.rating * 2))) {
    return json({ error: 'The rating must be 1 to 5, in half steps.' }, 400);
  }
  if (v.photo_path && !PHOTO_NAME.test(v.photo_path)) return json({ error: 'Bad photo.' }, 400);
  if (v.published && !v.consent) return json({ error: 'published_only_with_consent' }, 400);

  let row;
  if (id) {
    row = await env.DB.prepare(
      'UPDATE testimonials SET name=?, detail=?, quote=?, story=?, rating=?, photo_path=?, published=?, consent=?, position=?, ' +
      "updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? RETURNING *"
    ).bind(v.name, v.detail, v.quote, v.story, v.rating, v.photo_path, v.published, v.consent, Number.isInteger(body.position) ? body.position : 0, id).first();
  } else {
    const position = Number.isInteger(body.position) ? body.position : 0;
    row = await env.DB.prepare(
      'INSERT INTO testimonials (id, name, detail, quote, story, rating, photo_path, position, published, consent) ' +
      'VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *'
    ).bind(crypto.randomUUID(), v.name, v.detail, v.quote, v.story, v.rating, v.photo_path, position, v.published, v.consent).first();
  }
  return row ? json(out(row)) : json({ error: '0 rows' }, 404);
}

// ---------- sign in ----------

async function login(request, env) {
  if (!isJson(request, '')) return json({ error: 'Bad request' }, 400);
  if (Number(request.headers.get('Content-Length') || 0) > 2048) return json({ error: 'Bad request' }, 413);
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return json({ error: 'invalid login credentials' }, 400);
  if (email.length > 254 || password.length > MAX_PASSWORD) return json({ error: 'invalid login credentials' }, 401);

  // Wrong tries are counted three ways, so one person can't lock the real
  // admin out from somewhere else, and nobody can guess without limit:
  //   this account from this address: 10, any account from this address: 30,
  //   this account from anywhere: 100 (all within 15 minutes)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const keys = [`a:${email}|${ip}`, `i:${ip}`, `e:${email}`];
  const limits = [10, 30, 100];
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const counts = await env.DB.batch(keys.map(k =>
    env.DB.prepare('SELECT COUNT(*) AS n FROM login_failures WHERE email = ? AND at > ?').bind(k, since)));
  if (counts.some((c, i) => c.results[0].n >= limits[i])) return json({ error: 'too many requests' }, 429);

  const row = await env.DB.prepare('SELECT salt, hash FROM admins WHERE email = ?').bind(email).first();
  // hash even when the account doesn't exist, so timing doesn't give it away
  const hash = await hashPassword(password, row ? row.salt : 'AAAAAAAAAAAAAAAAAAAAAA==');
  if (!row || !safeEqual(hash, row.hash)) {
    const now = new Date().toISOString();
    await env.DB.batch([
      ...keys.map(k => env.DB.prepare('INSERT INTO login_failures (email, at) VALUES (?, ?)').bind(k, now)),
      env.DB.prepare('DELETE FROM login_failures WHERE at < ?').bind(since)
    ]);
    return json({ error: 'invalid login credentials' }, 401);
  }
  await env.DB.prepare('DELETE FROM login_failures WHERE email = ?').bind(keys[0]).run();
  // the token carries a fingerprint of the password, so changing the password signs every other device out
  const token = await sign(env, { e: email, f: row.hash.slice(0, 16), x: Date.now() + SESSION_DAYS * 86400000 });
  return json({ email }, 200, { 'Set-Cookie': cookie(token, SESSION_DAYS * 86400) });
}

async function signedInEmail(request, env) {
  const m = /(?:^|;\s*)__Host-sa_session=([^;]+)/.exec(request.headers.get('Cookie') || '');
  if (!m) return null;
  const payload = await verify(env, m[1]);
  if (!payload || payload.x < Date.now()) return null;
  // the account must still exist and the password must be the one this sign-in used
  const row = await env.DB.prepare('SELECT email, hash FROM admins WHERE email = ?').bind(payload.e).first();
  return row && row.hash.slice(0, 16) === payload.f ? row.email : null;
}

function cookie(value, maxAge) {
  return `__Host-sa_session=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

async function setAdmin(env, email, password) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPassword(password, salt);
  await env.DB.prepare(
    'INSERT INTO admins (email, salt, hash) VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET salt = excluded.salt, hash = excluded.hash'
  ).bind(email, salt, hash).run();
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: PBKDF2_ROUNDS }, key, 256
  );
  return b64(new Uint8Array(bits));
}

// ---------- signed tokens ----------

async function secret(env) {
  let row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'session_secret'").first();
  if (!row) {
    await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('session_secret', ?)")
      .bind(b64(crypto.getRandomValues(new Uint8Array(32)))).run();
    row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'session_secret'").first();
  }
  return crypto.subtle.importKey('raw', unb64(row.value), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(env, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await secret(env), enc.encode(body));
  return body + '.' + b64url(new Uint8Array(sig));
}

async function verify(env, token) {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await secret(env), unb64url(sig), enc.encode(body));
    return ok ? JSON.parse(new TextDecoder().decode(unb64url(body))) : null;
  } catch (e) {
    return null;
  }
}

// ---------- small helpers ----------

function goodPassword(p) {
  return typeof p === 'string' && p.length >= 10 && p.length <= MAX_PASSWORD;
}

function withSecurityHeaders(response) {
  const r = new Response(response.body, response);
  r.headers.set('X-Content-Type-Options', 'nosniff');
  r.headers.set('Referrer-Policy', 'same-origin');
  r.headers.set('X-Frame-Options', 'DENY');
  return r;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
  });
}

// changes must come as JSON (or the photo bytes), which a cross-site form cannot send
function isJson(request, path) {
  const type = request.headers.get('Content-Type') || '';
  return path === '/api/admin/photo' ? type === 'image/jpeg' : type.startsWith('application/json') || request.method === 'DELETE';
}

async function readJson(request) {
  try { return await request.json(); } catch (e) { return {}; }
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function b64(bytes) {
  let s = '';
  bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s);
}
function unb64(s) {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function b64url(bytes) {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  return unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
}
