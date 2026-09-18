# Studies and Awards Limited — Website

## Structure

```
site/              The actual website — open site/index.html in a browser,
                    or deploy this folder as-is to any static host.
  css/styles.css    Shared stylesheet (design tokens, layout, components)
  js/main.js        Shared JS (nav toggle, destination-page slideshow)
  assets/           Images actually used by the site (logo, favicon,
                    compressed destination photos)
  *.html            One file per page

tools/              Build scripts — not part of the deployed site.
  generate-countries.mjs   Regenerates the 5 destination pages (australia.html,
                            united-kingdom.html, germany.html, canada.html,
                            ireland.html) from the data at the top of the file.
                            Run: node tools/generate-countries.mjs
  package.json      Declares the one dependency (jimp, for image resizing)

source-assets/      Raw, uncompressed originals (destination photos, logo).
                    Not tracked by git (see .gitignore) — the compressed,
                    web-ready versions actually used by the site live in
                    site/assets/. Keep your own backup of these originals.
```

## Making changes

- **Page content/copy**: edit the HTML files in `site/` directly, *except*
  the 5 destination pages — those are generated. Edit the data in
  `tools/generate-countries.mjs` instead, then run
  `node tools/generate-countries.mjs` to regenerate them.
- **Styling**: `site/css/styles.css`.
- **Destination photos**: add the new photo to `source-assets/destination-photos/<country>/`,
  resize/compress it into `site/assets/destinations/<country>/`, then add
  an entry to that country's `partners` array in `generate-countries.mjs`
  and regenerate.
- **Publishing**: the live version is published as a Claude Artifact, not
  auto-deployed from this repo — republish from `site/index.html` after
  making changes.
