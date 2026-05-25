/**
 * ==========================================================================
 * ENTERPRISE ATTENDANCE ENGINE (VANILLA JS MODULE)
 * ==========================================================================
 */

// 1. TELEGRAM CONFIGURATION
const BOT_TOKEN = "ISI_BOT_TOKEN"; // Ganti dengan Token Bot Telegram Anda
const CHAT_ID = "ISI_CHAT_ID";     // Ganti dengan Chat ID Telegram Anda

// 2. STATE APP VARIABLES
let userCoordinates = null;
let attendanceCooldown = false;

// 3. DOM ELEMENTS ELEMENT RESOLVER
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const networkStatus = document.getElementById('network-status');
const toastContainer = document.getElementById('toast-container');

const liveClock = document.getElementById('live-clock');
const liveDate = document.getElementById('live-date');
const dashGreeting = document.getElementById('dash-greeting');
const dashUsername = document.getElementById('dash-username');
const dashUserInfo = document.getElementById('dash-userinfo');

const locationWidget = document.getElementById('location-widget');
const locTitle = document.getElementById('loc-status-title');
const locDesc = document.getElementById('loc-status-desc');

const btnAbsenMasuk = document.getElementById('btn-absen-masuk');
const btnAbsenPulang = document.getElementById('btn-absen-pulang');
const btnLogout = document.getElementById('btn-logout');
const historyList = document.getElementById('history-list');

// ==========================================================================
// CORE WORKFLOW & INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initRealtimeClock();
    checkAppSession();
    initNetworkMonitor();
});

// Memeriksa status login tersimpan
function checkAppSession() {
    const session = localStorage.getItem('emp_session');
    if (session) {
        const userData = JSON.parse(session);
        showDashboard(userData);
    } else {
        showAuth();
    }
}

function showAuth() {
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
}

function showDashboard(userData) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    
    dashUsername.textContent = sanitizeInput(userData.name);
    dashUserInfo.innerHTML = `<i class="fas fa-id-badge"></i> ID: ${sanitizeInput(userData.id)} | <i class="fas fa-building"></i> ${sanitizeInput(userData.division)}`;
    
    // Trigger pemindaian koordinat GPS saat dashboard dibuka
    requestGPSLocation();
    renderTodayHistory();
}

// ==========================================================================
// FORM LOGIN HANDLING
// ==========================================================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('emp-name').value.trim();
    const idInput = document.getElementById('emp-id').value.trim();
    const divisionInput = document.getElementById('emp-division').value;
    
    // Form validation
    if (!nameInput || !idInput || !divisionInput) {
        showToast("Semua kolom form wajib diisi lengkap!", "warning");
        return;
    }
    
    const sessionData = {
        name: nameInput,
        id: idInput,
        division: divisionInput
    };
    
    localStorage.setItem('emp_session', JSON.stringify(sessionData));
    showToast(`Selamat datang kembali, ${nameInput}!`, "success");
    showDashboard(sessionData);
});

btnLogout.addEventListener('click', () => {
    if(confirm("Apakah Anda yakin ingin keluar dari sesi aplikasi?")) {
        localStorage.removeItem('emp_session');
        localStorage.removeItem('today_attendance');
        showToast("Anda telah keluar dari aplikasi.", "info");
        showAuth();
    }
});

