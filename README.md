# Studies and Awards Limited Website

## Structure

```
site/              The actual website. Open site/index.html in a browser,
                    or deploy this folder as-is to any static host.
  css/styles.css    Shared stylesheet (design tokens, layout, components)
  js/main.js        Shared JS (nav toggle, destination-page slideshow,
                    "next destination" boarding-pass card, partner
                    institutions dialog, "Book Free Consultation" chooser)
  js/theme.js       The dark mode switch (sun and moon button), on every
                    page including the student portal
  js/team-data.js   The staff: bios for the Team page, plus each person's
                    department, what they help with and WhatsApp number for
                    the consultation chooser. Loaded on every page.
  js/testimonials-data.js
                    Real quotes for the home page's "What people say"
                    section. Empty for now, and the section stays hidden
                    until it has at least one real quote.
  js/destinations-data.js
                    GENERATED. Destination registry (name, airport code,
                    tagline) in journey order. Each destination page
                    suggests the entry after it. Don't edit by hand.
  js/partners-<country>.js
                    GENERATED. The partner institutions (and their courses)
                    for each city on that country's page, read by the
                    "View partners & courses" dialog. Don't edit by hand.
  assets/           Images actually used by the site (logo, favicon,
                    compressed destination photos)
  *.html            One file per page (the 6 destination pages are GENERATED)

tools/              Build scripts, not part of the deployed site.
  generate-countries.mjs   Generates the 6 destination pages (australia.html,
                            united-kingdom.html, germany.html, canada.html,
                            ireland.html, new-zealand.html) and
                            js/destinations-data.js and js/partners-*.js from
                            the data at the top of the file and from
                            data/partner-institutions.json. Also holds the
                            page template, including the shared header and
                            footer.
                            Run:   node tools/generate-countries.mjs
                            Check: node tools/generate-countries.mjs --check
  theme-markup.mjs         The dark mode <head> script and the sun and moon
                            switch's markup, shared by generate-countries.mjs
                            and generate-portal.mjs.
  process-photos.mjs       Resizes and compresses raw destination photos from
                            source-assets/ into web-ready ones in site/assets/.
                            Run: node tools/process-photos.mjs <source folder> <site folder>
  data/partner-institutions.json
                    The partner institutions by country and city, with the
                    courses each offers. The source of truth for the
                    partner lists on the destination pages.
  make-team-thumbs.mjs     Makes the small square head-and-shoulders portraits
                            (site/assets/team/thumbs/) used on the
                            consultation cards, from the full team photos.
                            Run: node tools/make-team-thumbs.mjs
  make-share-images.mjs    Makes the 1200x630 pictures that appear when a page
                            is shared on WhatsApp/Facebook
                            (site/assets/share/): one per destination, from its
                            lead city photo, plus a branded default.
                            Run: node tools/make-share-images.mjs
  package.json      Declares the one dependency (jimp, used by
                    process-photos.mjs, make-team-thumbs.mjs and
                    make-share-images.mjs) and the `generate` / `check` /
                    `photos` / `thumbs` npm scripts.
                    Run `npm install` in tools/ once.

source-assets/      Raw, uncompressed originals (destination photos, logo).
                    Not tracked by git (see .gitignore). The compressed,
                    web-ready versions actually used by the site live in
                    site/assets/. Keep your own backup of these originals.
```

## Making changes

- **Page content/copy**: edit the HTML files in `site/` directly, *except*
  the 6 destination pages, which are generated. Edit the data (or, for
  the header/footer/layout, the template) in `tools/generate-countries.mjs`
  instead, then run `node tools/generate-countries.mjs` to regenerate them.
  Never hand-edit a destination page, `js/destinations-data.js` or
  `js/partners-*.js`: the next run overwrites them. (The header and footer
  also appear on the non-generated pages (index, about, services, team,
  destinations), so a change to them must be made in those files as well as
  in the template. Those five pages also carry a generated block of
  link-preview tags between `<!-- seo:start -->` and `<!-- seo:end -->` in
  their `<head>`; the generator rewrites only that block, so leave it alone.)
