/* ==========================================================================
   SHIMMERWANDS - HERO IMAGE SLIDER & INTERACTIVE AUDIO ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  initHeroSlider();
  initSparkleCanvas();
  initMouseLightSweep();
  initMobileNav();
  initCustomizer();
  initCartSystem();
  initAudioEngine();
  await loadStorefrontProducts();
  initFooterModals();
});

/* ==========================================================================
   1. HERO MULTI-IMAGE SLIDER (assets/main_page_1.png to main_page_5.png)
   ========================================================================== */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');

  if (!slides.length) return;

  let currentSlide = 0;
  let slideTimer = null;

  function showSlide(index) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    let nextIdx = (currentSlide + 1) % slides.length;
    showSlide(nextIdx);
  }

  function prevSlide() {
    let prevIdx = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prevIdx);
  }

  function startAutoPlay() {
    stopAutoPlay();
    slideTimer = setInterval(nextSlide, 4000);
  }

  function stopAutoPlay() {
    if (slideTimer) clearInterval(slideTimer);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoPlay();
      playSparkleChime();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoPlay();
      playSparkleChime();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      showSlide(idx);
      startAutoPlay();
      playSparkleChime();
    });
  });

  // Pause on hover
  const heroCard = document.querySelector('.hero-image-card');
  if (heroCard) {
    heroCard.addEventListener('mouseenter', stopAutoPlay);
    heroCard.addEventListener('mouseleave', startAutoPlay);
  }

  startAutoPlay();
}

/* ==========================================================================
   2. MOBILE NAVIGATION DRAWER & OVERLAY
   ========================================================================== */
function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navDrawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('close-mobile-menu');
  const overlay = document.getElementById('mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  function openMobileMenu() {
    navDrawer?.classList.add('open');
    overlay?.classList.add('open');
    menuBtn?.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof playSparkleChime === 'function') playSparkleChime();
  }

  function closeMobileMenu() {
    navDrawer?.classList.remove('open');
    overlay?.classList.remove('open');
    menuBtn?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (navDrawer?.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileMenu);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // ESC Key to close mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDrawer?.classList.contains('open')) {
      closeMobileMenu();
    }
  });
}

/* ==========================================================================
   3. SPARKLE CURSOR TRAIL ENGINE
   ========================================================================== */
