const SITE_ORIGIN = "https://shopwholesomebakes.com";
const IMAGE_BASE = `${SITE_ORIGIN}/Assets/Product%20Images/`;

/**
 * Server-side product catalog. Prices are authoritative (cents).
 * IDs must match js/products.js on the static site.
 */
const PRODUCTS = Object.freeze([
  {
    id: 101,
    name: "Fresh Apple Cinnamon Muffins",
    unitAmount: 1200,
    unitLabel: "6 muffins",
    image: `${IMAGE_BASE}applecinnamonmuffin.jpg`,
  },
  {
    id: 102,
    name: "Triple Chocolate Pumpkin Bread",
    unitAmount: 1000,
    unitLabel: "loaf",
    image: `${IMAGE_BASE}triplechocolatepumpkinbread.jpg`,
  },
  {
    id: 103,
    name: "GF Sandwich Bread",
    unitAmount: 1000,
    unitLabel: "loaf",
    image: `${IMAGE_BASE}gfsandwichbread.jpg`,
  },
  {
    id: 104,
    name: "Lemon Blueberry Scones",
    unitAmount: 2000,
    unitLabel: "8 scones",
    image: `${IMAGE_BASE}lemonblueberryscone.jpg`,
  },
  {
    id: 105,
    name: "Amish Bread",
    unitAmount: 1000,
    unitLabel: "loaf",
    image: `${IMAGE_BASE}amishbread1.jpg`,
  },
]);

const PRODUCTS_BY_ID = Object.freeze(
  PRODUCTS.reduce(function (map, product) {
    map[product.id] = product;
    return map;
  }, {})
);

function getProductById(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  return PRODUCTS_BY_ID[numericId] || null;
}

module.exports = {
  SITE_ORIGIN,
  PRODUCTS,
  getProductById,
};
