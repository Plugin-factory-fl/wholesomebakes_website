(function () {
  const listEl = document.getElementById("checkout-list");
  const emptyEl = document.getElementById("checkout-empty");
  const summaryEl = document.getElementById("checkout-summary");
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
      "<span>Qty: " +
      item.quantity +
      " · $" +
      item.price +
      " / " +
      item.unit +
      "</span>" +
      "</div>" +
      '<span class="checkout-line-total">$' +
      item.lineTotal.toFixed(2) +
      "</span>" +
      '<button type="button" class="checkout-remove" data-id="' +
      item.productId +
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
    window.WholesomeCart.removeFromCart(parseInt(btn.getAttribute("data-id"), 10));
    window.location.reload();
  });
})();