- **Did someone edit a generated page by hand?** Run
  `node tools/generate-countries.mjs --check` (or `npm run check` in
  `tools/`). It changes nothing and exits with an error listing any generated
  file that no longer matches the generator. Run it before regenerating. If it
  reports a page, port that hand edit into the generator first, or the
  regenerate will silently discard it. It also confirms every script in
  `site/js/` still parses (a stray keystroke in a hand-edited file such as
  `team-data.js` would otherwise silently switch its feature off), and reminds
  you about leftover sample testimonials. `--out <dir>` writes the generated
  files somewhere else so you can diff them safely.
- **Adding a country**: add an entry to `countries` in `generate-countries.mjs`
  (its position in the list is the journey order for the "next destination"
  cards) and regenerate. That creates the page, and adds it to the footer of
  every destination page and to `js/destinations-data.js`. Then add it by hand
  to the pages the generator doesn't own:
  - footer "Destinations" links: `index.html`, `about.html`, `services.html`,
    `team.html`, `destinations.html`
  - `destinations.html`: a new card, the "N destinations" headline and the
    meta description
  - `index.html`: a row on the departures board (the last row has
    `border-bottom:none`), both copies of the ticker, and the meta description
  - `services.html`: a code pill in the "Available for" strip
- **Styling**: `site/css/styles.css`.
- **Laptop fit (why the site looks the same size on every laptop)**: laptops
  give web pages very different window widths, because Windows and macOS
  enlarge everything on high-resolution screens (a 1920x1200 screen at 150%
  gives a page only 1280px; 1920x1080 at 125% gives 1536px). The site is laid
  out for a window at least 1400px wide, so on a mouse/trackpad screen narrower
  than that, the whole page is laid out at 1400px and scaled down to fit, the
  same as zooming the browser out (at 1280px it shows at about 90%). It never
  goes below 80% (windows from 1024px to 1120px wide). Windows 1400px and
  wider, phones and tablets, and anything with a touch screen as its main
  input are not scaled. It lives in the "laptop fit" block near the top of
  `styles.css`, which also explains the two rules for editing that file: write
  vw/vh sizes as `calc(4vw / var(--z, 1))`, and a new width breakpoint between
  1024px and 1400px needs the extra real-width condition shown there. The
  student portal has its own stylesheet (`css/portal.css`) and is not scaled.
- **Colours and dark mode**: every page, the student portal included, comes
  in a light and a dark theme. Visitors get their device's own setting (a
  phone or laptop set to dark shows the dark site) until they switch it
  themselves (the pull cord on laptops and desktops, the sun and moon button
  in the header on phones, tablets and the portal), which is saved on their
  device for the whole site. Choosing the same as their device forgets the
  choice again, so the
  page goes back to following the device. How it fits together:
  - **Colours.** `styles.css` (and `portal.css`, the same way) has two kinds.
    *Theme colours* are the variables at the top of the file (`--bg`,
    `--paper`, `--surface`, `--text-strong`, `--text`, `--muted`, `--border`,
    `--line-strong`, the `--tint-NN` and `--shadow-NN` scales, and a few more,
    each with a note). Their dark values sit right below in
    `:root[data-theme="dark"]`, the only place dark mode is defined. *Fixed
    colours* are the brand colours (`--ink` navy, `--brass` gold) and any
    colour written out as a value; they look the same in both themes.
  - **Which to use when editing.** Anything that sits on the page, a card or a
    dialog takes a theme colour: `var(--text-strong)` for headings and links,
    `var(--text)` or `var(--muted)` for body text, `var(--bg)`/`var(--paper)`/
    `var(--surface)` for backgrounds, `var(--border)` or `var(--line-strong)`
    for lines, `var(--tint-10)` for a faint navy wash, `var(--shadow-12)` for a
    shadow. Anything on something that never changes (a navy band, a photo, a
    gold button) takes a fixed colour: text on gold is `var(--ink)`, text on
    navy is white or `var(--on-dark-muted)`. A new colour for the page needs a
    theme variable with a dark value in that block.
  - **Choosing the theme before the page is drawn.** A one-line script in each
    page's `<head>` sets `data-theme` on `<html>`, so nobody sees the light
    page flash first. It is `THEME_SCRIPT` in `tools/theme-markup.mjs`, which
    both generators write into their pages; `404.html` has a hand copy.
    Without JavaScript the site shows the light theme.
  - **The switch.** Its markup is `themeToggle()` in `tools/theme-markup.mjs`
    (used by both generators); the hand-maintained pages and `404.html` carry
    the same button, written in by hand. Its styles are `.theme-toggle` in
    `styles.css` and `portal.css`, and `js/theme.js` (loaded by every page,
    just before `main.js` or `portal.js`) keeps it in step and saves the
    choice.
  - **The pull cord.** On laptops and desktops (mouse or trackpad, 1024px and
    wider) the main site's switch is a cord with a gold knob hanging at the
    right end of the page, like a lamp's pull chain, and the header's sun and
    moon button is hidden there: pull the knob down past the click, or click
    it, and the theme switches. It is a proper button too: Tab reaches it
    just after the header, screen readers hear "Dark mode, toggle button",
    and Enter or Space switches. Phones, tablets and the student portal keep
    the sun and moon button instead. `js/theme.js` builds the cord (a small
    rope simulation that stops when the cord is still) and it presses the
    hidden header button, so the choice is saved the same way. Its look is
    `.pull-cord` in `styles.css` (colour `--cord`), which is also where the
    header button is hidden; its length, weight and how far to pull are the
    numbers at the top of the "Pull cord" block in `theme.js`. With "reduce
    motion" on, it hangs still and a click switches. Inspired by PullCord
    from FeralUI (feralui.dev/pullcord).
  - **Not covered.** The Google map on Find Us stays light (Google draws it).
    Photos, flags and team portraits are the same in both themes.
