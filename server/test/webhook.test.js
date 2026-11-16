const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createApp } = require("../src/server");

function listen(app) {
  const server = http.createServer(app);
  return new Promise(function (resolve) {
    server.listen(0, "127.0.0.1", function () {
      const address = server.address();
      resolve({
        server: server,
        baseUrl: "http://127.0.0.1:" + address.port,
      });
    });
  });
}

describe("webhook and order-status", function () {
  let server;
  let baseUrl;
  let mailCalls;
  let fakeStripe;

  before(async function () {
    mailCalls = [];

    fakeStripe = {
      webhooks: {
        constructEvent: function (body, signature) {
          if (signature !== "sig_test") {
            throw new Error("bad signature");
          }
          const parsed = JSON.parse(Buffer.from(body).toString("utf8"));
          return parsed;
        },
      },
      checkout: {
        sessions: {
          retrieve: async function (id) {
            return {
              id: id,
              payment_status: "paid",
              amount_total: 1000,
              currency: "usd",
              customer_details: {
                email: "customer@example.com",
                phone: "+19045551212",
                name: "Alex",
              },
              shipping_details: {
                name: "Alex",
                address: {
                  line1: "1 Main St",
                  city: "St. Augustine",
                  state: "FL",
                  postal_code: "32084",
                  country: "US",
                },
              },
              custom_fields: [],
              line_items: {
                data: [
                  {
                    description: "GF Sandwich Bread",
                    quantity: 1,
                    amount_total: 1000,
                  },
                ],
              },
            };
          },
          listLineItems: async function () {
            return { data: [] };
          },
          create: async function () {
            return { id: "cs_test_1", url: "https://checkout.stripe.com/test" };
          },
        },
      },
    };

    const emailProvider = {
      send: async function (payload) {
        mailCalls.push(payload);
        return { id: "email_" + mailCalls.length };
      },
    };

    const runtime = createApp({
      env: {
        STRIPE_SECRET_KEY: "sk_test_dummy",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "Wholesome Bakes <test@example.com>",
        ORDER_NOTIFY_EMAIL: "owner@example.com",
        ALLOWED_ORIGIN: "https://shopwholesomebakes.com",
      },
      emailProvider: emailProvider,
      stripeFactory: function () {
        return fakeStripe;
      },
    });

    const listening = await listen(runtime.app);
    server = listening.server;
    baseUrl = listening.baseUrl;
  });

  after(async function () {
    if (server) {
      await new Promise(function (resolve) {
        server.close(resolve);
      });
    }
  });

  it("returns health flags", async function () {
    const res = await fetch(baseUrl + "/health");
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.stripeConfigured, true);
    assert.equal(body.webhookConfigured, true);
    assert.equal(body.emailConfigured, true);
  });

  it("rejects invalid webhook signatures with 400", async function () {
    const res = await fetch(baseUrl + "/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "nope",
      },
      body: JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_1" } } }),
    });
    assert.equal(res.status, 400);
  });

  it("handles checkout.session.completed and emails without failing the webhook", async function () {
    mailCalls.length = 0;
    const event = {
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_webhook_1" } },
    };

    const res = await fetch(baseUrl + "/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "sig_test",
      },
      body: JSON.stringify(event),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.received, true);
    assert.equal(mailCalls.length, 2);
  });

  it("order-status sends email as a fallback when still unpaid path is skipped and paid path works", async function () {
    mailCalls.length = 0;
    const res = await fetch(baseUrl + "/order-status?session_id=cs_test_status_1");
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.paid, true);
    assert.equal(body.email.sent, true);
    assert.equal(mailCalls.length, 2);

    const again = await fetch(baseUrl + "/order-status?session_id=cs_test_status_1");
    const againBody = await again.json();
    assert.equal(againBody.email.sent, false);
    assert.equal(againBody.email.reason, "already_sent");
    assert.equal(mailCalls.length, 2);
  });
});
