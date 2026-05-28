(function () {
  const base = "Assets/Product%20Images/";
  const images = [];
  for (let i = 1; i <= 20; i += 1) {
    images.push({
      src: base + i + ".jpg",
      alt: "Wholesome Bakes product " + i,
    });
  }

  const slideshow = document.getElementById("product-slideshow");
  if (!slideshow || !images.length) return;

  const mainImg = document.getElementById("slideshow-current-img");
  const counterEl = document.getElementById("slideshow-index");
  const dockPrev = document.getElementById("dock-prev");
  const dockCurrent = document.getElementById("dock-current");
  const dockNext = document.getElementById("dock-next");
  const btnPrev = document.getElementById("slideshow-prev");
  const btnNext = document.getElementById("slideshow-next");

  let index = 0;
  let timer = null;
  const INTERVAL = 4500;

  function wrap(i) {
    return (i + images.length) % images.length;
  }

  function setDockThumb(button, imageIndex, label) {
    const thumb = button.querySelector(".dock-thumb");
    const img = thumb.querySelector("img");
    const labelEl = button.querySelector(".dock-label");
    img.src = images[imageIndex].src;
    img.alt = images[imageIndex].alt;
    labelEl.textContent = label;
    button.setAttribute("data-index", String(imageIndex));
  }

  function updateUI(animate) {
    const prevIdx = wrap(index - 1);
    const nextIdx = wrap(index + 1);

    if (animate) {
      mainImg.classList.add("is-fading");
      window.setTimeout(function () {
        mainImg.src = images[index].src;
        mainImg.alt = images[index].alt;
        mainImg.classList.remove("is-fading");
      }, 220);
    } else {
      mainImg.src = images[index].src;
      mainImg.alt = images[index].alt;
    }

    if (counterEl) {
      counterEl.textContent = String(index + 1);
    }

    setDockThumb(dockPrev, prevIdx, "Previous");
    setDockThumb(dockCurrent, index, "Now");
    setDockThumb(dockNext, nextIdx, "Next");
  }

  function goTo(i) {
    if (wrap(i) === index) return;
    index = wrap(i);
    updateUI(true);
    resetTimer();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function resetTimer() {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(next, INTERVAL);
  }

  function pauseTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  dockPrev.addEventListener("click", function () {
    goTo(Number(dockPrev.getAttribute("data-index")));
  });

  dockCurrent.addEventListener("click", function () {
    goTo(Number(dockCurrent.getAttribute("data-index")));
  });

  dockNext.addEventListener("click", function () {
    goTo(Number(dockNext.getAttribute("data-index")));
  });

  slideshow.addEventListener("mouseenter", pauseTimer);
  slideshow.addEventListener("mouseleave", resetTimer);

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  updateUI(false);
  resetTimer();
})();
