(function () {
  const config = window.WholesomeAnalyticsConfig || {};
  const measurementId = String(config.GA_MEASUREMENT_ID || "").trim();

  function isEnabled() {
    return measurementId.length > 0 && typeof window.gtag === "function";
  }

  function init() {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: true });
  }

  function trackEvent(eventName, params) {
    if (!isEnabled()) return;
    window.gtag("event", eventName, params || {});
  }

  function trackFeaturedImpression(products) {
    if (!products || !products.length) return;

    trackEvent("featured_products_shown", {
      product_ids: products
        .map(function (product) {
          return String(product.id);
        })
        .join(","),
      product_names: products
        .map(function (product) {
          return product.name;
        })
        .join(" | "),
      featured_count: products.length,
    });

    products.forEach(function (product, index) {
      trackEvent("featured_product_impression", {
        product_id: String(product.id),
        product_name: product.name,
        featured_slot: index + 1,
      });
    });
  }

  function trackFeaturedProductClick(product, slot, linkType) {
    if (!product) return;

    trackEvent("featured_product_click", {
      product_id: String(product.id),
      product_name: product.name,
      featured_slot: slot,
      link_type: linkType || "order_button",
    });
  }

  window.WholesomeAnalytics = {
    init: init,
    isEnabled: isEnabled,
    trackEvent: trackEvent,
    trackFeaturedImpression: trackFeaturedImpression,
    trackFeaturedProductClick: trackFeaturedProductClick,
  };

  init();
})();
