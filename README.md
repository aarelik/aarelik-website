# aarelik-website

Static showcase for my Roblox games. No framework, no build step — plain HTML,
CSS, and JavaScript, deployable straight to GitHub Pages.

## Adding a game

Edit **`data/games.json`**. That's the only file you touch.

```json
{
  "games": [
    {
      "id": "tower-of-nope",
      "title": "Tower of Nope",
      "status": "live",
      "tagline": "120 floors. No checkpoints. Good luck.",
      "description": "Optional longer paragraph.",
      "url": "https://www.roblox.com/games/123456789/Tower-of-Nope",
      "thumbnail": "assets/img/tower-of-nope.png",
      "tags": ["obby", "difficult"],
      "releaseDate": "2026-03-14"
    }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | kebab-case, unique |
| `title` | yes | display name |
| `status` | yes | `planned`, `in-development`, or `live` |
| `tagline` | yes | one line, shown under the title |
| `description` | no | longer paragraph |
| `url` | when `live` | the Roblox game link |
| `thumbnail` | no | path under `assets/img/`; without one, a lettered tile is used |
| `tags` | no | up to 5 |
| `releaseDate` | no | `YYYY-MM-DD` |

Cards sort automatically: live first, then in development, then planned.
A game can be listed before it is playable — that is what `planned` is for.

`data/games.example.json` holds sample entries to copy from. Run
`npm test` after editing; it checks the file before it ever reaches the site.

## Running it locally

```bash
npm run dev     # serves at http://localhost:8000
```

Opening `index.html` straight off disk will not work — the page fetches
`data/games.json`, which browsers block over `file://`. Serve it over http.

Visit `?demo=1` to preview the layout populated with the sample games without
touching your real data.

## Tests

```bash
npm test
```

25 checks, no dependencies, via the built-in Node test runner:

- **Data contract** — required fields, kebab-case unique ids, valid status,
  a `url` on every live game, real dates, thumbnails that actually exist.
- **Asset integrity** — every path referenced by `index.html` resolves, every
  element id `app.js` reads is defined, both fetched data files exist.
- **Accessibility** — one `h1`, a working skip link, `aria-labelledby` targets
  that exist, visible focus styles, honored reduced-motion preference.
- **Injection safety** — game text is never written as HTML, and only
  `http(s)` URLs survive sanitising.
- **Design system** — every colour token is defined, hard shadows carry no
  blur, the alternate palette stays reachable, and bounce/wiggle/marquee are
  all disabled under `prefers-reduced-motion`.

## Design

Built on the **Playful Geometric** system — see `docs/PRD.md` for the full
rationale. Everything is driven by CSS custom properties in the `:root` block
of `assets/css/styles.css`: change `--accent`, `--secondary`, `--tertiary` or
`--quaternary` there and the whole site follows, including the dark variant.

Typography is Outfit (headings) and Plus Jakarta Sans (body), loaded from
Google Fonts. To self-host instead, drop woff2 files in `assets/fonts/`,
replace the `<link>` in both HTML files with `@font-face` rules, and nothing
else changes.

## Deploying

Repository settings → Pages → deploy from branch, root. The `.nojekyll` file
stops Jekyll from stripping anything.

## Layout

```
index.html            markup and the card <template>
404.html              not-found page
assets/css/styles.css single stylesheet, Playful Geometric tokens, light
                      by default with a derived dark variant via OS setting
assets/js/app.js      loads the data and renders the grid
data/games.json       ← the file you edit
data/games.example.json  sample entries
data/games.schema.json   JSON Schema for the data contract
tests/site.test.mjs   the suite
docs/PRD.md           what this site is for and why it is built this way
```
