const PRODUCT_IMAGE_BASE = "Assets/Product%20Images/";

const FLOUR_VARIANTS = Object.freeze([
  { id: "gluten_free", label: "Gluten Free" },
  { id: "regular", label: "Regular" },
]);

const DEFAULT_FLOUR_VARIANT = "gluten_free";

const PRODUCTS = [
  {
    id: 101,
    name: "Fresh Apple Cinnamon Muffins",
    images: [PRODUCT_IMAGE_BASE + "applecinnamonmuffin.jpg"],
    description: "Fresh apple cinnamon muffins, sold six for $12.",
    price: 12,
    unit: "6 muffins",
  },
  {
    id: 102,
    name: "Triple Chocolate Pumpkin Bread",
    images: [PRODUCT_IMAGE_BASE + "triplechocolatepumpkinbread.jpg"],
    description: "Triple chocolate pumpkin bread, sold by the loaf.",
    price: 10,
    unit: "loaf",
  },
  {
    id: 103,
    name: "GF Sandwich Bread",
    images: [PRODUCT_IMAGE_BASE + "gfsandwichbread.jpg"],
    description: "GF sandwich bread, sold by the loaf.",
    price: 10,
    unit: "loaf",
    fixedFlourVariant: "gluten_free",
  },
  {
    id: 104,
    name: "Lemon Blueberry Scones",
    images: [PRODUCT_IMAGE_BASE + "lemonblueberryscone.jpg"],
    description: "Lemon blueberry scones, sold eight for $20.",
    price: 20,
    unit: "8 scones",
  },
  {
    id: 105,
    name: "Amish Bread",
    images: [PRODUCT_IMAGE_BASE + "amishbread1.jpg"],
    description: "Amish bread, sold by the loaf.",
    price: 10,
    unit: "loaf",
  },
];

function getProductImages(product) {
  if (!product) return [];
  if (product.images && product.images.length) return product.images;
  if (product.image) return [product.image];
  return [];
}

function getProductImage(product, index) {
  const images = getProductImages(product);
  if (!images.length) return "";
  if (typeof index === "number" && index >= 0 && index < images.length) {
    return images[index];
  }
  return images[0];
}

function getProductById(id) {
  return PRODUCTS.find(function (p) {
    return p.id === id;
  });
}

function getFlourVariant(id) {
  return (
    FLOUR_VARIANTS.find(function (option) {
      return option.id === id;
    }) || null
  );
}

function normalizeFlourVariant(value) {
  const variant = getFlourVariant(value);
  return variant ? variant.id : DEFAULT_FLOUR_VARIANT;
}

function getFlourLabel(value) {
  const variant = getFlourVariant(normalizeFlourVariant(value));
  return variant ? variant.label : "Gluten Free";
}

function normalizeSelections(product, selections) {
  const source = selections || {};
  const fixedFlour =
    product && product.fixedFlourVariant
      ? normalizeFlourVariant(product.fixedFlourVariant)
      : null;
  const normalized = {
    flour: fixedFlour || normalizeFlourVariant(source.flour || source.variant || DEFAULT_FLOUR_VARIANT),
    gluten: source.gluten || null,
    style: source.style || null,
    variant: source.variant || null,
    addOns: Array.isArray(source.addOns) ? source.addOns.slice().sort() : [],
  };

  // Keep flour as the diet/flour selector; strip size-variant collision when
  // the product does not define priced size variants.
  if (!product || !product.variants) {
    normalized.variant = null;
  }

  if (product && product.glutenOptions && !normalized.gluten) {
    normalized.gluten = product.glutenOptions[0];
  }

  if (product && product.styleOptions && !normalized.style) {
    normalized.style = product.styleOptions[0].id;
  }

  if (product && product.variants && !normalized.variant) {
    normalized.variant = product.variants[0].id;
  }

  return normalized;
}

function buildLineId(productId, selections) {
  const parts = [String(productId), "f:" + normalizeFlourVariant(selections.flour)];

  if (selections.gluten) parts.push("g:" + selections.gluten);
  if (selections.style) parts.push("s:" + selections.style);
  if (selections.variant) parts.push("v:" + selections.variant);
  if (selections.addOns && selections.addOns.length) {
    parts.push("a:" + selections.addOns.join(","));
  }

  return parts.join("|");
}

function resolveCartLine(product, rawSelections) {
  if (!product) return null;

  const selections = normalizeSelections(product, rawSelections || {});
  let unitPrice = product.price || 0;
  let unit = product.unit || "each";
  const flourLabel = getFlourLabel(selections.flour);
  const detailParts = [flourLabel];

  if (product.glutenOptions && selections.gluten) {
    detailParts.push(selections.gluten);
  }

  if (product.styleOptions && selections.style) {
    const style = product.styleOptions.find(function (opt) {
      return opt.id === selections.style;
    });
    if (style) detailParts.push(style.label);
  }

  if (product.variants && selections.variant) {
    const variant = product.variants.find(function (opt) {
      return opt.id === selections.variant;
    });
    if (variant) {
      unitPrice = variant.price;
      unit = variant.unit;
      detailParts.push(variant.label);
    }
  } else if (product.unit) {
    detailParts.push(product.unit);
  }

  if (product.addOns && selections.addOns.length) {
    selections.addOns.forEach(function (addOnId) {
      const addOn = product.addOns.find(function (opt) {
        return opt.id === addOnId;
      });
      if (addOn) {
        unitPrice += addOn.price;
        detailParts.push("+" + addOn.label);
      }
    });
  }

  return {
    lineId: buildLineId(product.id, selections),
    productId: product.id,
    selections: selections,
    name: product.name,
    displayName: product.name + " (" + flourLabel + ")",
    flour: selections.flour,
    flourLabel: flourLabel,
    image: getProductImage(product),
    unitPrice: unitPrice,
    unit: unit,
    details: detailParts.join(" · "),
  };
}

function getFeaturedPriceLabel(product) {
  if (product.variants && product.variants.length) {
    const prices = product.variants.map(function (v) {
      return v.price;
    });
    const min = Math.min.apply(null, prices);
    const max = Math.max.apply(null, prices);
    if (min === max) return "$" + min;
    return "From $" + min;
  }

  return "$" + product.price;
}

function getFeaturedUnitLabel(product) {
  if (product.variants && product.variants.length) {
    return product.variants[0].unit;
  }
  return product.unit;
}

function getFeaturedSummary(product) {
  const parts = [getFeaturedPriceLabel(product) + " / " + getFeaturedUnitLabel(product)];
  parts.push("Gluten Free by default");
  return parts.join(" · ");
}
