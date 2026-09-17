import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const html = read('index.html');
const js = read('assets/js/app.js');
const css = read('assets/css/styles.css');

const STATUSES = ['planned', 'in-development', 'live'];
const DATA_FILES = ['data/games.json', 'data/games.example.json'];

/* ---------- data contract ---------- */

for (const file of DATA_FILES) {
  test(`${file}: parses and has a games array`, () => {
    const data = readJson(file);
    assert.ok(Array.isArray(data.games), 'games must be an array');
  });

  test(`${file}: every game satisfies the contract`, () => {
    const { games } = readJson(file);
    const seen = new Set();

    for (const [i, game] of games.entries()) {
      const where = `${file}[${i}] (${game.id ?? 'no id'})`;

      assert.ok(game.id, `${where}: id is required`);
      assert.match(game.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${where}: id must be kebab-case`);
      assert.ok(!seen.has(game.id), `${where}: duplicate id`);
      seen.add(game.id);

      assert.ok(game.title?.trim(), `${where}: title is required`);
      assert.ok(game.tagline?.trim(), `${where}: tagline is required`);
      assert.ok(STATUSES.includes(game.status), `${where}: status must be one of ${STATUSES}`);

      // A live game with no link is a dead card; a planned game has nowhere to point.
      if (game.status === 'live') {
        assert.ok(game.url, `${where}: a live game needs a url`);
        assert.match(game.url, /^https?:\/\//, `${where}: url must be http(s)`);
      }

      if (game.tags !== undefined) {
        assert.ok(Array.isArray(game.tags), `${where}: tags must be an array`);
        assert.ok(game.tags.length <= 5, `${where}: at most 5 tags (layout overflows past that)`);
      }

      if (game.releaseDate !== undefined) {
        assert.match(game.releaseDate, /^\d{4}-\d{2}-\d{2}$/, `${where}: releaseDate must be YYYY-MM-DD`);
        assert.ok(!Number.isNaN(Date.parse(game.releaseDate)), `${where}: releaseDate must be a real date`);
      }

      // A thumbnail path that does not exist ships a broken image.
      if (game.thumbnail && !/^https?:\/\//.test(game.thumbnail)) {
        assert.ok(existsSync(join(root, game.thumbnail)), `${where}: thumbnail not found at ${game.thumbnail}`);
      }
    }
  });
}

test('sample games never reach production data', () => {
  // games.json started empty; it holds real games now. The thing worth
  // guarding is that the example entries never get copied in wholesale.
  const sampleIds = new Set(readJson('data/games.example.json').games.map((g) => g.id));
  for (const game of readJson('data/games.json').games) {
    assert.ok(!sampleIds.has(game.id),
      `"${game.id}" is a sample entry from games.example.json, not a real game`);
  }
});

test('data/games.example.json covers all three statuses', () => {
  const statuses = new Set(readJson('data/games.example.json').games.map((g) => g.status));
  for (const s of STATUSES) {
    assert.ok(statuses.has(s), `example data should demonstrate "${s}"`);
  }
});

/* ---------- asset integrity ---------- */

for (const page of ['index.html', '404.html']) {
  test(`every local asset referenced by ${page} exists`, () => {
    const source = read(page);
    const refs = [...source.matchAll(/(?:href|src)="(?!https?:|#|\?|mailto:)([^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length > 0, `expected local asset references in ${page}`);
    for (const ref of refs) {
      if (ref === './') continue;
      assert.ok(existsSync(join(root, ref)), `${page}: missing asset: ${ref}`);
    }
  });
}

test('app.js only looks up element ids that index.html defines', () => {
  const ids = [...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 0, 'expected id lookups in app.js');
  for (const id of ids) {
    assert.ok(html.includes(`id="${id}"`), `app.js reads #${id}, index.html does not define it`);
  }
});

test('card template provides every node app.js fills', () => {
  const template = html.slice(html.indexOf('<template'), html.indexOf('</template>'));
  // Class attributes hold multiple tokens, so compare tokens rather than substrings.
  const present = new Set(
    [...template.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
  );
  const used = [...js.matchAll(/querySelector\('\.([a-z-]+)'\)/g)]
    .map((m) => m[1])
    .filter((c) => c !== 'filters'); // .filters lives in the page, not the template

  assert.ok(used.length > 0, 'expected template lookups in app.js');
  for (const cls of used) {
    assert.ok(present.has(cls), `template is missing .${cls}`);
  }
});

test('data files the app fetches exist on disk', () => {
  const fetched = [...js.matchAll(/'(data\/[a-z.-]+\.json)'/g)].map((m) => m[1]);
  assert.ok(fetched.length >= 2, 'expected both the live and demo data paths');
  for (const path of fetched) {
    assert.ok(existsSync(join(root, path)), `app.js fetches ${path}, which does not exist`);
  }
});

/* ---------- accessibility invariants ---------- */

test('document declares a language', () => {
  assert.match(html, /<html[^>]+lang="[a-z]{2}"/);
});

test('exactly one h1', () => {
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
});

test('skip link points at an element that exists', () => {
  const target = html.match(/class="skip-link" href="#([^"]+)"/)?.[1];
  assert.ok(target, 'expected a skip link');
  assert.ok(html.includes(`id="${target}"`), `skip link targets #${target}, which does not exist`);
});

test('every section labelled by aria-labelledby has that heading', () => {
  const labels = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(labels.length > 0);
  for (const id of labels) {
    assert.ok(html.includes(`id="${id}"`), `aria-labelledby="${id}" has no matching element`);
  }
});

test('external links carry rel="noopener"', () => {
  assert.ok(js.includes("cta.rel = 'noopener noreferrer'"),
    'links opened with target=_blank must set rel=noopener');
});

test('focus is never suppressed without a replacement', () => {
  assert.ok(css.includes(':focus-visible'), 'expected a visible focus style');
  assert.ok(!/outline:\s*(none|0)\s*;/.test(css), 'css removes focus outline');
});

test('the hidden attribute is never defeated by a display rule', () => {
  // An author `display:` rule outranks the UA stylesheet's [hidden] { display: none },
  // so anything toggled via .hidden needs an explicit [hidden] override.
  const hiddenEls = [...html.matchAll(/<[^>]*\bclass="([^"]+)"[^>]*\shidden[^>]*>/g)]
    .map((m) => m[1].split(/\s+/));

  assert.ok(hiddenEls.length > 0, 'expected elements using the hidden attribute');

  for (const classes of hiddenEls) {
    const styled = classes.filter((c) =>
      new RegExp(`\\.${c}\\s*\\{[^}]*display:`, 'm').test(css));
    if (!styled.length) continue;

    const guarded = classes.some((c) => css.includes(`.${c}[hidden]`));
    assert.ok(guarded,
      `.${styled.join('/.')} sets display but no [hidden] override exists for ` +
      `"${classes.join(' ')}" — it will stay visible when hidden is set`);
  }
});

test('reduced-motion preference is honored', () => {
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('the light palette is reachable', () => {
  // The light block is guarded by :root:not([data-theme="dark"]). Hardcoding
  // that attribute in the markup would make the whole palette dead code.
  assert.ok(css.includes('prefers-color-scheme: light'), 'expected a light palette');
  for (const page of ['index.html', '404.html']) {
    assert.doesNotMatch(read(page), /<html[^>]*data-theme="dark"/,
      `${page} pins data-theme="dark", so the light palette can never apply`);
  }
});

/* ---------- injection safety ---------- */

test('game data is never written as HTML', () => {
  // Strip comments first: prose describing the rule is not a violation of it.
  const code = js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!code.includes('innerHTML'), 'app.js must not use innerHTML with game data');
  assert.ok(!code.includes('insertAdjacentHTML'), 'app.js must not use insertAdjacentHTML');
  assert.ok(code.includes('textContent'), 'app.js should set text via textContent');
});

test('only http(s) urls survive sanitising', () => {
  assert.ok(js.includes("parsed.protocol === 'http:'") && js.includes("parsed.protocol === 'https:'"),
    'safeUrl must restrict protocols');
});
