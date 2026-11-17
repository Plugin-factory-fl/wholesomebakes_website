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

  function pruneInvalidCartItems() {
    if (typeof getProductById !== "function") return getCart();

    const cart = getCart();
    const valid = cart.filter(function (item) {
      return item && getProductById(item.productId);
    });

    if (valid.length !== cart.length) {
      saveCart(valid);
    }

    return valid;
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + (parseInt(item.quantity, 10) || 0);
    }, 0);
  }

  const MIN_QTY = 1;
  const MAX_QTY = 50;

  function clampQuantity(quantity) {
    const parsed = parseInt(quantity, 10);
    if (!Number.isFinite(parsed)) return MIN_QTY;
    return Math.min(MAX_QTY, Math.max(MIN_QTY, parsed));
  }

  function addToCart(entry) {
    const productId =
      typeof entry === "object" ? entry.productId : entry;
    const quantity =
      typeof entry === "object"
        ? clampQuantity(entry.quantity || 1)
        : clampQuantity(arguments[1] || 1);
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
      existing.quantity = clampQuantity(existing.quantity + quantity);
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

  function setQuantity(lineId, quantity) {
    const next = parseInt(quantity, 10);
    if (!Number.isFinite(next) || next < MIN_QTY) {
      return removeFromCart(lineId);
    }

    const cart = getCart();
    const item = cart.find(function (entry) {
      return entry.lineId === lineId;
    });
    if (!item) return cart;

    item.quantity = clampQuantity(next);
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
          displayName: resolved.displayName,
          flour: resolved.flour,
          flourLabel: resolved.flourLabel,
          price: resolved.unitPrice,
          unit: resolved.unit,
          image: resolved.image,
          details: resolved.details,
          selections: resolved.selections,
          lineTotal: resolved.unitPrice * item.quantity,
        };
      })
      .filter(Boolean);
  }

  function updateCartNav(count) {
    document.querySelectorAll(".sidebar-cart-link").forEach(function (link) {
      const label = link.querySelector("[data-cart-nav-label]");
      const badge = link.querySelector("[data-cart-count]");

      if (count > 0) {
        link.classList.add("sidebar-cart-link--checkout");
        if (label) label.textContent = "Check Out";
        link.setAttribute("aria-label", "Check out with " + count + " items");
      } else {
        link.classList.remove("sidebar-cart-link--checkout");
        if (label) label.textContent = "Cart";
        link.setAttribute("aria-label", "Cart");
      }

      if (badge) {
        badge.textContent = String(count);
        badge.hidden = count === 0;
      }
    });
  }

  function updateCartBadge() {
    const count = getCartCount();
    updateCartNav(count);
    const badges = document.querySelectorAll("[data-cart-count]");
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

    sticky.textContent = "Check Out (" + count + ")";
    sticky.setAttribute("aria-label", "Check out with " + count + " items");
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
    setQuantity: setQuantity,
    clearCart: clearCart,
    getCartCount: getCartCount,
    getCartWithDetails: getCartWithDetails,
    pruneInvalidCartItems: pruneInvalidCartItems,
    updateCartBadge: updateCartBadge,
    MIN_QTY: MIN_QTY,
    MAX_QTY: MAX_QTY,
    PHONE_DISPLAY: PHONE_DISPLAY,
    PHONE_TEL: PHONE_TEL,
  };

  document.addEventListener("DOMContentLoaded", function () {
    pruneInvalidCartItems();
    updateCartBadge();
  });
})();
