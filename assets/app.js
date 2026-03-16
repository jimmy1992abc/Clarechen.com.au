(function markActiveNav(){
  const path = location.pathname.replace(/\/+$/, "/"); // normalize trailing slash
  document.querySelectorAll(".toolbar a.tool-item").forEach(a => {
    const href = new URL(a.getAttribute("href"), location.origin).pathname.replace(/\/+$/, "/");
    if (href === path) a.classList.add("active");
  });
})();
