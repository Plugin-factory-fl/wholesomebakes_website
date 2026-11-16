const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { SITE_ORIGIN } = require("./catalog");
const { validateCartItems, buildCheckoutSessionParams } = require("./checkout");

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || SITE_ORIGIN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const allowedOrigins = new Set([
  ALLOWED_ORIGIN,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "32kb" }));

app.get("/health", function (_req, res) {
  res.json({
    ok: true,
    service: "wholesomebakes-checkout",
    stripeConfigured: Boolean(STRIPE_SECRET_KEY),
  });
});

app.post("/create-checkout-session", async function (req, res) {
  try {
    const body = req.body || {};
    const validated = validateCartItems(body.items);

    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    if (!STRIPE_SECRET_KEY) {
      res.status(500).json({
        error: "Checkout is not configured. Missing STRIPE_SECRET_KEY.",
      });
      return;
    }

    const sessionParams = buildCheckoutSessionParams(validated.items, {
      successUrl:
        SITE_ORIGIN + "/order-success.html?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: SITE_ORIGIN + "/checkout.html",
    });

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      res.status(502).json({ error: "Stripe did not return a checkout URL." });
      return;
    }

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("create-checkout-session failed", err);
    const message =
      err && err.type === "StripeInvalidRequestError"
        ? err.message
        : "Unable to start checkout. Please try again.";
    res.status(500).json({ error: message });
  }
});

app.use(function (err, _req, res, _next) {
  if (err && err.message === "Origin not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", function () {
    console.log("Wholesome Bakes checkout API listening on 0.0.0.0:" + PORT);
  });
}

module.exports = app;
