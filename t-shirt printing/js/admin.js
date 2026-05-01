// Data Models
let allUsers = JSON.parse(localStorage.getItem('skb_all_users')) || [];
let products = JSON.parse(localStorage.getItem('skb_products')) || [];
let orders = JSON.parse(localStorage.getItem('skb_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('skb_admin_user')) || null;

// DOM Elements
const loginScreen = document.getElementById('admin-login-screen');
const adminLayout = document.getElementById('admin-layout');
const loginForm = document.getElementById('admin-login-form');

// Initialize
function init() {
    if (currentUser && currentUser.role === 'admin') {
        showDashboard();
    } else {
        loginScreen.style.display = 'flex';
        adminLayout.style.display = 'none';
    }
}

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    // Check against allUsers or hardcoded admin
    let user = allUsers.find(u => u.email === email && u.password === password && u.role === 'admin');

    // Hardcoded fallback for demo
    if (email === 'admin@skb.com' && password === 'admin') {
        user = { id: 1, name: 'Admin', email: 'admin@skb.com', role: 'admin' };
    }

    if (user) {
        localStorage.setItem('skb_admin_user', JSON.stringify(user));
        currentUser = user;
        showDashboard();
    } else {
        alert('Invalid admin credentials. Use admin@skb.com / admin');
    }
});

// Logout
document.getElementById('admin-logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('skb_admin_user');
    localStorage.removeItem('skb_user'); // Log out from the home page as well
    currentUser = null;
    window.location.href = 'index.html';
});

// Show Dashboard
function showDashboard() {
    loginScreen.style.display = 'none';
    adminLayout.style.display = 'flex';
    // Re-fetch in case changes happened
    allUsers = JSON.parse(localStorage.getItem('skb_all_users')) || [];
    products = JSON.parse(localStorage.getItem('skb_products')) || [];
    orders = JSON.parse(localStorage.getItem('skb_orders')) || [];

    updateDashboardStats();
    renderProductsTable();
    renderOrdersTable();
    renderUsersTable();
    setupNavigation();
}

// Navigation
function setupNavigation() {
    const links = document.querySelectorAll('.sidebar-nav .nav-link[data-view]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const view = link.getAttribute('data-view');
            document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(`view-${view}`).classList.add('active');

            // Update Title
            document.getElementById('page-title').textContent = view.charAt(0).toUpperCase() + view.slice(1);
        });
    });
}

// Render Stats
function updateDashboardStats() {
    const totalRev = orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('stat-revenue').textContent = `Rs. ${totalRev}`;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-users').textContent = allUsers.length;

    // Recent orders table
    const tbody = document.querySelector('#recent-orders-table tbody');
    tbody.innerHTML = '';
    orders.slice().reverse().slice(0, 5).forEach(order => {
        tbody.innerHTML += `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>Rs. ${order.total}</td>
                <td><span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></td>
            </tr>
        `;
    });
}

// Products Management
function renderProductsTable() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';
    products.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.image}" alt=""></td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>Rs. ${p.price}</td>
                <td>${p.stock || 50}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.id})" title="Edit" style="padding: 0.4rem 0.6rem;"><i class="ri-edit-line"></i></button>
                    <button class="btn btn-sm" onclick="deleteProduct(${p.id})" style="background: #ef4444; color: white; padding: 0.4rem 0.6rem; border: none; border-radius: 4px; cursor: pointer;" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `;
    });
}

// Orders Management
function renderOrdersTable() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';
    orders.slice().reverse().forEach(o => {
        tbody.innerHTML += `
            <tr>
                <td>#${o.id}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>${o.customerName}<br><small>${o.customerPhone}</small></td>
                <td>Rs. ${o.total}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
                        <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewOrder('${o.id}')">View</button>
                </td>
            </tr>
        `;
    });
}

window.updateOrderStatus = function (orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('skb_orders', JSON.stringify(orders));
        updateDashboardStats();
    }
}

// Users Management
function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    allUsers.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-delivered' : 'badge-pending'}">${u.role || 'user'}</span></td>
                <td>
                    <button class="btn btn-sm" onclick="deleteUser(${u.id})" style="background: #ef4444; color: white; padding: 0.4rem 0.6rem; border: none; border-radius: 4px; cursor: pointer;" title="Delete User"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `;
    });
}

window.deleteUser = function (id) {
    if (id === 1 || (currentUser && currentUser.id === id)) {
        alert("You cannot delete the primary admin account or yourself!");
        return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
        allUsers = allUsers.filter(u => u.id !== id);
        localStorage.setItem('skb_all_users', JSON.stringify(allUsers));
        renderUsersTable();
        updateDashboardStats();
    }
}

// Modals
const modalOverlay = document.getElementById('admin-modal-overlay');
const productModal = document.getElementById('product-modal');

window.openProductModal = function () {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add Product';
    productModal.classList.add('active');
    modalOverlay.classList.add('active');
}

window.closeAdminModal = function () {
    document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('active'));
    modalOverlay.classList.remove('active');
}

window.editProduct = function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock || 50;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-image').value = p.image;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    productModal.classList.add('active');
    modalOverlay.classList.add('active');
}

window.deleteProduct = function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('skb_products', JSON.stringify(products));
        renderProductsTable();
    }
}

document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const pData = {
        name: document.getElementById('prod-name').value,
        price: parseInt(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        category: document.getElementById('prod-category').value,
        image: document.getElementById('prod-image').value,
    };

    if (id) {
        // Edit
        const idx = products.findIndex(p => p.id == id);
        products[idx] = { ...products[idx], ...pData };
    } else {
        // Add
        pData.id = Date.now(); // fake id
        products.push(pData);
    }

    localStorage.setItem('skb_products', JSON.stringify(products));
    renderProductsTable();
    closeAdminModal();
});

window.viewOrder = function (id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let itemsHtml = order.items.map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
            <span>${i.quantity}x ${i.name} (${i.size}, ${i.color})</span>
            <span>Rs. ${i.price * i.quantity}</span>
        </div>
    `).join('');

    document.getElementById('order-details-content').innerHTML = `
        <div style="margin-bottom: 1rem;">
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Address:</strong> ${order.address}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
        </div>
        <hr style="border:0; border-top:1px solid #eee; margin-bottom:1rem;">
        <h4 style="margin-bottom: 0.5rem;">Items</h4>
        ${itemsHtml}
        <hr style="border:0; border-top:1px solid #eee; margin:1rem 0;">
        <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Total:</span>
            <span>Rs. ${order.total}</span>
        </div>
    `;
    document.getElementById('order-modal').classList.add('active');
    modalOverlay.classList.add('active');
}

// Run init
init();
