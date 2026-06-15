(function () {
  const container = document.getElementById("featured-products");
  if (!container || typeof PRODUCTS === "undefined") return;

  function shuffle(list) {
    const items = list.slice();
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }
    return items;
  }

  const featured = shuffle(PRODUCTS).slice(0, 2);

  if (window.WholesomeAnalytics) {
    window.WholesomeAnalytics.trackFeaturedImpression(featured);
  }

  featured.forEach(function (product, index) {
    const flipClass = index % 2 === 1 ? " product-feature--flip" : "";
    const slot = index + 1;
    const article = document.createElement("article");
    article.className = "product-feature" + flipClass;
    article.dataset.productId = String(product.id);

    const priceLabel = getFeaturedPriceLabel(product);
    const unitLabel = getFeaturedUnitLabel(product);

    article.innerHTML =
      (index % 2 === 0
        ? '<div class="product-feature-content">' +
          "<h3>" +
          product.name +
          "</h3>" +
          '<p class="product-price">' +
          priceLabel +
          " / " +
          unitLabel +
          "</p>" +
          "<p>" +
          product.description +
          "</p>" +
          '<a class="btn btn-cta featured-product-cta" href="menu.html" data-product-id="' +
          product.id +
          '" data-featured-slot="' +
          slot +
          '">Order from Menu</a>' +
          "</div>" +
          '<div class="product-feature-media">' +
          '<img src="' +
          product.image +
          '" alt="' +
          product.name +
          '">' +
          "</div>"
        : '<div class="product-feature-media">' +
          '<img src="' +
          product.image +
          '" alt="' +
          product.name +
          '">' +
          "</div>" +
          '<div class="product-feature-content">' +
          "<h3>" +
          product.name +
          "</h3>" +
          '<p class="product-price">' +
          priceLabel +
          " / " +
          unitLabel +
          "</p>" +
          "<p>" +
          product.description +
          "</p>" +
          '<a class="btn btn-cta featured-product-cta" href="menu.html" data-product-id="' +
          product.id +
          '" data-featured-slot="' +
          slot +
          '">Order from Menu</a>' +
          "</div>");

    container.appendChild(article);
  });

  container.addEventListener("click", function (e) {
    const link = e.target.closest(".featured-product-cta");
    if (!link) return;

    const productId = parseInt(link.getAttribute("data-product-id"), 10);
    const slot = parseInt(link.getAttribute("data-featured-slot"), 10) || 0;
    const product = getProductById(productId);

    if (window.WholesomeAnalytics && product) {
      window.WholesomeAnalytics.trackFeaturedProductClick(product, slot, "order_button");
    }
  });
})();
