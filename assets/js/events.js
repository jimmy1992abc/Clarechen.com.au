/**
 * Markdown Event Parser
 * Fetches and parses markdown event files with YAML frontmatter
 */

async function parseMarkdownFile(url) {
  try {
    console.log(`[Events] Fetching: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Events] Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const text = await response.text();
    console.log(`[Events] Fetched content length: ${text.length} chars`);

    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (!match) {
      console.warn(`[Events] No frontmatter found in ${url}`);
      return null;
    }

    const [, frontmatterStr, content] = match;
    console.log(`[Events] Frontmatter found, parsing...`);

    // Parse YAML-like frontmatter (simple parser for key: value pairs)
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        let value = valueParts.join(':').trim();
        // Remove quotes if present
        value = value.replace(/^["'](.*)["']$/, '$1');
        // Handle array format: [item1, item2]
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["'](.*)["']$/, '$1'));
        }
        // Convert boolean strings
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        frontmatter[key.trim()] = value;
      }
    });

    console.log(`[Events] Parsed frontmatter:`, frontmatter);

    return {
      frontmatter,
      content,
      slug: url.split('/').pop().replace('.md', '')
    };
  } catch (error) {
    console.error(`[Events] Error parsing ${url}:`, error);
    return null;
  }
}

async function loadPublishedEvents() {
  try {
    console.log('[Events] Fetching active events list...');

    const activeUrl = 'https://raw.githubusercontent.com/jimmy1992abc/Clarechen.com.au/main/event/active.md';
    const response = await fetch(activeUrl);

    if (!response.ok) {
      console.error(`[Events] Failed to fetch active.md: ${response.status} ${response.statusText}`);
      return [];
    }

    const text = await response.text();

    // Parse any line starting with "- " as an event slug
    const slugs = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- '))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);

    console.log('[Events] Active event slugs:', slugs);

    const events = [];

    for (const slug of slugs) {
      const eventUrl = `https://raw.githubusercontent.com/jimmy1992abc/Clarechen.com.au/main/event/${slug}/${slug}.md`;
      console.log(`[Events] Loading event: ${eventUrl}`);
      const event = await parseMarkdownFile(eventUrl);

      if (event) {
        event.slug = slug;
        console.log(`[Events] Loaded: ${event.frontmatter.title}`);
        events.push(event);
      } else {
        console.warn(`[Events] Failed to load event: ${slug}`);
      }
    }

    // Keep only events on or after today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = events.filter(e => new Date(e.frontmatter.date + 'T00:00:00') >= today);

    // Sort by date ascending (nearest first)
    upcoming.sort((a, b) => new Date(a.frontmatter.date) - new Date(b.frontmatter.date));

    console.log(`[Events] ${upcoming.length} upcoming event(s) to display`);
    return upcoming;
  } catch (error) {
    console.error('[Events] Error loading published events:', error);
    return [];
  }
}

function formatDateLong(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function createEventCard(event) {
  const { frontmatter, slug } = event;
  const dateFormatted = formatDateLong(frontmatter.date);
  
  // Determine tag based on event type (default to "Party")
  const tags = frontmatter.tags ? (Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags]) : ['Party'];
  const tagHtml = tags.map((tag, idx) => {
    const className = idx > 0 ? 'tag tag--muted' : 'tag';
    return `<span class="${className}">${tag}</span>`;
  }).join('\n        ');

  return `
    <article class="card reveal">
      <div class="card__top">
        ${tagHtml}
      </div>
      <h3 class="card__title">${frontmatter.title}</h3>
      <p class="card__text">
        ${frontmatter.description || ''}
      </p>
      <div class="card__date">
        <span class="card__date--icon">📅</span>
        ${dateFormatted}
      </div>
      <div class="card__actions">
        <a class="link" href="/event/${slug}/" aria-label="Open event">View details</a>
      </div>
    </article>
  `;
}

async function renderEventCards() {
  const container = document.getElementById('eventCardsContainer');
  if (!container) {
    console.warn('[Events] Event cards container not found');
    return;
  }

  try {
    console.log('[Events] Starting to render event cards...');
    const events = await loadPublishedEvents();
    console.log(`[Events] Got ${events.length} events to render`);

    if (events.length === 0) {
      console.log('[Events] No published events found');
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No upcoming events at the moment. Check back soon!</p>';
      return;
    }

    const html = events.map(event => createEventCard(event)).join('');
    console.log(`[Events] Generated HTML for ${events.length} cards`);
    container.innerHTML = html;

    // Manually set up reveal observer for dynamically added elements
    const revealEls = Array.from(container.querySelectorAll(".reveal"));
    console.log(`[Events] Setting up reveal animations for ${revealEls.length} elements`);
    
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => io.observe(el));
    console.log('[Events] Event cards rendered successfully');
  } catch (error) {
    console.error('[Events] Error rendering event cards:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">Error loading events.</p>';
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadPublishedEvents, renderEventCards, parseMarkdownFile };
}
