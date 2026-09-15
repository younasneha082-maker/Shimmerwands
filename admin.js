/* ==========================================================================
   SHIMMERWANDS ADMIN PORTAL ENGINE (AUTH, CRUD, CNIC, HASHING & INVOICES)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAdminSystem();
});

/* Initial Default Data Seeds & Helpers */
function normalizeCategory(cat) {
  if (!cat) return 'sets';
  const c = String(cat).toLowerCase().trim();
  if (c === 'cat_1' || c === 'sets' || c.includes('set')) return 'sets';
  if (c === 'cat_2' || c === 'face' || c.includes('face')) return 'face';
  if (c === 'cat_3' || c === 'eye' || c.includes('eye')) return 'eye';
  if (c === 'cat_4' || c === 'lip' || c.includes('lip')) return 'lip';
  return 'sets';
}

function getCategoryDisplayName(cat) {
  const norm = normalizeCategory(cat);
  const map = {
    sets: 'Full Face Sets',
    face: 'Face Sculptors',
    eye: 'Eye & Brow Magic',
    lip: 'Lip & Detailing'
  };
  return map[norm] || 'Full Face Sets';
}

function formatPKR(amount) {
  const val = parseFloat(amount) || 0;
  return `PKR ${val.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const DEFAULT_SUPER_ADMIN_PASS_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"; // SHA-256 of "admin123"

const defaultAdmins = [
  {
    id: "admin_super_1",
    name: "Main Super Admin",
    email: "admin@shimmerwands.com",
    contact: "+92 300 0000000",
    cnic: "42101-1234567-1",
    address: "Shimmerwands HQ, Lahore",
    username: "admin@shimmerwands.com",
    passwordHash: DEFAULT_SUPER_ADMIN_PASS_HASH,
    role: "super_admin",
    createdAt: "2026-08-01"
  }
];

const defaultProducts = [
  {
    id: "1",
    title: "The Royal Crown Rhinestone Set",
    sub: "10-Piece Luxury Face & Eye Wand Set",
    category: "sets",
    price: 148.00,
    quantity: 45,
    badge: "BESTSELLER",
    img: "assets/main_page_1.png"
  },
  {
    id: "2",
    title: "Coquette Pink Bow Trio",
    sub: "3-Piece Cheek, Contour & Highlight Set",
    category: "sets",
    price: 85.00,
    quantity: 30,
    badge: "COQUETTE EDITION",
    img: "assets/main_page_2.png"
  },
  {
    id: "3",
    title: "Celestial Starlight Face Wand",
    sub: "Ultra-Soft Foundation & Bronzer Wand",
    category: "face",
    price: 42.00,
    quantity: 65,
    badge: "NEW ARRIVAL",
    img: "assets/main_page_3.png"
  },
  {
    id: "4",
    title: "Empress Rose Gold Powder Wand",
    sub: "Large Fluffy Setting & Powder Brush",
    category: "face",
    price: 55.00,
    quantity: 40,
    badge: "",
    img: "assets/main_page_4.png"
  }
];

const defaultOrders = [
  {
    id: "SW-1001",
    customerName: "Ayesha Malik",
    email: "ayesha.malik@example.com",
    phone: "+92 321 9876543",
    address: "House 45, Street 12, Phase 5 DHA, Lahore",
    date: "2026-09-04 14:30",
    total: 148.00,
    status: "Pending", // Pending vs Done
    items: [
      { name: "The Royal Crown Rhinestone Set", qty: 1, price: 148.00 }
    ]
  }
];

/* Helper: SHA-256 Hashing */
async function hashPassword(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Helper: CNIC Auto Formatter (12345-1234567-1) */
function formatCNIC(val) {
  let cleaned = val.replace(/\D/g, '').slice(0, 13);
  if (cleaned.length > 12) {
    return `${cleaned.slice(0,5)}-${cleaned.slice(5,12)}-${cleaned.slice(12)}`;
  } else if (cleaned.length > 5) {
    return `${cleaned.slice(0,5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

/* Storage Helpers */
function getStoredAdmins() {
  const data = localStorage.getItem('shimmer_admins');
  let admins = data ? JSON.parse(data) : defaultAdmins;
  admins.forEach(a => {
    if (!a.passwordHash) {
      a.passwordHash = DEFAULT_SUPER_ADMIN_PASS_HASH;
    }
  });
  return admins;
}
function saveAdmins(admins) {
  localStorage.setItem('shimmer_admins', JSON.stringify(admins));
}

function getStoredProducts() {
  const data = localStorage.getItem('shimmer_products');
  return data ? JSON.parse(data) : defaultProducts;
}
function saveProducts(prods) {
  localStorage.setItem('shimmer_products', JSON.stringify(prods));
}

function getStoredOrders() {
  const data = localStorage.getItem('shimmer_orders');
  return data ? JSON.parse(data) : defaultOrders;
}
function saveOrders(orders) {
  localStorage.setItem('shimmer_orders', JSON.stringify(orders));
}

/* ==========================================================================
   MAIN ADMIN ENGINE
   ========================================================================== */
function initAdminSystem() {
  // Ensure default seeds exist in local storage for instant loading
  saveAdmins(getStoredAdmins());
  if (!localStorage.getItem('shimmer_products')) saveProducts(defaultProducts);
  if (!localStorage.getItem('shimmer_orders')) saveOrders(defaultOrders);

  const isLoginPage = !!document.getElementById('admin-login-form');
  const isDashboardPage = !!document.querySelector('.admin-layout');

  if (isLoginPage) {
    setupLoginPage();
  }

  if (isDashboardPage) {
    const currentUser = checkAuthSession();
    if (!currentUser) return;

    // Attach UI event listeners & tab handlers immediately
    setupDashboardUI(currentUser);
    setupCNICFormatting();
    setupAdminCRUD(currentUser);
    setupProductCRUD();
    setupOrdersTab();
    setupInvoiceTab();
    setupReportsTab();

    // Async sync with Supabase in background
    syncCloudDataInBackground();
  }
}

async function syncCloudDataInBackground() {
  if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
    try {
      const cloudProds = await window.ShimmerDB.getProducts();
      if (cloudProds && cloudProds.length > 0) {
        saveProducts(cloudProds);
      } else {
        for (const p of defaultProducts) {
          await window.ShimmerDB.saveProduct(p);
        }
      }

      const cloudAdmins = await window.ShimmerDB.getAdmins();
      if (cloudAdmins && cloudAdmins.length > 0) {
        saveAdmins(cloudAdmins);
      } else {
        for (const a of defaultAdmins) {
          await window.ShimmerDB.saveAdmin(a);
        }
      }

      const cloudOrders = await window.ShimmerDB.getOrders();
      if (cloudOrders) {
        saveOrders(cloudOrders);
      }

      const user = checkAuthSession();
      if (user) {
        setupAdminCRUD(user);
        setupProductCRUD();
        setupOrdersTab();
        setupInvoiceTab();
        setupReportsTab();
      }
    } catch (err) {
      console.warn("Background cloud sync notice:", err);
    }
  }
}

/* 1. Login Page Logic */
function setupLoginPage() {
  const loginForm = document.getElementById('admin-login-form');
  const errorMsg = document.getElementById('login-error');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = document.getElementById('login-username').value.trim();
    const passInput = document.getElementById('login-password').value;

    const passHash = await hashPassword(passInput);

    // Check Cloud Admins if available
    let admins = getStoredAdmins();
    if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
      const cloudAdmins = await window.ShimmerDB.getAdmins();
      if (cloudAdmins && cloudAdmins.length > 0) admins = cloudAdmins;
    }

    const matchedAdmin = admins.find(a => 
      (a.username.toLowerCase() === userInput.toLowerCase() || a.email.toLowerCase() === userInput.toLowerCase()) && 
      a.passwordHash === passHash
    );

    if (matchedAdmin) {
      sessionStorage.setItem('shimmer_active_user', JSON.stringify(matchedAdmin));
      window.location.href = 'admin.html';
    } else {
      if (errorMsg) errorMsg.style.display = 'block';
    }
  });
}

