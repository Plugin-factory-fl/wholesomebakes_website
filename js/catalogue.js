(function () {
  const grid = document.getElementById("catalogue-grid");
  if (!grid || typeof PRODUCTS === "undefined") return;

  PRODUCTS.forEach(function (product) {
    const card = document.createElement("article");
    card.className = "catalogue-card";
    card.innerHTML =
      '<div class="catalogue-card-image">' +
      '<img src="' +
      product.image +
      '" alt="' +
      product.name +
      '">' +
      "</div>" +
      '<div class="catalogue-card-body">' +
      "<h3>" +
      product.name +
      "</h3>" +
      '<p class="catalogue-price">$' +
      product.price +
      " <span>/ " +
      product.unit +
      "</span></p>" +
      '<div class="catalogue-actions">' +
      '<label class="qty-label">Qty <input type="number" class="catalogue-qty" min="1" max="99" value="1" aria-label="Quantity for ' +
      product.name +
      '"></label>' +
      '<button type="button" class="btn btn-cta catalogue-add" data-id="' +
      product.id +
      '">Add to Cart</button>' +
      "</div>" +
      "</div>";

    grid.appendChild(card);
  });

  grid.addEventListener("click", function (e) {
    const btn = e.target.closest(".catalogue-add");
    if (!btn) return;

    const card = btn.closest(".catalogue-card");
    const qtyInput = card.querySelector(".catalogue-qty");
    const id = parseInt(btn.getAttribute("data-id"), 10);
    const qty = parseInt(qtyInput.value, 10) || 1;

    window.WholesomeCart.addToCart(id, qty);

    const original = btn.textContent;
    btn.textContent = "Added!";
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  });
})();
