const BAKERY_PHONE = "(904) 217-2764";

function moneyFromCents(cents) {
  return "$" + (Number(cents || 0) / 100).toFixed(2);
}

function shortOrderNumber(sessionId) {
  const raw = String(sessionId || "");
  const trimmed = raw.replace(/^cs_(test_|live_)?/, "");
  return trimmed.slice(0, 10).toUpperCase() || "ORDER";
}

function extractCustomNotes(session) {
  const fields = (session && session.custom_fields) || [];
  const notes = fields.find(function (field) {
    return field && field.key === "order_notes";
  });
  if (!notes || !notes.text) return "";
  return String(notes.text.value || "").trim();
}

function extractAddress(session) {
  const details =
    (session && session.collected_information && session.collected_information.shipping_details) ||
    (session && session.shipping_details) ||
    null;
  if (!details) return { name: "", lines: [] };

  const address = details.address || {};
  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ]
    .map(function (line) {
      return String(line || "").trim();
    })
    .filter(Boolean);

  return {
    name: String(details.name || "").trim(),
    lines: lines,
  };
}

function extractPhone(session) {
  return (
    (session &&
      session.customer_details &&
      session.customer_details.phone) ||
    (session && session.customer_phone) ||
    ""
  );
}

function extractEmail(session) {
  return (
    (session &&
      session.customer_details &&
      session.customer_details.email) ||
    (session && session.customer_email) ||
    ""
  );
}

function normalizeLineItems(lineItems) {
  const data = (lineItems && lineItems.data) || lineItems || [];
  return data.map(function (item) {
    return {
      name: (item.description || (item.price && item.price.product && item.price.product.name) || "Item"),
      quantity: item.quantity || 1,
      amount: item.amount_total != null ? item.amount_total : item.amount_subtotal || 0,
    };
  });
}

function buildOrderView(session, lineItems) {
  const address = extractAddress(session);
  const items = normalizeLineItems(lineItems);
  return {
    orderNumber: shortOrderNumber(session && session.id),
    sessionId: session && session.id,
    email: extractEmail(session),
    phone: extractPhone(session),
    notes: extractCustomNotes(session),
    customerName: address.name || (session.customer_details && session.customer_details.name) || "",
    addressLines: address.lines,
    items: items,
    total: session.amount_total != null ? session.amount_total : 0,
    currency: (session.currency || "usd").toUpperCase(),
  };
}

