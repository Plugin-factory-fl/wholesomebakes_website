(function () {
  const PHONE = "(904) 217-2764";
  const LABEL = "Call or text to order";
  const NOTE =
    "Local pickup or delivery in St. Augustine, FL. If unsure, just contact us and ask.";

  let modal = document.getElementById("contact-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "contact-modal";
    modal.className = "contact-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="contact-modal-backdrop" data-close-modal></div>' +
      '<div class="contact-modal-dialog" role="dialog" aria-labelledby="contact-modal-title" aria-modal="true">' +
      '<button type="button" class="contact-modal-close" data-close-modal aria-label="Close">×</button>' +
      '<div class="contact-cta contact-cta--modal">' +
      '<span id="contact-modal-title" class="contact-cta-label">' +
      LABEL +
      "</span>" +
      '<span class="contact-cta-phone">' +
      PHONE +
      "</span>" +
      '<p class="contact-cta-note">' +
      NOTE +
      "</p>" +
      "</div>" +
      "</div>";
    document.body.appendChild(modal);

    modal.querySelectorAll("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", closeContactModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeContactModal();
    });
  }

  function openContactModal() {
    modal.hidden = false;
    requestAnimationFrame(function () {
      modal.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
  }

  function closeContactModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    window.setTimeout(function () {
      modal.hidden = true;
    }, 280);
  }

  document.querySelectorAll("[data-contact-modal]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openContactModal();
    });
  });

  window.WholesomeContactModal = {
    open: openContactModal,
    close: closeContactModal,
  };
})();
