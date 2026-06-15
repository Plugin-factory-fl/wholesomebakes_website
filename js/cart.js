(function () {
  const CART_KEY = "wholesomebakes_cart";
  const PHONE_DISPLAY = "(904) 217-2764";
  const PHONE_TEL = "+19042172764";

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
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

  function addToCart(entry) {
    const productId =
      typeof entry === "object" ? entry.productId : entry;
    const quantity =
      typeof entry === "object"
        ? Math.max(1, parseInt(entry.quantity, 10) || 1)
        : Math.max(1, parseInt(arguments[1], 10) || 1);
    const selections =
      typeof entry === "object" && entry.selections ? entry.selections : {};

    const product =
      typeof getProductById === "function" ? getProductById(productId) : null;
    if (!product) return getCart();

    const normalized = normalizeSelections(product, selections);
    const lineId = buildLineId(productId, normalized);
    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.lineId === lineId;
    });

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        lineId: lineId,
        productId: productId,
        quantity: quantity,
        selections: normalized,
      });
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(lineId) {
    const cart = getCart().filter(function (item) {
      return item.lineId !== lineId;
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
        const resolved = resolveCartLine(product, item.selections || {});
        if (!product || !resolved) return null;

        return {
          lineId: item.lineId,
          productId: item.productId,
          quantity: item.quantity,
          name: resolved.name,
          price: resolved.unitPrice,
          unit: resolved.unit,
          image: resolved.image,
          details: resolved.details,
          lineTotal: resolved.unitPrice * item.quantity,
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
