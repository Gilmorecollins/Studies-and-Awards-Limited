# Studies and Awards Limited — Website

## Structure

```
site/              The actual website — open site/index.html in a browser,
                    or deploy this folder as-is to any static host.
  css/styles.css    Shared stylesheet (design tokens, layout, components)
  js/main.js        Shared JS (nav toggle, destination-page slideshow,
                    "next destination" boarding-pass card, partner
                    institutions dialog, "Book Free Consultation" chooser)
  js/team-data.js   The staff: bios for the Team page, plus each person's
                    department, what they help with and WhatsApp number for
                    the consultation chooser. Loaded on every page.
  js/destinations-data.js
                    GENERATED. Destination registry (name, airport code,
                    tagline) in journey order — each destination page
                    suggests the entry after it. Don't edit by hand.
  js/partners-<country>.js
                    GENERATED. The partner institutions (and their courses)
                    for each city on that country's page, read by the
                    "View partners & courses" dialog. Don't edit by hand.
  assets/           Images actually used by the site (logo, favicon,
                    compressed destination photos)
  *.html            One file per page (the 6 destination pages are GENERATED)

tools/              Build scripts — not part of the deployed site.
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
  process-photos.mjs       Resizes and compresses raw destination photos from
                            source-assets/ into web-ready ones in site/assets/.
                            Run: node tools/process-photos.mjs <source folder> <site folder>
  data/partner-institutions.json
                    The partner institutions by country and city, with the
                    courses each offers — the source of truth for the
                    partner lists on the destination pages.
  package.json      Declares the one dependency (jimp, used by
                    process-photos.mjs) and the `generate` / `check` /
                    `photos` npm scripts. Run `npm install` in tools/ once.

source-assets/      Raw, uncompressed originals (destination photos, logo).
                    Not tracked by git (see .gitignore) — the compressed,
                    web-ready versions actually used by the site live in
                    site/assets/. Keep your own backup of these originals.
```

## Making changes

- **Page content/copy**: edit the HTML files in `site/` directly, *except*
  the 6 destination pages — those are generated. Edit the data (or, for
  the header/footer/layout, the template) in `tools/generate-countries.mjs`
  instead, then run `node tools/generate-countries.mjs` to regenerate them.
  Never hand-edit a destination page, `js/destinations-data.js` or
  `js/partners-*.js`: the next run overwrites them. (The header and footer also appear on the non-generated
  pages — index, about, services, team, destinations — so a change to them
  must be made in those files as well as in the template.)
- **Did someone edit a generated page by hand?** Run
  `node tools/generate-countries.mjs --check` (or `npm run check` in
  `tools/`). It changes nothing and exits with an error listing any generated
  file that no longer matches the generator. Run it before regenerating — if it
  reports a page, port that hand edit into the generator first, or the
  regenerate will silently discard it. `--out <dir>` writes the generated
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
- **Destination photos**: put the raw photos in
  `source-assets/destination-photos/<Country>/` (one .jpg per city, named
  after the city), then run
  `node tools/process-photos.mjs "<Country>" <country-slug>` — e.g.
  `node tools/process-photos.mjs "New zealand" new-zealand`. It writes
  1920px-wide, compressed copies (about 500 KB each) to
  `site/assets/destinations/<country-slug>/`; add `--changed` to process only
  new or replaced photos (leaving the ones already live untouched — use this
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
  name exactly. Data for a city that has no slide yet (no photo) isn't shown —
  the generator prints a note listing them. Cities with no entries keep the
  "[list coming soon]" placeholder. The JSON was built from the partner-list
  PDF (Sept 2026) with spelling mistakes and cut-off names corrected; when you
  get an updated list, replace or extend it there.
- **"Book Free Consultation" chooser**: every consultation button on the site
  (any link to the consultation email, or anything marked `data-consult`)
  opens a "Who would you like to talk to?" dialog listing our staff by
  department; choosing someone opens their WhatsApp with a ready-to-send
  message that already names the country if the visitor is on a destination
  page. To switch a person on, put their number in `whatsapp` in
  `js/team-data.js` (e.g. `'0712 345 678'` or `'+254 712 345 678'` — a
  leading 0 is read as Kenya). People with an empty or invalid `whatsapp` are
  left out, and **until at least one person has a number the buttons keep
  opening an email exactly as before**. Their `department` and `helpsWith`
  lines control how they're grouped and described; `CONSULT_DEPARTMENTS` sets
  the order departments appear in. Add `?consultPreview` to any page's
  address (e.g. `index.html?consultPreview`) to preview the whole chooser,
  including people without a number yet. Numbers end up in public web pages,
  so use numbers people are happy to have published.
- **Publishing**: the live version is published as a Claude Artifact, not
  auto-deployed from this repo — republish from `site/index.html` after
  making changes.
