// script.js
const norm = s => (s || "").normalize("NFC").trim();
const ul = document.getElementById("daftarKode");
const dataList = document.getElementById("kodeList");
const totalKode = document.getElementById("totalKode");

// Generate daftar kode
KODES.forEach(k => {
  const li = document.createElement("li");
  li.innerHTML = `<code>${k}</code>`;
  ul.appendChild(li);
  const opt = document.createElement("option");
  opt.value = k;
  dataList.appendChild(opt);
});
totalKode.textContent = KODES.length;

function coretKode(kode) {
  ul.querySelectorAll("li").forEach(li => {
    if (li.textContent.trim() === kode) {
      li.innerHTML = `<del><code>${kode}</code></del>`;
    }
  });
}

function cekKode() {
  const val = norm(document.getElementById("kodeInput").value);
  const hasil = document.getElementById("hasil");
  if (!val) {
    hasil.textContent = "Masukkan kode terlebih dahulu.";
    hasil.className = "result";
    return;
  }
  const cocok = KODES.includes(val);
  if (cocok) {
    hasil.innerHTML = `✅ <span class="ok">Cocok</span> — kode <code>${val}</code> ditemukan di daftar.`;
    coretKode(val);
  } else {
    const suggestion = KODES.filter(k => k.toLowerCase().startsWith(val.toLowerCase())).slice(0, 5);
    hasil.innerHTML = `❌ <span class="no">Tidak cocok</span> — kode <code>${val}</code> tidak ada di daftar.` +
      (suggestion.length ? `<br><span class="small">Mungkin maksud Anda:</span> <ul>${
        suggestion.map(s => `<li><code>${s}</code></li>`).join("")
      }</ul>` : "");
  }
}

document.getElementById("cekBtn").addEventListener("click", cekKode);
document.getElementById("kodeInput").addEventListener("keydown", e => { if (e.key === "Enter") cekKode(); });
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("kodeInput").value = "";
  document.getElementById("hasil").textContent = "";
  document.getElementById("kodeInput").focus();
});
