const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  validateCartItems,
  buildCheckoutSessionParams,
  buildLineItems,
  buildCartSummary,
} = require("../src/checkout");
const { PRODUCTS } = require("../src/catalog");

describe("validateCartItems", function () {
  it("rejects empty carts", function () {
    const result = validateCartItems([]);
    assert.equal(result.ok, false);
  });

  it("rejects unknown product ids", function () {
    const result = validateCartItems([{ productId: 1, quantity: 1 }]);
    assert.equal(result.ok, false);
    assert.match(result.error, /Unknown productId/);
  });

  it("rejects non integer quantities", function () {
    const result = validateCartItems([{ productId: 101, quantity: 1.5 }]);
    assert.equal(result.ok, false);
  });

  it("rejects quantities outside 1 to 50", function () {
    assert.equal(validateCartItems([{ productId: 101, quantity: 0 }]).ok, false);
    assert.equal(validateCartItems([{ productId: 101, quantity: 51 }]).ok, false);
  });

  it("accepts valid items and ignores client prices", function () {
    const result = validateCartItems([
      { productId: 101, quantity: 2, price: 1 },
      { productId: 105, quantity: 1, unitAmount: 1 },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].unitAmount, 1200);
    assert.equal(result.items[1].unitAmount, 1000);
  });

  it("merges duplicate product ids", function () {
    const result = validateCartItems([
      { productId: 102, quantity: 2 },
      { productId: 102, quantity: 3 },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].quantity, 5);
    assert.equal(result.items[0].unitAmount, 1000);
  });
});

describe("buildCheckoutSessionParams", function () {
  it("builds Stripe session payload from server catalog prices", function () {
    const validated = validateCartItems([
      { productId: 101, quantity: 1 },
      { productId: 104, quantity: 2 },
    ]);
    assert.equal(validated.ok, true);

    const params = buildCheckoutSessionParams(validated.items, {
      successUrl: "https://shopwholesomebakes.com/order-success.html?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "https://shopwholesomebakes.com/checkout.html",
    });

    assert.equal(params.mode, "payment");
    assert.deepEqual(params.shipping_address_collection.allowed_countries, ["US"]);
    assert.equal(params.phone_number_collection.enabled, true);
    assert.equal(params.custom_fields[0].key, "order_notes");
    assert.equal(params.custom_fields[0].optional, true);
    assert.equal(params.custom_fields[0].label.custom, "Order notes");
    assert.equal(params.metadata.cart_summary, "101x1,104x2");
    assert.match(params.success_url, /order-success\.html\?session_id=\{CHECKOUT_SESSION_ID\}$/);
    assert.equal(params.cancel_url, "https://shopwholesomebakes.com/checkout.html");

    const lineItems = params.line_items;
    assert.equal(lineItems.length, 2);
    assert.equal(lineItems[0].quantity, 1);
    assert.equal(lineItems[0].price_data.currency, "usd");
    assert.equal(lineItems[0].price_data.unit_amount, 1200);
    assert.equal(lineItems[0].price_data.product_data.name, "Fresh Apple Cinnamon Muffins");
    assert.match(
      lineItems[0].price_data.product_data.images[0],
      /^https:\/\/shopwholesomebakes\.com\/Assets\/Product%20Images\//
    );
    assert.equal(lineItems[1].price_data.unit_amount, 2000);
    assert.equal(lineItems[1].quantity, 2);
  });

  it("covers all five catalog products with expected cents", function () {
    const expected = {
      101: 1200,
      102: 1000,
      103: 1000,
      104: 2000,
      105: 1000,
    };

    PRODUCTS.forEach(function (product) {
      assert.equal(product.unitAmount, expected[product.id]);
    });

    const items = PRODUCTS.map(function (product) {
      return { productId: product.id, quantity: 1 };
    });
    const validated = validateCartItems(items);
    assert.equal(validated.ok, true);

    const lineItems = buildLineItems(validated.items);
    assert.equal(lineItems.length, 5);
    lineItems.forEach(function (line, index) {
      assert.equal(line.price_data.unit_amount, PRODUCTS[index].unitAmount);
    });

    assert.equal(buildCartSummary(validated.items), "101x1,102x1,103x1,104x1,105x1");
  });
});
