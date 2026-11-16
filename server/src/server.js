const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const { SITE_ORIGIN } = require("./catalog");
const { validateCartItems, buildCheckoutSessionParams } = require("./checkout");
const { createEmailProvider } = require("./email/provider");
const { createOrderMailer } = require("./email/orderMail");

function createApp(options) {
  const opts = options || {};
  const env = opts.env || process.env;

  const PORT = Number(env.PORT) || 3000;
  const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || SITE_ORIGIN;
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY || "";
  const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET || "";
  const RESEND_API_KEY = env.RESEND_API_KEY || "";
  const EMAIL_FROM =
    env.EMAIL_FROM || "Wholesome Bakes <onboarding@resend.dev>";
  const ORDER_NOTIFY_EMAIL =
    env.ORDER_NOTIFY_EMAIL || "wholesomebakes4u@gmail.com";

  const allowedOrigins = new Set([
    ALLOWED_ORIGIN,
    "http://localhost:8000",
    "http://127.0.0.1:8000",
  ]);

  const emailProvider =
    opts.emailProvider ||
    createEmailProvider({ RESEND_API_KEY: RESEND_API_KEY }, opts.emailDeps);
  const orderMailer =
    opts.orderMailer ||
    createOrderMailer({
      emailProvider: emailProvider,
      from: EMAIL_FROM,
      notifyEmail: ORDER_NOTIFY_EMAIL,
      sentSessions: opts.sentSessions,
    });

  const stripeFactory =
    opts.stripeFactory ||
    function () {
      if (!STRIPE_SECRET_KEY) return null;
      return new Stripe(STRIPE_SECRET_KEY);
    };

  async function retrievePaidSession(stripe, sessionId) {
    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  }

  async function sendReceiptsForPaidSession(stripe, session) {
    if (!session || session.payment_status !== "paid") {
      return { sent: false, reason: "not_paid" };
    }

    let lineItems = session.line_items;
    if (!lineItems || !lineItems.data) {
      lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
      });
    }

    return orderMailer.sendForSession(session, lineItems);
  }

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

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async function (req, res) {
      const stripe = stripeFactory();
      if (!stripe) {
        res.status(500).send("Stripe is not configured.");
        return;
      }

      if (!STRIPE_WEBHOOK_SECRET) {
        console.error("webhook rejected: missing STRIPE_WEBHOOK_SECRET");
        res.status(500).send("Webhook secret is not configured.");
        return;
      }

      const signature = req.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("webhook signature verification failed", err.message);
        res.status(400).send("Webhook signature verification failed.");
        return;
      }

      if (event.type === "checkout.session.completed") {
        const sessionFromEvent = event.data.object;
        try {
          const session = await retrievePaidSession(stripe, sessionFromEvent.id);
          const result = await sendReceiptsForPaidSession(stripe, session);
          if (!result.sent) {
            console.error("webhook email not sent", sessionFromEvent.id, result);
          } else {
            console.log(
              "webhook emails sent",
              result.sessionId,
              result.orderNumber
            );
          }
        } catch (err) {
          console.error("webhook processing failed after verification", err);
        }
      }

      res.json({ received: true });
    }
  );

  app.use(express.json({ limit: "32kb" }));

  app.get("/health", function (_req, res) {
    res.json({
      ok: true,
      service: "wholesomebakes-checkout",
      stripeConfigured: Boolean(STRIPE_SECRET_KEY),
      webhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
      emailConfigured: Boolean(emailProvider),
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

      const stripe = stripeFactory();
      if (!stripe) {
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

  app.get("/order-status", async function (req, res) {
    try {
      const sessionId = String(req.query.session_id || "").trim();
      if (!sessionId) {
        res.status(400).json({ error: "session_id is required." });
        return;
      }

      const stripe = stripeFactory();
      if (!stripe) {
        res.status(500).json({ error: "Stripe is not configured." });
        return;
      }

      const session = await retrievePaidSession(stripe, sessionId);
      const paid = session.payment_status === "paid";
      let email = { sent: false, reason: "not_attempted" };

      if (paid) {
        email = await sendReceiptsForPaidSession(stripe, session);
      }

      res.json({
        ok: true,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        paid: paid,
        email: email,
      });
    } catch (err) {
      console.error("order-status failed", err);
      res.status(500).json({
        error: "Unable to look up that order right now.",
      });
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

  return {
    app: app,
    orderMailer: orderMailer,
    sendReceiptsForPaidSession: sendReceiptsForPaidSession,
    port: PORT,
  };
}

const runtime = createApp();
const app = runtime.app;

if (require.main === module) {
  app.listen(runtime.port, "0.0.0.0", function () {
    console.log(
      "Wholesome Bakes checkout API listening on 0.0.0.0:" + runtime.port
    );
  });
}

module.exports = {
  app: app,
  createApp: createApp,
  orderMailer: runtime.orderMailer,
};
