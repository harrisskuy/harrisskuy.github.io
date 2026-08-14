/**
 * ============================================================
 *  script.js — Logika Trading Journal
 *  Membaca konfigurasi dari window.CONFIG (config.js)
 * ============================================================
 */

(function () {
  "use strict";

  // ---------- STATE ----------
  let trades = [];          // seluruh data trade (hasil GET dari Sheets)
  let editingId = null;     // id trade yang sedang diedit
  let currentOrderType = "BUY";

  // ---------- DOM SHORTCUTS ----------
  const $ = (id) => document.getElementById(id);

  const els = {
    form: $("journalForm"),
    datetime: $("f_datetime"),
    pair: $("f_pair"),
    pairCustom: $("f_pairCustom"),
    customPairWrap: $("customPairWrap"),
    lot: $("f_lot"),
    type: $("f_type"),
    entry: $("f_entry"),
    exit: $("f_exit"),
    sl: $("f_sl"),
    tp: $("f_tp"),
    pips: $("f_pips"),
    pnl: $("f_pnl"),
    strategy: $("f_strategy"),
    psychology: $("f_psychology"),
    screenshot: $("f_screenshot"),
    notes: $("f_notes"),
    submitBtn: $("submitBtn"),
    submitBtnText: $("submitBtnText"),

    tableBody: $("tableBody"),
    emptyState: $("emptyState"),
    rowCountBadge: $("rowCountBadge"),

    searchInput: $("searchInput"),
    filterPair: $("filterPair"),
    filterType: $("filterType"),
    filterDate: $("filterDate"),

    syncDot: $("syncDot"),
    syncText: $("syncText"),
    syncDotMobile: $("syncDotMobile"),
    syncTextMobile: $("syncTextMobile"),
    refreshBtn: $("refreshBtn"),

    toastContainer: $("toastContainer"),

    editModal: $("editModal"),
    closeModalBtn: $("closeModalBtn"),
    editPnl: $("edit_pnl"),
    editNotes: $("edit_notes"),
    saveEditBtn: $("saveEditBtn"),

    metricNetPL: $("metricNetPL"),
    metricNetPLSub: $("metricNetPLSub"),
    metricWinRate: $("metricWinRate"),
    metricWinRateSub: $("metricWinRateSub"),
    metricPF: $("metricPF"),
    metricPFSub: $("metricPFSub"),
    metricAvgWin: $("metricAvgWin"),
    metricAvgLoss: $("metricAvgLoss"),
  };

  // ---------- INIT ----------
  function init() {
    populateSelect(els.pair, window.CONFIG.PAIR_LIST, window.CONFIG.DEFAULT_PAIR, true);
    populateSelect(els.strategy, window.CONFIG.STRATEGY_LIST);
    populateSelect(els.psychology, window.CONFIG.PSYCHOLOGY_LIST);
    populateFilterPair();

    // default datetime = sekarang
    els.datetime.value = toLocalDatetimeInputValue(new Date());

    bindEvents();
    lucide.createIcons();
    renderTable();
    renderMetrics();

    loadFromSheet();

    if (window.CONFIG.AUTO_REFRESH_INTERVAL > 0) {
      setInterval(loadFromSheet, window.CONFIG.AUTO_REFRESH_INTERVAL);
    }
  }

  function populateSelect(selectEl, list, defaultValue, withCustomOption) {
    selectEl.innerHTML = "";
    list.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      selectEl.appendChild(opt);
    });
    if (withCustomOption) {
      const opt = document.createElement("option");
      opt.value = "CUSTOM";
      opt.textContent = "+ Custom...";
      selectEl.appendChild(opt);
    }
    if (defaultValue) selectEl.value = defaultValue;
  }

  function populateFilterPair() {
    window.CONFIG.PAIR_LIST.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      els.filterPair.appendChild(opt);
    });
  }

  function toLocalDatetimeInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // ---------- EVENTS ----------
  function bindEvents() {
    document.querySelectorAll(".order-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => setOrderType(btn.dataset.type));
    });

    els.pair.addEventListener("change", () => {
      els.customPairWrap.classList.toggle("hidden", els.pair.value !== "CUSTOM");
      calculatePips();
    });

    [els.entry, els.exit].forEach((el) => el.addEventListener("input", calculatePips));

    els.form.addEventListener("submit", handleSubmit);

    els.refreshBtn.addEventListener("click", () => loadFromSheet(true));

    [els.searchInput, els.filterPair, els.filterType, els.filterDate].forEach((el) => {
      el.addEventListener("input", renderTable);
      el.addEventListener("change", renderTable);
    });

    els.closeModalBtn.addEventListener("click", closeEditModal);
    els.editModal.addEventListener("click", (e) => {
      if (e.target === els.editModal) closeEditModal();
    });
    els.saveEditBtn.addEventListener("click", saveEdit);
  }

  function setOrderType(type) {
    currentOrderType = type;
    els.type.value = type;
    document.querySelectorAll(".order-type-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });
    calculatePips();
  }

  // ---------- PIPS CALCULATION ----------
  function getPipSize(pairName) {
    const table = window.CONFIG.PIP_SIZE;
    if (table[pairName]) return table[pairName];
    if (pairName && pairName.includes("JPY")) return table.DEFAULT_JPY;
    return table.DEFAULT;
  }

  function calculatePips() {
    const entry = parseFloat(els.entry.value);
    const exit = parseFloat(els.exit.value);
    if (isNaN(entry) || isNaN(exit)) {
      els.pips.value = "";
      return;
    }
    const pairName = getActivePairName();
    const pipSize = getPipSize(pairName);
    let diff = exit - entry;
    if (currentOrderType === "SELL") diff = -diff;
    const pips = diff / pipSize;
    els.pips.value = pips.toFixed(1);
  }

  function getActivePairName() {
    if (els.pair.value === "CUSTOM") {
      return (els.pairCustom.value || "").toUpperCase().trim();
    }
    return els.pair.value;
  }

  // ---------- VALIDATION ----------
  function validateForm() {
    let valid = true;
    const rules = [
      { el: els.datetime, ok: !!els.datetime.value },
      { el: els.lot, ok: parseFloat(els.lot.value) > 0 },
      { el: els.entry, ok: els.entry.value !== "" && !isNaN(parseFloat(els.entry.value)) },
      { el: els.exit, ok: els.exit.value !== "" && !isNaN(parseFloat(els.exit.value)) },
      { el: els.pnl, ok: els.pnl.value !== "" && !isNaN(parseFloat(els.pnl.value)) },
    ];

    if (els.pair.value === "CUSTOM" && !els.pairCustom.value.trim()) {
      markError(els.pairCustom, true);
      valid = false;
    } else {
      markError(els.pairCustom, false);
    }

    rules.forEach(({ el, ok }) => {
      markError(el, !ok);
      if (!ok) valid = false;
    });

    return valid;
  }

  function markError(el, isError) {
    el.classList.toggle("error", isError);
    const msg = el.parentElement.querySelector(".err-msg");
    if (msg) msg.classList.toggle("hidden", !isError);
  }

  // ---------- SUBMIT (POST ke Google Sheets) ----------
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Periksa kembali field yang wajib diisi.", "error");
      return;
    }

    const pairName = getActivePairName();
    const payload = {
      token: window.CONFIG.APP_TOKEN,
      id: "trd_" + Date.now(),
      datetime: els.datetime.value,
      pair: pairName,
      type: els.type.value,
      lot: parseFloat(els.lot.value),
      entry: parseFloat(els.entry.value),
      exit: parseFloat(els.exit.value),
      sl: els.sl.value ? parseFloat(els.sl.value) : "",
      tp: els.tp.value ? parseFloat(els.tp.value) : "",
      pips: parseFloat(els.pips.value) || 0,
      pnl: parseFloat(els.pnl.value),
      strategy: els.strategy.value,
      psychology: els.psychology.value,
      screenshot: els.screenshot.value || "",
      notes: els.notes.value || "",
    };

    setSubmitting(true);
    setSyncStatus("saving", "Menyimpan ke Spreadsheet...");

    try {
      await postToSheet(payload);
      trades.unshift(payload);
      renderTable();
      renderMetrics();
      resetForm();
      showToast("Trade berhasil disimpan.", "success");
      setSyncStatus("success", "Berhasil disinkronkan");
    } catch (err) {
      console.error(err);
      // Fallback: tetap simpan secara lokal agar data tidak hilang dari tampilan
      trades.unshift(payload);
      renderTable();
      renderMetrics();
      resetForm();
      showToast("Gagal menyimpan ke Spreadsheet. Data ditampilkan lokal — cek koneksi/URL config.js.", "error");
      setSyncStatus("error", "Gagal sinkronisasi");
    } finally {
      setSubmitting(false);
    }
  }

  function setSubmitting(isSubmitting) {
    els.submitBtn.disabled = isSubmitting;
    els.submitBtn.classList.toggle("opacity-60", isSubmitting);
    els.submitBtn.classList.toggle("cursor-not-allowed", isSubmitting);
    els.submitBtnText.textContent = isSubmitting ? "Menyimpan..." : "Simpan ke Spreadsheet";
  }

  function resetForm() {
    els.form.reset();
    els.datetime.value = toLocalDatetimeInputValue(new Date());
    els.pair.value = window.CONFIG.DEFAULT_PAIR;
    els.customPairWrap.classList.add("hidden");
    els.pips.value = "";
    setOrderType("BUY");
    document.querySelectorAll(".input-field").forEach((el) => markError(el, false));
  }

  // ---------- GOOGLE APPS SCRIPT: POST ----------
  async function postToSheet(payload) {
    if (!window.CONFIG.GAS_WEB_APP_URL || window.CONFIG.GAS_WEB_APP_URL.includes("GANTI_DENGAN")) {
      throw new Error("GAS_WEB_APP_URL belum dikonfigurasi di config.js");
    }
    const res = await fetch(window.CONFIG.GAS_WEB_APP_URL, {
      method: "POST",
      // text/plain menghindari CORS preflight pada Google Apps Script Web App
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "create", data: payload }),
    });
    const json = await res.json();
    if (!json || json.status !== "success") {
      throw new Error((json && json.message) || "Response GAS tidak valid");
    }
    return json;
  }

  // ---------- GOOGLE APPS SCRIPT: GET ----------
  async function loadFromSheet(isManual) {
    if (!window.CONFIG.GAS_WEB_APP_URL || window.CONFIG.GAS_WEB_APP_URL.includes("GANTI_DENGAN")) {
      setSyncStatus("idle", "Belum tersambung (isi config.js)");
      return;
    }
    setSyncStatus("saving", isManual ? "Memuat ulang..." : "Menyinkronkan...");
    try {
      const url = `${window.CONFIG.GAS_WEB_APP_URL}?action=list&token=${encodeURIComponent(window.CONFIG.APP_TOKEN)}`;
      const res = await fetch(url, { method: "GET" });
      const json = await res.json();
      if (!json || json.status !== "success") {
        throw new Error((json && json.message) || "Response GAS tidak valid");
      }
      trades = Array.isArray(json.data) ? json.data : [];
      renderTable();
      renderMetrics();
      setSyncStatus("success", "Berhasil disinkronkan");
    } catch (err) {
      console.error(err);
      setSyncStatus("error", "Gagal memuat data");
      if (isManual) showToast("Gagal memuat data dari Spreadsheet.", "error");
    }
  }

  // ---------- DELETE (opsional kirim ke sheet) ----------
  async function deleteTrade(id) {
    if (!confirm("Hapus transaksi ini? Tindakan tidak dapat dibatalkan.")) return;

    trades = trades.filter((t) => t.id !== id);
    renderTable();
    renderMetrics();

    if (window.CONFIG.GAS_WEB_APP_URL && !window.CONFIG.GAS_WEB_APP_URL.includes("GANTI_DENGAN")) {
      try {
        await fetch(window.CONFIG.GAS_WEB_APP_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "delete", token: window.CONFIG.APP_TOKEN, id }),
        });
        showToast("Transaksi dihapus.", "success");
      } catch (err) {
        console.error(err);
        showToast("Dihapus secara lokal, namun gagal sinkron hapus ke Spreadsheet.", "error");
      }
    }
  }

  // ---------- EDIT ----------
  function openEditModal(id) {
    const trade = trades.find((t) => t.id === id);
    if (!trade) return;
    editingId = id;
    els.editPnl.value = trade.pnl;
    els.editNotes.value = trade.notes || "";
    els.editModal.classList.remove("hidden");
    els.editModal.classList.add("flex");
  }

  function closeEditModal() {
    editingId = null;
    els.editModal.classList.add("hidden");
    els.editModal.classList.remove("flex");
  }

  async function saveEdit() {
    if (!editingId) return;
    const trade = trades.find((t) => t.id === editingId);
    if (!trade) return;

    const newPnl = parseFloat(els.editPnl.value);
    if (isNaN(newPnl)) {
      showToast("Nominal P/L tidak valid.", "error");
      return;
    }
    trade.pnl = newPnl;
    trade.notes = els.editNotes.value;

    renderTable();
    renderMetrics();
    closeEditModal();

    if (window.CONFIG.GAS_WEB_APP_URL && !window.CONFIG.GAS_WEB_APP_URL.includes("GANTI_DENGAN")) {
      try {
        await fetch(window.CONFIG.GAS_WEB_APP_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "update", token: window.CONFIG.APP_TOKEN, id: trade.id, data: trade }),
        });
        showToast("Perubahan disimpan.", "success");
      } catch (err) {
        console.error(err);
        showToast("Diubah secara lokal, namun gagal sinkron ke Spreadsheet.", "error");
      }
    } else {
      showToast("Perubahan disimpan (lokal).", "success");
    }
  }

  // ---------- RENDER TABLE ----------
  function getFilteredTrades() {
    const search = els.searchInput.value.trim().toLowerCase();
    const pairFilter = els.filterPair.value;
    const typeFilter = els.filterType.value;
    const dateFilter = els.filterDate.value;

    return trades.filter((t) => {
      if (pairFilter && t.pair !== pairFilter) return false;
      if (typeFilter && t.type !== typeFilter) return false;
      if (dateFilter && !String(t.datetime).startsWith(dateFilter)) return false;
      if (search) {
        const haystack = `${t.pair} ${t.strategy} ${t.psychology} ${t.notes || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  function renderTable() {
    const filtered = getFilteredTrades().slice().sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    els.tableBody.innerHTML = "";
    els.rowCountBadge.textContent = `${filtered.length} trade`;

    if (filtered.length === 0) {
      els.emptyState.classList.remove("hidden");
      els.emptyState.classList.add("flex");
      lucide.createIcons();
      return;
    }
    els.emptyState.classList.add("hidden");
    els.emptyState.classList.remove("flex");

    const frag = document.createDocumentFragment();
    filtered.forEach((t) => {
      const isProfit = parseFloat(t.pnl) >= 0;
      const tr = document.createElement("tr");
      tr.className = "hover:bg-white/[0.03] transition";
      tr.innerHTML = `
        <td class="px-3 py-2.5 whitespace-nowrap text-slate-300">${formatDateShort(t.datetime)}</td>
        <td class="px-3 py-2.5 font-semibold text-white">${escapeHtml(t.pair)}</td>
        <td class="px-3 py-2.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${t.type === "BUY" ? "badge-buy" : "badge-sell"}">${t.type}</span>
        </td>
        <td class="px-3 py-2.5 text-right num text-slate-300">${Number(t.lot).toFixed(2)}</td>
        <td class="px-3 py-2.5 text-right num text-slate-300">${formatPrice(t.entry)}</td>
        <td class="px-3 py-2.5 text-right num text-slate-300">${formatPrice(t.exit)}</td>
        <td class="px-3 py-2.5 text-right num ${isProfit ? "text-profit" : "text-loss"}">${Number(t.pips || 0).toFixed(1)}</td>
        <td class="px-3 py-2.5 text-right num font-bold ${isProfit ? "text-profit" : "text-loss"}">
          ${isProfit ? "+" : ""}${formatCurrency(t.pnl)}
        </td>
        <td class="px-3 py-2.5 text-slate-400">${escapeHtml(t.strategy || "-")}</td>
        <td class="px-3 py-2.5 text-slate-400">${escapeHtml(t.psychology || "-")}</td>
        <td class="px-3 py-2.5 text-center">
          ${t.screenshot ? `<a href="${escapeAttr(t.screenshot)}" target="_blank" rel="noopener" class="text-accent hover:underline"><i data-lucide="image" class="w-4 h-4 inline"></i></a>` : `<span class="text-slate-700">—</span>`}
        </td>
        <td class="px-3 py-2.5">
          <div class="flex items-center justify-center gap-2">
            <button class="edit-btn text-slate-400 hover:text-accent transition" data-id="${t.id}" title="Edit">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button class="delete-btn text-slate-400 hover:text-loss transition" data-id="${t.id}" title="Hapus">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      `;
      frag.appendChild(tr);
    });
    els.tableBody.appendChild(frag);
    lucide.createIcons();

    els.tableBody.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    els.tableBody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteTrade(btn.dataset.id));
    });
  }

  // ---------- RENDER METRICS ----------
  function renderMetrics() {
    const total = trades.length;
    const wins = trades.filter((t) => parseFloat(t.pnl) > 0);
    const losses = trades.filter((t) => parseFloat(t.pnl) < 0);

    const netPL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    const grossProfit = wins.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.pnl), 0));

    const winRate = total > 0 ? (wins.length / total) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    els.metricNetPL.textContent = `${netPL >= 0 ? "+" : ""}${formatCurrency(netPL)}`;
    els.metricNetPL.className = `num text-xl sm:text-2xl font-bold ${netPL >= 0 ? "text-profit" : "text-loss"}`;
    const balance = window.CONFIG.INITIAL_BALANCE || 0;
    els.metricNetPLSub.textContent = `dari modal ${formatCurrency(balance)}`;

    els.metricWinRate.textContent = `${winRate.toFixed(1)}%`;
    els.metricWinRateSub.textContent = `${wins.length} win / ${losses.length} loss`;

    els.metricPF.textContent = profitFactor === Infinity ? "∞" : profitFactor.toFixed(2);
    els.metricPFSub.textContent = `${total} total trade`;

    els.metricAvgWin.textContent = `+${formatCurrency(avgWin)}`;
    els.metricAvgLoss.textContent = `-${formatCurrency(avgLoss)}`;
  }

  // ---------- SYNC STATUS INDICATOR ----------
  function setSyncStatus(state, text) {
    const colors = {
      idle: "bg-slate-500",
      saving: "bg-accent status-dot",
      success: "bg-profit",
      error: "bg-loss",
    };
    [els.syncDot, els.syncDotMobile].forEach((dot) => {
      dot.className = `w-2 h-2 rounded-full ${colors[state] || colors.idle}`;
    });
    els.syncText.textContent = text;
    els.syncTextMobile.textContent = text;
  }

  // ---------- TOAST ----------
  function showToast(message, type) {
    const colors = {
      success: "border-profit/40 text-profit",
      error: "border-loss/40 text-loss",
    };
    const icons = { success: "check-circle-2", error: "alert-circle" };

    const toast = document.createElement("div");
    toast.className = `glass border ${colors[type] || "border-white/10 text-slate-200"} rounded-lg px-4 py-3 text-sm flex items-center gap-2 fade-in shadow-xl`;
    toast.innerHTML = `<i data-lucide="${icons[type] || "info"}" class="w-4 h-4 shrink-0"></i><span>${escapeHtml(message)}</span>`;
    els.toastContainer.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity .3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---------- UTILS ----------
  function formatCurrency(value) {
    const n = Number(value) || 0;
    const decimals = window.CONFIG.CURRENCY_DECIMALS ?? 2;
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }

  function formatPrice(value) {
    const n = Number(value);
    if (isNaN(n)) return "-";
    return n.toString();
  }

  function formatDateShort(datetimeStr) {
    const d = new Date(datetimeStr);
    if (isNaN(d.getTime())) return String(datetimeStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str ?? "").replace(/"/g, "&quot;");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
