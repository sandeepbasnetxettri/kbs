// --- Database Simulation (LocalStorage) ---
const defaultProducts = [
    { id: 1, name: "Nepal Retro Tee", price: 1500, category: "Graphic T-Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", stock: 50 },
    { id: 2, name: "Custom Print Block", price: 1800, category: "Custom Prints", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80", stock: 30 },
    { id: 3, name: "Corporate Logo Polo", price: 2000, category: "Business Branding", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80", stock: 100 },
    { id: 4, name: "King Queen Set", price: 2800, category: "Couple & Event", image: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=500&q=80", stock: 20 },
    { id: 5, name: "Kathmandu Vibes", price: 1200, category: "Graphic T-Shirts", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80", stock: 45 },
    { id: 6, name: "Minimalist Event Tee", price: 1000, category: "Couple & Event", image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&q=80", stock: 60 }
];

let products = JSON.parse(localStorage.getItem('skb_products'));
if (!products || products.length === 0) {
    products = defaultProducts;
    localStorage.setItem('skb_products', JSON.stringify(products));
}

let allUsers = JSON.parse(localStorage.getItem('skb_all_users')) || [];
if (!allUsers.find(u => u.email === 'admin@skb.com')) {
    allUsers.push({ id: 1, name: 'Admin', email: 'admin@skb.com', password: 'admin', role: 'admin' });
    localStorage.setItem('skb_all_users', JSON.stringify(allUsers));
}

let orders = JSON.parse(localStorage.getItem('skb_orders')) || [];

// --- State ---
let cart = JSON.parse(localStorage.getItem('skb_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('skb_user')) || null;
let currentDiscount = 0; // percentage
let isBuy2Get1Active = false;

// --- DOM Elements ---
const productsGrid = document.getElementById('products-grid');
const cartBadge = document.getElementById('cart-badge');
const cartDrawer = document.getElementById('cart-drawer');
const modalOverlay = document.getElementById('modal-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartDiscountRow = document.getElementById('discount-row');
const cartDiscountEl = document.getElementById('cart-discount');
const cartTotalEl = document.getElementById('cart-total');
const userGreeting = document.getElementById('user-greeting');
const toastEl = document.getElementById('toast');

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    // Refresh products from localStorage in case admin updated them
    products = JSON.parse(localStorage.getItem('skb_products')) || defaultProducts;
    allUsers = JSON.parse(localStorage.getItem('skb_all_users')) || [];
    orders = JSON.parse(localStorage.getItem('skb_orders')) || [];
    
    renderProducts(products);
    updateCartUI();
    checkAuth();
    setupEventListeners();
});

// --- Functions ---
function renderProducts(items) {
    productsGrid.innerHTML = '';
    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" onclick="openProductModal(${product.id})">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title" onclick="openProductModal(${product.id})">${product.name}</h3>
                <div class="product-bottom">
                    <span class="product-price">Rs. ${product.price}</span>
                    <button class="btn btn-primary" onclick="addToCart(${product.id}, 'M', 'Black')">Add</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// --- Cart Logic ---
window.addToCart = function(productId, size, color, customDesign = null) {
    const product = products.find(p => p.id === productId);
    if (!product && !customDesign) return;

    const itemPrice = customDesign ? 2000 : product.price;
    const itemName = customDesign ? "Custom Designed T-Shirt" : product.name;
    const itemImage = customDesign ? customDesign.image : product.image;

    const cartItem = {
        cartId: Date.now().toString(),
        productId: productId || 'custom',
        name: itemName,
        price: itemPrice,
        size: size,
        color: color,
        image: itemImage,
        quantity: 1
    };

    const existingIndex = cart.findIndex(i => i.productId === cartItem.productId && i.size === cartItem.size && i.color === cartItem.color && !customDesign);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    saveCart();
    updateCartUI();
    openModal('cart-drawer');
    showToast('Added to cart!');
}

window.removeFromCart = function(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    updateCartUI();
}

window.updateQuantity = function(cartId, delta) {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(cartId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('skb_cart', JSON.stringify(cart));
}

function calculateCart() {
    let subtotal = 0;
    let totalItems = 0;
    let itemsForDiscount = [];

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        totalItems += item.quantity;
        for(let i=0; i<item.quantity; i++) {
            itemsForDiscount.push(item.price);
        }
    });

    let discount = 0;
    isBuy2Get1Active = totalItems >= 3;
    if (isBuy2Get1Active) {
        itemsForDiscount.sort((a, b) => a - b);
        const freeItemsCount = Math.floor(totalItems / 3);
        for(let i=0; i<freeItemsCount; i++) {
            discount += itemsForDiscount[i];
        }
    }

    if (currentDiscount > 0) {
        const couponDiscount = (subtotal - discount) * (currentDiscount / 100);
        discount += couponDiscount;
    }

    const total = subtotal - discount;
    return { subtotal, discount, total, totalItems };
}

function updateCartUI() {
    const { subtotal, discount, total, totalItems } = calculateCart();
    
    cartBadge.textContent = totalItems;
    cartSubtotalEl.textContent = `Rs. ${subtotal}`;
    
    if (discount > 0) {
        cartDiscountRow.style.display = 'flex';
        cartDiscountEl.textContent = `- Rs. ${Math.round(discount)}`;
    } else {
        cartDiscountRow.style.display = 'none';
    }
    
    cartTotalEl.textContent = `Rs. ${Math.round(total)}`;

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-meta">Size: ${item.size} | Color: ${item.color}</div>
                <div class="cart-item-price">Rs. ${item.price}</div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', -1)">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.cartId}')">Remove</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });
}

// --- Modals Logic ---
function openModal(id) {
    if (id !== 'cart-drawer') {
        document.getElementById(id).classList.add('active');
    } else {
        cartDrawer.classList.add('active');
    }
    modalOverlay.classList.add('active');
}

function closeModal() {
    document.querySelectorAll('.modal, .cart-drawer').forEach(m => m.classList.remove('active'));
    modalOverlay.classList.remove('active');
}

// --- Product Modal ---
window.openProductModal = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const content = document.getElementById('product-detail-content');
    content.innerHTML = `
        <div class="pd-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="pd-info">
            <div class="pd-category">${product.category}</div>
            <h2 class="pd-title">${product.name}</h2>
            <div class="pd-price">Rs. ${product.price}</div>
            
            <div class="pd-section">
                <h4>Select Size</h4>
                <div class="size-selector">
                    <button class="size-btn active">S</button>
                    <button class="size-btn">M</button>
                    <button class="size-btn">L</button>
                    <button class="size-btn">XL</button>
                </div>
            </div>
            
            <div class="pd-section">
                <h4>Select Color</h4>
                <div class="color-selector">
                    <button class="color-btn color-black active" data-color="Black"></button>
                    <button class="color-btn color-white" data-color="White"></button>
                    <button class="color-btn color-red" data-color="Red"></button>
                    <button class="color-btn color-blue" data-color="Blue"></button>
                </div>
            </div>
            
            <button class="btn btn-primary btn-full mt-4" id="pd-add-cart">Add to Cart</button>
        </div>
    `;

    openModal('product-modal');

    let selectedSize = 'S';
    let selectedColor = 'Black';

    content.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            content.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedSize = e.target.textContent;
        });
    });

    content.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            content.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedColor = e.target.getAttribute('data-color');
        });
    });

    document.getElementById('pd-add-cart').addEventListener('click', () => {
        addToCart(product.id, selectedSize, selectedColor);
        closeModal();
    });
}

