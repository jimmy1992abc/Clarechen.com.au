/**
 * Markdown Event Parser
 * Fetches and parses markdown event files with YAML frontmatter
 */

async function parseMarkdownFile(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (!match) {
      console.warn(`No frontmatter found in ${url}`);
      return null;
    }

    const [, frontmatterStr, content] = match;

    // Parse YAML-like frontmatter (simple parser for key: value pairs)
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        let value = valueParts.join(':').trim();
        // Remove quotes if present
        value = value.replace(/^["'](.*)["']$/, '$1');
        // Convert boolean strings
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        frontmatter[key.trim()] = value;
      }
    });

    return {
      frontmatter,
      content,
      slug: url.split('/').pop().replace('.md', '')
    };
  } catch (error) {
    console.error(`Error parsing ${url}:`, error);
    return null;
  }
}

async function loadPublishedEvents() {
  try {
    // Fetch the list of events - you'll need to maintain this list
    const eventFiles = [
      'birthday-celebration.md',
      'design-workshop.md'
      // Add more event files here as they're created
    ];

    const events = [];

    for (const file of eventFiles) {
      // Use relative path from the site root
      const eventPath = `./event/events/${file}`;
      const event = await parseMarkdownFile(eventPath);
      if (event && event.frontmatter.published === true) {
        events.push(event);
      }
    }

    // Sort by date (most recent first)
    events.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

    return events;
  } catch (error) {
    console.error('Error loading published events:', error);
    return [];
  }
}
    console.error('Error loading events:', error);
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

  return `
    <article class="card reveal">
      <div class="card__top">
        <span class="tag">Party</span>
        <span class="tag tag--muted">Private</span>
      </div>
      <h3 class="card__title">${frontmatter.title}</h3>
      <p class="card__text">
        ${frontmatter.description}
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
    console.warn('Event cards container not found');
    return;
  }

  try {
    const events = await loadPublishedEvents();

    if (events.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No upcoming events at the moment. Check back soon!</p>';
      return;
    }

    container.innerHTML = events.map(event => createEventCard(event)).join('');

    // Manually set up reveal observer for dynamically added elements
    const revealEls = Array.from(container.querySelectorAll(".reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => io.observe(el));
  } catch (error) {
    console.error('Error rendering event cards:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">Error loading events.</p>';
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadPublishedEvents, renderEventCards, parseMarkdownFile };
}
