(function () {
  const container = document.getElementById("featured-products");
  if (!container || typeof PRODUCTS === "undefined") return;

  const HERO_PRODUCT_ID = 103;

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

  function pickFeatured() {
    const hero = getProductById(HERO_PRODUCT_ID);
    const others = shuffle(
      PRODUCTS.filter(function (product) {
        return product.id !== HERO_PRODUCT_ID;
      })
    );
    const featured = [];
    if (hero) featured.push(hero);
    if (others.length) featured.push(others[0]);
    return featured;
  }

  const featured = pickFeatured();

  if (window.WholesomeAnalytics) {
    window.WholesomeAnalytics.trackFeaturedImpression(featured);
  }

  featured.forEach(function (product, index) {
    const isHero = product.id === HERO_PRODUCT_ID;
    const flipClass = index % 2 === 1 ? " product-feature--flip" : "";
    const heroClass = isHero ? " product-feature--hero" : "";
    const slot = index + 1;
    const article = document.createElement("article");
    article.className = "product-feature" + flipClass + heroClass;
    article.dataset.productId = String(product.id);

    const priceLabel = getFeaturedPriceLabel(product);
    const unitLabel = getFeaturedUnitLabel(product);
    const images = getProductImages(product);
    const featuredImage = getProductImage(product);

    const badgeHtml = isHero
      ? '<p class="featured-badge">October 2026\'s best seller</p>' +
        '<p class="featured-kicker">Our customers keep coming back for this loaf.</p>'
      : "";

    const contentHtml =
      '<div class="product-feature-content">' +
      badgeHtml +
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
      "</div>";

    const mediaHtml =
      '<div class="product-feature-media">' +
      '<img src="' +
      featuredImage +
      '" alt="' +
      product.name +
      '">' +
      "</div>";

    article.innerHTML =
      index % 2 === 0 ? contentHtml + mediaHtml : mediaHtml + contentHtml;

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