// ==========================================================================
// REALTIME LIVE CLOCK & GREETING ENGINE
// ==========================================================================
function initRealtimeClock() {
    const updateTime = () => {
        const now = new Date();
        
        // Formatter Jam
        liveClock.textContent = now.toLocaleTimeString('id-ID', { 
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
        
        // Formatter Tanggal Indonesia
        liveDate.textContent = now.toLocaleDateString('id-ID', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });
        
        // Dinamis Greeting Jam Kerja
        const hours = now.getHours();
        if (hours >= 5 && hours < 11) dashGreeting.textContent = "Selamat Pagi, 👋";
        else if (hours >= 11 && hours < 15) dashGreeting.textContent = "Selamat Siang, ☀️";
        else if (hours >= 15 && hours < 18) dashGreeting.textContent = "Selamat Sore, ☕";
        else dashGreeting.textContent = "Selamat Malam, 🌙";
    };
    
    updateTime();
    setInterval(updateTime, 1000);
}

// ==========================================================================
// HARDWARE GPS TRACKING ACCELERATION
// ==========================================================================
function requestGPSLocation() {
    if (!"geolocation" in navigator) {
        updateLocationWidget("error", "GPS Tidak Didukung", "Browser Anda tidak memiliki modul GPS.");
        return;
    }
    
    updateLocationWidget("pending", "Meminta Akses GPS...", "Mengunci koordinat satelit akurat.");
    
    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userCoordinates = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            updateLocationWidget("success", "Lokasi GPS Terkunci", `Akurasi tinggi (${Math.round(position.coords.accuracy)} meter)`);
            
            // Aktifkan tombol absensi apabila koordinat sukses didapatkan
            btnAbsenMasuk.disabled = false;
            btnAbsenPulang.disabled = false;
        },
        (error) => {
            console.error(error);
            let errMsg = "Gagal memuat koordinat.";
            if (error.code === 1) errMsg = "Akses GPS ditolak. Izinkan lokasi di pengaturan browser.";
            else if (error.code === 2) errMsg = "Sinyal GPS lemah tidak terdeteksi.";
            
            updateLocationWidget("error", "GPS Gagal Terbaca", errMsg);
            showToast(errMsg, "error");
        },
        geoOptions
    );
}

function updateLocationWidget(status, title, desc) {
    locationWidget.className = `location-widget status-${status}`;
    locTitle.textContent = title;
    locDesc.textContent = desc;
    
    const icon = locationWidget.querySelector('.loc-icon i');
    if (status === 'success') icon.className = "fas fa-check-circle";
    else if (status === 'error') icon.className = "fas fa-exclamation-triangle";
    else icon.className = "fas fa-map-marker-alt animated-bounce";
}

// ==========================================================================
// CORE ATTENDANCE ACTION HANDLING (API EXECUTION)
// ==========================================================================
async function executeAttendance(type) {
    if (!navigator.onLine) {
        showToast("Gagal melakukan absensi. Koneksi internet terputus!", "error");
        return;
    }
    
    if (!userCoordinates) {
        showToast("Koordinat lokasi kosong. Harap refresh halaman dan aktifkan GPS.", "error");
        return;
    }
    
    if (attendanceCooldown) {
        showToast("Harap tunggu beberapa saat sebelum mengirim data lagi.", "warning");
        return;
    }
    
    // Lock State / Disable spamming clicks
    setLoadingState(true);
    attendanceCooldown = true;
    
    const session = JSON.parse(localStorage.getItem('emp_session'));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const deviceStr = parseBrowserAgent();
    
    // Create professional Telegram Text Layout
    const message = `━━━━━━━ ABSENSI KARYAWAN ━━━━━━━\n` +
                    `👤 Nama: ${session.name}\n` +
                    `🆔 ID: ${session.id}\n` +
                    `🏢 Divisi: ${session.division}\n` +
                    `📌 Status: Absen ${type}\n` +
                    `🕒 Jam: ${timeStr} WIB\n` +
                    `📅 Tanggal: ${dateStr}\n` +
                    `📍 Lokasi: ${userCoordinates.lat}, ${userCoordinates.lon}\n` +
                    `🌍 Maps:\nhttps://maps.google.com/?q=${userCoordinates.lat},${userCoordinates.lon}\n` +
                    `💻 Device: ${deviceStr}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━`;
                    
    const endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const resData = await response.json();
        
        if (resData.ok) {
            showToast(`Absen ${type} Berhasil Terkirim!`, "success");
            saveAttendanceHistory(type, timeStr, dateStr);
        } else {
            throw new Error(resData.description || "Gagal mengirim ke Telegram API");
        }
    } catch (err) {
        console.error(err);
        showToast(`Sistem Error: ${err.message}`, "error");
    } finally {
        setLoadingState(false);
        // Cooldown timer 5 detik untuk anti-spam submit
        setTimeout(() => { attendanceCooldown = false; }, 5000);
    }
}