function initSparkleCanvas() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];

  function addPointerParticles(posX, posY) {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: posX + (Math.random() - 0.5) * 12,
        y: posY + (Math.random() - 0.5) * 12,
        size: Math.random() * 4.5 + 1.5,
        speedX: (Math.random() - 0.5) * 1.2,
        speedY: (Math.random() - 0.5) * 1.2 - 0.3,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        color: getRandomSparkleColor()
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    addPointerParticles(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      addPointerParticles(e.touches[0].clientX, e.touches[0].clientY);
    }
  });

  function getRandomSparkleColor() {
    const colors = ['#ffffff', '#f5dce1', '#d6a7a1', '#ffd700', '#e6c594'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function drawStar(cx, cy, spikes, outerRadius, innerRadius, color, opacity) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0, opacity);
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      drawStar(p.x, p.y, 4, p.size * 1.8, p.size * 0.35, p.color, p.life);
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   4. MOUSE & TOUCH LIGHT SWEEP LISTENER
   ========================================================================== */
function initMouseLightSweep() {
  const cards = document.querySelectorAll('.product-card, .hero-image-card, .category-card, .mood-card, .testing-card');

  function updatePointerLight(clientX, clientY) {
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  window.addEventListener('mousemove', (e) => {
    updatePointerLight(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updatePointerLight(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
}

/* ==========================================================================
   5. TWO-COLOR CUSTOM BRUSH BUILDER
   ========================================================================== */
function initCustomizer() {
  const bgSwatches = document.querySelectorAll('.swatch-item[data-type="bg"]');
  const monoSwatches = document.querySelectorAll('.swatch-item[data-type="mono"]');
  const monogramInput = document.getElementById('monogram-input');
  const monogramDisplay = document.getElementById('monogram-tag-display');
  const handleFill = document.getElementById('wand-handle-fill');
  const handleLabel = document.getElementById('selected-handle-name');
  const monoLabel = document.getElementById('selected-mono-name');

  const handleGradients = {
    'rose-gold': 'url(#grad-rose-gold)',
    'diamond': 'url(#grad-diamond)',
    'pink-sapphire': 'url(#grad-pink-sapphire)',
    'champagne-gold': 'url(#grad-champagne-gold)',
    'amethyst-violet': 'url(#grad-amethyst-violet)',
    'ruby-sparkle': 'url(#grad-ruby-sparkle)',
    'emerald-luxe': 'url(#grad-emerald-luxe)',
    'midnight-onyx': 'url(#grad-midnight-onyx)'
  };

  // 1. Background / Handle Swatches
  bgSwatches.forEach(item => {
    item.addEventListener('click', () => {
      bgSwatches.forEach(c => c.classList.remove('active'));
      item.classList.add('active');

      const val = item.getAttribute('data-value');
      const name = item.getAttribute('data-name');

      if (handleFill && handleGradients[val]) {
        handleFill.setAttribute('fill', handleGradients[val]);
      }
      if (handleLabel) handleLabel.textContent = name;
      playSparkleChime();
    });
  });

  // 2. Monogram Tag Swatches
  monoSwatches.forEach(item => {
    item.addEventListener('click', () => {
      monoSwatches.forEach(c => c.classList.remove('active'));
      item.classList.add('active');

      const bg = item.getAttribute('data-bg');
      const color = item.getAttribute('data-color');
      const name = item.getAttribute('data-name');

      if (monogramDisplay) {
        monogramDisplay.style.backgroundColor = bg;
        monogramDisplay.style.color = color;
      }
      if (monoLabel) monoLabel.textContent = name;
      playSparkleChime();
    });
  });

  // 3. Monogram Text Input
  if (monogramInput && monogramDisplay) {
    monogramInput.addEventListener('input', (e) => {
      const text = e.target.value.toUpperCase().slice(0, 3);
      monogramDisplay.textContent = text || 'SW';
    });
  }
}

/* ==========================================================================
   CATEGORY & CURRENCY HELPERS
   ========================================================================== */
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

/* ==========================================================================
   6. CART SYSTEM
   ========================================================================== */
let cart = [];

function initCartSystem() {
  cart = [];
  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('shimmer_cart');
    sessionStorage.removeItem('cart');
    sessionStorage.removeItem('shimmer_cart');
  } catch (e) {}
  updateCartUI();
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart-btn');

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  const addBagButtons = document.querySelectorAll('.btn-add-bag');
  addBagButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) {
        const id = card.getAttribute('data-id');
        const title = card.querySelector('.product-title')?.textContent || 'Shimmer Wand';
        const sub = card.querySelector('.product-sub')?.textContent || 'Rhinestone Edition';
        const priceText = card.querySelector('.product-price')?.textContent || 'PKR 45';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 45.00;
        const img = card.querySelector('.product-img-wrapper img')?.getAttribute('src') || '';

        addToCart({ id, name: title, sub, price, img });
        showToast(`✨ ${title} added to your bag!`);
        playSparkleChime();
      }
    });
  });

  const checkoutBtn = document.getElementById('btn-checkout');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutModal = document.getElementById('close-checkout-modal');
  const customerForm = document.getElementById('form-customer-checkout');

  if (checkoutBtn && checkoutModal) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast("Your cart is currently empty! ✨");
        return;
      }
      
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalEl = document.getElementById('checkout-order-total');
      if (totalEl) totalEl.textContent = formatPKR(subtotal);

      closeCart();
      checkoutModal.classList.add('open');
      playSparkleChime();
    });
  }

  if (closeCheckoutModal && checkoutModal) {
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('open'));
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    });
  }

  customerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('checkout-cust-name').value.trim();
    const email = document.getElementById('checkout-cust-email').value.trim();
    const phone = document.getElementById('checkout-cust-phone').value.trim();
    const address = document.getElementById('checkout-cust-address').value.trim();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderItems = cart.map(item => ({ id: item.id, name: item.name, qty: item.quantity, price: item.price }));

    const newOrder = {
      id: "SW-" + Math.floor(1000 + Math.random() * 9000),
      customerName: name,
      email,
      phone,
      address,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      total: subtotal,
      status: "Pending", // Default Pending ⏳ status
      items: orderItems
    };

    // 1. Sync to Supabase Cloud DB if connected
    if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
      await window.ShimmerDB.placeOrder(newOrder);
    }

    // 2. Save order to Local Storage
    const storedOrders = JSON.parse(localStorage.getItem('shimmer_orders') || '[]');
    storedOrders.unshift(newOrder);
    localStorage.setItem('shimmer_orders', JSON.stringify(storedOrders));

    // 3. Deduct stock quantities
    const storedProds = JSON.parse(localStorage.getItem('shimmer_products') || '[]');
    cart.forEach(cartItem => {
      const match = storedProds.find(p => p.id == cartItem.id || p.title == cartItem.name);
      if (match && match.quantity > 0) {
        match.quantity = Math.max(0, match.quantity - cartItem.quantity);
        if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
          window.ShimmerDB.saveProduct(match);
        }
      }
    });
    localStorage.setItem('shimmer_products', JSON.stringify(storedProds));

    // 4. Send Email Notification to shimmerwands@gmail.com & customer email
    await sendOrderEmailNotification(newOrder);

    // 5. Refresh storefront so out-of-stock items automatically render as Unavailable
    await loadStorefrontProducts();

    playSparkleHarpCascade();
    showToast(`✨ Order ${newOrder.id} placed & emailed successfully!`);
    alert(`✨ Thank you, ${name}! Your order ${newOrder.id} has been placed and email notification sent to shimmerwands@gmail.com! You will pay on delivery! ✨`);

    cart = [];
    updateCartUI();
    checkoutModal.classList.remove('open');
  });

  updateCartUI();
}

