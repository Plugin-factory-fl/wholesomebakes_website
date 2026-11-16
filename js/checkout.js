(function () {
  const listEl = document.getElementById("checkout-list");
  const emptyEl = document.getElementById("checkout-empty");
  const summaryEl = document.getElementById("checkout-summary");
  const errorEl = document.getElementById("checkout-error");
  const submitBtn = document.getElementById("checkout-submit");
  const totalEl = document.getElementById("checkout-total");

  if (!listEl) return;

  const MIN_QTY = window.WholesomeCart.MIN_QTY || 1;
  const MAX_QTY = window.WholesomeCart.MAX_QTY || 50;

  function money(amount) {
    return "$" + Number(amount).toFixed(2);
  }

  function showEmptyState() {
    if (emptyEl) emptyEl.hidden = false;
    if (summaryEl) summaryEl.hidden = true;
    listEl.innerHTML = "";
    if (totalEl) totalEl.textContent = "$0.00";
  }

  function renderCart() {
    const items = window.WholesomeCart.getCartWithDetails();

    if (!items.length) {
      showEmptyState();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (summaryEl) summaryEl.hidden = false;

    let total = 0;
    listEl.innerHTML = "";

    items.forEach(function (item) {
      total += item.lineTotal;
      const li = document.createElement("li");
      li.className = "checkout-line";
      li.dataset.lineId = item.lineId;
      li.innerHTML =
        '<img src="' +
        item.image +
        '" alt="" class="checkout-line-thumb">' +
        '<div class="checkout-line-details">' +
        "<strong>" +
        item.name +
        "</strong>" +
        '<span class="checkout-line-meta">' +
        (item.details ? item.details + " · " : "") +
        money(item.price) +
        " / " +
        item.unit +
        "</span>" +
        '<div class="checkout-qty" role="group" aria-label="Quantity for ' +
        item.name +
        '">' +
        '<button type="button" class="checkout-qty-btn" data-action="decrease" data-line-id="' +
        item.lineId +
        '" aria-label="Decrease quantity">−</button>' +
        '<input type="number" class="checkout-qty-input" inputmode="numeric" min="' +
        MIN_QTY +
        '" max="' +
        MAX_QTY +
        '" value="' +
        item.quantity +
        '" data-line-id="' +
        item.lineId +
        '" aria-label="Quantity">' +
        '<button type="button" class="checkout-qty-btn" data-action="increase" data-line-id="' +
        item.lineId +
        '" aria-label="Increase quantity">+</button>' +
        "</div>" +
        "</div>" +
        '<span class="checkout-line-total" data-line-total>' +
        money(item.lineTotal) +
        "</span>" +
        '<button type="button" class="checkout-remove" data-action="remove" data-line-id="' +
        item.lineId +
        '" aria-label="Remove ' +
        item.name +
        '">Remove</button>';
      listEl.appendChild(li);
    });

    if (totalEl) totalEl.textContent = money(total);
    window.WholesomeCart.updateCartBadge();
  }

  function applyQuantity(lineId, quantity) {
    const next = parseInt(quantity, 10);
    if (!Number.isFinite(next) || next < MIN_QTY) {
      window.WholesomeCart.removeFromCart(lineId);
    } else {
      window.WholesomeCart.setQuantity(lineId, next);
    }
    renderCart();
  }

  listEl.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const lineId = btn.getAttribute("data-line-id");
    const action = btn.getAttribute("data-action");
    if (!lineId || !action) return;

    const item = window.WholesomeCart.getCart().find(function (entry) {
      return entry.lineId === lineId;
    });

    if (action === "remove") {
      window.WholesomeCart.removeFromCart(lineId);
      renderCart();
      return;
    }

    if (!item) return;

    if (action === "decrease") {
      if (item.quantity <= MIN_QTY) {
        window.WholesomeCart.removeFromCart(lineId);
      } else {
        window.WholesomeCart.setQuantity(lineId, item.quantity - 1);
      }
      renderCart();
      return;
    }

    if (action === "increase") {
      window.WholesomeCart.setQuantity(lineId, item.quantity + 1);
      renderCart();
    }
  });

  listEl.addEventListener("change", function (e) {
    const input = e.target.closest(".checkout-qty-input");
    if (!input) return;
    applyQuantity(input.getAttribute("data-line-id"), input.value);
  });

  listEl.addEventListener("keydown", function (e) {
    const input = e.target.closest(".checkout-qty-input");
    if (!input || e.key !== "Enter") return;
    e.preventDefault();
    applyQuantity(input.getAttribute("data-line-id"), input.value);
  });

  renderCart();

  if (!submitBtn) return;

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting
      ? "Redirecting to Stripe…"
      : "Checkout securely with Stripe";
  }

  function buildPayload() {
    const cart = window.WholesomeCart.getCart();
    return {
      items: cart.map(function (item) {
        return {
          productId: item.productId,
          quantity: item.quantity,
        };
      }),
    };
  }

  submitBtn.addEventListener("click", function () {
    clearError();

    const config = window.WholesomeOrderConfig || {};
    const apiBase = String(config.CHECKOUT_API_URL || "").replace(/\/$/, "");

    if (!apiBase) {
      showError(
        "Secure checkout is not connected yet. Please browse the menu and try again soon."
      );
      return;
    }

    const cartItems = window.WholesomeCart.getCartWithDetails();
    if (!cartItems.length) {
      showError("Your cart is empty. Add items from the menu first.");
      return;
    }

    setSubmitting(true);

    fetch(apiBase + "/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildPayload()),
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { response: response, data: data };
          });
      })
      .then(function (result) {
        if (!result.response.ok || !result.data.url) {
          throw new Error(
            result.data.error || "Unable to start secure checkout. Please try again."
          );
        }
        window.location.href = result.data.url;
      })
      .catch(function (err) {
        showError(
          err.message || "Something went wrong starting checkout. Please try again."
        );
        setSubmitting(false);
      });
  });
})();
