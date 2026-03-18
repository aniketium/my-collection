// ===== State =====
let allItems = [];
let categories = [];
let siteConfig = {};
let currency = '$';
let currentCategory = 'all';
let currentSort = 'featured';
let currentView = 'grid';
let visibleCount = 12;
const PAGE_SIZE = 12;
const STORAGE_KEY = 'inventory_items';

// ===== Helpers =====
function getStoredItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveStoredItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getAllItems() {
  const stored = getStoredItems();
  // Merge: stored items override data.json items by ID, plus add new ones
  const map = new Map();
  allItems.forEach(i => map.set(i.id, i));
  stored.forEach(i => map.set(i.id, i));
  return Array.from(map.values());
}

function formatPrice(price) {
  return currency + price.toLocaleString('en-IN');
}

function getCategoryName(id) {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.name : id;
}

function nextId() {
  const items = getAllItems();
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

// ===== Init =====
async function init() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    allItems = data.items;
    categories = data.categories;
    siteConfig = data.site;
    currency = data.currency || '$';
    renderCategoryPills();
    renderFooterCategories();
    renderProducts();
    renderStats();
    setupEventListeners();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ===== Stats =====
function renderStats() {
  const container = document.getElementById('heroStats');
  const countEl = document.getElementById('itemCount');
  const items = getAllItems();
  const total = items.reduce((sum, i) => sum + (i.price || 0), 0);

  if (container) {
    container.innerHTML = `
      <div class="stat">
        <span class="stat-value">${items.length}</span>
        <span class="stat-label">Items</span>
      </div>
      <div class="stat">
        <span class="stat-value">${currency}${total.toLocaleString('en-IN')}</span>
        <span class="stat-label">Total value</span>
      </div>
      <div class="stat">
        <span class="stat-value">${new Set(items.map(i => i.category)).size}</span>
        <span class="stat-label">Categories</span>
      </div>
    `;
  }

  if (countEl) {
    countEl.textContent = `${items.length} items`;
  }
}

// ===== Render Category Pills =====
function renderCategoryPills() {
  const container = document.getElementById('filterPills');
  if (!container) return;

  categories.forEach(cat => {
    const items = getAllItems().filter(i => i.category === cat.id);
    if (items.length === 0) return;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.category = cat.id;
    btn.textContent = cat.name;
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
  let items = getAllItems();

  if (currentCategory !== 'all') {
    items = items.filter(item => item.category === currentCategory);
  }

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

// ===== Render Product Card =====
function createProductCard(item) {
  const card = document.createElement('div');
  card.className = 'product-card';

  card.innerHTML = `
    <div class="card-image">
      ${item.featured ? `<span class="card-badge">Fav</span>` : ''}
      <a href="${item.url}" target="_blank" rel="noopener" class="card-link" aria-label="View ${item.name}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </a>
      <img src="${item.image}" alt="${item.name}" loading="lazy">
    </div>
    <div class="card-info">
      <span class="card-meta">${item.brand} / ${getCategoryName(item.category)}</span>
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
  grid.className = `product-grid${currentView === 'list' ? ' list-view' : ''}`;
  visible.forEach(item => grid.appendChild(createProductCard(item)));

  if (showMoreWrapper) {
    showMoreWrapper.style.display = items.length > visibleCount ? '' : 'none';
  }
}

// ===== Search =====
function handleSearch(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  if (!query.trim()) { results.innerHTML = ''; return; }

  const q = query.toLowerCase();
  const matches = getAllItems().filter(item =>
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
        <div class="meta">${item.brand} / ${getCategoryName(item.category)}</div>
      </div>
      <span class="search-result-price">${formatPrice(item.price)}</span>
    </a>
  `).join('');
}

// ===== Event Listeners =====
function setupEventListeners() {
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

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderProducts();
    });
  });

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
  const searchInput = document.getElementById('searchInput');

  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInput?.focus(), 100);
    });

    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
        const results = document.getElementById('searchResults');
        if (results) results.innerHTML = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput?.focus(), 100);
      }
    });

    searchInput?.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  // URL params
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat && categories.find(c => c.id === cat)) {
    currentCategory = cat;
    const pills = document.querySelectorAll('.pill');
    pills.forEach(p => p.classList.toggle('active', p.dataset.category === cat));
    renderProducts();
  }
}