/* 2. Check Auth Session */
function checkAuthSession() {
  const activeUserStr = sessionStorage.getItem('shimmer_active_user');
  if (!activeUserStr) {
    window.location.href = 'admin-login.html';
    return null;
  }
  return JSON.parse(activeUserStr);
}

/* 3. Setup Dashboard Navigation & Permissions */
function setupDashboardUI(currentUser) {
  // Update header info
  const navAvatar = document.getElementById('nav-user-avatar');
  const navName = document.getElementById('nav-user-name');
  const navRole = document.getElementById('nav-user-role');
  const logoutBtn = document.getElementById('btn-admin-logout');
  const mobileTabSelect = document.getElementById('admin-mobile-tab-select');

  if (navAvatar) navAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
  if (navName) navName.textContent = currentUser.name;
  if (navRole) navRole.textContent = currentUser.role === 'super_admin' ? 'SUPER ADMIN' : 'SUB ADMIN';

  // Logout action
  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('shimmer_active_user');
    window.location.href = 'admin-login.html';
  });

  // Permission & Tab Enforcement
  if (currentUser.role !== 'super_admin') {
    document.querySelectorAll('.super-admin-only').forEach(el => {
      if (el.tagName === 'OPTION') {
        el.remove();
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Handle Initial Tab & URL Hash Navigation
  const initialHash = window.location.hash ? window.location.hash.substring(1) : '';
  const defaultTab = currentUser.role === 'super_admin' ? 'tab-admins' : 'tab-products';
  const startTab = (initialHash && document.getElementById(initialHash) && (currentUser.role === 'super_admin' || initialHash !== 'tab-admins'))
    ? initialHash
    : defaultTab;

  window.switchTab(startTab);

  // Delegated click and touch event listener for tab buttons, links, and anchor tags
  const handleTabEvent = (e) => {
    const tabEl = e.target.closest('[data-tab], a[href^="#tab-"]');
    if (tabEl) {
      const targetTab = tabEl.getAttribute('data-tab') || tabEl.getAttribute('href').substring(1);
      if (targetTab && document.getElementById(targetTab)) {
        e.preventDefault();
        window.switchTab(targetTab);
      }
    }
  };

  document.addEventListener('click', handleTabEvent);
  document.addEventListener('touchend', handleTabEvent, { passive: false });

  // Mobile Tab Dropdown Selector
  if (mobileTabSelect) {
    const onSelectChange = (e) => {
      const selected = e.target.value;
      if (selected === 'storefront') {
        window.location.href = 'index.html';
        return;
      }
      window.switchTab(selected);
    };
    mobileTabSelect.addEventListener('change', onSelectChange);
    mobileTabSelect.addEventListener('input', onSelectChange);
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash) {
      const hashTab = window.location.hash.substring(1);
      if (document.getElementById(hashTab)) {
        window.switchTab(hashTab);
      }
    }
  });
}

// Global Tab Switching Engine (Handles Mobile Responsiveness, Scroll Reset, and Visual Sync)
window.switchTab = function(tabId) {
  if (!tabId) return;
  if (tabId === 'storefront') {
    window.location.href = 'index.html';
    return;
  }
  if (tabId.startsWith('#')) tabId = tabId.substring(1);

  const targetSection = document.getElementById(tabId);
  if (!targetSection) {
    console.warn("Target tab section not found:", tabId);
    return;
  }

  const tabContents = document.querySelectorAll('.tab-content');
  const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-tab], [data-tab], a[href^="#tab-"]');
  const mobileTabSelect = document.getElementById('admin-mobile-tab-select');

  tabContents.forEach(c => {
    const isActive = c.id === tabId;
    c.classList.toggle('active', isActive);
    c.style.setProperty('display', isActive ? 'block' : 'none', 'important');
  });

  sidebarBtns.forEach(b => {
    const target = b.getAttribute('data-tab') || (b.getAttribute('href') ? b.getAttribute('href').substring(1) : '');
    const isActive = target === tabId;
    b.classList.toggle('active', isActive);
    if (isActive && window.innerWidth <= 992 && b.classList.contains('sidebar-btn')) {
      try {
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch (err) {}
    }
  });

  if (mobileTabSelect && mobileTabSelect.value !== tabId) {
    mobileTabSelect.value = tabId;
  }

  // Sync URL Hash cleanly without jumping
  if (window.location.hash !== '#' + tabId) {
    try {
      history.replaceState(null, '', '#' + tabId);
    } catch (err) {}
  }

  // Always reset window scroll to top when switching tabs on mobile view
  if (window.innerWidth <= 992) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  // Close open modals when switching tabs so modal overlays do not linger over other tabs
  document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('open'));
};

