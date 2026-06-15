(function () {
  const listEl = document.getElementById("checkout-list");
  const emptyEl = document.getElementById("checkout-empty");
  const summaryEl = document.getElementById("checkout-summary");
  const successEl = document.getElementById("checkout-success");
  const formEl = document.getElementById("checkout-form");
  const errorEl = document.getElementById("checkout-error");
  const submitBtn = document.getElementById("checkout-submit");
  const addressField = document.getElementById("order-address-field");
  const addressInput = document.getElementById("order-address");

  if (!listEl) return;

  const items = window.WholesomeCart.getCartWithDetails();

  if (!items.length) {
    if (emptyEl) emptyEl.hidden = false;
    if (summaryEl) summaryEl.hidden = true;
    if (successEl) successEl.hidden = true;
    listEl.innerHTML = "";
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (summaryEl) summaryEl.hidden = false;
  if (successEl) successEl.hidden = true;

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

  if (!formEl) return;

  function getFulfillment() {
    const selected = formEl.querySelector('input[name="fulfillment"]:checked');
    return selected ? selected.value : "Pickup";
  }

  function updateAddressField() {
    const isDelivery = getFulfillment() === "Delivery";
    if (!addressField || !addressInput) return;
    addressField.hidden = !isDelivery;
    addressInput.required = isDelivery;
    if (!isDelivery) {
      addressInput.value = "";
    }
  }

  formEl.querySelectorAll('input[name="fulfillment"]').forEach(function (radio) {
    radio.addEventListener("change", updateAddressField);
  });
  updateAddressField();

  function formatOrderLines(cartItems, orderTotal) {
    const lines = cartItems.map(function (item) {
      return (
        "- " +
        item.name +
        (item.details ? " (" + item.details + ")" : "") +
        " x" +
        item.quantity +
        " ($" +
        item.price.toFixed(2) +
        " / " +
        item.unit +
        ") — $" +
        item.lineTotal.toFixed(2)
      );
    });

    return lines.join("\n") + "\n\nEstimated total: $" + orderTotal.toFixed(2);
  }

  function buildOrderMessage(data, cartItems, orderTotal) {
    const parts = [
      "New Wholesome Bakes website order",
      "",
      "Customer: " + data.name,
      "Phone: " + data.phone,
    ];

    if (data.email) {
      parts.push("Email: " + data.email);
    }

    parts.push("Fulfillment: " + data.fulfillment);

    if (data.fulfillment === "Delivery" && data.address) {
      parts.push("Delivery address: " + data.address);
    }

    if (data.requested_time) {
      parts.push("Requested: " + data.requested_time);
    }

    if (data.notes) {
      parts.push("Notes: " + data.notes);
    }

    parts.push("", "Items:", formatOrderLines(cartItems, orderTotal));

    return parts.join("\n");
  }

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
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Sending order…" : "Place Order";
  }

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    const config = window.WholesomeOrderConfig || {};
    const submitUrl =
      config.FORMSUBMIT_URL ||
      (config.ORDER_EMAIL
        ? "https://formsubmit.co/ajax/" + encodeURIComponent(config.ORDER_EMAIL)
        : "");

    if (!submitUrl) {
      showError("Order form is not configured. Please call (904) 217-2764 to place your order.");
      return;
    }

    const formData = new FormData(formEl);

    if (formData.get("_honey")) {
      return;
    }

    const data = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      fulfillment: getFulfillment(),
      address: String(formData.get("address") || "").trim(),
      requested_time: String(formData.get("requested_time") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };

    if (!data.name || !data.phone) {
      showError("Please enter your name and phone number.");
      return;
    }

    if (data.fulfillment === "Delivery" && !data.address) {
      showError("Please enter a delivery address.");
      return;
    }

    const cartItems = window.WholesomeCart.getCartWithDetails();
    if (!cartItems.length) {
      showError("Your cart is empty. Add items from the menu first.");
      return;
    }

    let orderTotal = 0;
    cartItems.forEach(function (item) {
      orderTotal += item.lineTotal;
    });

    const orderMessage = buildOrderMessage(data, cartItems, orderTotal);
    const payload = {
      _subject: "New Wholesome Bakes Order — " + data.name,
      _captcha: "false",
      _template: "table",
      name: data.name,
      phone: data.phone,
      email: data.email || "Not provided",
      fulfillment: data.fulfillment,
      address: data.address || "N/A",
      requested_time: data.requested_time || "Not specified",
      notes: data.notes || "None",
      message: orderMessage,
    };

    if (data.email) {
      payload._replyto = data.email;
    }

    setSubmitting(true);

    fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        const ok = result.success === true || result.success === "true";
        if (!ok) {
          throw new Error(result.message || "Unable to send your order. Please try again.");
        }

        window.WholesomeCart.clearCart();
        window.WholesomeCart.updateCartBadge();

        if (summaryEl) summaryEl.hidden = true;
        if (successEl) successEl.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(function (err) {
        showError(
          err.message ||
            "Something went wrong sending your order. Please call or text (904) 217-2764."
        );
      })
      .finally(function () {
        setSubmitting(false);
      });
  });
})();
