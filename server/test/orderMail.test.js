const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildOrderView,
  createOrderMailer,
  shortOrderNumber,
  renderTextReceipt,
} = require("../src/email/orderMail");
const { createResendProvider } = require("../src/email/provider");

function sampleSession() {
  return {
    id: "cs_test_abc123456789",
    payment_status: "paid",
    amount_total: 2200,
    currency: "usd",
    customer_details: {
      email: "customer@example.com",
      name: "Alex Miller",
      phone: "+19045551212",
    },
    shipping_details: {
      name: "Alex Miller",
      address: {
        line1: "12 Magnolia St",
        line2: "",
        city: "St. Augustine",
        state: "FL",
        postal_code: "32084",
        country: "US",
      },
    },
    custom_fields: [
      {
        key: "order_notes",
        text: { value: "Leave at the porch" },
      },
    ],
  };
}

function sampleLineItems() {
  return {
    data: [
      {
        description: "GF Sandwich Bread",
        quantity: 1,
        amount_total: 1000,
      },
      {
        description: "Fresh Apple Cinnamon Muffins",
        quantity: 1,
        amount_total: 1200,
      },
    ],
  };
}

describe("orderMail helpers", function () {
  it("builds a compact order number from the session id", function () {
    assert.equal(shortOrderNumber("cs_test_abc123456789"), "ABC1234567");
  });

  it("builds an order view with address phone notes and totals", function () {
    const order = buildOrderView(sampleSession(), sampleLineItems());
    assert.equal(order.email, "customer@example.com");
    assert.equal(order.phone, "+19045551212");
    assert.equal(order.notes, "Leave at the porch");
    assert.equal(order.items.length, 2);
    assert.equal(order.total, 2200);
    assert.match(order.addressLines.join(" "), /Magnolia/);
    assert.match(renderTextReceipt(order, "customer"), /Thank you/);
  });
});

describe("createOrderMailer", function () {
  it("sends customer and owner emails once per session", async function () {
    const sends = [];
    const provider = {
      send: async function (payload) {
        sends.push(payload);
        return { id: "email_" + sends.length };
      },
    };

    const mailer = createOrderMailer({
      emailProvider: provider,
      from: "Wholesome Bakes <orders@example.com>",
      notifyEmail: "owner@example.com",
    });

    const first = await mailer.sendForSession(sampleSession(), sampleLineItems());
    const second = await mailer.sendForSession(sampleSession(), sampleLineItems());

    assert.equal(first.sent, true);
    assert.equal(second.sent, false);
    assert.equal(second.reason, "already_sent");
    assert.equal(sends.length, 2);
    assert.equal(sends[0].to, "customer@example.com");
    assert.equal(sends[1].to, "owner@example.com");
    assert.match(sends[0].subject, /receipt/);
    assert.match(sends[1].subject, /New Wholesome Bakes order/);
  });

  it("returns send_failed without throwing when provider errors", async function () {
    const provider = {
      send: async function () {
        throw new Error("boom");
      },
    };
    const mailer = createOrderMailer({
      emailProvider: provider,
      notifyEmail: "owner@example.com",
    });
    const result = await mailer.sendForSession(sampleSession(), sampleLineItems());
    assert.equal(result.sent, false);
    assert.equal(result.reason, "send_failed");
  });
});

describe("createResendProvider", function () {
  it("posts to the Resend API", async function () {
    let called = null;
    const provider = createResendProvider({
      apiKey: "re_test",
      fetchImpl: async function (url, init) {
        called = { url: url, init: init };
        return {
          ok: true,
          json: async function () {
            return { id: "re_123" };
          },
        };
      },
    });

    const result = await provider.send({
      from: "Wholesome Bakes <orders@example.com>",
      to: "customer@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    assert.equal(result.id, "re_123");
    assert.equal(called.url, "https://api.resend.com/emails");
    assert.match(called.init.headers.Authorization, /Bearer re_test/);
  });
});
