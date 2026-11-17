(function () {
  const root = document.querySelector("[data-events-carousel]");
  if (!root) return;

  const viewport = root.querySelector("[data-carousel-viewport]");
  const track = root.querySelector("[data-carousel-track]");
  const slides = Array.prototype.slice.call(
    root.querySelectorAll("[data-carousel-slide]")
  );
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const statusEl = root.querySelector("[data-carousel-status]");

  if (!viewport || !track || !slides.length) return;

  let index = 0;
  let autoplayId = null;
  let pointerId = null;
  let startX = 0;
  let deltaX = 0;
  let isDragging = false;
  const AUTOPLAY_MS = 7000;

  slides.forEach(function (slide, i) {
    slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    slide.setAttribute("aria-label", "Photo " + (i + 1) + " of " + slides.length);
  });

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach(function (_slide, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "events-carousel-dot" + (i === 0 ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", "Show photo " + (i + 1));
      btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
      btn.addEventListener("click", function () {
        goTo(i, true);
      });
      dotsWrap.appendChild(btn);
    });
  }

  function updateStatus() {
    if (!statusEl) return;
    statusEl.textContent =
      "Showing photo " + (index + 1) + " of " + slides.length;
  }

  function updateUI() {
    track.style.transform = "translateX(-" + index * 100 + "%)";
    slides.forEach(function (slide, i) {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
        const active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });
    }
    updateStatus();
  }

  function goTo(nextIndex, userInitiated) {
    const total = slides.length;
    index = ((nextIndex % total) + total) % total;
    updateUI();
    if (userInitiated) restartAutoplay();
  }

  function next(userInitiated) {
    goTo(index + 1, userInitiated);
  }

  function prev(userInitiated) {
    goTo(index - 1, userInitiated);
  }

  function stopAutoplay() {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    autoplayId = window.setInterval(function () {
      next(false);
    }, AUTOPLAY_MS);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      prev(true);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      next(true);
    });
  }

  viewport.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next(true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev(true);
    }
  });

  root.addEventListener("keydown", function (e) {
    if (e.target !== root && e.target !== viewport) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next(true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev(true);
    }
  });

  viewport.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    deltaX = 0;
    isDragging = true;
    viewport.setPointerCapture(pointerId);
    stopAutoplay();
  });

  viewport.addEventListener("pointermove", function (e) {
    if (!isDragging || e.pointerId !== pointerId) return;
    deltaX = e.clientX - startX;
  });

  function endDrag(e) {
    if (!isDragging || e.pointerId !== pointerId) return;
    isDragging = false;
    const threshold = Math.min(80, viewport.clientWidth * 0.18);
    if (deltaX <= -threshold) next(true);
    else if (deltaX >= threshold) prev(true);
    else restartAutoplay();
    pointerId = null;
    deltaX = 0;
  }

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", function (e) {
    if (!root.contains(e.relatedTarget)) startAutoplay();
  });

  buildDots();
  updateUI();
  startAutoplay();
})();
