# PRD — Aarelik Roblox Game Showcase

## Problem

There is no public place to point people at for Aarelik's Roblox games. The
games do not exist yet, so the site must look intentional and finished while
holding zero games, and must absorb new games later without a redesign.

## Users

- **Players** arriving from a Roblox profile, Discord, or YouTube link. They
  want to know what exists, what is playable right now, and where to click.
- **The owner (Aarelik)** adding a game after release. Adding a game must be a
  one-file edit, no code changes, no build step.

## Requirements

### Must have
1. Static site, deployable to GitHub Pages with no build step.
2. All game content lives in `data/games.json`. Adding a game = appending one
   object. No HTML edits.
3. Three lifecycle states per game: `planned`, `in-development`, `live`.
   A game is publicly listable before it is playable.
4. A designed empty state. Zero games is the launch condition, not an error.
5. Responsive from 320px to desktop.
6. Accessible: semantic landmarks, keyboard-reachable controls, visible focus,
   AA contrast, no keyboard traps.
7. No third-party runtime dependencies and no tracking. **Amended:** webfonts
   are served from the Google Fonts CDN (see Design below) — a deliberate
   exception, not an oversight. Everything else stays self-contained.

### Should have
8. Filter the grid by lifecycle state.
9. Thumbnail optional — a game with no image still renders correctly.
10. Demo preview so the owner can see a populated layout before having games.

### Out of scope
- Live Roblox API player counts (requires a proxy; revisit when games ship).
- CMS, comments, accounts, analytics.

## Design

The site follows the **Playful Geometric** system: primitive shapes, hard
offset shadows with no blur, chunky 2px borders, pattern fills, and a
rotational accent palette (violet primary; pink, amber and mint used
decoratively). Content sits in calm, readable blocks while the space around it
carries the decoration — "stable grid, wild decoration".

Three translation decisions, since the system is authored for Tailwind/React:

1. **Vanilla CSS custom properties, not Tailwind.** Adding a build step would
   cost the direct GitHub Pages deploy and the one-file-edit workflow, which
   requirements 1 and 2 depend on. Hard shadows, pill radii and chunky borders
   are trivial in plain CSS, so nothing is lost visually.
2. **Google Fonts CDN for Outfit and Plus Jakarta Sans.** Chosen over
   self-hosting for simplicity, at the cost of requirement 7's no-CDN clause and
   a render-blocking third-party request. Self-hosting into `assets/fonts/`
   remains a drop-in change if that trade stops being worth it.
3. **A derived dark palette.** The system specifies light only. On a dark
   ground a slate hard shadow is invisible, so the dark variant uses *colored*
   hard shadows (violet on cards, pink on featured) to keep the "pop", and the
   hero blob swaps hue rather than just alpha to avoid muddying to olive.

## Success criteria

- `npm test` passes: data contract, asset integrity, and accessibility
  invariants are machine-checked.
- Site renders correctly with `games: []` and with a populated list.
- Adding a game touches exactly one file.

## Data contract

```json
{
  "games": [
    {
      "id": "kebab-case-slug",         // required, unique
      "title": "Display Name",          // required
      "status": "planned",              // required: planned|in-development|live
      "tagline": "One line.",           // required
      "description": "Longer text.",    // optional
      "url": "https://roblox.com/...",  // required when status is live
      "thumbnail": "assets/img/x.png",  // optional
      "tags": ["obby"],                 // optional
      "releaseDate": "2026-01-01"       // optional, ISO date
    }
  ]
}
```

`url` is required when and only when `status` is `live` — a planned game has
nowhere to link to, and a live game with no link is a dead card.
