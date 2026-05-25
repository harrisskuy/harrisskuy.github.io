/**
 * Attenda - Premium Attendance System (With Selfie Verification & Excuse Management)
 */

// --- INITIAL DATA STATE ---
const state = {
    user: {
        name: "Sarah Jenkins",
        role: "Lead UI/UX Designer",
        division: "Product Design & Development",
        email: "sarah.j@company.com"
    },
    stats: { hadir: 18, telat: 2, izin: 1, alpha: 0 },
    history: [
        { id: 1, nama: "Sarah Jenkins", tanggal: "2026-05-22", masuk: "07:52", keluar: "17:05", status: "Tepat Waktu" },
        { id: 2, nama: "Sarah Jenkins", tanggal: "2026-05-21", masuk: "08:14", keluar: "17:00", status: "Terlambat" },
        { id: 3, nama: "Sarah Jenkins", tanggal: "2026-05-20", masuk: "00:00", keluar: "00:00", status: "Izin" },
    ],
    checkedInToday: false,
    checkedOutToday: false,
    checkInTime: null,
    checkOutTime: null,
    hasUploadedSelfie: false // Guard variable untuk validasi foto selfie
};

// --- DOM ELEMENT SELECTION ---
const dom = {
    loader: document.getElementById('loader'),
    authPage: document.getElementById('authPage'),
    mainApp: document.getElementById('mainApp'),
    loginForm: document.getElementById('loginForm'),
    btnLogout: document.getElementById('btnLogout'),
    themeToggle: document.getElementById('themeToggle'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    closeSidebar: document.getElementById('closeSidebar'),
    sidebar: document.getElementById('sidebar'),
    menuItems: document.querySelectorAll('.menu-item'),
    appSections: document.querySelectorAll('.app-section'),
    
    // Realtime Strings
    txtClock: document.getElementById('txtClock'),
    txtDate: document.getElementById('txtDate'),
    actionClock: document.getElementById('actionClock'),
    actionDate: document.getElementById('actionDate'),
    
    // Attendance Feature Elements
    btnCheckIn: document.getElementById('btnCheckIn'),
    btnCheckOut: document.getElementById('btnCheckOut'),
    attendanceBanner: document.getElementById('attendanceBanner'),
    statusText: document.getElementById('statusText'),
    quickStatus: document.getElementById('quickStatus'),
    
    // Camera Simulator Components
    btnUploadSelfie: document.getElementById('btnUploadSelfie'),
    selfieInput: document.getElementById('selfieInput'),
    cameraBlank: document.getElementById('cameraBlank'),
    selfiePreview: document.getElementById('selfiePreview'),
    cameraLine: document.getElementById('cameraLine'),
    
    // Tab Elements
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    formIzin: document.getElementById('formIzin'),

    // Stats Elements
    statHadir: document.getElementById('statHadir'),
    statTelat: document.getElementById('statTelat'),
    statIzin: document.getElementById('statIzin'),
    statAlpha: document.getElementById('statAlpha'),
    
    // Table Elements
    tableBody: document.getElementById('tableBody'),
    tableSearch: document.getElementById('tableSearch'),
    statusFilter: document.getElementById('statusFilter'),
    
    toastContainer: document.getElementById('toastContainer'),
    miniCalendar: document.getElementById('miniCalendar'),
    btnDownloadPDF: document.getElementById('btnDownloadPDF')
};

// --- REALTIME TIME ENGINE ---
const updateClockEngine = () => {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeString = now.toLocaleTimeString('id-ID', timeOptions) + " WIB";
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', dateOptions);
    
    if(dom.txtClock) dom.txtClock.textContent = timeString;
    if(dom.txtDate) dom.txtDate.textContent = dateString;
    if(dom.actionClock) dom.actionClock.textContent = timeString.replace(" WIB", "");
    if(dom.actionDate) dom.actionDate.textContent = dateString;
};
setInterval(updateClockEngine, 1000);
updateClockEngine();

// --- TOAST NOTIFICATION ---
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if(type === 'danger') icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if(type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    dom.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// --- TAB SWITCHING SYSTEM ---
dom.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        dom.tabButtons.forEach(btn => btn.classList.remove('active'));
        dom.tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// --- CAMERA SIMULATOR CONTROLLER ---
dom.btnUploadSelfie.addEventListener('click', () => {
    dom.selfieInput.click();
});

dom.selfieInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        dom.cameraLine.style.display = 'block'; // Efek garis scanner aktif
        
        reader.onload = function(event) {
            setTimeout(() => {
                dom.cameraBlank.classList.add('hidden');
                dom.selfiePreview.classList.remove('hidden');
                dom.selfiePreview.src = event.target.result;
                state.hasUploadedSelfie = true;
                showToast('Foto selfie berhasil diverifikasi oleh sistem!', 'success');
            }, 1000); // Simulasi pemrosesan AI wajah selama 1 detik
        }
        reader.readAsDataURL(file);
    }
});

