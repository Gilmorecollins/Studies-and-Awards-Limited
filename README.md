# Studies and Awards Limited — Website

## Structure

```
site/              The actual website — open site/index.html in a browser,
                    or deploy this folder as-is to any static host.
  css/styles.css    Shared stylesheet (design tokens, layout, components)
  js/main.js        Shared JS (nav toggle, destination-page slideshow,
                    "next destination" boarding-pass card)
  js/destinations-data.js
                    GENERATED. Destination registry (name, airport code,
                    tagline) in journey order — each destination page
                    suggests the entry after it. Don't edit by hand.
  assets/           Images actually used by the site (logo, favicon,
                    compressed destination photos)
  *.html            One file per page (the 6 destination pages are GENERATED)

tools/              Build scripts — not part of the deployed site.
  generate-countries.mjs   Generates the 6 destination pages (australia.html,
                            united-kingdom.html, germany.html, canada.html,
                            ireland.html, new-zealand.html) and
                            js/destinations-data.js from the
                            data at the top of the file. Also holds the page
                            template, including the shared header and footer.
                            Run:   node tools/generate-countries.mjs
                            Check: node tools/generate-countries.mjs --check
  package.json      Declares the one dependency (jimp, for image resizing)
                    and the `generate` / `check` npm scripts

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
  Never hand-edit a destination page or `js/destinations-data.js`: the next
  run overwrites it. (The header and footer also appear on the non-generated
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
- **Destination photos**: add the new photo to `source-assets/destination-photos/<country>/`,
  resize/compress it into `site/assets/destinations/<country>/`, then add
  an entry to that country's `partners` array in `generate-countries.mjs`
  and regenerate. If a photo is close to square (e.g. 4:3) and the full-screen
  slide crops off the subject, give that city a `position: 'center bottom'`
  (any CSS background-position) in its entry. A destination with an empty
  `partners` list shows three "[City]" placeholder slides until its photos
  are added.
- **Publishing**: the live version is published as a Claude Artifact, not
  auto-deployed from this repo — republish from `site/index.html` after
  making changes.
