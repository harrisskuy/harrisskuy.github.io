function copyIP() {
  const ip = document.getElementById('server-ip');
  ip.select();
  ip.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('Server IP copied!');
}

window.addEventListener("DOMContentLoaded", () => {
  const status = document.querySelector(".status");
  setTimeout(() => {
    status.textContent = "Server Online: 127 players";
    status.style.color = "#00ff88";
  }, 1200);

  const mobileMenu = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  mobileMenu.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileMenu.classList.toggle("open");
  });
});
