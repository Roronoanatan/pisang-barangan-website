// == style.js (fixed & upgraded) ==

// keys
const CART_KEY = 'ecom_cart';
const USER_KEY = 'ecom_user';
const USER_LIST_KEY = 'ecom_users';
const PROD_KEY = 'ecom_products';
const SALES_KEY = 'ecom_sales';

const $ = id => document.getElementById(id);
const formatRp = n => 'Rp' + Number(n).toLocaleString('id-ID');

// default products (with stock)
const PRODUCTS_DEFAULT = [
  { id: 1, name: 'Pisang Barangan Kecil', price: 15000, img: 'pisang barangan ukuran kecil.jpeg', desc: 'Ukuran kecil, manis segar.', stock: 20 },
  { id: 2, name: 'Pisang Barangan Sedang', price: 20000, img: 'pisang barangan ukuran sedang.jpeg', desc: 'Ukuran sedang, cocok untuk harian.', stock: 15 },
  { id: 3, name: 'Pisang Barangan Besar', price: 25000, img: 'pisang barangan ukuran besar.jpeg', desc: 'Ukuran besar, ideal untuk oleh-oleh.', stock: 8 }
];

// --- storage helpers ---
function loadProducts() { return JSON.parse(localStorage.getItem(PROD_KEY)) || JSON.parse(JSON.stringify(PRODUCTS_DEFAULT)); }
function saveProducts(list) { localStorage.setItem(PROD_KEY, JSON.stringify(list)); }

function loadCart() { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartUI(); }
function clearCart() { localStorage.removeItem(CART_KEY); updateCartUI(); }

function getUser() { return JSON.parse(localStorage.getItem(USER_KEY)); }
function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); updateUserUI(); }
function removeUser() { localStorage.removeItem(USER_KEY); updateUserUI(); }

function getUserList() { return JSON.parse(localStorage.getItem(USER_LIST_KEY)) || []; }
function saveUserList(list) { localStorage.setItem(USER_LIST_KEY, JSON.stringify(list)); }

function getSales() { return JSON.parse(localStorage.getItem(SALES_KEY)) || []; }
function saveSales(list) { localStorage.setItem(SALES_KEY, JSON.stringify(list)); }

