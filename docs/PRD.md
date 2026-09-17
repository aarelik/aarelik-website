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
7. No third-party runtime dependencies, no CDN, no tracking.

### Should have
8. Filter the grid by lifecycle state.
9. Thumbnail optional — a game with no image still renders correctly.
10. Demo preview so the owner can see a populated layout before having games.

### Out of scope
- Live Roblox API player counts (requires a proxy; revisit when games ship).
- CMS, comments, accounts, analytics.

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
