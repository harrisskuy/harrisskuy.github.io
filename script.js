function copyIP() {
  const ip = document.getElementById("server-ip");
  navigator.clipboard.writeText(ip.value);
  alert("Server IP copied to clipboard!");
}

// Get server status
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  fetch("https://api.mcsrvstat.us/2/play.norixcraft.net")
    .then(res => res.json())
    .then(data => {
      if (data.online) {
        status.textContent = `🟢 Online: ${data.players.online} players`;
      } else {
        status.textContent = "🔴 Server Offline";
      }
    })
    .catch(() => {
      status.textContent = "⚠️ Failed to fetch server status";
    });
});
