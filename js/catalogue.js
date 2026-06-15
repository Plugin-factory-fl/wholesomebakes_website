(function () {
  const grid = document.getElementById("catalogue-grid");
  if (!grid || typeof PRODUCTS === "undefined") return;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildOptionsHtml(product) {
    let html = '<div class="catalogue-options">';

    if (product.glutenOptions) {
      html += '<fieldset class="catalogue-fieldset"><legend>Type</legend>';
      product.glutenOptions.forEach(function (option, index) {
        const id = "product-" + product.id + "-gluten-" + index;
        html +=
          '<label class="catalogue-choice"><input type="radio" name="gluten-' +
          product.id +
          '" value="' +
          escapeHtml(option) +
          '"' +
          (index === 0 ? " checked" : "") +
          "> " +
          escapeHtml(option) +
          "</label>";
      });
      html += "</fieldset>";
    }

    if (product.styleOptions) {
      html += '<fieldset class="catalogue-fieldset"><legend>Style</legend>';
      product.styleOptions.forEach(function (option, index) {
        html +=
          '<label class="catalogue-choice"><input type="radio" name="style-' +
          product.id +
          '" value="' +
          escapeHtml(option.id) +
          '"' +
          (index === 0 ? " checked" : "") +
          "> " +
          escapeHtml(option.label) +
          "</label>";
      });
      html += "</fieldset>";
    }

    if (product.variants) {
      html += '<fieldset class="catalogue-fieldset"><legend>Size</legend>';
      product.variants.forEach(function (variant, index) {
        html +=
          '<label class="catalogue-choice"><input type="radio" name="variant-' +
          product.id +
          '" value="' +
          escapeHtml(variant.id) +
          '" data-price="' +
          variant.price +
          '"' +
          (index === 0 ? " checked" : "") +
          "> " +
          escapeHtml(variant.label) +
          " — $" +
          variant.price +
          "</label>";
      });
      html += "</fieldset>";
    }

    if (product.addOns) {
      html += '<fieldset class="catalogue-fieldset"><legend>Add-ons (+$2 each)</legend>';
      product.addOns.forEach(function (addOn) {
        html +=
          '<label class="catalogue-choice"><input type="checkbox" name="addon-' +
          product.id +
          '" value="' +
          escapeHtml(addOn.id) +
          '"> ' +
          escapeHtml(addOn.label) +
          " (+$" +
          addOn.price +
          ")</label>";
      });
      html += "</fieldset>";
    }

    html += "</div>";
    return html;
  }

  function buildPriceHtml(product) {
    const resolved = resolveCartLine(product, normalizeSelections(product, {}));
    if (!resolved) return "";

    if (product.variants) {
      return (
        '<p class="catalogue-price" data-price-display>$' +
        resolved.unitPrice.toFixed(2) +
        ' <span>/ ' +
        escapeHtml(resolved.unit) +
        "</span></p>"
      );
    }

    let label = "$" + product.price + " / " + product.unit;
    if (product.addOns && product.addOns.length) {
      label += " · add-ons +$2";
    }

    return '<p class="catalogue-price" data-price-display>' + escapeHtml(label) + "</p>";
  }

  function readSelections(card, product) {
    const selections = { addOns: [] };

    const glutenInput = card.querySelector('input[name="gluten-' + product.id + '"]:checked');
    if (glutenInput) selections.gluten = glutenInput.value;

    const styleInput = card.querySelector('input[name="style-' + product.id + '"]:checked');
    if (styleInput) selections.style = styleInput.value;

    const variantInput = card.querySelector('input[name="variant-' + product.id + '"]:checked');
    if (variantInput) selections.variant = variantInput.value;

    card.querySelectorAll('input[name="addon-' + product.id + '"]:checked').forEach(function (input) {
      selections.addOns.push(input.value);
    });

    return normalizeSelections(product, selections);
  }

  function updateCardPrice(card, product) {
    const priceEl = card.querySelector("[data-price-display]");
    if (!priceEl) return;

    const resolved = resolveCartLine(product, readSelections(card, product));
    if (!resolved) return;

    if (product.variants) {
      priceEl.innerHTML =
        "$" +
        resolved.unitPrice.toFixed(2) +
        " <span>/ " +
        escapeHtml(resolved.unit) +
        "</span>";
      return;
    }

    let label = "$" + resolved.unitPrice.toFixed(2) + " / " + product.unit;
    if (product.addOns && product.addOns.length && resolved.selections.addOns.length) {
      label += " · with add-ons";
    } else if (product.addOns && product.addOns.length) {
      label += " · add-ons +$2";
    }

    priceEl.textContent = label;
  }

  PRODUCTS.forEach(function (product) {
    const card = document.createElement("article");
    card.className = "catalogue-card";
    card.innerHTML =
      '<div class="catalogue-card-image">' +
      '<img src="' +
      product.image +
      '" alt="' +
      escapeHtml(product.name) +
      '">' +
      "</div>" +
      '<div class="catalogue-card-body">' +
      "<h3>" +
      escapeHtml(product.name) +
      "</h3>" +
      '<p class="catalogue-desc">' +
      escapeHtml(product.description || "") +
      "</p>" +
      buildPriceHtml(product) +
      buildOptionsHtml(product) +
      '<div class="catalogue-actions">' +
      '<label class="qty-label">Qty <input type="number" class="catalogue-qty" min="1" max="99" value="1" aria-label="Quantity for ' +
      escapeHtml(product.name) +
      '"></label>' +
      '<button type="button" class="btn btn-cta catalogue-add" data-id="' +
      product.id +
      '">Add to Cart</button>' +
      "</div>" +
      "</div>";

    card.addEventListener("change", function () {
      updateCardPrice(card, product);
    });

    grid.appendChild(card);
  });

  grid.addEventListener("click", function (e) {
    const btn = e.target.closest(".catalogue-add");
    if (!btn) return;

    const card = btn.closest(".catalogue-card");
    const productId = parseInt(btn.getAttribute("data-id"), 10);
    const product = getProductById(productId);
    if (!product) return;

    const qtyInput = card.querySelector(".catalogue-qty");
    const qty = parseInt(qtyInput.value, 10) || 1;
    const selections = readSelections(card, product);

    window.WholesomeCart.addToCart({
      productId: productId,
      quantity: qty,
      selections: selections,
    });

    if (window.WholesomeAnalytics) {
      window.WholesomeAnalytics.trackEvent("add_to_cart", {
        product_id: String(productId),
        product_name: product.name,
        quantity: qty,
        item_details: resolveCartLine(product, selections).details,
      });
    }

    const original = btn.textContent;
    btn.textContent = "Added!";
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  });
})();