async function sendOrderEmailNotification(order) {
  try {
    const itemLines = (order.items || []).map(i => `• ${i.name} (x${i.qty}) - PKR ${(i.price * i.qty).toFixed(2)}`).join('\n');
    const emailSubject = `✨ New Order #${order.id} from ${order.customerName}`;

    const emailMessage = `
✨ NEW SHIMMERWANDS ORDER RECEIVED! ✨

Order ID: ${order.id}
Date: ${order.date}

CUSTOMER INFORMATION:
• Full Name: ${order.customerName}
• Email: ${order.email}
• Contact Phone: ${order.phone}
• Shipping Address: ${order.address}

ORDER ITEMS:
${itemLines}

ORDER TOTAL: PKR ${order.total.toFixed(2)}
PAYMENT METHOD: Cash on Delivery (COD)
STATUS: Pending ⏳

Thank you for shopping with Shimmerwands! Beauty meets bling. ✨
    `.trim();

    let emailSent = false;
    let gatewayUsed = 'None';

    // 1. Try FormSubmit AJAX Endpoint (Zero-Config, Free, Direct to shimmerwands@gmail.com)
    try {
      const formSubmitResp = await fetch('https://formsubmit.co/ajax/shimmerwands@gmail.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: emailSubject,
          name: order.customerName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          order_id: order.id,
          order_total: `PKR ${order.total.toFixed(2)}`,
          order_details: emailMessage,
          _replyto: order.email,
          _captcha: "false"
        })
      });

      if (formSubmitResp.ok) {
        const fsData = await formSubmitResp.json();
        if (fsData.success === "true" || fsData.success === true || formSubmitResp.status === 200) {
          emailSent = true;
          gatewayUsed = 'FormSubmit API';
          console.log("✨ Order email sent via FormSubmit API successfully!");
        }
      }
    } catch (fsErr) {
      console.warn("FormSubmit API attempt note:", fsErr);
    }

    // 2. Try Web3Forms API if custom key is available or FormSubmit failed
    if (!emailSent) {
      const web3Key = localStorage.getItem('shimmer_web3forms_key');
      if (web3Key) {
        try {
          const w3Resp = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              access_key: web3Key,
              subject: emailSubject,
              from_name: 'Shimmerwands Storefront',
              to_email: 'shimmerwands@gmail.com',
              replyto: order.email,
              message: emailMessage
            })
          });
          const w3Data = await w3Resp.json();
          if (w3Data.success) {
            emailSent = true;
            gatewayUsed = 'Web3Forms API';
            console.log("✨ Order email sent via Web3Forms API successfully!");
          }
        } catch (w3Err) {
          console.warn("Web3Forms API attempt note:", w3Err);
        }
      }
    }

    // 3. Fallback Mailto URL generator if both API calls are offline/unreachable
    if (!emailSent) {
      gatewayUsed = 'Mailto Link Fallback';
      const mailtoUrl = `mailto:shimmerwands@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
      try {
        window.open(mailtoUrl, '_blank');
      } catch (e) {}
    }

    // 4. Audit Log in Local Storage & Supabase
    const emailLog = {
      id: "EML-" + Date.now(),
      orderId: order.id,
      customerEmail: order.email,
      merchantEmail: "shimmerwands@gmail.com",
      message: emailMessage,
      gateway: gatewayUsed,
      date: new Date().toISOString(),
      status: emailSent ? "Delivered" : "Queued (Mailto)"
    };

    const existingLogs = JSON.parse(localStorage.getItem('shimmer_email_logs') || '[]');
    existingLogs.unshift(emailLog);
    localStorage.setItem('shimmer_email_logs', JSON.stringify(existingLogs));

    return emailSent;
  } catch (err) {
    console.warn("Order email notification error:", err);
    return false;
  }
}

function openCart() {
  updateCartUI();
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
}

function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
}

function addToCart(product) {
  const existing = cart.find(item => item.id == product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  updateCartUI();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id != id);
  updateCartUI();
}

function updateCartQuantity(id, change) {
  const item = cart.find(item => item.id == id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  }
}

function updateCartUI() {
  const cartBody = document.getElementById('cart-body-items');
  const cartBadge = document.getElementById('cart-badge');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const shippingProgress = document.getElementById('shipping-progress-text');
  const progressBarFill = document.getElementById('progress-bar-fill');

  if (!cartBody) return;
  cartBody.innerHTML = '';

  let totalItems = 0;
  let subtotal = 0;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: #888;">
        <div style="font-size: 3rem; margin-bottom: 10px;">✨</div>
        <p style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--charcoal);">Your bag is empty</p>
        <p style="font-size: 0.82rem; margin-top: 6px;">Add your favorite rhinestone wands to begin!</p>
      </div>
    `;
  } else {
    cart.forEach(item => {
      totalItems += item.quantity;
      subtotal += item.price * item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatPKR(item.price * item.quantity)}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
            <button onclick="updateCartQuantity('${item.id}', -1)" style="background:#eee; border:none; width:24px; height:24px; border-radius:50%; cursor:pointer;">-</button>
            <span style="font-size: 0.85rem;">${item.quantity}</span>
            <button onclick="updateCartQuantity('${item.id}', 1)" style="background:#eee; border:none; width:24px; height:24px; border-radius:50%; cursor:pointer;">+</button>
            <button onclick="removeFromCart('${item.id}')" style="margin-left:auto; background:none; border:none; color:#c00; font-size:0.75rem; cursor:pointer;">Remove</button>
          </div>
        </div>
      `;
      cartBody.appendChild(itemEl);
    });
  }

  if (cartBadge) {
    cartBadge.textContent = totalItems;
    if (totalItems > 0) {
      cartBadge.style.display = 'flex';
    } else {
      cartBadge.style.display = 'none';
    }
  }
  if (cartSubtotal) cartSubtotal.textContent = formatPKR(subtotal);

  const freeThreshold = 7500.00;
  if (shippingProgress && progressBarFill) {
    if (subtotal >= freeThreshold) {
      shippingProgress.innerHTML = `✨ You unlocked <strong>FREE Shipping</strong>!`;
      progressBarFill.style.width = '100%';
    } else {
      const remaining = freeThreshold - subtotal;
      shippingProgress.innerHTML = `Add <strong>${formatPKR(remaining)}</strong> more for <strong>FREE Shipping</strong>! ✨`;
      progressBarFill.style.width = `${Math.min(100, (subtotal / freeThreshold) * 100)}%`;
    }
  }
}

window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;

/* ==========================================================================
   7. CLEAN INTERACTIVE AUDIO SYNTHESIZER (NO CONTINUOUS BACKGROUND BUZZING)
   ========================================================================== */
let audioCtx = null;
let soundEnabled = true;

function initAudioEngine() {
  const soundToggleBtn = document.getElementById('sound-toggle-btn');

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) {
        playSparkleHarpCascade();
      }
    });
  }
}

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* Crystal Clean Interactive Sparkle Chime */
function playSparkleChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [1046.50, 1318.51, 1567.98, 2093.00];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.04, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.3);
    });
  } catch (e) {}
}

/* Soft Cascading Fairy Harp */
function playSparkleHarpCascade() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.05, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0002, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.4);
    });
  } catch (e) {}
}

let loadedStorefrontProducts = [];
let currentCategoryFilter = 'all';

async function loadStorefrontProducts() {
  const productGrid = document.querySelector('.product-grid');
  if (!productGrid) return;

  let products = [];
  if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
    const cloudProducts = await window.ShimmerDB.getProducts();
    if (cloudProducts && cloudProducts.length > 0) {
      products = cloudProducts;
      localStorage.setItem('shimmer_products', JSON.stringify(cloudProducts));
    }
  }

  if (products.length === 0) {
    const localProds = localStorage.getItem('shimmer_products');
    products = localProds ? JSON.parse(localProds) : [];
  }

  loadedStorefrontProducts = products;
  await renderFilteredStorefrontProducts();
  initProductFilters();
}

async function renderFilteredStorefrontProducts() {
  const productGrid = document.querySelector('.product-grid');
  const countBadge = document.getElementById('product-count-summary');
  if (!productGrid) return;

  const categoryFilter = currentCategoryFilter || 'all';
  const sortOption = document.getElementById('sort-products-select')?.value || 'default';
  const priceFilter = document.getElementById('filter-price-select')?.value || 'all';
  const colorFilter = document.getElementById('filter-color-select')?.value || 'all';

  let filtered = [];
  let isBackendQuerySuccess = false;

  // 1. Backend Query execution via Supabase Cloud DB if connected
  if (window.ShimmerDB && window.ShimmerDB.isCloudConnected()) {
    const cloudFiltered = await window.ShimmerDB.getProducts({
      category: categoryFilter,
      sortBy: sortOption,
      priceFilter: priceFilter,
      colorFilter: colorFilter
    });
    if (cloudFiltered !== null) {
      filtered = cloudFiltered;
      isBackendQuerySuccess = true;
      console.log(`✨ Backend product query completed via Supabase DB (${filtered.length} products returned)`);
    }
  }

  // 2. Client-side Fallback filtering if Cloud DB is disconnected
  if (!isBackendQuerySuccess) {
    let sourceProducts = loadedStorefrontProducts;
    if (!sourceProducts || sourceProducts.length === 0) {
      const localProds = localStorage.getItem('shimmer_products');
      sourceProducts = localProds ? JSON.parse(localProds) : [];
    }

    filtered = sourceProducts.filter(prod => {
      const prodCat = normalizeCategory(prod.category);
      const filterCat = normalizeCategory(categoryFilter);
      return categoryFilter === 'all' || prodCat === filterCat;
    });

    if (priceFilter !== 'all') {
      filtered = filtered.filter(prod => {
        const price = parseFloat(prod.price) || 0;
        if (priceFilter === 'under-500' || priceFilter === 'under-50') return price < 500;
        if (priceFilter === '500-1000' || priceFilter === '50-100') return price >= 500 && price <= 1000;
        if (priceFilter === 'over-1000' || priceFilter === 'over-100') return price > 1000;
        return true;
      });
    }

    if (colorFilter !== 'all') {
      filtered = filtered.filter(prod => {
        const colorText = ((prod.color || '') + ' ' + prod.title + ' ' + (prod.sub || '') + ' ' + (prod.badge || '')).toLowerCase();
        if (colorFilter === 'rose-gold') return colorText.includes('rose') || colorText.includes('gold') || colorText.includes('blush') || colorText.includes('pink');
        if (colorFilter === 'pink') return colorText.includes('pink') || colorText.includes('coquette') || colorText.includes('bow');
        if (colorFilter === 'silver') return colorText.includes('silver') || colorText.includes('crystal') || colorText.includes('diamond') || colorText.includes('starlight');
        if (colorFilter === 'gold') return colorText.includes('champagne') || colorText.includes('gold') || colorText.includes('royal');
        if (colorFilter === 'black') return colorText.includes('black') || colorText.includes('onyx') || colorText.includes('midnight');
        return true;
      });
    }

    if (sortOption === 'price-asc') {
      filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortOption === 'price-desc') {
      filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortOption === 'title-asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortOption === 'title-desc') {
      filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }
  }

  // Update summary badge
  if (countBadge) {
    const totalCount = loadedStorefrontProducts.length || filtered.length;
    countBadge.textContent = `Showing ${filtered.length} of ${totalCount} Wands`;
  }

  productGrid.innerHTML = '';

  if (filtered.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: var(--rose-gold-light); border-radius: 24px; border: 1px solid var(--rose-gold-blush);">
        <div style="font-size: 3rem; margin-bottom: 12px;">✨</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--charcoal); margin-bottom: 8px;">No Matching Wands Found</h3>
        <p style="font-size: 0.88rem; color: #666; margin-bottom: 20px;">Try adjusting your sort or filter options to see available rhinestone edits.</p>
        <button onclick="resetCatalogFilters()" class="btn-sparkle" style="margin: 0 auto;">Reset All Filters 🔄</button>
      </div>
    `;
    return;
  }

  filtered.forEach(prod => {
    const isOutOfStock = prod.quantity <= 0;
    const normCategory = normalizeCategory(prod.category);
    const categoryName = getCategoryDisplayName(prod.category);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', prod.id);
    card.setAttribute('data-category', normCategory);

    card.innerHTML = `
      ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ''}
      <div class="product-img-wrapper">
        <img src="${prod.img || 'assets/main_page_1.png'}" alt="${prod.title}">
        <div class="quick-view-overlay">
          <button class="btn-quickview">Quick View ✨</button>
        </div>
      </div>
      <div class="product-info">
        <div style="font-size: 0.68rem; color: var(--rose-gold-dark); letter-spacing: 1.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
          ${categoryName}
        </div>
        <h3 class="product-title">${prod.title}</h3>
        <p class="product-sub">${prod.sub || ''}</p>
        <div style="font-size: 0.75rem; color: ${isOutOfStock ? '#dc2626' : '#047857'}; font-weight: 700; margin-bottom: 6px;">
          ${isOutOfStock ? 'Unavailable ❌' : 'In Stock ✨'}
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatPKR(prod.price)}</span>
          <button class="btn-add-bag" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ${isOutOfStock ? 'UNAVAILABLE' : '+ ADD TO BAG'}
          </button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector('.btn-add-bag');
    if (addBtn && !isOutOfStock) {
      addBtn.addEventListener('click', () => {
        addToCart({
          id: prod.id,
          name: prod.title,
          price: parseFloat(prod.price),
          img: prod.img
        });
        if (typeof playSparkleChime === 'function') playSparkleChime();
      });
    }

    productGrid.appendChild(card);
  });

  initProductDetailPage();
}

function initProductFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sort-products-select');
  const priceSelect = document.getElementById('filter-price-select');
  const colorSelect = document.getElementById('filter-color-select');
  const resetBtn = document.getElementById('btn-reset-catalog-filters');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.getAttribute('data-filter') || 'all';
      renderFilteredStorefrontProducts();
      if (typeof playSparkleChime === 'function') playSparkleChime();
    });
  });

  sortSelect?.addEventListener('change', () => {
    renderFilteredStorefrontProducts();
    if (typeof playSparkleChime === 'function') playSparkleChime();
  });

  priceSelect?.addEventListener('change', () => {
    renderFilteredStorefrontProducts();
    if (typeof playSparkleChime === 'function') playSparkleChime();
  });

  colorSelect?.addEventListener('change', () => {
    renderFilteredStorefrontProducts();
    if (typeof playSparkleChime === 'function') playSparkleChime();
  });

  resetBtn?.addEventListener('click', () => {
    resetCatalogFilters();
  });
}

function resetCatalogFilters() {
  currentCategoryFilter = 'all';
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
  });

  const sortSelect = document.getElementById('sort-products-select');
  const priceSelect = document.getElementById('filter-price-select');
  const colorSelect = document.getElementById('filter-color-select');

  if (sortSelect) sortSelect.value = 'default';
  if (priceSelect) priceSelect.value = 'all';
  if (colorSelect) colorSelect.value = 'all';

  renderFilteredStorefrontProducts();
  if (typeof playSparkleChime === 'function') playSparkleChime();
}
window.resetCatalogFilters = resetCatalogFilters;

function initProductDetailPage() {
  const pageView = document.getElementById('product-detail-view');
  const backBtn = document.getElementById('btn-back-storefront');
  const pageCartBtn = document.getElementById('product-page-cart-btn');

  if (!pageView) return;

  const pageImg = document.getElementById('product-page-img');
  const prevBtn = document.getElementById('product-page-prev-btn');
  const nextBtn = document.getElementById('product-page-next-btn');
  const counterEl = document.getElementById('product-page-img-counter');
  const thumbsContainer = document.getElementById('product-page-thumbnails');

  const catEl = document.getElementById('product-page-category');
  const badgeEl = document.getElementById('product-page-badge');
  const titleEl = document.getElementById('product-page-title');
  const subEl = document.getElementById('product-page-sub');
  const priceEl = document.getElementById('product-page-price');
  const stockEl = document.getElementById('product-page-stock');
  const descEl = document.getElementById('product-page-desc');
  const colorEl = document.getElementById('product-page-color');

  const qtyMinusBtn = document.getElementById('product-page-qty-minus');
  const qtyPlusBtn = document.getElementById('product-page-qty-plus');
  const qtyValEl = document.getElementById('product-page-qty-val');
  const addBagBtn = document.getElementById('product-page-add-bag');
  const buyNowBtn = document.getElementById('product-page-buy-now');

  let currentGallery = [];
  let currentImgIdx = 0;
  let currentQty = 1;
  let currentProduct = null;

  function updateGallery(index) {
    if (!currentGallery || currentGallery.length === 0) return;
    currentImgIdx = (index + currentGallery.length) % currentGallery.length;
    if (pageImg) pageImg.src = currentGallery[currentImgIdx];
    if (counterEl) counterEl.textContent = `${currentImgIdx + 1} / ${currentGallery.length}`;

    if (thumbsContainer) {
      const thumbs = thumbsContainer.querySelectorAll('.thumb-item');
      thumbs.forEach((t, idx) => {
        t.classList.toggle('active', idx === currentImgIdx);
      });
    }
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      updateGallery(currentImgIdx - 1);
      if (typeof playSparkleChime === 'function') playSparkleChime();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      updateGallery(currentImgIdx + 1);
      if (typeof playSparkleChime === 'function') playSparkleChime();
    };
  }

  function closeProductDetailPage() {
    pageView.classList.remove('open');
    document.body.style.overflow = '';
    if (window.location.hash && window.location.hash.startsWith('#product/')) {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  if (backBtn) backBtn.onclick = closeProductDetailPage;
  if (pageCartBtn) pageCartBtn.onclick = () => {
    closeProductDetailPage();
    openCart();
  };

  window.addEventListener('popstate', () => {
    if (!window.location.hash.startsWith('#product/')) {
      closeProductDetailPage();
    }
  });

  function openProductDetailPage(product) {
    currentProduct = product;
    currentQty = 1;
    if (qtyValEl) qtyValEl.textContent = currentQty;

    // Gallery List
    let galleryList = [];
    if (product.images && product.images.length > 0) {
      galleryList = product.images;
    } else if (product.img) {
      galleryList = [product.img];
    } else {
      galleryList = ['assets/main_page_1.png'];
    }
    currentGallery = galleryList;
    currentImgIdx = 0;

    // Render Thumbnails
    if (thumbsContainer) {
      thumbsContainer.innerHTML = '';
      if (currentGallery.length > 1) {
        thumbsContainer.style.display = 'flex';
        currentGallery.forEach((imgUrl, idx) => {
          const thumb = document.createElement('div');
          thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
          thumb.innerHTML = `<img src="${imgUrl}" alt="Thumbnail ${idx + 1}">`;
          thumb.onclick = () => {
            updateGallery(idx);
            if (typeof playSparkleChime === 'function') playSparkleChime();
          };
          thumbsContainer.appendChild(thumb);
        });
      } else {
        thumbsContainer.style.display = 'none';
      }
    }

    if (prevBtn) prevBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    updateGallery(0);

    // Meta & Texts
    if (catEl) catEl.textContent = getCategoryDisplayName(product.category).toUpperCase();
    if (badgeEl) {
      if (product.badge) {
        badgeEl.textContent = product.badge;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
    if (titleEl) titleEl.textContent = product.title;
    if (subEl) subEl.textContent = product.sub || 'Premium Handcrafted Wand Collection';
    if (priceEl) priceEl.textContent = formatPKR(product.price);
    if (colorEl) colorEl.textContent = product.color || 'Rose Gold';
    if (descEl) descEl.textContent = product.desc || 'Handcrafted with premium AB rhinestones and ultra-soft, cruelty-free synthetic fibers. Designed for smooth, flawless application and high-durability artistry.';

    const isOutOfStock = product.quantity <= 0;
    if (stockEl) {
      if (isOutOfStock) {
        stockEl.textContent = 'Unavailable ❌';
        stockEl.style.background = '#fef2f2';
        stockEl.style.color = '#dc2626';
        stockEl.style.borderColor = '#fca5a5';
      } else {
        stockEl.textContent = 'In Stock ✨';
        stockEl.style.background = '#ecfdf5';
        stockEl.style.color = '#047857';
        stockEl.style.borderColor = '#a7f3d0';
      }
    }

    // Buttons
    if (addBagBtn) {
      addBagBtn.disabled = isOutOfStock;
      addBagBtn.textContent = isOutOfStock ? 'UNAVAILABLE ❌' : '+ ADD TO BAG ✨';
      addBagBtn.onclick = () => {
        if (isOutOfStock) return;
        addToCart({
          id: product.id,
          name: product.title,
          sub: product.sub,
          price: parseFloat(product.price),
          img: currentGallery[0] || product.img,
          quantity: currentQty
        });
        showToast(`✨ Added ${currentQty} x ${product.title} to your bag!`);
        if (typeof playSparkleChime === 'function') playSparkleChime();
      };
    }

    if (buyNowBtn) {
      buyNowBtn.disabled = isOutOfStock;
      buyNowBtn.onclick = () => {
        if (isOutOfStock) return;
        addToCart({
          id: product.id,
          name: product.title,
          sub: product.sub,
          price: parseFloat(product.price),
          img: currentGallery[0] || product.img,
          quantity: currentQty
        });
        closeProductDetailPage();
        openCart();
      };
    }

    pageView.classList.add('open');
    pageView.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    window.location.hash = `#product/${product.id}`;
    if (typeof playSparkleChime === 'function') playSparkleChime();
  }

  // Quantity Listeners
  if (qtyMinusBtn) {
    qtyMinusBtn.onclick = () => {
      if (currentQty > 1) {
        currentQty--;
        if (qtyValEl) qtyValEl.textContent = currentQty;
      }
    };
  }

  if (qtyPlusBtn) {
    qtyPlusBtn.onclick = () => {
      const maxStock = currentProduct ? currentProduct.quantity : 99;
      if (currentQty < maxStock) {
        currentQty++;
        if (qtyValEl) qtyValEl.textContent = currentQty;
      }
    };
  }

  // Bind Quick View Buttons & Product Card Clicks
  const quickViewBtns = document.querySelectorAll('.btn-quickview');
  quickViewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.target.closest('.product-card');
      if (!card) return;
      const prodId = card.getAttribute('data-id');
      const product = loadedStorefrontProducts.find(p => String(p.id) === String(prodId)) || {
        id: prodId,
        title: card.querySelector('.product-title')?.textContent || 'Shimmer Wand',
        sub: card.querySelector('.product-sub')?.textContent || '',
        price: parseFloat((card.querySelector('.product-price')?.textContent || '0').replace(/[^0-9.]/g, '')),
        img: card.querySelector('.product-img-wrapper img')?.getAttribute('src') || '',
        category: card.getAttribute('data-category') || 'sets',
        quantity: 50,
        color: 'Rose Gold',
        badge: ''
      };
      openProductDetailPage(product);
    });
  });

  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add-bag')) return;
      const prodId = card.getAttribute('data-id');
      const product = loadedStorefrontProducts.find(p => String(p.id) === String(prodId)) || {
        id: prodId,
        title: card.querySelector('.product-title')?.textContent || 'Shimmer Wand',
        sub: card.querySelector('.product-sub')?.textContent || '',
        price: parseFloat((card.querySelector('.product-price')?.textContent || '0').replace(/[^0-9.]/g, '')),
        img: card.querySelector('.product-img-wrapper img')?.getAttribute('src') || '',
        category: card.getAttribute('data-category') || 'sets',
        quantity: 50,
        color: 'Rose Gold',
        badge: ''
      };
      openProductDetailPage(product);
    });
  });

  window.openProductDetailPage = openProductDetailPage;
}

