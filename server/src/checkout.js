const { getProductById } = require("./catalog");

const MIN_QTY = 1;
const MAX_QTY = 50;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validate and normalize cart items from the client.
 * Client may only send productId + quantity. Prices come from the server catalog.
 */
function validateCartItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "Cart must include at least one item." };
  }

  const merged = new Map();

  for (let i = 0; i < rawItems.length; i += 1) {
    const entry = rawItems[i];
    if (!isPlainObject(entry)) {
      return { ok: false, error: "Each cart item must be an object." };
    }

    const productId = Number(entry.productId);
    if (!Number.isInteger(productId)) {
      return { ok: false, error: "Each item needs a valid productId." };
    }

    const product = getProductById(productId);
    if (!product) {
      return { ok: false, error: "Unknown productId: " + productId };
    }

    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < MIN_QTY || quantity > MAX_QTY) {
      return {
        ok: false,
        error: "Quantity must be an integer from " + MIN_QTY + " to " + MAX_QTY + ".",
      };
    }

    const existing = merged.get(productId) || 0;
    const nextQty = existing + quantity;
    if (nextQty > MAX_QTY) {
      return {
        ok: false,
        error: "Quantity for " + product.name + " cannot exceed " + MAX_QTY + ".",
      };
    }
    merged.set(productId, nextQty);
  }

  const items = Array.from(merged.entries()).map(function ([productId, quantity]) {
    const product = getProductById(productId);
    return {
      productId: product.id,
      name: product.name,
      quantity: quantity,
      unitAmount: product.unitAmount,
      unitLabel: product.unitLabel,
      image: product.image,
    };
  });

  return { ok: true, items: items };
}

function buildCartSummary(items) {
  return items
    .map(function (item) {
      return item.productId + "x" + item.quantity;
    })
    .join(",");
}

function buildLineItems(items) {
  return items.map(function (item) {
    return {
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unitAmount,
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: {
            product_id: String(item.productId),
            unit_label: item.unitLabel,
          },
        },
      },
    };
  });
}

/**
 * Build Stripe Checkout Session create params (no network calls).
 */
function buildCheckoutSessionParams(items, urls) {
  const successUrl = urls && urls.successUrl;
  const cancelUrl = urls && urls.cancelUrl;

  if (!successUrl || !cancelUrl) {
    throw new Error("successUrl and cancelUrl are required.");
  }

  return {
    mode: "payment",
    line_items: buildLineItems(items),
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    phone_number_collection: {
      enabled: true,
    },
    custom_fields: [
      {
        key: "order_notes",
        label: {
          type: "custom",
          custom: "Order notes",
        },
        type: "text",
        optional: true,
      },
    ],
    metadata: {
      cart_summary: buildCartSummary(items),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };
}

module.exports = {
  MIN_QTY,
  MAX_QTY,
  validateCartItems,
  buildCartSummary,
  buildLineItems,
  buildCheckoutSessionParams,
};
