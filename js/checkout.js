(function () {
  const listEl = document.getElementById("checkout-list");
  const emptyEl = document.getElementById("checkout-empty");
  const summaryEl = document.getElementById("checkout-summary");
  const errorEl = document.getElementById("checkout-error");
  const submitBtn = document.getElementById("checkout-submit");

  if (!listEl) return;

  const items = window.WholesomeCart.getCartWithDetails();

  if (!items.length) {
    if (emptyEl) emptyEl.hidden = false;
    if (summaryEl) summaryEl.hidden = true;
    listEl.innerHTML = "";
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
    li.innerHTML =
      '<img src="' +
      item.image +
      '" alt="" class="checkout-line-thumb">' +
      '<div class="checkout-line-details">' +
      "<strong>" +
      item.name +
      "</strong>" +
      "<span>" +
      (item.details ? item.details + " · " : "") +
      "Qty: " +
      item.quantity +
      " · $" +
      item.price.toFixed(2) +
      " / " +
      item.unit +
      "</span>" +
      "</div>" +
      '<span class="checkout-line-total">$' +
      item.lineTotal.toFixed(2) +
      "</span>" +
      '<button type="button" class="checkout-remove" data-line-id="' +
      item.lineId +
      '" aria-label="Remove ' +
      item.name +
      '">×</button>';
    listEl.appendChild(li);
  });

  const totalEl = document.getElementById("checkout-total");
  if (totalEl) {
    totalEl.textContent = "$" + total.toFixed(2);
  }

  listEl.addEventListener("click", function (e) {
    const btn = e.target.closest(".checkout-remove");
    if (!btn) return;
    window.WholesomeCart.removeFromCart(btn.getAttribute("data-line-id"));
    window.location.reload();
  });

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
