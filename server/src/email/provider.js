/**
 * Small email provider abstraction.
 * Default implementation talks to the Resend HTTP API.
 */

function createResendProvider(options) {
  const apiKey = options && options.apiKey;
  const fetchImpl = (options && options.fetchImpl) || fetch;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required for the Resend email provider.");
  }

  return {
    name: "resend",
    async send({ from, to, subject, html, text }) {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html,
          text: text,
        }),
      });

      const payload = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        const detail =
          (payload && (payload.message || payload.error)) ||
          "Resend request failed with status " + response.status;
        const err = new Error(String(detail));
        err.status = response.status;
        err.payload = payload;
        throw err;
      }

      return payload;
    },
  };
}

function createEmailProvider(env, deps) {
  const apiKey = (env && env.RESEND_API_KEY) || "";
  if (!apiKey) return null;
  return createResendProvider({
    apiKey: apiKey,
    fetchImpl: deps && deps.fetchImpl,
  });
}

module.exports = {
  createResendProvider,
  createEmailProvider,
};