function initFooterModals() {
  const contactBtn = document.getElementById('footer-contact-btn');
  const returnsBtn = document.getElementById('footer-returns-btn');
  const trackBtn = document.getElementById('footer-track-btn');

  const contactModal = document.getElementById('contact-modal');
  const returnsModal = document.getElementById('returns-modal');
  const trackModal = document.getElementById('track-modal');

  const closeContactBtn = document.getElementById('close-contact-modal');
  const closeReturnsBtn = document.getElementById('close-returns-modal');
  const closeTrackBtn = document.getElementById('close-track-modal');

  if (contactBtn && contactModal) {
    contactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      contactModal.classList.add('open');
      if (typeof playSparkleChime === 'function') playSparkleChime();
    });
  }

  if (returnsBtn && returnsModal) {
    returnsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      returnsModal.classList.add('open');
      if (typeof playSparkleChime === 'function') playSparkleChime();
    });
  }

  if (trackBtn && trackModal) {
    trackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      trackModal.classList.add('open');
      if (typeof playSparkleChime === 'function') playSparkleChime();
    });
  }

  if (closeContactBtn && contactModal) {
    closeContactBtn.addEventListener('click', () => contactModal.classList.remove('open'));
  }

  if (closeReturnsBtn && returnsModal) {
    closeReturnsBtn.addEventListener('click', () => returnsModal.classList.remove('open'));
  }

  if (closeTrackBtn && trackModal) {
    closeTrackBtn.addEventListener('click', () => trackModal.classList.remove('open'));
  }

  window.addEventListener('click', (e) => {
    if (e.target === contactModal) contactModal.classList.remove('open');
    if (e.target === returnsModal) returnsModal.classList.remove('open');
    if (e.target === trackModal) trackModal.classList.remove('open');
  });
}

function showToast(message) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}