// --- ABSENSI DAN PENGAJUAN IZIN LOGIC ---
const updateAttendanceUIState = () => {
    if(state.checkedInToday) {
        dom.btnCheckIn.disabled = true;
        dom.quickStatus.textContent = "Sudah Check In";
        dom.quickStatus.className = "attendance-fast-status card-status-badge badge-success";
        dom.statusText.innerHTML = `Sudah Check In Masuk pukul <strong>${state.checkInTime}</strong>`;
        dom.btnCheckOut.disabled = false;
    }
    if(state.checkedOutToday) {
        dom.btnCheckOut.disabled = true;
        dom.quickStatus.textContent = "Selesai Kerja";
        dom.statusText.innerHTML = `Sudah Check Out Pulang pukul <strong>${state.checkOutTime}</strong>`;
        dom.attendanceBanner.style.borderColor = "var(--success)";
        dom.cameraLine.style.display = 'none';
    }
};

dom.btnCheckIn.addEventListener('click', () => {
    // Validasi apakah karyawan sudah mengunggah selfie
    if(!state.hasUploadedSelfie) {
        showToast('Gagal! Anda wajib mengambil foto selfie terlebih dahulu.', 'danger');
        return;
    }

    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    
    let logStatus = "Tepat Waktu";
    if (curHour > 8 || (curHour === 8 && curMin > 15)) {
        logStatus = "Terlambat";
        state.stats.telat += 1;
    } else {
        state.stats.hadir += 1;
    }
    
    const timeStr = `${String(curHour).padStart(2, '0')}:${String(curMin).padStart(2, '0')}`;
    const dateISO = now.toISOString().split('T')[0];
    
    state.checkedInToday = true;
    state.checkInTime = timeStr;
    
    state.history.unshift({
        id: Date.now(),
        nama: state.user.name,
        tanggal: dateISO,
        masuk: timeStr,
        keluar: "--:--",
        status: logStatus
    });
    
    showToast(`Presensi masuk berhasil! Status: ${logStatus}`, logStatus === 'Terlambat' ? 'warning' : 'success');
    updateAttendanceUIState();
    renderHistoryTable();
    updateDashboardStats();
    updateChartData();
});

dom.btnCheckOut.addEventListener('click', () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    state.checkedOutToday = true;
    state.checkOutTime = timeStr;
    
    if(state.history.length > 0) {
        state.history[0].keluar = timeStr;
    }
    
    showToast('Presensi pulang berhasil tercatat.', 'success');
    updateAttendanceUIState();
    renderHistoryTable();
});

// Submit Form Izin / Sakit
dom.formIzin.addEventListener('submit', (e) => {
    e.preventDefault();
    const jenis = document.getElementById('jenisIzin').value;
    const keterangan = document.getElementById('keteranganIzin').value;
    const now = new Date();
    const dateISO = now.toISOString().split('T')[0];

    // Update State
    state.stats.izin += 1;
    state.history.unshift({
        id: Date.now(),
        nama: state.user.name,
        tanggal: dateISO,
        masuk: "00:00",
        keluar: "00:00",
        status: jenis
    });

    showToast(`Pengajuan ${jenis} berhasil dikirim ke HRD.`, 'success');
    dom.formIzin.reset();
    
    // Switch ke tab dashboard untuk melihat update data
    dom.menuItems[0].click();
    updateDashboardStats();
    renderHistoryTable();
});