// Bind Button Action
btnAbsenMasuk.addEventListener('click', () => executeAttendance('Masuk'));
btnAbsenPulang.addEventListener('click', () => executeAttendance('Pulang'));

function setLoadingState(isLoading) {
    if (isLoading) {
        btnAbsenMasuk.setAttribute('disabled', 'true');
        btnAbsenPulang.setAttribute('disabled', 'true');
        btnAbsenMasuk.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
    } else {
        btnAbsenMasuk.removeAttribute('disabled');
        btnAbsenPulang.removeAttribute('disabled');
        btnAbsenMasuk.innerHTML = `<i class="fas fa-sign-in-alt"></i> <span>Absen Masuk</span>`;
        btnAbsenPulang.innerHTML = `<i class="fas fa-sign-out-alt"></i> <span>Absen Pulang</span>`;
    }
}

// ==========================================================================
// LOCAL STORAGE DATA REPOSITORIES (HISTORY)
// ==========================================================================
function saveAttendanceHistory(type, time, date) {
    let history = JSON.parse(localStorage.getItem('today_attendance')) || [];
    history.unshift({ type, time, date }); // Tambahkan di baris paling atas
    localStorage.setItem('today_attendance', JSON.stringify(history));
    renderTodayHistory();
}

function renderTodayHistory() {
    const history = JSON.parse(localStorage.getItem('today_attendance')) || [];
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-day"></i>
                <p>Belum ada riwayat absensi untuk hari ini.</p>
            </div>`;
        return;
    }
    
    historyList.innerHTML = "";
    history.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.innerHTML = `
            <div class="hist-left">
                <span class="badge badge-${item.type.toLowerCase()}">Absen ${item.type}</span>
                <div>
                    <div class="hist-time">${item.time} WIB</div>
                    <div class="hist-date">${item.date}</div>
                </div>
            </div>
            <i class="fas fa-check-circle" style="color: var(--color-success)"></i>
        `;
        historyList.appendChild(itemEl);
    });
}

// ==========================================================================
// NETWORK & HARDWARE DEVICE MONITORING UTILS
// ==========================================================================
function initNetworkMonitor() {
    const changeStatus = () => {
        if (navigator.onLine) {
            networkStatus.className = "network-status online show";
            networkStatus.querySelector('span').textContent = "Terhubung ke Internet";
            setTimeout(() => networkStatus.classList.remove('show'), 3000);
        } else {
            networkStatus.className = "network-status offline show";
            networkStatus.querySelector('span').textContent = "Koneksi Internet Terputus!";
        }
    };
    
    window.addEventListener('online', changeStatus);
    window.addEventListener('offline', changeStatus);
}

function parseBrowserAgent() {
    const ua = navigator.userAgent;
    let bName = "Unknown Browser";
    if (ua.indexOf("Firefox") > -1) bName = "Mozilla Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) bName = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) bName = "Opera Browser";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) bName = "Microsoft Edge";
    else if (ua.indexOf("Chrome") > -1) bName = "Google Chrome";
    else if (ua.indexOf("Safari") > -1) bName = "Apple Safari";
    
    const isMobile = /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
    return `${bName} (${isMobile})`;
}

function showToast(text, type = "info") {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = "info-circle";
    if (type === 'success') icon = "check-circle";
    if (type === 'error') icon = "times-circle";
    if (type === 'warning') icon = "exclamation-triangle";
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${text}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate3d(0, 20px, 0)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function sanitizeInput(str) {
    return str.replace(/[&<>"']/g, (m) => {
        const aq = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
        return aq[m];
    });
}
