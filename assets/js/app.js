/* Aarelik — game grid.
 * Reads data/games.json and renders it. No dependencies, no build step.
 * All game text is injected with textContent, never innerHTML. */

(function () {
  'use strict';

  var STATUSES = ['live', 'in-development', 'planned'];
  var STATUS_LABEL = {
    'live': 'Live',
    'in-development': 'In development',
    'planned': 'Planned'
  };
  // Live games surface first; planned games sink to the bottom.
  var STATUS_ORDER = { 'live': 0, 'in-development': 1, 'planned': 2 };

  // Lucide-style glyphs (2.5 stroke, round caps) for the floating status circle.
  var STATUS_ICON = {
    'live': ['m6 3 14 9-14 9V3z'],
    'in-development': [
      'm15 12-8.4 8.4a1 1 0 1 1-3-3L12 9',
      'm18 15 4-4',
      'm21.5 11.5-1.9-1.9A2 2 0 0 1 19 8.2V7l-2.3-2.3a6 6 0 0 0-4.2-1.7L9 3l.9.8A6.2 6.2 0 0 1 12 8.4V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9'
    ],
    'planned': ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2']
  };
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Built through the DOM rather than markup strings — nothing here is parsed
     as HTML, which keeps the no-innerHTML rule true for every rendered node. */
  function buildIcon(status) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    (STATUS_ICON[status] || []).forEach(function (d) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  var grid = document.getElementById('game-grid');
  var emptyState = document.getElementById('empty-state');
  var errorState = document.getElementById('error-state');
  var errorDetail = document.getElementById('error-detail');
  var gridStatus = document.getElementById('grid-status');
  var filterBar = document.querySelector('.filters');
  var template = document.getElementById('game-card-template');

  var allGames = [];
  var activeFilter = 'all';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Only http(s) links are ever rendered, so a bad data file cannot
     introduce a javascript: URL. */
  function safeUrl(value) {
    if (typeof value !== 'string' || value === '') return null;
    try {
      var parsed = new URL(value, window.location.href);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        ? parsed.href
        : null;
    } catch (err) {
      return null;
    }
  }

  function normalize(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    var title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) return null;

    var status = STATUSES.indexOf(raw.status) !== -1 ? raw.status : 'planned';

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : 'game-' + index,
      title: title,
      status: status,
      tagline: typeof raw.tagline === 'string' ? raw.tagline.trim() : '',
      description: typeof raw.description === 'string' ? raw.description.trim() : '',
      url: status === 'live' ? safeUrl(raw.url) : null,
      thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail.trim() : '',
      tags: Array.isArray(raw.tags)
        ? raw.tags.filter(function (t) { return typeof t === 'string' && t.trim(); })
                  .map(function (t) { return t.trim(); })
                  .slice(0, 5)
        : [],
      releaseDate: typeof raw.releaseDate === 'string' ? raw.releaseDate : ''
    };
  }

  function formatMeta(game) {
    if (game.status === 'live') return 'Playable now';
    if (!game.releaseDate) {
      return game.status === 'in-development' ? 'In development' : 'Planned';
    }
    var d = new Date(game.releaseDate);
    if (isNaN(d.getTime())) return STATUS_LABEL[game.status];
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }

  function buildCard(game) {
    var node = template.content.firstElementChild.cloneNode(true);

    node.dataset.status = game.status;
    node.querySelector('.card-title').textContent = game.title;
    node.querySelector('.card-tagline').textContent = game.tagline;

    var desc = node.querySelector('.card-description');
    if (game.description) desc.textContent = game.description;
    else desc.hidden = true;

    var badge = node.querySelector('.badge');
    badge.textContent = STATUS_LABEL[game.status];
    badge.dataset.status = game.status;

    var sticker = node.querySelector('.card-sticker');
    sticker.dataset.status = game.status;
    sticker.appendChild(buildIcon(game.status));

    var img = node.querySelector('.card-img');
    var fallback = node.querySelector('.card-fallback');
    if (game.thumbnail) {
      img.src = game.thumbnail;
      img.alt = game.title + ' thumbnail';
      img.hidden = false;
      fallback.hidden = true;
      // A broken path falls back to the lettered tile rather than a torn image.
      img.addEventListener('error', function () {
        img.hidden = true;
        fallback.hidden = false;
      });
    } else {
      fallback.textContent = game.title.charAt(0).toUpperCase();
    }

    var tagList = node.querySelector('.card-tags');
    if (game.tags.length) {
      game.tags.forEach(function (tag) {
        var li = document.createElement('li');
        li.textContent = tag;
        tagList.appendChild(li);
      });
    } else {
      tagList.hidden = true;
    }

    var cta = node.querySelector('.card-cta');
    if (game.url) {
      cta.href = game.url;
      cta.rel = 'noopener noreferrer';
      cta.target = '_blank';
      cta.setAttribute('aria-label', 'Play ' + game.title + ' on Roblox (opens in a new tab)');
      cta.hidden = false;
    }

    node.querySelector('.card-meta').textContent = formatMeta(game);
    return node;
  }

  function render() {
    var visible = activeFilter === 'all'
      ? allGames
      : allGames.filter(function (g) { return g.status === activeFilter; });

    grid.textContent = '';

    if (!allGames.length) {
      emptyState.hidden = false;
      if (filterBar) filterBar.hidden = true;
      gridStatus.textContent = 'No games published yet.';
      return;
    }

    emptyState.hidden = true;
    if (filterBar) filterBar.hidden = false;

    var fragment = document.createDocumentFragment();
    visible.forEach(function (game) { fragment.appendChild(buildCard(game)); });
    grid.appendChild(fragment);

    gridStatus.textContent = visible.length === 1
      ? '1 game shown.'
      : visible.length + ' games shown.';
  }

  function wireFilters() {
    if (!filterBar) return;
    filterBar.addEventListener('click', function (event) {
      var button = event.target.closest('.filter');
      if (!button) return;

      activeFilter = button.dataset.filter;

      filterBar.querySelectorAll('.filter').forEach(function (b) {
        var on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      render();
    });
  }

  function showError(message) {
    grid.textContent = '';
    emptyState.hidden = true;
    if (filterBar) filterBar.hidden = true;
    errorState.hidden = false;
    errorDetail.textContent = message;
    gridStatus.textContent = 'The game list failed to load.';
  }

  function load() {
    var demo = new URLSearchParams(window.location.search).get('demo') === '1';
    var source = demo ? 'data/games.example.json' : 'data/games.json';

    fetch(source, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var list = data && Array.isArray(data.games) ? data.games : [];
        allGames = list
          .map(normalize)
          .filter(Boolean)
          .sort(function (a, b) {
            var byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
            return byStatus !== 0 ? byStatus : a.title.localeCompare(b.title);
          });
        wireFilters();
        render();
      })
      .catch(function (err) {
        showError(
          'Could not read ' + source + ' (' + err.message + '). ' +
          'If you opened this file directly, serve it over http instead.'
        );
      });
  }

  load();
})();
