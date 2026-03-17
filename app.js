// ===== State =====
let allItems = [];
let categories = [];
let siteConfig = {};
let currentCategory = 'all';
let currentSort = 'featured';
let visibleCount = 12;
const PAGE_SIZE = 12;

// ===== Category Icons (SVG paths) =====
const categoryIcons = {
  laptop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  monitor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  briefcase: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
  book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  coffee: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>',
  watch: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 01-2 1.82H9.83a2 2 0 01-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 019.83 1h4.35a2 2 0 012 1.82l.35 3.83"/></svg>',
  shirt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>',
  plane: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>'
};

// ===== Init =====
async function init() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    allItems = data.items;
    categories = data.categories;
    siteConfig = data.site;
    renderCategoryPills();
    renderFooterCategories();
    renderProducts();
    setupEventListeners();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ===== Render Category Pills =====
function renderCategoryPills() {
  const container = document.getElementById('filterPills');
  if (!container) return;

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.category = cat.id;
    btn.innerHTML = `${categoryIcons[cat.icon] || ''} ${cat.name}`;
    container.appendChild(btn);
  });
}

// ===== Render Footer Categories =====
function renderFooterCategories() {
  const container = document.getElementById('footerCategories');
  if (!container) return;

  categories.forEach(cat => {
    const a = document.createElement('a');
    a.href = `index.html?category=${cat.id}`;
    a.textContent = cat.name;
    container.appendChild(a);
  });
}

// ===== Get Filtered & Sorted Items =====
function getFilteredItems() {
  let items = [...allItems];

  // Filter
  if (currentCategory !== 'all') {
    items = items.filter(item => item.category === currentCategory);
  }

  // Sort
  switch (currentSort) {
    case 'featured':
      items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'brand':
      items.sort((a, b) => a.brand.localeCompare(b.brand));
      break;
  }

  return items;
}

// ===== Format Price =====
function formatPrice(price) {
  return '$' + price.toLocaleString('en-US');
}

// ===== Get Category Name =====
function getCategoryName(id) {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.name : id;
}

// ===== Render Product Card =====
function createProductCard(item) {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="card-top">
      ${item.featured ? `
        <span class="card-badge">
          <svg viewBox="0 0 24 24" fill="var(--accent)" stroke="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Favorite
        </span>
      ` : '<span class="card-badge"></span>'}
      <a href="${item.url}" target="_blank" rel="noopener" class="card-link" aria-label="View ${item.name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </a>
    </div>
    <div class="card-image">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
    </div>
    <div class="card-info">
      <span class="card-meta"><span class="brand">${item.brand}</span> &middot; ${getCategoryName(item.category)}</span>
      <div class="card-bottom">
        <span class="card-name">${item.name}</span>
        <span class="card-price">${formatPrice(item.price)}</span>
      </div>
    </div>
  `;

  return card;
}

// ===== Render Products =====
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const showMoreWrapper = document.getElementById('showMoreWrapper');
  if (!grid) return;

  const items = getFilteredItems();
  const visible = items.slice(0, visibleCount);

  grid.innerHTML = '';
  visible.forEach(item => {
    grid.appendChild(createProductCard(item));
  });

  if (showMoreWrapper) {
    showMoreWrapper.style.display = items.length > visibleCount ? '' : 'none';
  }
}

// ===== Search =====
function handleSearch(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  if (!query.trim()) {
    results.innerHTML = '';
    return;
  }

  const q = query.toLowerCase();
  const matches = allItems.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.brand.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-empty">No results found</div>';
    return;
  }

  results.innerHTML = matches.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener" class="search-result-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="search-result-info">
        <div class="name">${item.name}</div>
        <div class="meta">${item.brand} &middot; ${getCategoryName(item.category)}</div>
      </div>
      <span class="search-result-price">${formatPrice(item.price)}</span>
    </a>
  `).join('');
}

// ===== Event Listeners =====
function setupEventListeners() {
  // Category filter pills
  const pillContainer = document.getElementById('filterPills');
  if (pillContainer) {
    pillContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;

      pillContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category;
      visibleCount = PAGE_SIZE;
      renderProducts();
    });
  }

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // Show more
  const showMoreBtn = document.getElementById('showMoreBtn');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderProducts();
    });
  }

  // Search
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');

  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInput?.focus(), 100);
    });

    searchClose?.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
      if (searchInput) searchInput.value = '';
      const results = document.getElementById('searchResults');
      if (results) results.innerHTML = '';
    });

    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
      }
      // Cmd/Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput?.focus(), 100);
      }
    });

    searchInput?.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  // URL params (for category links)
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat && categories.find(c => c.id === cat)) {
    currentCategory = cat;
    const pills = document.querySelectorAll('.pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.category === cat);
    });
    renderProducts();
  }
}

// ===== Browse Page =====
function initBrowse() {
  fetch('data.json').then(r => r.json()).then(data => {
    allItems = data.items;
    categories = data.categories;
    renderBrowseCategories();
    renderFooterCategories();
  });
}

function renderBrowseCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  categories.forEach(cat => {
    const count = allItems.filter(i => i.category === cat.id).length;
    if (count === 0) return;

    const firstItem = allItems.find(i => i.category === cat.id);
    const card = document.createElement('a');
    card.className = 'category-card';
    card.href = `index.html?category=${cat.id}`;

    card.innerHTML = `
      <div class="category-card-image">
        <img src="${firstItem.image}" alt="${cat.name}" loading="lazy">
      </div>
      <div class="category-card-info">
        <span class="name">${cat.name}</span>
        <span class="count">${count}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ===== Start =====
if (document.getElementById('productGrid')) {
  init();
} else if (document.getElementById('categoryGrid')) {
  initBrowse();
} else {
  // About or other pages — just load footer categories
  fetch('data.json').then(r => r.json()).then(data => {
    categories = data.categories;
    renderFooterCategories();
  });
}