// --- ROUTINE UI RENDERING ---
const renderHistoryTable = (filterText = "", statusSelect = "all") => {
    dom.tableBody.innerHTML = "";
    const filtered = state.history.filter(item => {
        const matchesSearch = item.tanggal.includes(filterText) || item.status.toLowerCase().includes(filterText.toLowerCase());
        const matchesStatus = statusSelect === 'all' || item.status === statusSelect;
        return matchesSearch && matchesStatus;
    });

    if(filtered.length === 0) {
        dom.tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Data riwayat tidak ditemukan.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        let badgeClass = 'success';
        if(item.status === 'Terlambat') badgeClass = 'warning';
        if(item.status === 'Izin' || item.status === 'Sakit') badgeClass = 'info';
        
        tr.innerHTML = `
            <td><strong>${item.nama}</strong></td>
            <td>${item.tanggal}</td>
            <td>${item.masuk}</td>
            <td>${item.keluar}</td>
            <td><span class="badge-status ${badgeClass}">${item.status}</span></td>
        `;
        dom.tableBody.appendChild(tr);
    });
};

dom.tableSearch.addEventListener('input', (e) => renderHistoryTable(e.target.value, dom.statusFilter.value));
dom.statusFilter.addEventListener('change', (e) => renderHistoryTable(dom.tableSearch.value, e.target.value));

const updateDashboardStats = () => {
    dom.statHadir.textContent = state.stats.hadir;
    dom.statTelat.textContent = state.stats.telat;
    dom.statIzin.textContent = state.stats.izin;
    dom.statAlpha.textContent = state.stats.alpha;
};

const renderMiniCalendar = () => {
    const days = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
    dom.miniCalendar.innerHTML = "";
    days.forEach(d => {
        const head = document.createElement('div');
        head.className = "calendar-day-head"; head.textContent = d;
        dom.miniCalendar.appendChild(head);
    });
    for(let i = 20; i <= 26; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = "calendar-day" + (i === 25 ? " active" : "");
        dayEl.textContent = i;
        dom.miniCalendar.appendChild(dayEl);
    }
};

// --- AUTH & CONFIG MANAGEMENT ---
dom.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(email === 'admin@attenda.com' && password === 'password') {
        dom.loader.style.opacity = '1'; dom.loader.style.visibility = 'visible';
        setTimeout(() => {
            dom.authPage.classList.add('hidden');
            dom.mainApp.classList.remove('hidden');
            dom.loader.style.opacity = '0'; dom.loader.style.visibility = 'hidden';
            showToast('Selamat Datang! Login berhasil.', 'success');
            initAppDashboard();
        }, 1200);
    } else {
        showToast('Kredensial salah!', 'danger');
    }
});

dom.btnLogout.addEventListener('click', () => {
    dom.mainApp.classList.add('hidden');
    dom.authPage.classList.remove('hidden');
    showToast('Anda telah keluar dari sistem.', 'info');
});

dom.menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSectionId = item.getAttribute('data-target');
        dom.menuItems.forEach(i => i.classList.remove('active'));
        dom.appSections.forEach(s => s.classList.remove('active-section'));
        item.classList.add('active');
        document.getElementById(targetSectionId).classList.add('active-section');
        if(window.innerWidth <= 768) dom.sidebar.classList.remove('open');
    });
});

dom.toggleSidebar.addEventListener('click', () => dom.sidebar.classList.add('open'));
dom.closeSidebar.addEventListener('click', () => dom.sidebar.classList.remove('open'));

const initThemeMode = () => {
    const cachedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', cachedTheme);
    dom.themeToggle.innerHTML = cachedTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>';
};

