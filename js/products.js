const PRODUCT_IMAGE_BASE = "Assets/Product%20Images/";

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

function normalizeSelections(product, selections) {
  const normalized = {
    gluten: selections.gluten || null,
    style: selections.style || null,
    variant: selections.variant || null,
    addOns: Array.isArray(selections.addOns) ? selections.addOns.slice().sort() : [],
  };

  if (product.glutenOptions && !normalized.gluten) {
    normalized.gluten = product.glutenOptions[0];
  }

  if (product.styleOptions && !normalized.style) {
    normalized.style = product.styleOptions[0].id;
  }

  if (product.variants && !normalized.variant) {
    normalized.variant = product.variants[0].id;
  }

  return normalized;
}

function buildLineId(productId, selections) {
  const parts = [String(productId)];

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
  const detailParts = [];

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

  if (product.glutenOptions) {
    parts.push("Gluten friendly or regular");
  }

  if (product.addOns && product.addOns.length) {
    parts.push("Add-ons available");
  }

  if (product.styleOptions) {
    parts.push("Plain or everything bagel seasoning");
  }

  return parts.join(" · ");
}
