(function () {
  const CART_KEY = "wholesomebakes_cart";
  const PHONE_DISPLAY = "(904) 217-2764";
  const PHONE_TEL = "+19042172764";

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function addToCart(productId, quantity) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.productId === productId;
    });

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ productId: productId, quantity: qty });
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(productId) {
    const cart = getCart().filter(function (item) {
      return item.productId !== productId;
    });
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartWithDetails() {
    return getCart()
      .map(function (item) {
        const product =
          typeof getProductById === "function" ? getProductById(item.productId) : null;
        if (!product) return null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image: product.image,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter(Boolean);
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll("[data-cart-count]");
    const count = getCartCount();
    badges.forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
    updateStickyCart(count);
  }

  function ensureStickyCart() {
    let sticky = document.getElementById("sticky-cart");
    if (!sticky) {
      sticky = document.createElement("a");
      sticky.id = "sticky-cart";
      sticky.className = "sticky-cart-btn";
      sticky.href = "checkout.html";
      sticky.setAttribute("aria-label", "View cart and checkout");
      sticky.hidden = true;
      document.body.appendChild(sticky);
    }
    return sticky;
  }

  function isCheckoutPage() {
    return /checkout\.html$/i.test(window.location.pathname);
  }

  function updateStickyCart(count) {
    const sticky = ensureStickyCart();
    const main = document.querySelector(".main-content");

    if (count === 0 || isCheckoutPage()) {
      sticky.classList.remove("is-visible");
      sticky.hidden = true;
      if (main) main.classList.remove("main-content--has-sticky-cart");
      return;
    }

    sticky.textContent = "Cart (" + count + ")";
    sticky.setAttribute("aria-label", "View cart with " + count + " items");
    sticky.hidden = false;
    if (main) main.classList.add("main-content--has-sticky-cart");
    requestAnimationFrame(function () {
      sticky.classList.add("is-visible");
    });
  }

  window.WholesomeCart = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getCartCount: getCartCount,
    getCartWithDetails: getCartWithDetails,
    updateCartBadge: updateCartBadge,
    PHONE_DISPLAY: PHONE_DISPLAY,
    PHONE_TEL: PHONE_TEL,
  };

  document.addEventListener("DOMContentLoaded", updateCartBadge);
})();