// --- UI rendering ---
function renderProducts() {
  const list = loadProducts(), u = getUser();
  const wrap = $('products'); if (!wrap) return;
  wrap.innerHTML = '';
  list.forEach(p => {
    const el = document.createElement('div'); el.className = 'product';
    const outStock = p.stock <= 0;
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}" />
      <strong>${p.name}</strong>
      <div class="price">${formatRp(p.price)}</div>
      <div class="muted">${p.desc}</div>
      <div class="small">Stok: <strong>${p.stock}</strong></div>
      ${u && u.role === 'admin'
        ? `<div class="admin-controls">
             <button onclick="openEditProduct(${p.id})" style="background:#f0ad4e;">Edit</button>
             <button onclick="deleteProduct(${p.id})" style="background:#ff5252;">Hapus</button>
           </div>`
        : `<button onclick="addToCart(${p.id})" ${outStock ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}>${outStock ? 'Habis' : 'Tambah ke Keranjang'}</button>`}
    `;
    wrap.appendChild(el);
  });
  updateCartUI();
}

// Admin product table
function renderAdminProductTable() {
  const list = loadProducts();
  if (!$('productTableWrap')) return;
  if (list.length === 0) { $('productTableWrap').innerHTML = '<div class="small">Belum ada produk.</div>'; return; }
  let html = '<table><thead><tr><th>Nama</th><th>Harga</th><th>Stok</th><th>Deskripsi</th><th>Aksi</th></tr></thead><tbody>';
  list.forEach(p => {
    html += `<tr>
      <td>${p.name}</td>
      <td>${formatRp(p.price)}</td>
      <td><input class="inline-input" type="number" value="${p.stock}" min="0" data-id="${p.id}" onchange="updateStock(event)"></td>
      <td>${p.desc}</td>
      <td>
        <button onclick="openEditProduct(${p.id})">Edit</button>
        <button onclick="deleteProduct(${p.id})" class="btn-danger">Hapus</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('productTableWrap').innerHTML = html;
}

// Users table
function renderUsersTable() {
  const users = getUserList();
  if (!$('usersTableWrap')) return;
  if (users.length === 0) { $('usersTableWrap').innerHTML = '<div class="small">Belum ada pengguna terdaftar.</div>'; return; }
  let html = '<table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Aksi</th></tr></thead><tbody>';
  users.forEach((u, idx) => {
    html += `<tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role || 'user'}</td>
      <td><button onclick="deleteUser(${idx})" class="btn-danger">Hapus</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('usersTableWrap').innerHTML = html;
}

// Sales (transactions) table
function renderSalesTable() {
  const sales = getSales();
  if (!$('salesTableWrap')) return;
  if (sales.length === 0) { $('salesTableWrap').innerHTML = '<div class="small">Belum ada transaksi.</div>'; return; }
  let html = '<table><thead><tr><th>ID</th><th>User</th><th>Tanggal</th><th>Total</th><th>Item</th></tr></thead><tbody>';
  sales.slice().reverse().forEach(s => {
    const items = s.items.map(it => `${it.name} x${it.qty}`).join(', ');
    html += `<tr>
      <td>${s.id}</td>
      <td>${s.userEmail || 'Guest'}</td>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${formatRp(s.total)}</td>
      <td>${items}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('salesTableWrap').innerHTML = html;
}

// Report
function renderReport() {
  if (!$('reportWrap')) return;
  const sales = getSales();
  const products = loadProducts();
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalOrders = sales.length;
  const soldMap = {};
  sales.forEach(s => s.items.forEach(it => { soldMap[it.id] = (soldMap[it.id] || 0) + it.qty; }));
  let html = `<div class="card" style="margin-bottom:12px;padding:12px"><strong>Total Pendapatan:</strong> ${formatRp(totalRevenue)}<br><strong>Total Transaksi:</strong> ${totalOrders}</div>`;
  html += '<h4>Produk Terjual</h4>';
  if (Object.keys(soldMap).length === 0) { html += '<div class="small">Belum ada produk terjual.</div>'; }
  else {
    html += '<table><thead><tr><th>Produk</th><th>Terjual (qty)</th></tr></thead><tbody>';
    Object.keys(soldMap).forEach(id => {
      const prod = products.find(p => p.id == id) || { name: '(produk dihapus)' };
      html += `<tr><td>${prod.name}</td><td>${soldMap[id]}</td></tr>`;
    });
    html += '</tbody></table>';
  }
  $('reportWrap').innerHTML = html;
}

// --- Product CRUD ---
function addProduct() {
  const name = $('pName').value.trim();
  const price = parseInt($('pPrice').value);
  const stock = parseInt($('pStock').value) || 0;
  const img = $('pImg').value.trim();
  if (!name || !price || !img) return alert('Lengkapi nama, harga, gambar.');
  const list = loadProducts();
  const nextId = list.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  list.push({ id: nextId, name, price, img, desc: '', stock });
  saveProducts(list);
  $('pName').value = ''; $('pPrice').value = ''; $('pImg').value = ''; $('pStock').value = '';
  renderProducts(); renderAdminProductTable(); renderReport();
  alert('Produk ditambahkan!');
}

function deleteProduct(id) {
  if (!confirm('Yakin hapus produk ini?')) return;
  let list = loadProducts().filter(p => p.id !== id);
  saveProducts(list);
  renderProducts(); renderAdminProductTable(); renderReport();
  alert('Produk dihapus!');
}

function updateStock(e) {
  const id = parseInt(e.target.dataset.id), val = parseInt(e.target.value) || 0;
  const list = loadProducts();
  const idx = list.findIndex(p => p.id === id);
  if (idx >= 0) { list[idx].stock = val; saveProducts(list); renderProducts(); renderAdminProductTable(); }
}

function openEditProduct(id) {
  const list = loadProducts(); const p = list.find(x => x.id === id);
  if (!p) return alert('Produk tidak ditemukan');
  $('adminPanel').classList.add('open');
  activateTab('productsTab');
  $('pName').value = p.name; $('pPrice').value = p.price; $('pImg').value = p.img; $('pStock').value = p.stock;
  const addBtn = $('addProduct');
  addBtn.textContent = 'Simpan Perubahan';
  addBtn.onclick = function saveEdit() {
    const name = $('pName').value.trim(), price = parseInt($('pPrice').value), stock = parseInt($('pStock').value) || 0, img = $('pImg').value.trim();
    if (!name || !price || !img) return alert('Lengkapi nama, harga, gambar.');
    p.name = name; p.price = price; p.img = img; p.stock = stock;
    saveProducts(list);
    addBtn.textContent = 'Tambah Produk';
    addBtn.onclick = addProduct;
    $('pName').value = ''; $('pPrice').value = ''; $('pImg').value = ''; $('pStock').value = '';
    renderProducts(); renderAdminProductTable(); renderReport();
    alert('Perubahan disimpan!');
  };
}

// --- CART ---
function addToCart(id) {
  // require login
  const u = getUser();
  if (!u) {
    alert('Silakan login terlebih dahulu sebelum menambahkan produk ke keranjang.');
    showLoginForm();
    return;
  }
  const prod = loadProducts().find(p => p.id === id);
  if (!prod) return alert('Produk tidak ditemukan.');
  if (prod.stock <= 0) return alert('Stok habis.');
  const cart = loadCart();
  const item = cart.find(c => c.id === id);
  if (item) item.qty++;
  else cart.push({ id: prod.id, name: prod.name, price: prod.price, img: prod.img, qty: 1 });
  saveCart(cart);
  openCartDrawer();
}

function updateCartUI() {
  const items = loadCart();
  if ($('cartCount')) $('cartCount').textContent = items.reduce((s, i) => s + i.qty, 0);
  const wrap = $('cartItems'); if (wrap) {
    wrap.innerHTML = '';
    let total = 0;
    items.forEach(i => {
      total += i.price * i.qty;
      const d = document.createElement('div'); d.className = 'cart-item';
      d.innerHTML = `<img src="${i.img}"/><div style="flex:1"><strong>${i.name}</strong><div class="muted">${formatRp(i.price)} x ${i.qty}</div></div>`;
      wrap.appendChild(d);
    });
    if ($('cartTotal')) $('cartTotal').textContent = formatRp(total);
  }
}

function openCartDrawer() { const el = $('cartDrawer'); if (el) el.classList.add('open'); }
function closeCartDrawer() { const el = $('cartDrawer'); if (el) el.classList.remove('open'); }

// --- CHECKOUT & RECEIPT ---
function openCheckoutModal() {
  const el = $('checkoutModal'); if (!el) return alert('Modal checkout tidak ditemukan.');
  el.style.display = 'flex'; el.setAttribute('aria-hidden', 'false');
}

function closeCheckoutModal() {
  const el = $('checkoutModal'); if (!el) return;
  el.style.display = 'none'; el.setAttribute('aria-hidden', 'true');
}

function openReceiptModal() {
  const el = $('receiptModal'); if (!el) return;
  el.style.display = 'flex'; el.setAttribute('aria-hidden', 'false');
}

function closeReceiptModal() {
  const el = $('receiptModal'); if (!el) return;
  el.style.display = 'none'; el.setAttribute('aria-hidden', 'true');
}

function showLoginForm() {
  const m = $('modal'); if (!m) return alert('Form login tidak tersedia.');
  m.classList.add('open');
  m.style.display = 'flex';
}

// handle confirm checkout
function performCheckoutConfirm() {
  const u = getUser();
  if (!u) {
    alert('Anda harus login sebelum checkout.');
    showLoginForm();
    return;
  }

  const address = $('checkoutAddress').value.trim();
  const payment = $('checkoutPayment').value;
  const cart = loadCart();

  if (cart.length === 0) { alert('Keranjang masih kosong.'); return; }
  if (!address) { alert('Alamat pengiriman harus diisi.'); return; }
  if (!payment) { alert('Pilih metode pembayaran.'); return; }

  // compute total
  let total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const trxId = 'TRX' + Date.now();
  const date = new Date().toISOString();

  // reduce stock
  const products = loadProducts();
  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });
  saveProducts(products);

  // save sale
  const sales = getSales();
  sales.push({
    id: trxId,
    date,
    userEmail: u.email || 'Guest',
    items: cart,
    total,
    payment,
    address
  });
  saveSales(sales);

  // prepare receipt HTML (nicely formatted)
  const nowStr = new Date().toLocaleString('id-ID');
  let itemsHTML = cart.map(it => `<div class="space-between"><span>${it.name} x ${it.qty}</span><strong>${formatRp(it.price * it.qty)}</strong></div>`).join('');
  let paymentExtra = '';
  if (payment === 'Transfer') {
    paymentExtra = `<div class="muted small">Transfer ke: BCA 123456789 a.n Boru Regar</div>`;
  } else if (payment === 'QRIS') {
    paymentExtra = `<div class="muted small">Scan QRIS pada aplikasi e-wallet Anda untuk membayar.</div>`;
  }

  const receiptHTML = `
    <h3 style="margin-top:0">Struk Pembelian</h3>
    <div class="muted">No. Transaksi: <strong>${trxId}</strong></div>
    <div class="muted">Tanggal: ${nowStr}</div>
    <hr>
    <div><strong>Nama:</strong> ${u.name || 'Guest'}</div>
    <div><strong>Alamat:</strong><div class="small muted" style="margin-top:6px">${address}</div></div>
    <div style="margin-top:8px"><strong>Metode Pembayaran:</strong> ${payment}</div>
    ${paymentExtra}
    <hr>
    <div><strong>Daftar Barang</strong></div>
    <div style="margin-top:8px">${itemsHTML}</div>
    <hr>
    <div class="space-between"><strong>Total</strong><strong>${formatRp(total)}</strong></div>
    <div style="margin-top:10px" class="small muted">Terima kasih telah berbelanja di Pisang Barangan Boru Regar.</div>
  `;
  if ($('receiptContent')) $('receiptContent').innerHTML = receiptHTML;

  // clear cart
  saveCart([]);
  // refresh relevant UI parts
  renderProducts(); renderSalesTable(); renderReport(); renderAdminProductTable();

  // close checkout and open receipt
  closeCheckoutModal();
  openReceiptModal();
}

// --- Print receipt ---
function doPrintReceipt() {
  const content = $('receiptContent').innerHTML;
  const w = window.open('', '', 'width=600,height=800');
  w.document.write(`<html><head><title>Struk - ${new Date().toLocaleString()}</title></head><body>${content}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  // optionally w.close(); but leave open for user control
}

// --- USERS ---
function createAccount() {
  const email = $('email').value.trim(), pwd = $('pwd').value.trim();
  if (!email || !pwd) return alert('Isi email dan password.');
  const users = getUserList();
  if (users.some(u => u.email === email)) return alert('Email sudah terdaftar.');
  users.push({ name: email.split('@')[0], email, password: pwd, role: 'user' });
  saveUserList(users);
  alert('Akun berhasil dibuat! Silakan login.');
}

function attemptLogin() {
  const email = $('email').value.trim(), pwd = $('pwd').value.trim();
  if (email === 'admin' && pwd === 'admin') {
    setUser({ name: 'Admin', email: 'admin', role: 'admin' });
    const m = $('modal'); if (m) { m.classList.remove('open'); m.style.display = 'none'; }
    alert('Login sebagai admin berhasil!');
    return;
  }
  const users = getUserList();
  const found = users.find(u => u.email === email && u.password === pwd);
  if (found) {
    setUser({ name: found.name, email: found.email, role: found.role || 'user' });
    const m = $('modal'); if (m) { m.classList.remove('open'); m.style.display = 'none'; }
    alert('Login berhasil!');
  } else {
    alert('Login gagal! Periksa email dan password.');
  }
}

function deleteUser(idx) {
  if (!confirm('Hapus pengguna ini?')) return;
  const users = getUserList();
  users.splice(idx, 1);
  saveUserList(users);
  renderUsersTable();
  alert('Pengguna dihapus.');
}

function deleteUserByEmail(email) {
  const users = getUserList().filter(u => u.email !== email);
  saveUserList(users);
}

// --- admin helpers ---
function activateTab(tabId) {
  document.querySelectorAll('#adminPanel .admin-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('#adminTabs .tab').forEach(t => t.classList.remove('active'));
  $('adminPanel').classList.add('open');
  $(tabId).style.display = 'block';
  document.querySelector(`#adminTabs .tab[data-tab="${tabId}"]`).classList.add('active');
  if (tabId === 'productsTab') renderAdminProductTable();
  if (tabId === 'usersTab') renderUsersTable();
  if (tabId === 'salesTab') renderSalesTable();
  if (tabId === 'reportTab') renderReport();
}

// update UI when user changes
function updateUserUI() {
  const u = getUser();
  if ($('welcome')) {
    if (u) {
      $('welcome').textContent = 'Halo, ' + u.name + (u.role === 'admin' ? ' (Admin)' : '');
      $('loginBtn').textContent = 'Logout';
      $('adminBtn').style.display = (u.role === 'admin') ? 'inline-block' : 'none';
    } else {
      $('welcome').textContent = 'Selamat datang, Tamu';
      $('loginBtn').textContent = 'Login';
      if ($('adminBtn')) $('adminBtn').style.display = 'none';
    }
  }
  renderProducts();
}

// --- init / events ---
document.addEventListener('DOMContentLoaded', () => {
  // initial render
  renderProducts(); updateCartUI(); updateUserUI();
  renderAdminProductTable(); renderUsersTable(); renderSalesTable(); renderReport();

  // cart buttons
  if ($('openCart')) $('openCart').onclick = openCartDrawer;
  if ($('closeCart')) $('closeCart').onclick = closeCartDrawer;
  if ($('clearCartBtn')) $('clearCartBtn').onclick = () => { if (confirm('Kosongkan keranjang?')) saveCart([]); };
  if ($('checkoutBtn')) $('checkoutBtn').onclick = () => {
    const cart = loadCart();
    if (cart.length === 0) { alert('Keranjang masih kosong.'); return; }
    openCheckoutModal();
  };

  // login button
  if ($('loginBtn')) $('loginBtn').onclick = () => {
    if (getUser()) { removeUser(); alert('Logout berhasil'); }
    else { showLoginForm(); $('modalTitle').textContent = 'Login'; }
  };
  if ($('closeModal')) $('closeModal').onclick = () => $('modal').classList.remove('open');
  if ($('loginSubmit')) $('loginSubmit').onclick = attemptLogin;
  if ($('createAccountBtn')) $('createAccountBtn').onclick = createAccount;

  // admin
  if ($('adminBtn')) $('adminBtn').onclick = () => { activateTab('productsTab'); $('adminPanel').classList.add('open'); };
  if ($('closeAdmin')) $('closeAdmin').onclick = () => { $('adminPanel').classList.remove('open'); };
  if ($('addProduct')) $('addProduct').onclick = addProduct;
  document.querySelectorAll('#adminTabs .tab').forEach(t => { t.onclick = () => activateTab(t.dataset.tab); });

  // checkout modal actions
  if ($('confirmCheckout')) $('confirmCheckout').onclick = performCheckoutConfirm;
  if ($('cancelCheckout')) $('cancelCheckout').onclick = closeCheckoutModal;

  // receipt actions
  if ($('closeReceipt')) $('closeReceipt').onclick = closeReceiptModal;
  if ($('printReceipt')) $('printReceipt').onclick = doPrintReceipt;
});

// storage sync
window.addEventListener('storage', function (e) {
  if (e.key === PROD_KEY) { renderProducts(); renderAdminProductTable(); renderReport(); }
  if (e.key === SALES_KEY) { renderSalesTable(); renderReport(); }
  if (e.key === USER_LIST_KEY) { renderUsersTable(); }
});

// end of file

  document.getElementById("checkoutPayment").addEventListener("change", function() {
    const qrisBox = document.getElementById("qrisBox");
    const payment = this.value;

    if (payment === "QRIS") {
      qrisBox.style.display = "block";
    } else {
      qrisBox.style.display = "none";
    }
  });