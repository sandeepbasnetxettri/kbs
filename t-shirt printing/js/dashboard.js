// --- Dashboard Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('skb_user'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    initializeDashboard(currentUser);
    setupEventListeners();
});

function initializeDashboard(user) {
    // Set Profile Info
    document.getElementById('welcome-text').textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
    document.getElementById('user-name-display').textContent = user.name;
    document.getElementById('user-email-display').textContent = user.email;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
    
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;

    // Load Orders
    const allOrders = JSON.parse(localStorage.getItem('skb_orders')) || [];
    const userOrders = allOrders.filter(o => o.customerEmail === user.email || o.customerName === user.name); // Simple match for demo

    updateStats(userOrders);
    renderRecentOrders(userOrders);
    renderAllOrders(userOrders);
    renderDesigns(userOrders);
}

function updateStats(orders) {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    
    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-spent').textContent = `Rs. ${totalSpent}`;
    document.getElementById('stat-total-designs').textContent = orders.filter(o => o.items.some(i => i.productId === 'custom')).length;
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-body');
    const emptyMsg = document.getElementById('no-orders-msg');
    
    if (orders.length === 0) {
        tbody.parentElement.parentElement.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    const recent = orders.slice(-5).reverse();
    tbody.innerHTML = '';
    
    recent.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>Rs. ${order.total}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td><button class="btn-text" onclick="viewOrderDetails('${order.id}')" style="color:var(--primary); cursor:pointer; background:none; border:none; font-weight:600;">Details</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderAllOrders(orders) {
    const tbody = document.getElementById('all-orders-body');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No orders found.</td></tr>';
        return;
    }

    orders.slice().reverse().forEach(order => {
        const row = document.createElement('tr');
        const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemsSummary}</div></td>
            <td>Rs. ${order.total}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function renderDesigns(orders) {
    const grid = document.getElementById('designs-grid');
    const emptyMsg = document.getElementById('no-designs-msg');
    grid.innerHTML = '';

    const customItems = [];
    orders.forEach(o => {
        o.items.forEach(item => {
            if (item.productId === 'custom') {
                customItems.push({ ...item, orderId: o.id, date: o.date });
            }
        });
    });

    if (customItems.length === 0) {
        grid.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyMsg.style.display = 'none';

    customItems.forEach(design => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'flex-start';
        card.innerHTML = `
            <img src="${design.image}" style="width:100%; height:200px; object-fit:cover; border-radius:0.5rem; margin-bottom:1rem;">
            <h4 style="margin-bottom:0.5rem;">${design.name}</h4>
            <p style="font-size:0.875rem; color:#64748b; margin-bottom:1rem;">Created on ${new Date(design.date).toLocaleDateString()}</p>
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <span style="font-weight:700; color:var(--primary);">Rs. ${design.price}</span>
                <span class="status-badge status-shipped" style="font-size:0.7rem;">Order #${design.orderId}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.viewOrderDetails = function(orderId) {
    const allOrders = JSON.parse(localStorage.getItem('skb_orders')) || [];
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const content = document.getElementById('order-detail-content');
    let itemsHtml = order.items.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px solid #f1f5f9;">
            <div>
                <strong>${item.name}</strong><br>
                <small>Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</small>
            </div>
            <div>Rs. ${item.price * item.quantity}</div>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="margin-bottom:1.5rem;">
            <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
            <p><strong>Shipping Address:</strong> ${order.address}</p>
        </div>
        <div style="background:#f8fafc; padding:1rem; border-radius:0.5rem;">
            <h4 style="margin-bottom:1rem;">Items</h4>
            ${itemsHtml}
            <div style="display:flex; justify-content:space-between; margin-top:1rem; font-weight:700; border-top:2px solid #e2e8f0; pt:1rem;">
                <span>Total</span>
                <span>Rs. ${order.total}</span>
            </div>
        </div>
    `;

    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('order-detail-modal').classList.add('active');
}

function switchView(viewId) {
    document.querySelectorAll('.dashboard-view').forEach(v => v.style.display = 'none');
    document.getElementById(`view-${viewId}`).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.getAttribute('data-view'));
        });
    });

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('skb_user');
            window.location.href = 'index.html';
        }
    });

    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.getElementById('dashboard-sidebar').classList.toggle('active');
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', closeModal);

    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        const user = JSON.parse(localStorage.getItem('skb_user'));
        const allUsers = JSON.parse(localStorage.getItem('skb_all_users'));
        
        const userIdx = allUsers.findIndex(u => u.email === user.email);
        if (userIdx > -1) {
            allUsers[userIdx].name = newName;
            localStorage.setItem('skb_all_users', JSON.stringify(allUsers));
            
            user.name = newName;
            localStorage.setItem('skb_user', JSON.stringify(user));
            
            showToast('Profile updated successfully!');
            setTimeout(() => window.location.reload(), 1000);
        }
    });
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('order-detail-modal').classList.remove('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