dom.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    dom.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>';
    showToast(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} aktif.`, 'success');
});

let weeklyChartInstance = null;
const initWeeklyChart = () => {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
            datasets: [{
                label: 'Jam Kerja',
                data: [8, 8.5, 7.8, 9, 8.2],
                backgroundColor: '#2563eb',
                borderRadius: 6,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
};
const updateChartData = () => { if(weeklyChartInstance) { weeklyChartInstance.data.datasets[0].data[4] = 8.5; weeklyChartInstance.update(); } };

const initAppDashboard = () => {
    updateDashboardStats();
    renderMiniCalendar();
    initWeeklyChart();
    renderHistoryTable();
    document.querySelectorAll('.user-name').forEach(el => el.textContent = state.user.name);
    document.querySelectorAll('.user-role').forEach(el => el.textContent = state.user.role);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = state.user.email);
};


// =========================================================================
// FITUR EKSPOR REPORT PDF (TERSTRUKTUR)
// =========================================================================
const generateAttendancePDF = () => {
    const filterText = dom.tableSearch.value.toLowerCase();
    const statusSelect = dom.statusFilter.value;

    // Filter data sesuai apa yang tampil di layar input user
    const filteredData = state.history.filter(item => {
        const matchesSearch = item.tanggal.includes(filterText) || item.status.toLowerCase().includes(filterText);
        const matchesStatus = statusSelect === 'all' || item.status === statusSelect;
        return matchesSearch && matchesStatus;
    });

    if (filteredData.length === 0) {
        showToast('Gagal cetak! Tidak ada data riwayat yang sesuai untuk diunduh.', 'danger');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Warna korporat premium (Attenda Blue)
    const primaryColor = [37, 99, 235]; 
    const textColor = [15, 23, 42];    

    // Header Aplikasi
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ATTENDA", 14, 20);
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139); 
    doc.text("Premium Attendance & HR System", 14, 25);

    // Garis Separator Header
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 28, 196, 28);

    // Metadata Karyawan
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("LAPORAN RIWAYAT KEHADIRAN KARYAWAN", 14, 38);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nama Karyawan : ${state.user.name}`, 14, 46);
    doc.text(`Jabatan / Divisi : ${state.user.role} / ${state.user.division}`, 14, 52);
    doc.text(`Email Resmi     : ${state.user.email}`, 14, 58);
    doc.text(`Tanggal Cetak   : ${dom.txtDate.textContent}`, 14, 64);

    // Info Filter Aktif
    if (statusSelect !== 'all' || filterText !== '') {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`*Kriteria Cetak: Status [${statusSelect}], Kata Kunci ["${filterText || '-'}"]`, 14, 71);
    }

    // Transformasi Data ke Tabel
    const tableBodyData = filteredData.map((item, index) => [
        index + 1,
        item.tanggal,
        item.masuk === "00:00" ? "-" : item.masuk,
        item.keluar === "00:00" || item.keluar === "--:--" ? "-" : item.keluar,
        item.status
    ]);

    // Pembuatan AutoTable
    doc.autoTable({
        startY: statusSelect !== 'all' || filterText !== '' ? 75 : 69,
        head: [['No', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status']],
        body: tableBodyData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            font: 'Helvetica',
            fontSize: 10,
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 12 }, 
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { fontStyle: 'bold' } 
        },
        didParseCell: function(data) {
            // Berikan pewarnaan dinamis teks status di dalam PDF
            if (data.column.index === 4 && data.cell.section === 'body') {
                const statusValue = data.cell.text[0];
                if (statusValue === 'Tepat Waktu') data.cell.styles.textColor = [16, 185, 129]; 
                if (statusValue === 'Terlambat') data.cell.styles.textColor = [245, 158, 11];   
                if (statusValue === 'Izin' || statusValue === 'Sakit') data.cell.styles.textColor = [37, 99, 235]; 
            }
        }
    });

    // Validasi Posisi Tanda Tangan Supaya Tidak Terpotong Page Break
    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY > 245) {
        doc.addPage();
        doc.setFont("Helvetica", "normal");
        doc.text("Disetujui oleh,", 14, 30);
        doc.setDrawColor(150, 150, 150);
        doc.line(14, 50, 70, 50);
        doc.setFont("Helvetica", "bold");
        doc.text("HRD Department", 14, 55);
    } else {
        doc.setFont("Helvetica", "normal");
        doc.text("Disetujui oleh,", 14, finalY);
        doc.setDrawColor(150, 150, 150);
        doc.line(14, finalY + 20, 70, finalY + 20);
        doc.setFont("Helvetica", "bold");
        doc.text("HRD Department", 14, finalY + 25);
    }

    const fileNameClean = state.user.name.replace(/\s+/g, '_');
    doc.save(`Riwayat_Presensi_${fileNameClean}.pdf`);
    showToast('File PDF Berhasil diunduh!', 'success');
};

window.addEventListener('DOMContentLoaded', () => {
    // Event Listener PDF
    if(dom.btnDownloadPDF) dom.btnDownloadPDF.addEventListener('click', generateAttendancePDF);
    initThemeMode();
    setTimeout(() => { dom.loader.style.opacity = '0'; dom.loader.style.visibility = 'hidden'; }, 600);
});