// ===== Browse Page =====
function initBrowse() {
  fetch('data.json').then(r => r.json()).then(data => {
    allItems = data.items;
    categories = data.categories;
    currency = data.currency || '$';
    renderBrowseCategories();
    renderFooterCategories();
  });
}

function renderBrowseCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  categories.forEach(cat => {
    const items = getAllItems().filter(i => i.category === cat.id);
    if (items.length === 0) return;
    const firstItem = items[0];
    const card = document.createElement('a');
    card.className = 'category-card';
    card.href = `index.html?category=${cat.id}`;
    card.innerHTML = `
      <div class="category-card-image">
        <img src="${firstItem.image}" alt="${cat.name}" loading="lazy">
      </div>
      <div class="category-card-info">
        <span class="name">${cat.name}</span>
        <span class="count">${items.length}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== Admin Page =====
function initAdmin() {
  fetch('data.json').then(r => r.json()).then(data => {
    allItems = data.items;
    categories = data.categories;
    currency = data.currency || '$';
    setupAdmin();
  });
}

function setupAdmin() {
  const ADMIN_PASS = 'admin123'; // Change this!
  const gate = document.getElementById('adminGate');
  const panel = document.getElementById('adminPanel');
  const passInput = document.getElementById('adminPass');
  const loginBtn = document.getElementById('adminLogin');
  const errorMsg = document.getElementById('adminError');

  // Check if already logged in
  if (sessionStorage.getItem('admin_auth') === 'true') {
    gate.style.display = 'none';
    panel.style.display = 'block';
    renderAdminPanel();
    return;
  }

  loginBtn.addEventListener('click', () => {
    if (passInput.value === ADMIN_PASS) {
      sessionStorage.setItem('admin_auth', 'true');
      gate.style.display = 'none';
      panel.style.display = 'block';
      renderAdminPanel();
    } else {
      errorMsg.textContent = 'Wrong password';
    }
  });

  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

function renderAdminPanel() {
  const list = document.getElementById('adminItemList');
  const items = getAllItems();
  const catSelect = document.getElementById('itemCategory');

  // Populate category dropdown
  if (catSelect && catSelect.options.length <= 1) {
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = '<div class="admin-empty">No items yet. Click "Add Item" to get started.</div>';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="admin-item" data-id="${item.id}">
      <img class="admin-item-img" src="${item.image}" alt="${item.name}">
      <div class="admin-item-info">
        <div class="admin-item-name">${item.name}</div>
        <div class="admin-item-meta">${item.brand} / ${getCategoryName(item.category)}${item.featured ? ' &bull; Favorite' : ''}</div>
      </div>
      <span class="admin-item-price">${formatPrice(item.price)}</span>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="editItem(${item.id})">Edit</button>
        <button class="btn-delete" onclick="deleteItem(${item.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Admin form controls
function showAddForm() {
  const form = document.getElementById('adminForm');
  form.classList.add('active');
  document.getElementById('formTitle').textContent = 'Add new item';
  document.getElementById('editId').value = '';
  document.getElementById('itemName').value = '';
  document.getElementById('itemBrand').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemImage').value = '';
  document.getElementById('itemUrl').value = '';
  document.getElementById('itemFeatured').checked = false;
  document.getElementById('imagePreviewImg').innerHTML = '<span class="placeholder">Preview</span>';
}

function hideForm() {
  document.getElementById('adminForm').classList.remove('active');
}

function editItem(id) {
  const item = getAllItems().find(i => i.id === id);
  if (!item) return;

  const form = document.getElementById('adminForm');
  form.classList.add('active');
  document.getElementById('formTitle').textContent = 'Edit item';
  document.getElementById('editId').value = item.id;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemBrand').value = item.brand;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('itemImage').value = item.image;
  document.getElementById('itemUrl').value = item.url;
  document.getElementById('itemFeatured').checked = item.featured;
  document.getElementById('imagePreviewImg').innerHTML = `<img src="${item.image}" alt="preview">`;

  form.scrollIntoView({ behavior: 'smooth' });
}

function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  const stored = getStoredItems().filter(i => i.id !== id);
  // Also mark data.json items as deleted
  const baseItem = allItems.find(i => i.id === id);
  if (baseItem) {
    // Store a deletion marker
    const deletions = JSON.parse(localStorage.getItem('inventory_deletions') || '[]');
    deletions.push(id);
    localStorage.setItem('inventory_deletions', JSON.stringify(deletions));
  }
  saveStoredItems(stored);
  renderAdminPanel();
}

function saveItem() {
  const editId = document.getElementById('editId').value;
  const item = {
    id: editId ? parseInt(editId) : nextId(),
    name: document.getElementById('itemName').value.trim(),
    brand: document.getElementById('itemBrand').value.trim(),
    category: document.getElementById('itemCategory').value,
    price: parseInt(document.getElementById('itemPrice').value) || 0,
    image: document.getElementById('itemImage').value.trim(),
    url: document.getElementById('itemUrl').value.trim(),
    featured: document.getElementById('itemFeatured').checked
  };

  if (!item.name || !item.brand || !item.category) {
    alert('Please fill in name, brand, and category.');
    return;
  }

  const stored = getStoredItems();
  const idx = stored.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    stored[idx] = item;
  } else {
    stored.push(item);
  }
  try {
    saveStoredItems(stored);
  } catch (e) {
    alert('Failed to save — image may be too large for browser storage. Try a smaller image or use a URL instead.');
    return;
  }
  hideForm();
  renderAdminPanel();
}

function exportItems() {
  const items = getAllItems();
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory-items.json';
  a.click();
  URL.revokeObjectURL(url);
}

function logout() {
  sessionStorage.removeItem('admin_auth');
  location.reload();
}

// Override getAllItems to respect deletions
const _originalGetAllItems = getAllItems;
getAllItems = function() {
  const deletions = JSON.parse(localStorage.getItem('inventory_deletions') || '[]');
  return _originalGetAllItems().filter(i => !deletions.includes(i.id));
};

// Image tab switching
function switchImageTab(tab) {
  document.querySelectorAll('.img-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.img-tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById('imageTabUrl').style.display = tab === 'url' ? '' : 'none';
  document.getElementById('imageTabUpload').style.display = tab === 'upload' ? '' : 'none';
}

// Process uploaded file — resize and compress to JPEG
function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be under 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Resize to max 800px on longest side to keep localStorage manageable
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById('itemImage').value = dataUrl;
      document.getElementById('imagePreviewImg').innerHTML = `<img src="${dataUrl}" alt="preview">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Image preview + upload + drag & drop
document.addEventListener('DOMContentLoaded', () => {
  const imgInput = document.getElementById('itemImage');
  if (imgInput) {
    imgInput.addEventListener('input', (e) => {
      const preview = document.getElementById('imagePreviewImg');
      const url = e.target.value.trim();
      if (url && !url.startsWith('data:')) {
        preview.innerHTML = `<img src="${url}" alt="preview" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>Invalid URL</span>'">`;
      } else if (!url) {
        preview.innerHTML = '<span class="placeholder">Preview</span>';
      }
    });
  }

  const fileInput = document.getElementById('itemImageFile');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleImageFile(e.target.files[0]);
    });
  }

  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      handleImageFile(e.dataTransfer.files[0]);
    });
  }
});

// ===== Start =====
if (document.getElementById('productGrid')) {
  init();
} else if (document.getElementById('categoryGrid')) {
  initBrowse();
} else if (document.getElementById('adminPanel')) {
  initAdmin();
} else {
  fetch('data.json').then(r => r.json()).then(data => {
    categories = data.categories;
    renderFooterCategories();
  });
}