/* 4. Setup CNIC Inputs Formatting */
function setupCNICFormatting() {
  const cnicInputs = document.querySelectorAll('#admin-input-cnic');
  cnicInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = formatCNIC(e.target.value);
    });
  });
}

/* 5. ADMINS CRUD MANAGEMENT (SUPER ADMIN ONLY) */
function setupAdminCRUD(currentUser) {
  const adminsTableBody = document.getElementById('admins-table-body');
  const openAddBtn = document.getElementById('btn-open-add-admin');
  const adminModal = document.getElementById('modal-admin-form');
  const closeAdminModalBtn = document.getElementById('close-admin-modal');
  const adminForm = document.getElementById('form-admin-save');
  const formError = document.getElementById('admin-form-error');

  const togglePassBtn = document.getElementById('toggle-admin-pass-btn');
  const toggleConfirmBtn = document.getElementById('toggle-admin-confirm-btn');

  togglePassBtn?.addEventListener('click', () => {
    const passInput = document.getElementById('admin-input-password');
    if (passInput) {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
      togglePassBtn.textContent = passInput.type === 'password' ? '👁️' : '🙈';
    }
  });

  toggleConfirmBtn?.addEventListener('click', () => {
    const confirmInput = document.getElementById('admin-input-confirm');
    if (confirmInput) {
      confirmInput.type = confirmInput.type === 'password' ? 'text' : 'password';
      toggleConfirmBtn.textContent = confirmInput.type === 'password' ? '👁️' : '🙈';
    }
  });

  renderAdminsTable();

  openAddBtn?.addEventListener('click', () => {
    adminForm.reset();
    document.getElementById('admin-edit-id').value = '';
    document.getElementById('admin-modal-title').textContent = 'Add New Admin Account';
    document.getElementById('group-confirm-pass').style.display = 'block';
    document.getElementById('admin-input-password').placeholder = '••••••••';
    if (formError) formError.style.display = 'none';
    adminModal.classList.add('open');
  });

  closeAdminModalBtn?.addEventListener('click', () => adminModal.classList.remove('open'));
  adminModal?.addEventListener('click', (e) => { if (e.target === adminModal) adminModal.classList.remove('open'); });

  // Save Admin (Create or Update)
  adminForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (formError) formError.style.display = 'none';

    const editId = document.getElementById('admin-edit-id').value;
    const name = document.getElementById('admin-input-name').value.trim();
    const email = document.getElementById('admin-input-email').value.trim();
    const contact = document.getElementById('admin-input-contact').value.trim();
    const cnic = document.getElementById('admin-input-cnic').value.trim();
    const address = document.getElementById('admin-input-address').value.trim();
    const username = document.getElementById('admin-input-username').value.trim();
    const role = document.getElementById('admin-input-role').value;
    const password = document.getElementById('admin-input-password').value;
    const confirmPassword = document.getElementById('admin-input-confirm')?.value;

    if (!name || !email || !username) {
      if (formError) {
        formError.textContent = "⚠️ Please fill in required fields (Name, Email, Username).";
        formError.style.display = 'block';
      }
      return;
    }

    // Validation for new Admin
    if (!editId) {
      if (!password) {
        if (formError) {
          formError.textContent = "⚠️ Password is required for new admin account.";
          formError.style.display = 'block';
        }
        return;
      }
      if (password !== confirmPassword) {
        if (formError) {
          formError.textContent = "⚠️ Passwords do not match! Please check confirm password.";
          formError.style.display = 'block';
        }
        return;
      }
    }

    let admins = getStoredAdmins();

    if (editId) {
      // Edit Admin
      const idx = admins.findIndex(a => a.id === editId);
      if (idx !== -1) {
        admins[idx].name = name;
        admins[idx].email = email;
        admins[idx].contact = contact;
        admins[idx].cnic = cnic;
        admins[idx].address = address;
        admins[idx].username = username;
        admins[idx].role = role;
        if (!admins[idx].passwordHash) {
          admins[idx].passwordHash = DEFAULT_SUPER_ADMIN_PASS_HASH;
        }
        if (password) {
          admins[idx].passwordHash = await hashPassword(password);
        }
      }
    } else {
      // Create Admin
      const newAdmin = {
        id: "admin_" + Date.now(),
        name,
        email,
        contact,
        cnic,
        address,
        username,
        passwordHash: await hashPassword(password),
        role,
        createdAt: new Date().toISOString().split('T')[0]
      };
      admins.push(newAdmin);
    }

    try {
      saveAdmins(admins);

      // Update active user session if self was edited
      const activeUserStr = sessionStorage.getItem('shimmer_active_user');
      if (activeUserStr) {
        try {
          const activeUser = JSON.parse(activeUserStr);
          if (activeUser.id === editId) {
            const updatedSelf = admins.find(a => a.id === editId);
            if (updatedSelf) {
              sessionStorage.setItem('shimmer_active_user', JSON.stringify(updatedSelf));
            }
          }
        } catch (err) {}
      }

      if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
        const savedObj = editId ? admins.find(a => a.id === editId) : admins[admins.length - 1];
        if (savedObj) await window.ShimmerDB.saveAdmin(savedObj);
      }
      renderAdminsTable();
      adminModal.classList.remove('open');
      alert(`✨ Admin Account ${editId ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error("Save Admin error:", err);
      alert("⚠️ Error saving admin account: " + (err.message || err));
    }
  });

  function renderAdminsTable() {
    if (!adminsTableBody) return;
    const admins = getStoredAdmins();

    // Metrics
    document.getElementById('metric-total-admins').textContent = admins.length;
    document.getElementById('metric-super-admins').textContent = admins.filter(a => a.role === 'super_admin').length;
    document.getElementById('metric-sub-admins').textContent = admins.filter(a => a.role === 'sub_admin').length;

    adminsTableBody.innerHTML = '';
    admins.forEach(admin => {
      const isMainSuper = admin.id === "admin_super_1";
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Admin">
          <div style="font-weight: 700; color: var(--charcoal);">${admin.name || 'Admin'}</div>
          <div style="font-size: 0.75rem; color: #888;">@${admin.username || 'user'}</div>
        </td>
        <td data-label="Email">${admin.email || '-'}</td>
        <td data-label="Contact">${admin.contact || '-'}</td>
        <td data-label="CNIC"><strong style="letter-spacing: 1px;">${admin.cnic || '-'}</strong></td>
        <td data-label="Address">${admin.address || '-'}</td>
        <td data-label="Role">
          <span class="status-badge ${admin.role === 'super_admin' ? 'status-super' : 'status-sub'}">
            ${admin.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
          </span>
        </td>
        <td data-label="Actions">
          <button class="btn-action btn-edit" onclick="openEditAdmin('${admin.id}')" title="Edit Admin">✏️</button>
          ${!isMainSuper ? `<button class="btn-action btn-delete" onclick="deleteAdmin('${admin.id}')" title="Delete Admin">🗑️</button>` : '<span style="font-size: 0.72rem; color: #888;">Main Admin</span>'}
        </td>
      `;
      adminsTableBody.appendChild(tr);
    });
  }

  window.openEditAdmin = (id) => {
    const admins = getStoredAdmins();
    const admin = admins.find(a => a.id === id);
    if (!admin) return;

    if (formError) formError.style.display = 'none';

    document.getElementById('admin-edit-id').value = admin.id;
    document.getElementById('admin-input-name').value = admin.name || '';
    document.getElementById('admin-input-email').value = admin.email || '';
    document.getElementById('admin-input-contact').value = admin.contact || '';
    document.getElementById('admin-input-cnic').value = admin.cnic || '';
    document.getElementById('admin-input-address').value = admin.address || '';
    document.getElementById('admin-input-username').value = admin.username || '';
    document.getElementById('admin-input-role').value = admin.role || 'sub_admin';
    document.getElementById('admin-input-password').value = '';
    document.getElementById('admin-input-password').placeholder = 'Leave blank to keep current';
    document.getElementById('group-confirm-pass').style.display = 'none';

    document.getElementById('admin-modal-title').textContent = 'Edit Admin Account';
    adminModal.classList.add('open');
  };

  window.deleteAdmin = async (id) => {
    if (confirm("Are you sure you want to delete this Admin account?")) {
      let admins = getStoredAdmins();
      admins = admins.filter(a => a.id !== id);
      saveAdmins(admins);
      if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
        await window.ShimmerDB.deleteAdmin(id);
      }
      renderAdminsTable();
    }
  };
}

