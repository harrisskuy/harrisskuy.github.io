/**
 * ============================================================
 *  config.js — Konfigurasi Trading Journal
 * ============================================================
 *  File ini berisi pengaturan dasar aplikasi. Pisahkan dari
 *  index.html supaya endpoint/URL backend mudah diganti tanpa
 *  menyentuh logika UI.
 *
 *  PENTING:
 *  - GAS_WEB_APP_URL harus diisi dengan URL hasil deploy
 *    Google Apps Script (lihat panduan di README / jawaban chat).
 *  - Karena ini murni frontend (statis), nilai di file ini akan
 *    terlihat oleh siapa pun yang membuka source halaman.
 *    JANGAN taruh API key rahasia berbahaya di sini — cukup URL
 *    Web App GAS, yang memang didesain untuk dipanggil publik
 *    (kontrol akses diatur lewat token sederhana di dalamnya).
 * ============================================================
 */

const CONFIG = {
  // URL Web App hasil deploy Google Apps Script (langkah deploy ada di panduan)
  // Contoh: "https://script.google.com/macros/s/AKfycb..../exec"
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID_ANDA/exec",

  // Token sederhana untuk memvalidasi request (harus sama persis dengan APP_TOKEN di Code.gs)
  APP_TOKEN: "ganti-dengan-token-rahasia-anda",

  // Nama sheet tujuan di dalam spreadsheet (tab)
  SHEET_NAME: "Journal",

  // Modal awal akun (dipakai untuk menghitung % pertumbuhan equity, opsional)
  INITIAL_BALANCE: 17000000,

  // Mata uang akun untuk format nominal
  ACCOUNT_CURRENCY: "IDR",

  // Pair default yang otomatis terpilih saat form dibuka
  DEFAULT_PAIR: "XAUUSD",

  // Daftar pair yang muncul di dropdown (bisa ditambah/kurangi bebas)
  PAIR_LIST: [
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "USDCHF",
    "AUDUSD",
    "NZDUSD",
    "USDCAD",
    "EURJPY",
    "GBPJPY",
    "BTCUSD",
  ],

  // Kategori setup / strategi
  STRATEGY_LIST: [
    "Breakout",
    "Scalping",
    "Trend Following",
    "Supply & Demand",
    "Reversal",
    "News Trading",
    "Range / Sideways",
  ],

  // Kondisi psikologi / emosi saat entry
  PSYCHOLOGY_LIST: [
    "Tenang & Disiplin",
    "Yakin (Sesuai Plan)",
    "FOMO",
    "Ragu-ragu",
    "Balas Dendam (Revenge Trade)",
    "Serakah",
    "Takut / Cemas",
  ],

  // Ukuran pip default per pair (dipakai untuk estimasi kalkulator pips)
  // Nilai ini estimasi umum; sesuaikan dengan broker Anda bila perlu.
  PIP_SIZE: {
    XAUUSD: 0.01,
    BTCUSD: 1,
    DEFAULT_JPY: 0.01,
    DEFAULT: 0.0001,
  },

  // Interval auto-refresh data dari Google Sheets (ms). Set 0 untuk mematikan.
  AUTO_REFRESH_INTERVAL: 60000,

  // Jumlah desimal untuk menampilkan nominal $
  CURRENCY_DECIMALS: 2,
};

// Jangan diubah — dipakai index.html untuk membaca konfigurasi di atas
if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
}
