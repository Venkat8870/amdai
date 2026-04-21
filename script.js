/* ============================================
   NASA Space Explorer — Application Logic
   ============================================ */

const NASA_API_KEY = 'DEMO_KEY'; // Free NASA API key — replace with your own from https://api.nasa.gov
const NASA_APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
const NASA_MARS_URL = `https://api.nasa.gov/mars-photos/api/v1/rovers`;
const NASA_IMAGE_URL = `https://images-api.nasa.gov/search`;

// =============================================
// Starfield Background
// =============================================
class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.shootingStars = [];
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.stars = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 3000);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  spawnShootingStar() {
    if (Math.random() > 0.995) {
      this.shootingStars.push({
        x: Math.random() * this.canvas.width,
        y: 0,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 8 + 6,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        opacity: 1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stars
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed;
      const alpha = star.opacity * (0.5 + 0.5 * Math.sin(star.twinklePhase));
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
      this.ctx.fill();
    }

    // Shooting stars
    this.spawnShootingStar();
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      const endX = ss.x - Math.cos(ss.angle) * ss.length;
      const endY = ss.y - Math.sin(ss.angle) * ss.length;

      const gradient = this.ctx.createLinearGradient(ss.x, ss.y, endX, endY);
      gradient.addColorStop(0, `rgba(200, 220, 255, ${ss.opacity})`);
      gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);

      this.ctx.beginPath();
      this.ctx.moveTo(ss.x, ss.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= 0.01;

      if (ss.opacity <= 0 || ss.x > this.canvas.width || ss.y > this.canvas.height) {
        this.shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// =============================================
// Navigation
// =============================================
function initNavigation() {
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Active link tracking
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });

  // Intersection Observer for active nav
  const sections = document.querySelectorAll('section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[data-section="${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

// =============================================
// Stat Counter Animation
// =============================================
function animateStats() {
  const stats = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateValue(el, 0, target, 2000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
}

function animateValue(el, start, end, duration) {
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(start + (end - start) * eased);
    el.textContent = formatNumber(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(0) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(0) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(0) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

// =============================================
// APOD — Astronomy Picture of the Day
// =============================================
async function loadAPOD() {
  const loading = document.getElementById('apod-loading');
  const content = document.getElementById('apod-content');

  try {
    const response = await fetch(NASA_APOD_URL);
    if (!response.ok) throw new Error('APOD fetch failed');
    const data = await response.json();

    const mediaEl = document.getElementById('apod-media');
    if (data.media_type === 'video') {
      mediaEl.innerHTML = `<iframe src="${data.url}" allowfullscreen title="${data.title}"></iframe>`;
    } else {
      const img = document.createElement('img');
      img.src = data.hdurl || data.url;
      img.alt = data.title;
      img.addEventListener('click', () => openLightbox(img.src, data.title));
      mediaEl.appendChild(img);
    }

    document.getElementById('apod-date').textContent = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('apod-title').textContent = data.title;
    document.getElementById('apod-explanation').textContent = data.explanation;
    document.getElementById('apod-copyright').textContent = data.copyright ? `© ${data.copyright}` : '';

    loading.style.display = 'none';
    content.style.display = 'grid';
  } catch (err) {
    console.error('APOD Error:', err);
    loading.innerHTML = `<p style="color: var(--accent-4);">⚠️ Could not load today's picture. NASA API may be rate-limited (DEMO_KEY). <br>Try again shortly or get a free key at <a href="https://api.nasa.gov" target="_blank" style="color: var(--accent-2);">api.nasa.gov</a></p>`;
  }
}

// =============================================
// Mars Rover Photos
// =============================================
async function fetchMarsPhotos() {
  const rover = document.getElementById('rover-select').value;
  const sol = document.getElementById('sol-input').value;
  const grid = document.getElementById('mars-grid');

  grid.innerHTML = `<div class="grid-loading"><div class="loader"></div></div>`;

  try {
    const url = `${NASA_MARS_URL}/${rover}/photos?sol=${sol}&page=1&api_key=${NASA_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Mars fetch failed');
    const data = await res.json();
    const photos = data.photos.slice(0, 12);

    if (photos.length === 0) {
      grid.innerHTML = `<div class="no-results">No photos found for ${rover} on Sol ${sol}. Try a different Sol number!</div>`;
      return;
    }

    grid.innerHTML = photos.map(p => `
      <div class="mars-photo-card" onclick="openLightbox('${p.img_src.replace('http:', 'https:')}', '${p.camera.full_name} — Sol ${p.sol}')">
        <img src="${p.img_src.replace('http:', 'https:')}" alt="${p.camera.full_name} photo from Mars" loading="lazy" />
        <div class="mars-photo-overlay">
          <span>${p.camera.full_name}</span>
          <span>Sol ${p.sol} · ${p.earth_date}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Mars Error:', err);
    grid.innerHTML = `<div class="no-results" style="color: var(--accent-4);">⚠️ Could not fetch Mars photos. API may be rate-limited.</div>`;
  }
}

// =============================================
// NASA Image Gallery Search
// =============================================
async function searchGallery(query) {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = `<div class="grid-loading"><div class="loader"></div></div>`;

  // Update active tag
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.query === query);
  });

  try {
    const url = `${NASA_IMAGE_URL}?q=${encodeURIComponent(query)}&media_type=image&page_size=12`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gallery fetch failed');
    const data = await res.json();
    const items = data.collection.items.slice(0, 12);

    if (items.length === 0) {
      grid.innerHTML = `<div class="no-results">No results found for "${query}". Try a different search term!</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const imgData = item.data[0];
      const imgLink = item.links ? item.links[0].href : '';
      const title = imgData.title || 'NASA Image';
      return `
        <div class="gallery-card" onclick="openLightbox('${imgLink}', '${title.replace(/'/g, "\\'")}')">
          <img src="${imgLink}" alt="${title}" loading="lazy" />
          <div class="gallery-card-info">
            <h4>${title}</h4>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Gallery Error:', err);
    grid.innerHTML = `<div class="no-results" style="color: var(--accent-4);">⚠️ Could not search the gallery. Try again.</div>`;
  }
}

// =============================================
// Lightbox
// =============================================
function openLightbox(src, caption) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  img.src = src;
  cap.textContent = caption || '';
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('active');
  document.body.style.overflow = '';
}

// =============================================
// Space Facts
// =============================================
function loadFacts() {
  const facts = [
    { icon: '☀️', title: 'The Sun\'s Journey', text: 'The Sun takes about 225-250 million years to orbit the center of the Milky Way galaxy, traveling at roughly 515,000 mph.' },
    { icon: '🕳️', title: 'Spaghettification', text: 'Near a black hole, gravitational tidal forces stretch objects into long, thin shapes — a process scientists call "spaghettification."' },
    { icon: '💎', title: 'Diamond Rain', text: 'On Neptune and Uranus, extreme pressure turns carbon into diamonds that rain down through the atmosphere toward the core.' },
    { icon: '🔇', title: 'Silent Space', text: 'Space is completely silent. With no atmosphere to carry sound waves, even the largest explosions make no noise in the vacuum.' },
    { icon: '🌡️', title: 'Extreme Temperatures', text: 'Temperatures in space range from -270°C in the cosmic void to millions of degrees near stars. A spacesuit must handle both extremes.' },
    { icon: '⭐', title: 'Neutron Star Density', text: 'A teaspoon of neutron star material would weigh about 6 billion tons — roughly the weight of Mount Everest compressed into a sugar cube.' },
    { icon: '🌊', title: 'Europa\'s Ocean', text: 'Jupiter\'s moon Europa has a subsurface ocean containing about 2-3 times the volume of all Earth\'s oceans combined.' },
    { icon: '🪐', title: 'Saturn Would Float', text: 'Saturn\'s average density is less than water. If you could find a bathtub large enough, Saturn would float in it.' },
    { icon: '🔭', title: 'Observable Universe', text: 'The observable universe is 93 billion light-years in diameter, but the entire universe could be 250 times larger — or even infinite.' },
  ];

  const grid = document.getElementById('facts-grid');
  grid.innerHTML = facts.map((f, i) => `
    <div class="fact-card reveal" style="transition-delay: ${i * 0.08}s">
      <div class="fact-icon">${f.icon}</div>
      <h3 class="fact-title">${f.title}</h3>
      <p class="fact-text">${f.text}</p>
    </div>
  `).join('');
}

// =============================================
// Reveal Animation on Scroll
// =============================================
function initRevealAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  // Re-observe as new elements may be added
  function observeAll() {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  observeAll();
  // Re-run after dynamic content loads
  setInterval(observeAll, 2000);
}

// =============================================
// Initialize Everything
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Starfield
  new Starfield(document.getElementById('starfield'));

  // Navigation
  initNavigation();

  // Stats counter
  animateStats();

  // Load APOD
  loadAPOD();

  // Load facts
  loadFacts();

  // Reveal animations
  initRevealAnimations();

  // Mars Rover button
  document.getElementById('btn-fetch-mars').addEventListener('click', fetchMarsPhotos);

  // Gallery search
  document.getElementById('btn-search-gallery').addEventListener('click', () => {
    const query = document.getElementById('gallery-search-input').value.trim();
    if (query) searchGallery(query);
  });

  document.getElementById('gallery-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) searchGallery(query);
    }
  });

  // Quick tag buttons
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      document.getElementById('gallery-search-input').value = query;
      searchGallery(query);
    });
  });

  // Lightbox
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Auto-load gallery with default search
  searchGallery('nebula');
});