/* 6. PRODUCTS & INVENTORY QUANTITY CRUD */
function setupProductCRUD() {
  const productsTableBody = document.getElementById('products-table-body');
  const openAddBtn = document.getElementById('btn-open-add-product');
  const productModal = document.getElementById('modal-product-form');
  const closeProductModalBtn = document.getElementById('close-product-modal');
  const productForm = document.getElementById('form-product-save');

  renderProductsTable();

  openAddBtn?.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add New Wand Item';
    productModal.classList.add('open');
  });

  closeProductModalBtn?.addEventListener('click', () => productModal.classList.remove('open'));
  productModal?.addEventListener('click', (e) => { if (e.target === productModal) productModal.classList.remove('open'); });

  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const editId = document.getElementById('product-edit-id').value;
      const title = document.getElementById('prod-input-title').value.trim();
      const sub = document.getElementById('prod-input-sub').value.trim();
      const category = document.getElementById('prod-input-category').value;
      const price = parseFloat(document.getElementById('prod-input-price').value) || 0;
      const quantity = parseInt(document.getElementById('prod-input-quantity').value) || 0;
      const color = document.getElementById('prod-input-color')?.value.trim() || 'Rose Gold';
      const badge = document.getElementById('prod-input-badge').value.trim();
      const imgRaw = document.getElementById('prod-input-img').value.trim();

      if (!title) {
        alert("⚠️ Please enter a product wand title.");
        return;
      }

      const imagesList = imgRaw.split(',').map(s => s.trim()).filter(Boolean);
      const mainImg = imagesList[0] || imgRaw || 'assets/main_page_1.png';

      let prods = getStoredProducts();

      if (editId) {
        const idx = prods.findIndex(p => p.id === editId);
        if (idx !== -1) {
          prods[idx] = { ...prods[idx], title, sub, category, price, quantity, color, badge, img: mainImg, images: imagesList };
        }
      } else {
        const newProd = {
          id: String(Date.now()),
          title,
          sub,
          category,
          price,
          quantity,
          color,
          badge,
          img: mainImg,
          images: imagesList
        };
        prods.push(newProd);
      }

      saveProducts(prods);
      if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
        const savedProd = editId ? prods.find(p => p.id === editId) : prods[prods.length - 1];
        if (savedProd) await window.ShimmerDB.saveProduct(savedProd);
      }
      renderProductsTable();
      productModal.classList.remove('open');
      alert(`✨ Product Wand ${editId ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      console.error("Save Product error:", err);
      alert("⚠️ Error saving product: " + (err.message || err));
    }
  });

  function renderProductsTable() {
    if (!productsTableBody) return;
    const prods = getStoredProducts();

    // Metrics
    document.getElementById('metric-total-products').textContent = prods.length;
    document.getElementById('metric-low-stock').textContent = prods.filter(p => p.quantity <= 10).length;
    document.getElementById('metric-total-stock').textContent = prods.reduce((acc, p) => acc + p.quantity, 0);

    productsTableBody.innerHTML = '';
    prods.forEach(prod => {
      let stockBadgeClass = 'badge-in-stock';
      let stockText = 'In Stock';

      if (prod.quantity === 0) {
        stockBadgeClass = 'badge-out-stock';
        stockText = 'Unavailable';
      } else if (prod.quantity <= 10) {
        stockBadgeClass = 'badge-low-stock';
        stockText = 'Low Stock';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Wand Item">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${prod.img || (prod.images ? prod.images[0] : 'assets/main_page_1.png')}" alt="${prod.title}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover;">
            <div style="text-align: left;">
              <div style="font-weight: 700; color: var(--charcoal);">${prod.title}</div>
              <div style="font-size: 0.75rem; color: #777;">${prod.sub}</div>
            </div>
          </div>
        </td>
        <td data-label="Category" style="font-size: 0.8rem; font-weight: 600; color: var(--rose-gold-dark);">${getCategoryDisplayName(prod.category)}</td>
        <td data-label="Price"><strong style="color: var(--rose-gold-dark);">${formatPKR(prod.price)}</strong></td>
        <td data-label="Stock"><strong>${prod.quantity} units</strong></td>
        <td data-label="Status"><span class="status-badge ${stockBadgeClass}">${stockText}</span></td>
        <td data-label="Badge">${prod.badge ? `<span style="font-size:0.7rem; background:#f5dce1; color:#b8736d; padding:2px 8px; border-radius:10px; font-weight:600;">${prod.badge}</span>` : '-'}</td>
        <td data-label="Actions">
          <button class="btn-action btn-edit" onclick="openEditProduct('${prod.id}')" title="Edit Product">✏️</button>
          <button class="btn-action btn-delete" onclick="deleteProduct('${prod.id}')" title="Delete Product">🗑️</button>
        </td>
      `;
      productsTableBody.appendChild(tr);
    });
  }

  window.openEditProduct = (id) => {
    const prods = getStoredProducts();
    const prod = prods.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('product-edit-id').value = prod.id;
    document.getElementById('prod-input-title').value = prod.title || '';
    document.getElementById('prod-input-sub').value = prod.sub || '';
    document.getElementById('prod-input-category').value = normalizeCategory(prod.category);
    document.getElementById('prod-input-price').value = prod.price || 0;
    document.getElementById('prod-input-quantity').value = prod.quantity !== undefined ? prod.quantity : 0;
    const colorInput = document.getElementById('prod-input-color');
    if (colorInput) colorInput.value = prod.color || 'Rose Gold';
    document.getElementById('prod-input-badge').value = prod.badge || '';

    const imgField = document.getElementById('prod-input-img');
    if (prod.images && prod.images.length > 0) {
      imgField.value = prod.images.join(', ');
    } else {
      imgField.value = prod.img || '';
    }

    document.getElementById('product-modal-title').textContent = 'Edit Wand Details';
    productModal.classList.add('open');
  };

  window.deleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      let prods = getStoredProducts();
      prods = prods.filter(p => p.id !== id);
      saveProducts(prods);
      if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
        await window.ShimmerDB.deleteProduct(id);
      }
      renderProductsTable();
    }
  };
}

