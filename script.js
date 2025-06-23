function copyIP() {
  const ipInput = document.getElementById("server-ip");
  ipInput.select();
  ipInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(ipInput.value);
  alert("IP copied to clipboard!");
}

// Get server status using mcsrvstat.us
document.addEventListener("DOMContentLoaded", () => {
  fetch("https://api.mcsrvstat.us/2/play.norixcraft.net")
    .then(res => res.json())
    .then(data => {
      const statusDiv = document.getElementById("status");
      if (data.online) {
        statusDiv.textContent = `Server Online: ${data.players.online} Players`;
        statusDiv.style.color = "#00ff88";
      } else {
        statusDiv.textContent = "Server Offline";
        statusDiv.style.color = "#ff6666";
      }
    })
    .catch(() => {
      document.getElementById("status").textContent = "Unable to fetch server status.";
    });
});