- **Destination photos**: put the raw photos in
  `source-assets/destination-photos/<Country>/` (one .jpg per city, named
  after the city), then run
  `node tools/process-photos.mjs "<Country>" <country-slug>`, e.g.
  `node tools/process-photos.mjs "New zealand" new-zealand`. It writes
  1920px-wide, compressed copies (about 500 KB each) to
  `site/assets/destinations/<country-slug>/`; add `--changed` to process only
  new or replaced photos (leaving the ones already live untouched; use this
  whenever you add cities to a folder that already has photos), or
  `--out <dir>` to preview them somewhere else first. Then add an entry per city to that country's
  `partners` array in `generate-countries.mjs` and regenerate. If a photo is
  close to square (e.g. 4:3) and the full-screen slide crops off the subject,
  give that city a `position: 'center bottom'` (any CSS background-position)
  in its entry. A destination with an empty `partners` list shows three
  "[City]" placeholder slides until its photos are added.
- **Partner institutions**: each city slide with entries in
  `tools/data/partner-institutions.json` shows a summary and a "View partners
  & courses" button that opens a searchable list of that city's institutions and
  their courses. To change a list, edit the JSON (country → city → `name` and
  `courses`; an empty `courses` list shows "Courses on request" with a link
  to email a counsellor) and regenerate. City names must match the slide's city
  name exactly. Data for a city that has no slide yet (no photo) isn't shown.
  The generator prints a note listing them. Cities with no entries show "Our
  counsellors can advise on study options in <city>" with an "Ask a counsellor"
  link that opens the consultation chooser for that city. The JSON was built from the partner-list
  PDF (Sept 2026) with spelling mistakes and cut-off names corrected; when you
  get an updated list, replace or extend it there.