/* 7. ORDERS TAB & PENDING/DONE STATUS TOGGLE */
function setupOrdersTab() {
  const ordersTableBody = document.getElementById('orders-table-body');
  renderOrdersTable();

  function renderOrdersTable() {
    if (!ordersTableBody) return;
    const orders = getStoredOrders();

    // Metrics
    document.getElementById('metric-total-orders').textContent = orders.length;
    document.getElementById('metric-pending-orders').textContent = orders.filter(o => o.status === 'Pending').length;
    document.getElementById('metric-done-orders').textContent = orders.filter(o => o.status === 'Done').length;

    ordersTableBody.innerHTML = '';
    if (orders.length === 0) {
      ordersTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">No orders recorded yet. Placed orders will appear here automatically!</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const isPending = order.status === 'Pending';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="Order ID"><strong style="color: var(--rose-gold-dark);">${order.id}</strong></td>
        <td data-label="Customer">
          <div style="font-weight: 700;">${order.customerName}</div>
          <div style="font-size: 0.75rem; color: #777;">${order.email}</div>
        </td>
        <td data-label="Contact">
          <div>${order.phone}</div>
          <div style="font-size: 0.75rem; color: #666;">${order.address}</div>
        </td>
        <td data-label="Date">${order.date}</td>
        <td data-label="Total"><strong style="color: var(--charcoal);">${formatPKR(order.total)}</strong></td>
        <td data-label="Status">
          <span class="status-badge ${isPending ? 'status-pending' : 'status-done'}">
            ${isPending ? 'Pending ⏳' : 'Done ✅'}
          </span>
        </td>
        <td data-label="Actions">
          <button class="btn-toggle-status ${isPending ? 'btn-sparkle' : ''}" 
                  style="${!isPending ? 'background:#e2e8f0; color:#475569; cursor:pointer;' : 'padding:6px 12px; font-size:0.7rem;'}"
                  onclick="toggleOrderStatus('${order.id}')">
            ${isPending ? 'Mark Done ✅' : 'Reopen ⏳'}
          </button>
        </td>
      `;
      ordersTableBody.appendChild(tr);
    });
  }

  window.toggleOrderStatus = async (id) => {
    let orders = getStoredOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const newStatus = orders[idx].status === 'Pending' ? 'Done' : 'Pending';
      orders[idx].status = newStatus;
      saveOrders(orders);
      if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
        await window.ShimmerDB.updateOrderStatus(id, newStatus);
      }
      renderOrdersTable();
      populateInvoiceDropdown();
      setupReportsTab();
    }
  };
}

/* 8. INVOICES TAB GENERATOR */
function setupInvoiceTab() {
  populateInvoiceDropdown();

  const orderSelect = document.getElementById('invoice-order-select');
  const printBtn = document.getElementById('btn-print-invoice');

  orderSelect?.addEventListener('change', (e) => {
    const orderId = e.target.value;
    if (orderId) {
      renderInvoice(orderId);
    }
  });

  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

function populateInvoiceDropdown() {
  const orderSelect = document.getElementById('invoice-order-select');
  if (!orderSelect) return;

  const orders = getStoredOrders();
  orderSelect.innerHTML = '<option value="">Select Order #...</option>';

  orders.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = `${o.id} - ${o.customerName} (${formatPKR(o.total)})`;
    orderSelect.appendChild(opt);
  });
}

function renderInvoice(orderId) {
  const orders = getStoredOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('inv-num').textContent = order.id;
  document.getElementById('inv-date').textContent = `Date: ${order.date}`;
  document.getElementById('inv-cust-name').textContent = order.customerName;
  document.getElementById('inv-cust-email').textContent = order.email;
  document.getElementById('inv-cust-phone').textContent = order.phone;
  document.getElementById('inv-cust-address').textContent = order.address;

  const itemsBody = document.getElementById('inv-items-body');
  itemsBody.innerHTML = '';

  order.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td style="text-align: center;">${item.qty}</td>
      <td style="text-align: right;">${formatPKR(item.price)}</td>
      <td style="text-align: right;">${formatPKR(item.qty * item.price)}</td>
    `;
    itemsBody.appendChild(tr);
  });

  document.getElementById('inv-subtotal').textContent = formatPKR(order.total);
  document.getElementById('inv-total').textContent = formatPKR(order.total);
}

