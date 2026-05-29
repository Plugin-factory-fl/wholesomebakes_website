(function () {
  const toggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");

  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== toggle
      ) {
        sidebar.classList.remove("open");
      }
    });
  }

  const glutenTerms = document.querySelectorAll(".gluten-friendly-term");
  if (glutenTerms.length) {
    let toastEl = document.getElementById("gluten-toast");
    let hideTimer = null;

    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "gluten-toast";
      toastEl.className = "toast toast--anchored";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.hidden = true;
      toastEl.innerHTML =
        "<p><strong>What is Gluten Friendly?</strong></p>" +
        "<p>Our baked goods are made with care for those avoiding gluten — using thoughtful ingredient choices and kitchen practices designed to keep gluten levels as low as possible while still delivering the flavor and texture you love.</p>" +
        '<button type="button" class="toast-close" aria-label="Close">×</button>';
      document.body.appendChild(toastEl);

      toastEl.querySelector(".toast-close").addEventListener("click", function () {
        hideGlutenToast();
      });
    }

    function positionToast(anchor) {
      const rect = anchor.getBoundingClientRect();
      const margin = 12;
      let top = rect.bottom + margin;
      const left = rect.left + rect.width / 2;

      toastEl.style.position = "fixed";
      toastEl.style.top = top + "px";
      toastEl.style.left = left + "px";
      toastEl.style.bottom = "auto";
      toastEl.style.transform = "translateX(-50%)";

      const toastHeight = toastEl.offsetHeight || 160;
      if (top + toastHeight > window.innerHeight - 16) {
        top = rect.top - toastHeight - margin;
        toastEl.style.top = Math.max(16, top) + "px";
      }
    }

    function hideGlutenToast() {
      toastEl.classList.remove("is-visible");
      if (hideTimer) window.clearTimeout(hideTimer);
      window.setTimeout(function () {
        toastEl.hidden = true;
        toastEl.style.visibility = "";
        toastEl.style.opacity = "";
      }, 300);
    }

    function showGlutenToast(anchor) {
      toastEl.hidden = false;
      toastEl.classList.remove("is-visible");
      toastEl.style.visibility = "hidden";
      toastEl.style.opacity = "0";
      positionToast(anchor);
      requestAnimationFrame(function () {
        positionToast(anchor);
        toastEl.style.visibility = "";
        toastEl.style.opacity = "";
        toastEl.classList.add("is-visible");
      });
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideGlutenToast, 8000);
    }

    glutenTerms.forEach(function (btn) {
      btn.addEventListener("click", function () {
        showGlutenToast(btn);
      });
    });

    window.addEventListener(
      "resize",
      function () {
        if (toastEl.classList.contains("is-visible") && !toastEl.hidden) {
          const active = document.activeElement;
          if (active && active.classList.contains("gluten-friendly-term")) {
            positionToast(active);
          }
        }
      },
      { passive: true }
    );
  }

  const animated = document.querySelectorAll(".animate-in");
  if (!animated.length) return;

  const show = function (el) {
    el.classList.add("visible");
  };

  if (!("IntersectionObserver" in window)) {
    animated.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  animated.forEach(function (el) {
    observer.observe(el);
  });

  document.querySelectorAll(".hero .animate-in").forEach(show);
})();
