/**
 * SKB Water Bottle Suppliers
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Navigation Toggle ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if(mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if(navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                // Close mobile menu if open
                if(navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileBtn.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
                }
                
                // Scroll to element with header offset
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Header Scroll Effect ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        }
    });

    // --- Order Form Submission (MongoDB + WhatsApp Integration) ---
    const orderForm = document.getElementById('orderForm');
    if(orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect Data
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;

            const orderData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                product: document.getElementById('product').value,
                quantity: document.getElementById('quantity').value
            };
            
            try {
                // Save to Backend MongoDB API
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();

                if (result.success) {
                    // Construct WhatsApp Message
                    const companyPhone = '9779800000000'; // Placeholder
                    const text = `*New Order from SKB Website*%0A%0A*Order ID:* ${result.order._id}%0A*Name:* ${orderData.name}%0A*Phone:* ${orderData.phone}%0A*Address:* ${orderData.address}%0A*Product:* ${orderData.product}%0A*Quantity:* ${orderData.quantity}%0A%0APlease confirm my order.`;
                    const whatsappUrl = `https://wa.me/${companyPhone}?text=${text}`;

                    // Show success message and redirect
                    alert(`Order received, ${orderData.name}! Your Order ID is: ${result.order._id}\nRedirecting to WhatsApp to confirm...`);
                    orderForm.reset();
                    window.open(whatsappUrl, '_blank');
                } else {
                    alert('Error saving order: ' + result.message);
                }
            } catch (error) {
                console.error('API Error:', error);
                alert('Could not connect to the server. Please try again later or contact us directly.');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Delivery Tracking Form (API Integration) ---
    const trackForm = document.getElementById('trackForm');
    const trackResult = document.getElementById('trackResult');
    
    if(trackForm) {
        trackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trackId = document.getElementById('trackId').value;
            
            if(!trackId) return;

            // Show loading state
            trackResult.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Fetching details...</p>';
            trackResult.classList.remove('hidden');

            try {
                const response = await fetch(`http://localhost:5000/api/orders/track/${encodeURIComponent(trackId)}`);
                const result = await response.json();

                if (result.success) {
                    const order = result.order;
                    const statuses = ['Pending', 'Processing', 'Out for Delivery', 'Delivered'];
                    let currentStatusIndex = statuses.indexOf(order.status);
                    if (currentStatusIndex === -1) currentStatusIndex = 0; // Default to Pending

                    trackResult.innerHTML = `
                        <h4>Order Status: ${order.status}</h4>
                        <p><strong>Order ID:</strong> ${order._id}</p>
                        <p><strong>Product:</strong> ${order.quantity}x ${order.product}</p>
                        <p><strong>Estimated Arrival:</strong> ${order.status === 'Delivered' ? 'Already Delivered' : 'Today, before 5 PM'}</p>
                        
                        <div class="status-steps">
                            <div class="step active">
                                <div class="dot"><i class="fa-solid fa-check"></i></div>
                                <span>Received</span>
                            </div>
                            <div class="step ${currentStatusIndex >= 1 ? 'active' : ''}">
                                <div class="dot"><i class="fa-solid ${currentStatusIndex >= 1 ? 'fa-check' : 'fa-box'}"></i></div>
                                <span>Processing</span>
                            </div>
                            <div class="step ${currentStatusIndex >= 2 ? 'active' : ''}">
                                <div class="dot"><i class="fa-solid ${currentStatusIndex >= 2 ? 'fa-check' : 'fa-truck'}"></i></div>
                                <span>Out for Delivery</span>
                            </div>
                        </div>
                    `;
                } else {
                    trackResult.innerHTML = `<p style="color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${result.message}</p>`;
                }
            } catch (error) {
                console.error('API Error:', error);
                trackResult.innerHTML = `<p style="color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> Could not connect to the tracking server.</p>`;
            }
        });
    }

});

// --- Global function to select product from card ---
window.selectProduct = function(productName) {
    const productSelect = document.getElementById('product');
    if(productSelect) {
        productSelect.value = productName;
        
        // Scroll to order section
        const orderSection = document.getElementById('order');
        if(orderSection) {
            const headerOffset = 100;
            const elementPosition = orderSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Highlight the select briefly
            setTimeout(() => {
                productSelect.focus();
                productSelect.style.boxShadow = '0 0 0 3px #0ea5e9';
                setTimeout(() => {
                    productSelect.style.boxShadow = '';
                }, 1500);
            }, 500);
        }
    }
};