/* 9. ANALYTICS REPORTS TAB */
function setupReportsTab() {
  const orders = getStoredOrders();
  const prods = getStoredProducts();

  const totalRev = orders.reduce((acc, o) => acc + o.total, 0);
  const avgOrder = orders.length ? (totalRev / orders.length) : 0;
  const doneOrders = orders.filter(o => o.status === 'Done').length;
  const fulfilmentRate = orders.length ? Math.round((doneOrders / orders.length) * 100) : 100;

  const revEl = document.getElementById('report-total-revenue');
  const avgEl = document.getElementById('report-avg-order');
  const fulEl = document.getElementById('report-fulfilment-rate');

  if (revEl) revEl.textContent = formatPKR(totalRev);
  if (avgEl) avgEl.textContent = formatPKR(avgOrder);
  if (fulEl) fulEl.textContent = `${fulfilmentRate}%`;

  // Top Customers Table
  const custBody = document.getElementById('report-customers-body');
  if (custBody) {
    custBody.innerHTML = '';
    const custMap = {};

    orders.forEach(o => {
      if (!custMap[o.email]) {
        custMap[o.email] = { name: o.customerName, email: o.email, count: 0, total: 0 };
      }
      custMap[o.email].count += 1;
      custMap[o.email].total += o.total;
    });

    const custArr = Object.values(custMap).sort((a,b) => b.total - a.total);

    if (custArr.length === 0) {
      custBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888;">No customer orders placed yet.</td></tr>`;
    } else {
      custArr.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.name}</strong><br><span style="font-size:0.75rem; color:#777;">${c.email}</span></td>
          <td>${c.count} orders</td>
          <td><strong style="color: var(--rose-gold-dark);">${formatPKR(c.total)}</strong></td>
        `;
        custBody.appendChild(tr);
      });
    }
  }

  // Stock Health Table
  const stockBody = document.getElementById('report-stock-body');
  if (stockBody) {
    stockBody.innerHTML = '';
    prods.forEach(p => {
      let badgeClass = 'badge-in-stock';
      let text = 'Healthy';
      if (p.quantity === 0) { badgeClass = 'badge-out-stock'; text = 'Out of Stock'; }
      else if (p.quantity <= 10) { badgeClass = 'badge-low-stock'; text = 'Low Stock'; }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.title}</strong></td>
        <td>${p.quantity} units</td>
        <td><span class="status-badge ${badgeClass}">${text}</span></td>
      `;
      stockBody.appendChild(tr);
    });
  }
}
