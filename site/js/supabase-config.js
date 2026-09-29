// The Supabase project behind the home page testimonials and the admin page
// (admin/index.html). Loaded by those two pages only.
//
// The key is the project's PUBLISHABLE key: it is made to be in a web page.
// On its own it can do only what the database's access rules allow: read the
// testimonials that are switched on. Adding or changing anything needs an
// admin to sign in. Never put the secret key (sb_secret_...) or the
// service_role key in the site.
window.SUPABASE_CONFIG = {
  url: 'https://jveuydvdbpzlvhhhphwv.supabase.co',
  key: 'sb_publishable_7Mf4szAJno7TCRyg_JzE_w_5x9EUo7p',
  photoBucket: 'testimonial-photos'
};