- **"Book Free Consultation" chooser**: every consultation button on the site
  (any link to the consultation email, or anything marked `data-consult`)
  opens a "Who would you like to talk to?" dialog listing our staff in the
  same order as the Team page, with department filter buttons (and a "Not sure
  who to pick? Start here" shortcut); choosing someone opens their WhatsApp with a ready-to-send
  message that already names the country if the visitor is on a destination
  page. To switch a person on, put their number in `whatsapp` in
  `js/team-data.js` (e.g. `'0712 345 678'` or `'+254 712 345 678'`; a
  leading 0 is read as Kenya). People with an empty or invalid `whatsapp` are
  left out, and **until at least one person has a number the buttons keep
  opening an email exactly as before**. People appear in the order they are
  listed in `js/team-data.js`. Their `department` decides which filter button
  they sit under (`CONSULT_DEPARTMENTS` sets the order of those buttons) and
  `helpsWith` is the line under their name. Put `startHere: true` on one person
  to offer them first in the "Start here" box; remove it and the box goes away.
  The photo on each card is the small framed
  portrait in `assets/team/thumbs/` (the `thumb` field), made from the full
  team photo by `node tools/make-team-thumbs.mjs`. If you add a person or
  replace a team photo, add/adjust their row in that script (eye height and top
  of the hair) and re-run it. Team photos are 4:5 portraits, 960×1200, saved
  with a lowercase name matching the person's `id` (a raw camera photo or a
  square one should be cropped to that shape first, and the huge original kept
  out of `site/`). Add `?consultPreview` to any page's
  address (e.g. `index.html?consultPreview`) to preview the whole chooser,
  including people without a number yet. Numbers end up in public web pages,
  so use numbers people are happy to have published.
- **Link previews (WhatsApp, Facebook, LinkedIn)**: every page has a generated
  block of tags (title, description, card type, theme colour) so a shared link
  shows a proper preview. The canonical link, `og:url` and the share picture
  need the site's full web address, so they are switched on by setting
  `SITE_URL` (e.g. `'https://studiesandawardsltd.com'`, no trailing slash) near
  the top of `tools/generate-countries.mjs` and running it again. It is set to
  the test address, `https://test-studies-and-awards-limited.vercel.app`, for
  now; swap in the real domain when it's live. The pictures are already made
  (`site/assets/share/`; rebuild with `node tools/make-share-images.mjs`), so
  they will show as "not referenced" in a file audit until `SITE_URL` is set.
  After going live, paste a page's address into Facebook's Sharing Debugger to
  refresh the cached preview. `--check` covers these blocks too.
- **Page not found**: `site/404.html` is what Vercel shows for any address that
  doesn't exist. It is served at the missing address itself (e.g. `/old/page`),
  so every link and file in it starts with `/`. It is marked `noindex`.
- **Opening hours badge**: the footer and the Find Us page show "Open now" or
  when the office next opens, in Kenya time. `js/main.js` knows the fixed
  public holidays and Easter; add Eid or any one-off closure to
  `EXTRA_CLOSED_DAYS` there as `'YYYY-MM-DD'`.
- **Slideshow photos on phones**: each city photo has a 3:4 crop in
  `<country>/portrait/`, which phones and portrait tablets load instead of the
  full 1920px photo. `node tools/make-editorial-photos.mjs` makes them.
- **Direct links**: `team.html#<id>` (e.g. `team.html#miki`) opens on that
  person, and `index.html#faq-visa` opens that FAQ answer (the ids are on the
  `<details>` in `index.html`). Both update the address bar as visitors browse.
- **Destination specialists**: give a team member `destinations: ['Germany']`
  in `js/team-data.js` and they lead the consultation list, tagged "Best for
  Germany", when someone books from that country's page.
- **Testimonials**: the home page's "What people say" section is fed by
  `js/testimonials-data.js`. It currently holds three **sample** quotes
  (marked `sample: true`) so the layout can be reviewed. Samples show only on
  your own copy of the site (opened as a file, or on localhost), each tagged
  "Sample: replace before launch", and are hidden automatically on any real
  website address (add `?testimonialsPreview` to an address to see them
  anywhere). **Before you deploy, replace them with real quotes**, each as
  `{ quote, name, detail }`, in the person's own words, published with their
  agreement, under a name they're happy to use (leave `sample` out). An entry
  with no quote or no name is skipped. With nothing to show the section stays
  hidden. `--check` reminds you while samples remain, and fails once
  `SITE_URL` is set to a real domain (a `*.vercel.app` test address is
  allowed).
- **Publishing**: the live version is published as a Claude Artifact, not
  auto-deployed from this repo. Republish from `site/index.html` after
  making changes.
