function copyIP() {
  const ip = document.getElementById('server-ip');
  ip.select();
  ip.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('Server IP copied!');
}

window.addEventListener("DOMContentLoaded", () => {
  const status = document.querySelector(".status");
  // Simulasi status (bisa ganti pakai API mcsrvstat.us nanti)
  setTimeout(() => {
    status.textContent = "Server Online: 127 players";
    status.style.color = "#00ff88";
  }, 1200);
});
