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
