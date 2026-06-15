const PRODUCT_IMAGE_BASE = "Assets/Product%20Images/";

const PRODUCTS = [
  {
    id: 1,
    name: "Chocolate Brownies",
    images: [
      PRODUCT_IMAGE_BASE + "26.jpeg",
      PRODUCT_IMAGE_BASE + "27.jpeg",
    ],
    description:
      "Rich, fudgy chocolate brownies baked in an 8×8 pan. Available gluten friendly or regular.",
    glutenOptions: ["Gluten Friendly", "Regular"],
    price: 15,
    unit: "8×8 pan",
    addOns: [
      { id: "ganache", label: "Ganache frosting", price: 2 },
      { id: "nuts", label: "Nuts", price: 2 },
    ],
  },
  {
    id: 2,
    name: "Chocolate Chip Cookies",
    images: [
      PRODUCT_IMAGE_BASE + "13.jpg",
      PRODUCT_IMAGE_BASE + "18.jpg",
      PRODUCT_IMAGE_BASE + "23.jpeg",
    ],
    description:
      "Chewy, buttery cookies loaded with chocolate chips. Available gluten friendly or regular.",
    glutenOptions: ["Gluten Friendly", "Regular"],
    variants: [
      { id: "half", label: "1/2 dozen", price: 10, unit: "1/2 dozen" },
      { id: "dozen", label: "1 dozen", price: 15, unit: "dozen" },
    ],
  },
  {
    id: 3,
    name: "Sourdough Sandwich Bread",
    images: [
      PRODUCT_IMAGE_BASE + "6.jpg",
      PRODUCT_IMAGE_BASE + "4.jpg",
      PRODUCT_IMAGE_BASE + "1.jpg",
      PRODUCT_IMAGE_BASE + "2.jpg",
      PRODUCT_IMAGE_BASE + "21.jpeg",
      PRODUCT_IMAGE_BASE + "22.jpeg",
    ],
    description:
      "Classic 9×5 sourdough sandwich loaf — plain or with everything bagel seasoning.",
    styleOptions: [
      { id: "plain", label: "Plain" },
      { id: "everything", label: "Everything bagel seasoning" },
    ],
    variants: [
      { id: "single", label: "1 loaf (9×5)", price: 8, unit: "loaf" },
      { id: "pair", label: "2 loaves", price: 12, unit: "2 loaves" },
    ],
  },
  {
    id: 4,
    name: "Sunshine Lemon Bars",
    images: [
      PRODUCT_IMAGE_BASE + "16.jpg",
      PRODUCT_IMAGE_BASE + "7.jpg",
      PRODUCT_IMAGE_BASE + "24.jpeg",
      PRODUCT_IMAGE_BASE + "25.jpeg",
    ],
    description:
      "Bright, tangy lemon bars on a buttery shortbread crust in an 8×8 pan. Available gluten friendly or regular.",
    glutenOptions: ["Gluten Friendly", "Regular"],
    price: 15,
    unit: "8×8 pan",
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
