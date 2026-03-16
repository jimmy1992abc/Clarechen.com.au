(function markActiveNav(){
  const path = location.pathname.replace(/\/+$/, "/");

  document.querySelectorAll(".toolbar a.tool-pill").forEach(a => {
    const href = new URL(a.getAttribute("href"), location.origin).pathname.replace(/\/+$/, "/");
    if (href === path) a.classList.add("active");
  });
})();