// --- Auth Logic ---
function checkAuth() {
    if (currentUser) {
        if (currentUser.role === 'admin') {
            userGreeting.textContent = 'Dashboard';
        } else {
            userGreeting.textContent = currentUser.name.split(' ')[0];
        }
    } else {
        userGreeting.textContent = 'Login';
    }
}

// --- Designer Logic ---
const canvas = document.getElementById('tshirt-canvas');
const ctx = canvas.getContext('2d');
let customImage = null;
let customText = "";
let customTextColor = "#000000";

function drawDesigner() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (customImage) {
        const scale = Math.min(150 / customImage.width, 150 / customImage.height);
        const w = customImage.width * scale;
        const h = customImage.height * scale;
        const x = (canvas.width - w) / 2;
        ctx.drawImage(customImage, x, 30, w, h);
    }
    if (customText) {
        ctx.fillStyle = customTextColor;
        ctx.font = "bold 24px Outfit";
        ctx.textAlign = "center";
        ctx.fillText(customText, canvas.width / 2, customImage ? 200 : 125);
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('active');
    });

    document.querySelectorAll('[data-close], #close-cart, #modal-overlay').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('nav-cart-btn').addEventListener('click', () => openModal('cart-drawer'));
    
    const loginBtns = [document.getElementById('nav-login-btn'), document.getElementById('mobile-login-btn')];
    loginBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                if (currentUser.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                openModal('auth-modal');
                if(document.getElementById('mobile-menu').classList.contains('active')){
                    document.getElementById('mobile-menu').classList.remove('active');
                }
            }
        });
    });

    const designBtns = [document.getElementById('nav-custom-design'), document.getElementById('mobile-custom-design'), document.getElementById('hero-custom-btn')];
    designBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('designer-modal');
            drawDesigner();
            if(document.getElementById('mobile-menu').classList.contains('active')){
                document.getElementById('mobile-menu').classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const filter = e.target.getAttribute('data-filter');
            if (filter === 'All') {
                renderProducts(products);
            } else {
                renderProducts(products.filter(p => p.category === filter));
            }
        });
    });

    document.getElementById('apply-coupon-btn').addEventListener('click', () => {
        const val = document.getElementById('coupon-input').value.trim().toUpperCase();
        const msg = document.getElementById('coupon-message');
        if (val === 'SKB10') {
            currentDiscount = 10;
            msg.textContent = '10% Discount applied!';
            msg.style.color = 'var(--success)';
            updateCartUI();
        } else {
            currentDiscount = 0;
            msg.textContent = 'Invalid coupon code.';
            msg.style.color = 'var(--danger)';
            updateCartUI();
        }
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }
        if (!currentUser) {
            showToast('Please login to continue');
            closeModal();
            openModal('auth-modal');
            return;
        }
        
        closeModal();
        openModal('checkout-modal');
        
        const { subtotal, discount, total } = calculateCart();
        document.getElementById('chk-subtotal').textContent = `Rs. ${subtotal}`;
        if (discount > 0) {
            document.getElementById('chk-discount-row').style.display = 'flex';
            document.getElementById('chk-discount').textContent = `- Rs. ${Math.round(discount)}`;
        } else {
            document.getElementById('chk-discount-row').style.display = 'none';
        }
        document.getElementById('chk-total').textContent = `Rs. ${Math.round(total + 100)}`; 
        
        document.getElementById('checkout-name').value = currentUser.name;

        const list = document.getElementById('checkout-items-list');
        list.innerHTML = '';
        cart.forEach(item => {
            list.innerHTML += `
                <div class="chk-item">
                    <div>
                        <div class="chk-item-name">${item.quantity}x ${item.name}</div>
                        <div class="chk-item-meta">${item.size}, ${item.color}</div>
                    </div>
                    <div>Rs. ${item.price * item.quantity}</div>
                </div>
            `;
        });
    });

    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const info = document.getElementById('payment-info');
            switch(e.target.value) {
                case 'cod': info.innerHTML = '<p>Pay with cash upon delivery.</p>'; break;
                case 'esewa': info.innerHTML = '<p>You will be redirected to eSewa to complete payment.</p>'; break;
                case 'khalti': info.innerHTML = '<p>You will be redirected to Khalti to complete payment.</p>'; break;
                case 'card': info.innerHTML = `
                    <input type="text" placeholder="Card Number" style="width:100%; padding:0.5rem; margin-bottom:0.5rem;">
                    <div style="display:flex; gap:0.5rem;">
                        <input type="text" placeholder="MM/YY" style="width:50%; padding:0.5rem;">
                        <input type="text" placeholder="CVC" style="width:50%; padding:0.5rem;">
                    </div>
                `; break;
            }
        });
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Save Order to DB (localStorage)
        const { total } = calculateCart();
        const finalTotal = Math.round(total + 100);
        const order = {
            id: Date.now().toString().slice(-6),
            date: new Date().toISOString(),
            customerName: document.getElementById('checkout-name').value,
            customerEmail: currentUser ? currentUser.email : '',
            customerPhone: document.getElementById('checkout-phone').value,
            address: document.getElementById('checkout-address').value,
            paymentMethod: document.querySelector('input[name="payment"]:checked').value,
            items: [...cart],
            total: finalTotal,
            status: 'Pending'
        };
        
        orders.push(order);
        localStorage.setItem('skb_orders', JSON.stringify(orders));

        showToast('🎉 Order placed successfully!');
        cart = [];
        saveCart();
        updateCartUI();
        closeModal();
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.getAttribute('data-target')).classList.add('active');
        });
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        const user = allUsers.find(u => u.email === email && u.password === pass);
        if (user) {
            currentUser = { email: user.email, name: user.name, role: user.role };
            localStorage.setItem('skb_user', JSON.stringify(currentUser));
            checkAuth();
            closeModal();
            showToast('Logged in successfully!');
            
            if (user.role === 'admin') {
                localStorage.setItem('skb_admin_user', JSON.stringify(currentUser));
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            alert('Invalid credentials. Please register first.');
        }
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        if(allUsers.find(u => u.email === email)) {
            alert('Email already registered!');
            return;
        }

        const newUser = { id: Date.now(), name, email, password, role: 'user' };
        allUsers.push(newUser);
        localStorage.setItem('skb_all_users', JSON.stringify(allUsers));

        currentUser = { email, name, role: 'user' };
        localStorage.setItem('skb_user', JSON.stringify(currentUser));
        checkAuth();
        closeModal();
        showToast('Account created successfully!');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    });

    document.getElementById('designer-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    customImage = img;
                    drawDesigner();
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('designer-add-text').addEventListener('click', () => {
        customText = document.getElementById('designer-text').value;
        customTextColor = document.getElementById('designer-color').value;
        drawDesigner();
    });

    document.getElementById('designer-clear').addEventListener('click', () => {
        customImage = null;
        customText = "";
        document.getElementById('designer-text').value = "";
        drawDesigner();
    });

    document.getElementById('designer-add-cart').addEventListener('click', () => {
        addToCart(null, 'M', 'Custom', { image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80' });
        closeModal();
    });
}