function renderTextReceipt(order, kind) {
  const lines = [];
  if (kind === "customer") {
    lines.push("Thank you for your Wholesome Bakes order!");
  } else {
    lines.push("New Wholesome Bakes order");
  }
  lines.push("");
  lines.push("Order number: " + order.orderNumber);
  if (order.customerName) lines.push("Customer: " + order.customerName);
  if (order.email) lines.push("Email: " + order.email);
  if (order.phone) lines.push("Phone: " + order.phone);
  if (order.addressLines.length) {
    lines.push("Delivery address:");
    order.addressLines.forEach(function (line) {
      lines.push("  " + line);
    });
  }
  if (order.notes) lines.push("Order notes: " + order.notes);
  lines.push("");
  lines.push("Items:");
  order.items.forEach(function (item) {
    lines.push(
      "- " +
        item.name +
        " x" +
        item.quantity +
        "  " +
        moneyFromCents(item.amount)
    );
  });
  lines.push("");
  lines.push("Total: " + moneyFromCents(order.total) + " " + order.currency);
  lines.push("");
  lines.push("Questions? Call or text " + BAKERY_PHONE + ".");
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtmlReceipt(order, kind) {
  const intro =
    kind === "customer"
      ? "Thank you for your Wholesome Bakes order. A summary is below."
      : "A new paid order came through Stripe Checkout.";

  const itemRows = order.items
    .map(function (item) {
      return (
        "<tr>" +
        "<td style='padding:8px 0;border-bottom:1px solid #eadfd4;'>" +
        escapeHtml(item.name) +
        " × " +
        item.quantity +
        "</td>" +
        "<td style='padding:8px 0;border-bottom:1px solid #eadfd4;text-align:right;'>" +
        moneyFromCents(item.amount) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const addressHtml = order.addressLines.length
    ? "<p style='margin:0 0 12px;'><strong>Delivery address</strong><br>" +
      order.addressLines.map(escapeHtml).join("<br>") +
      "</p>"
    : "";

  return (
    "<div style='font-family:Georgia,serif;color:#3f2412;max-width:560px;margin:0 auto;padding:24px;'>" +
    "<h1 style='font-size:28px;margin:0 0 8px;'>Wholesome Bakes</h1>" +
    "<p style='margin:0 0 20px;color:#6e5748;'>" +
    escapeHtml(intro) +
    "</p>" +
    "<p style='margin:0 0 8px;'><strong>Order number:</strong> " +
    escapeHtml(order.orderNumber) +
    "</p>" +
    (order.customerName
      ? "<p style='margin:0 0 8px;'><strong>Customer:</strong> " +
        escapeHtml(order.customerName) +
        "</p>"
      : "") +
    (order.email
      ? "<p style='margin:0 0 8px;'><strong>Email:</strong> " +
        escapeHtml(order.email) +
        "</p>"
      : "") +
    (order.phone
      ? "<p style='margin:0 0 8px;'><strong>Phone:</strong> " +
        escapeHtml(order.phone) +
        "</p>"
      : "") +
    addressHtml +
    (order.notes
      ? "<p style='margin:0 0 16px;'><strong>Order notes:</strong> " +
        escapeHtml(order.notes) +
        "</p>"
      : "") +
    "<table style='width:100%;border-collapse:collapse;margin:16px 0;'>" +
    itemRows +
    "<tr><td style='padding-top:12px;'><strong>Total</strong></td>" +
    "<td style='padding-top:12px;text-align:right;'><strong>" +
    moneyFromCents(order.total) +
    "</strong></td></tr>" +
    "</table>" +
    "<p style='margin:20px 0 0;color:#6e5748;'>Questions? Call or text " +
    BAKERY_PHONE +
    ".</p>" +
    "</div>"
  );
}

function createOrderMailer(options) {
  const emailProvider = options.emailProvider;
  const from =
    options.from || "Wholesome Bakes <onboarding@resend.dev>";
  const notifyEmail = options.notifyEmail || "wholesomebakes4u@gmail.com";
  const sentSessions = options.sentSessions || new Set();

  async function sendForSession(session, lineItems) {
    const sessionId = session && session.id;
    if (!sessionId) {
      return { sent: false, reason: "missing_session_id" };
    }

    if (sentSessions.has(sessionId)) {
      return { sent: false, reason: "already_sent", sessionId: sessionId };
    }

    if (!emailProvider) {
      console.error("order email skipped: email provider not configured", sessionId);
      return { sent: false, reason: "email_not_configured", sessionId: sessionId };
    }

    const order = buildOrderView(session, lineItems);
    const tasks = [];

    if (order.email) {
      tasks.push(
        emailProvider.send({
          from: from,
          to: order.email,
          subject: "Your Wholesome Bakes receipt (" + order.orderNumber + ")",
          html: renderHtmlReceipt(order, "customer"),
          text: renderTextReceipt(order, "customer"),
        })
      );
    } else {
      console.error("order email skipped customer receipt: missing customer email", sessionId);
    }

    tasks.push(
      emailProvider.send({
        from: from,
        to: notifyEmail,
        subject: "New Wholesome Bakes order (" + order.orderNumber + ")",
        html: renderHtmlReceipt(order, "owner"),
        text: renderTextReceipt(order, "owner"),
      })
    );

    try {
      await Promise.all(tasks);
      sentSessions.add(sessionId);
      return { sent: true, sessionId: sessionId, orderNumber: order.orderNumber };
    } catch (err) {
      console.error("order email send failed", sessionId, err);
      return {
        sent: false,
        reason: "send_failed",
        sessionId: sessionId,
        error: err && err.message ? err.message : String(err),
      };
    }
  }

  return {
    sendForSession: sendForSession,
    hasSent: function (sessionId) {
      return sentSessions.has(sessionId);
    },
    _sentSessions: sentSessions,
  };
}

module.exports = {
  BAKERY_PHONE,
  shortOrderNumber,
  extractCustomNotes,
  extractAddress,
  extractPhone,
  extractEmail,
  buildOrderView,
  renderTextReceipt,
  renderHtmlReceipt,
  createOrderMailer,
};
