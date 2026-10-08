
/* C-DFS PHP/MySQL API */
async function apiRequest(action, payload = {}) {
    try {
        const r = await fetch(`php/api.php?action=${encodeURIComponent(action)}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (!r.ok || data.success === false) return {success: false, message: data.message || 'Permintaan gagal.'};
        return data;
    } catch (e) {
        console.warn('PHP API belum tersedia:', e.message);
        return null;
    }
}
async function cdfsLogin(email, password) { return apiRequest('login', {email, password}); }
async function cdfsRegister(user) { return apiRequest('register', user); }
async function cdfsLogout() { return apiRequest('logout'); }
async function cdfsUpdateProdi(jalur, prodi) { return apiRequest('update_prodi', {jalur, prodi}); }

/* Daftar Program Studi per Jalur Pendidikan (Jobseeker) */
const PRODI_BY_JALUR = {
    'Akademis': [
        {kode: 'MAT', nama: 'Matematika'},
        {kode: 'PAUD', nama: 'Pendidikan Anak Usia Dini (PAUD)'}
    ],
    'Vocational': [
        {kode: 'TRSE', nama: 'Teknologi Rekayasa Sistem Elektronika'},
        {kode: 'MP', nama: 'Manajemen Pemasaran'}
    ]
};

/* Profil kompetensi inti tiap prodi — dasar skor kecocokan kandidat (sesuaikan dengan CPL prodi) */
const PRODI_SKILLS = {
    'Matematika': ['Analisis Data', 'Statistika', 'Pemodelan Matematika', 'Pemrograman Python', 'Microsoft Excel', 'Riset Operasi', 'Berpikir Logis'],
    'Pendidikan Anak Usia Dini (PAUD)': ['Perencanaan Pembelajaran', 'Psikologi Perkembangan Anak', 'Asesmen Perkembangan', 'Komunikasi dengan Orang Tua', 'Media Ajar Kreatif', 'Manajemen Kelas'],
    'Teknologi Rekayasa Sistem Elektronika': ['Rangkaian Elektronika', 'Mikrokontroler', 'Internet of Things (IoT)', 'PLC & Otomasi', 'Troubleshooting Perangkat', 'Desain PCB', 'Instrumentasi'],
    'Manajemen Pemasaran': ['Digital Marketing', 'Riset Pasar', 'Penjualan (Sales)', 'Branding', 'Komunikasi Pemasaran', 'Manajemen Media Sosial', 'Negosiasi']
};

document.addEventListener('DOMContentLoaded', function() {

            // ==============================================================
            // 1. CHART.JS – Grafik di Landing (gapChart)
            // ==============================================================
            const ctx = document.getElementById('gapChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['AI/ML', 'Cloud', 'Data Sci', 'IoT', 'Cybersec'],
                    datasets: [{
                        label: 'Gap Kompetensi',
                        data: [30, 45, 60, 20, 50],
                        backgroundColor: 'rgba(29, 78, 216, 0.7)',
                        borderColor: '#1d4ed8',
                        borderWidth: 1
                    }, {
                        label: 'Future Skills',
                        data: [70, 65, 80, 55, 75],
                        backgroundColor: 'rgba(22, 163, 74, 0.7)',
                        borderColor: '#16a34a',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { boxWidth: 12, font: { size: 9, family: 'Inter' } }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { font: { size: 8 } } },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            });

            // ==============================================================
            // 2. DATE PICKER – Batas 7 hari
            // ==============================================================
            function setupDatePickers() {
                const today = new Date();
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);

                const formatDate = (d) => d.toISOString().split('T')[0];
                const minDate = formatDate(sevenDaysAgo);
                const maxDate = formatDate(today);

                document.querySelectorAll('input[type="date"]').forEach(input => {
                    input.setAttribute('min', minDate);
                    input.setAttribute('max', maxDate);
                    if (input.id.includes('Start') || input.id.includes('start') || input.id === 'industriDate') {
                        input.value = formatDate(sevenDaysAgo);
                    } else if (input.id.includes('End') || input.id.includes('end')) {
                        input.value = formatDate(today);
                    } else {
                        input.value = formatDate(today);
                    }
                });

                document.querySelectorAll('.date-picker').forEach(picker => {
                    const inputs = picker.querySelectorAll('input[type="date"]');
                    if (inputs.length === 2) {
                        const startInput = inputs[0];
                        const endInput = inputs[1];
                        startInput.addEventListener('change', function() {
                            if (this.value > endInput.value) {
                                endInput.value = this.value;
                            }
                        });
                        endInput.addEventListener('change', function() {
                            if (this.value < startInput.value) {
                                startInput.value = this.value;
                            }
                        });
                    }
                });
            }
            setupDatePickers();

            // ==============================================================
            // 3. TOAST NOTIFICATION
            // ==============================================================
            function showToast(message) {
                const toast = document.getElementById('toast');
                document.getElementById('toastMessage').textContent = message;
                toast.classList.add('show');
                clearTimeout(toast._timeout);
                toast._timeout = setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }

            // ==============================================================
            // 4. DOWNLOAD FUNGSI
            // ==============================================================
            document.getElementById('unduhRekomendasiBtn').addEventListener('click', function(e) {
                e.preventDefault();
                const content = '=== REKOMENDASI KURIKULUM C-DFS ===\n\n' +
                    'Tanggal: ' + new Date().toLocaleDateString('id-ID') + '\n\n' +
                    'Mata Kuliah Direkomendasikan: 18\n' +
                    'Modul Pembelajaran: 36\n' +
                    'Materi / Topik: 142\n' +
                    'Tingkat Kesesuaian: 76%\n\n' +
                    '--- Daftar Rekomendasi ---\n' +
                    '1. Data Analytics - Sangat Tinggi\n' +
                    '2. Machine Learning Fundamentals - Sangat Tinggi\n' +
                    '3. Cybersecurity Essentials - Tinggi\n' +
                    '4. UI/UX Design - Tinggi\n' +
                    '5. Cloud Computing - Tinggi\n\n' +
                    '--- Sumber Data ---\n' +
                    'LinkedIn, JobStreet, Glints, WEF Future of Jobs Report 2023';
                downloadFile(content, 'rekomendasi_kurikulum.txt', 'text/plain');
                showToast('Rekomendasi berhasil diunduh!');
            });

            document.getElementById('unduhLaporanBtn').addEventListener('click', function(e) {
                e.preventDefault();
                const content = '=== LAPORAN C-DFS ===\n\n' +
                    'Total Laporan: 24\n' +
                    'Total Unduhan: 152\n' +
                    'Pengguna Aktif: 38\n' +
                    'Ukuran Data: 1.48 GB\n\n' +
                    '--- Daftar Laporan Terbaru ---\n' +
                    '1. Kebutuhan Industri Sektor Teknologi Informasi\n' +
                    '2. Analisis Gap Kompetensi 2025\n' +
                    '3. Future Skills Forecasting 2025-2030\n' +
                    '4. Rekomendasi Kurikulum Prodi SI\n' +
                    '5. Tracer Study Lulusan 2021-2023\n\n' +
                    '--- Sumber Data ---\n' +
                    'JobStreet, LinkedIn, Glints, Karir.com, BPS, WEF Future of Jobs Report 2023';
                downloadFile(content, 'laporan_c-dfs.txt', 'text/plain');
                showToast('Laporan berhasil diunduh!');
            });

            document.querySelectorAll('.btn-download-report').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const reportName = this.getAttribute('data-report') || 'Laporan';
                    const content = '=== LAPORAN: ' + reportName + ' ===\n\n' +
                        'Diupload oleh: ' + (this.closest('tr').querySelector('td:nth-child(5)')?.textContent ||
                            'Admin PT') + '\n' +
                        'Tanggal: ' + (this.closest('tr').querySelector('td:nth-child(4)')?.textContent ||
                            new Date().toLocaleDateString('id-ID')) + '\n\n' +
                        '--- Detail Laporan ---\n' +
                        'Jenis: ' + (this.closest('tr').querySelector('td:nth-child(2)')?.textContent || 'Umum') +
                        '\n' +
                        'Periode: ' + (this.closest('tr').querySelector('td:nth-child(3)')?.textContent || '-') +
                        '\n\n' +
                        'Laporan ini berisi analisis komprehensif mengenai ' + reportName +
                        '.\nData disusun berdasarkan sumber terpercaya dan dapat digunakan untuk pengambilan keputusan.';
                    downloadFile(content, reportName.replace(/\s+/g, '_') + '.txt', 'text/plain');
                    showToast('Laporan "' + reportName + '" berhasil diunduh!');
                });
            });

            document.getElementById('eksporSekarangBtn').addEventListener('click', function(e) {
                e.preventDefault();
                const includeChart = document.getElementById('includeChart').checked;
                const includeSummary = document.getElementById('includeSummary').checked;
                let content = '=== EKSPOR DATA C-DFS ===\n\n' +
                    'Tanggal Ekspor: ' + new Date().toLocaleString('id-ID') + '\n' +
                    'Sertakan Grafik: ' + (includeChart ? 'Ya' : 'Tidak') + '\n' +
                    'Sertakan Ringkasan: ' + (includeSummary ? 'Ya' : 'Tidak') + '\n\n' +
                    '--- Data Ekspor ---\n' +
                    'Total Laporan: 24\n' +
                    'Total Unduhan: 152\n' +
                    'Pengguna Aktif: 38\n' +
                    'Ukuran Data: 1.48 GB\n\n' +
                    '--- Ringkasan ---\n' +
                    'Keselarasan Kurikulum: 70%\n' +
                    'Kompetensi Industri: 120\n' +
                    'Future Skills: 50\n' +
                    'Rekomendasi Kurikulum: 18\n\n' +
                    '--- Sumber Data ---\n' +
                    'JobStreet, LinkedIn, Glints, Karir.com, BPS, WEF Future of Jobs Report 2023';
                downloadFile(content, 'ekspor_data_c-dfs.txt', 'text/plain');
                showToast('Data berhasil diekspor!');
            });

            function downloadFile(content, filename, mimeType) {
                const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }

            // ==============================================================
            // 5. TOGGLE LANDING / AUTH / DASHBOARD
            // ==============================================================
            const landingContainer = document.getElementById('landingContainer');
            const authContainer = document.getElementById('authContainer');
            const dashboardContainer = document.getElementById('dashboardContainer');

            function showLanding() {
                landingContainer.classList.remove('hidden');
                authContainer.classList.remove('active');
                dashboardContainer.classList.remove('active');
                setMode('register');
                document.getElementById('global-stepper').classList.remove('hidden-stepper');
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            }

            function showAuth() {
                landingContainer.classList.add('hidden');
                authContainer.classList.add('active');
                dashboardContainer.classList.remove('active');
                setMode('register');
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            }

            function showDashboard() {
                landingContainer.classList.add('hidden');
                authContainer.classList.remove('active');
                dashboardContainer.classList.add('active');
                applyRoleLayout();
                initDashboardCharts();
                setTimeout(jalankanAnimasiAngka, 200);
                const name = sessionStorage.getItem('c-dfs_user_name') || 'Admin PT';
                document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                setupDatePickers();
                renderJobseekerDashboard();
            }

            document.getElementById('landingLoginBtn').addEventListener('click', showAuth);
            document.getElementById('heroExploreBtn').addEventListener('click', showAuth);
            document.getElementById('backToLandingBtn').addEventListener('click', showLanding);

            // ==============================================================
            // 6. AUTH STATE & NAVIGATION
            // ==============================================================
            const state = {
                currentStep: 1,
                mode: 'register',
                name: '',
                email: '',
                instansi: '',
                role: 'Jobseeker',
                jalur: '',
                prodi: ''
            };
            const TOTAL_STEPS = 3; // 1 Informasi Diri, 2 Pilih Peran, 3 Selesai (tanpa OTP)

            const btnBack = document.getElementById('btn-back');
            const stepperEl = document.getElementById('global-stepper');

            function goToStep(stepNumber) {
                state.currentStep = stepNumber;
                document.querySelectorAll('.auth-mode-content').forEach(el => el.classList.remove('active'));
                const target = document.getElementById(`view-step-${stepNumber}`);
                if (target) target.classList.add('active');

                for (let i = 1; i <= TOTAL_STEPS; i++) {
                    const indicator = document.getElementById(`step-indicator-${i}`);
                    if (!indicator) continue;
                    const circle = indicator.querySelector('.v-step-circle');
                    if (i < stepNumber || (stepNumber === TOTAL_STEPS && i === TOTAL_STEPS)) {
                        indicator.className = 'v-step completed';
                        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
                    } else if (i === stepNumber) {
                        indicator.className = 'v-step active';
                        circle.innerText = i;
                    } else {
                        indicator.className = 'v-step';
                        circle.innerText = i;
                    }
                }

                if (stepNumber === 1 || stepNumber === TOTAL_STEPS) btnBack.style.visibility = 'hidden';
                else btnBack.style.visibility = 'visible';
            }

            function setMode(mode) {
                state.mode = mode;
                document.querySelectorAll('.auth-mode-content').forEach(el => el.classList.remove('active'));

                if (mode === 'login') {
                    document.getElementById('view-login').classList.add('active');
                    stepperEl.classList.add('hidden-stepper');
                    btnBack.style.visibility = 'hidden';
                } else {
                    stepperEl.classList.remove('hidden-stepper');
                    goToStep(1);
                }
            }

            document.getElementById('switchToLogin').addEventListener('click', (e) => {
                e.preventDefault();
                setMode('login');
            });
            document.getElementById('switchToRegister').addEventListener('click', (e) => {
                e.preventDefault();
                setMode('register');
            });

            btnBack.addEventListener('click', () => {
                if (state.mode === 'register' && state.currentStep > 1 && state.currentStep < TOTAL_STEPS) {
                    goToStep(state.currentStep - 1);
                }
            });

            // ---------- Step 1: Informasi Diri ----------
            document.getElementById('formRegister').addEventListener('submit', function(e) {
                e.preventDefault();
                state.name = document.getElementById('regName').value.trim();
                state.email = document.getElementById('userEmail').value.trim();
                state.instansi = document.getElementById('regInstansi').value.trim();
                if (!state.name || !state.email || !state.instansi) {
                    alert('Harap isi semua field.');
                    return;
                }
                goToStep(2);
            });

            // ---------- Step 2: Pilih Peran -> langsung simpan & selesai (tanpa OTP) ----------
            document.getElementById('formRole').addEventListener('submit', async function(e) {
                e.preventDefault();
                state.role = document.querySelector('input[name="role"]:checked')?.value || 'Jobseeker';
                // Jalur & Program Studi dipilih Jobseeker nanti di Dashboard
                state.jalur = '';
                state.prodi = '';

                const result = await cdfsRegister({
                    name: state.name, email: state.email, instansi: state.instansi,
                    role: state.role, jalur: state.jalur, prodi: state.prodi
                });
                if (result && result.success === false) {
                    alert(result.message || 'Registrasi gagal.');
                    return;
                }

                saveSession({name: state.name, email: state.email, instansi: state.instansi,
                    role: state.role, jalur: state.jalur, prodi: state.prodi});

                let summary = `Peran: <strong>${state.role}</strong>`;
                if (state.role === 'Jobseeker') summary += '<br>Pilih Jalur Pendidikan &amp; Program Studi Anda di Dashboard.';
                if (result && result.success) summary += '<br>Password awal: <strong>CDFS@12345</strong>';
                document.getElementById('regSummary').innerHTML = summary;
                goToStep(3);
            });

            function saveSession(u) {
                sessionStorage.setItem('c-dfs_user_name', u.name || '');
                sessionStorage.setItem('c-dfs_user_email', u.email || '');
                sessionStorage.setItem('c-dfs_user_instansi', u.instansi || '');
                sessionStorage.setItem('c-dfs_user_role', u.role || '');
                sessionStorage.setItem('c-dfs_user_jalur', u.jalur || '');
                sessionStorage.setItem('c-dfs_user_prodi', u.prodi || '');
            }

            // ---------- Antarmuka Jobseeker di Dashboard: pencarian jalur & prodi ----------
            const jobseekerDashCard = document.getElementById('jobseekerDashCard');
            const dashProdiBadge = document.getElementById('dashProdiBadge');
            const escHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

            // Komponen pencarian (combobox) sederhana yang bisa dipakai ulang
            function createSearchPick(rootId, getOptions, onSelect, onClear) {
                const root = document.getElementById(rootId);
                const input = root.querySelector('input');
                const list = root.querySelector('.search-pick-list');
                let items = [], hl = 0, selected = null;
                const mark = (text, q) => {
                    if (!q) return escHtml(text);
                    const i = text.toLowerCase().indexOf(q.toLowerCase());
                    return i < 0 ? escHtml(text) : escHtml(text.slice(0, i)) + '<mark>' + escHtml(text.slice(i, i + q.length)) + '</mark>' + escHtml(text.slice(i + q.length));
                };
                function render() {
                    const q = (selected && input.value === selected.label) ? '' : input.value.trim();
                    items = getOptions().filter(o => !q || (o.label + ' ' + (o.code || '') + ' ' + (o.group || '')).toLowerCase().includes(q.toLowerCase()));
                    hl = Math.min(hl, Math.max(0, items.length - 1));
                    list.innerHTML = items.length ? items.map((o, i) => `
                        <li role="option" data-i="${i}" class="${i === hl ? 'hl' : ''}" aria-selected="${selected && selected.value === o.value}">
                            ${o.code ? `<span class="code">${mark(o.code, q)}</span>` : ''}<span>${mark(o.label, q)}</span>${o.group ? `<span class="grp">${escHtml(o.group)}</span>` : ''}
                        </li>`).join('') : '<li class="empty">Tidak ditemukan</li>';
                }
                const open = () => { render(); root.classList.add('open'); input.setAttribute('aria-expanded', 'true'); };
                const close = () => { root.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); if (selected) input.value = selected.label; else input.value = ''; };
                function choose(o) {
                    selected = o; input.value = o.label; root.classList.add('has-value');
                    root.classList.remove('open'); input.blur(); onSelect(o);
                }
                input.addEventListener('focus', () => { input.select(); open(); });
                input.addEventListener('input', () => { hl = 0; open(); });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(hl + 1, items.length - 1); render(); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(hl - 1, 0); render(); }
                    else if (e.key === 'Enter') { e.preventDefault(); if (items[hl]) choose(items[hl]); }
                    else if (e.key === 'Escape') { close(); input.blur(); }
                });
                list.addEventListener('mousedown', (e) => {
                    const li = e.target.closest('li[data-i]');
                    if (li) { e.preventDefault(); choose(items[+li.dataset.i]); }
                });
                input.addEventListener('blur', () => setTimeout(close, 120));
                root.querySelector('.search-pick-clear').addEventListener('click', () => {
                    selected = null; input.value = ''; root.classList.remove('has-value'); onClear && onClear();
                });
                return {
                    set(value) {
                        selected = getOptions().find(o => o.value === value) || null;
                        input.value = selected ? selected.label : '';
                        root.classList.toggle('has-value', !!selected);
                    }
                };
            }

            const jalurOptions = () => Object.keys(PRODI_BY_JALUR).map(j => ({value: j, label: j, group: `${PRODI_BY_JALUR[j].length} prodi`}));
            const prodiOptions = () => {
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                return Object.entries(PRODI_BY_JALUR)
                    .filter(([j]) => !jalur || j === jalur)
                    .flatMap(([j, list]) => list.map(p => ({value: p.nama, label: p.nama, code: p.kode, group: j})));
            };
            async function saveProdiChoice() {
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                dashProdiBadge.textContent = prodi ? `${jalur} · ${prodi}` : (jalur ? `${jalur} · pilih prodi` : 'Belum dipilih');
                if (jalur && prodi) {
                    await cdfsUpdateProdi(jalur, prodi);
                    showToast(`Program Studi: ${prodi}`);
                }
                if (typeof jmRefreshStats === 'function') jmRefreshStats();
            }
            const pickJalur = createSearchPick('pickJalur', jalurOptions, (o) => {
                const prev = sessionStorage.getItem('c-dfs_user_jalur');
                sessionStorage.setItem('c-dfs_user_jalur', o.value);
                const prodi = sessionStorage.getItem('c-dfs_user_prodi');
                if (prev !== o.value && prodi && !(PRODI_BY_JALUR[o.value] || []).some(p => p.nama === prodi)) {
                    sessionStorage.setItem('c-dfs_user_prodi', '');
                    pickProdi.set('');
                }
                saveProdiChoice();
                setTimeout(() => document.getElementById('pickProdiInput').focus(), 60);
            }, () => {
                sessionStorage.setItem('c-dfs_user_jalur', '');
                sessionStorage.setItem('c-dfs_user_prodi', '');
                pickProdi.set('');
                saveProdiChoice();
            });
            const pickProdi = createSearchPick('pickProdi', prodiOptions, (o) => {
                sessionStorage.setItem('c-dfs_user_jalur', o.group);   // jalur otomatis mengikuti prodi
                sessionStorage.setItem('c-dfs_user_prodi', o.value);
                pickJalur.set(o.group);
                saveProdiChoice();
            }, () => {
                sessionStorage.setItem('c-dfs_user_prodi', '');
                saveProdiChoice();
            });

            function renderJobseekerDashboard() {
                const role = sessionStorage.getItem('c-dfs_user_role') || '';
                const isJobseeker = role === 'Jobseeker';
                jobseekerDashCard.classList.toggle('is-hidden', !isJobseeker);
                if (!isJobseeker) return;
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                pickJalur.set(jalur);
                pickProdi.set(prodi);
                dashProdiBadge.textContent = prodi ? `${jalur} · ${prodi}` : (jalur ? `${jalur} · pilih prodi` : 'Belum dipilih');
            }

            document.getElementById('formLogin').addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const pass = document.getElementById('loginPassword').value.trim();
                if (!email || !pass) {
                    alert('Harap isi email dan kata sandi.');
                    return;
                }
                const result = await cdfsLogin(email, pass);
                if (result && result.success === false) {
                    alert(result.message || 'Email atau kata sandi salah.');
                    return;
                }
                const u = result?.user || {};
                saveSession({name: u.name || email.split('@')[0], email: u.email || email,
                    instansi: u.instansi || '', role: u.role || 'Jobseeker',
                    jalur: u.jalur || '', prodi: u.prodi || ''});
                showDashboard();
            });

            document.querySelector('.btn-google').addEventListener('click', function() {
                alert('🔵 Login dengan Google (simulasi)');
            });

            document.getElementById('gotoDashboardBtn').addEventListener('click', function() {
                showDashboard();
            });

            // ==============================================================
            // 7. DROPDOWN LOGOUT
            // ==============================================================
            document.querySelectorAll('.user-profile').forEach(profile => {
                const chevron = profile.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.addEventListener('click', function(e) {
                        e.stopPropagation();
                        profile.classList.toggle('show');
                    });
                }
                const avatar = profile.querySelector('.avatar');
                const nameSpan = profile.querySelector('.user-name');
                if (avatar) avatar.addEventListener('click', function(e) { e.stopPropagation();
                    profile.classList.toggle('show'); });
                if (nameSpan) nameSpan.addEventListener('click', function(e) { e.stopPropagation();
                    profile.classList.toggle('show'); });
            });

            document.addEventListener('click', function() {
                document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
            });

            document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    sessionStorage.removeItem('c-dfs_user_name');
                    sessionStorage.removeItem('c-dfs_user_email');
                    sessionStorage.removeItem('c-dfs_user_instansi');
                    sessionStorage.removeItem('c-dfs_user_role');
                    sessionStorage.removeItem('c-dfs_user_jalur');
                    sessionStorage.removeItem('c-dfs_user_prodi');
                    cdfsLogout();
                    delete document.body.dataset.role;
                    showLanding();
                    document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                });
            });

            // ==============================================================
            // 8. DASHBOARD CHARTS
            // ==============================================================
            let dashboardChartsInited = false;

            function initDashboardCharts() {
                if (dashboardChartsInited) return;
                dashboardChartsInited = true;

                new Chart(document.getElementById('alignmentDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Sudah Selaras', 'Sedang Dikembangkan', 'Perlu Ditingkatkan'],
                        datasets: [{ data: [70, 20, 10], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                            borderWidth: 0 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '75%', rotation: -90,
                        plugins: { legend: { display: false } } }
                });

                new Chart(document.getElementById('skillsBarChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Digital Marketing', 'Data Analysis', 'Excel', 'Communication', 'Project Mgmt'],
                        datasets: [{ data: [4892, 4231, 3987, 3452, 2987], backgroundColor: '#2563eb',
                            borderRadius: 6, barPercentage: 0.6 }]
                    },
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } }, scales: { x: { grid: { display: true } },
                            y: { grid: { display: false } } } }
                });

                new Chart(document.getElementById('sourceDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['JobStreet', 'LinkedIn', 'Glints', 'Karir.com'],
                        datasets: [{ data: [48.2, 30.4, 15.4, 6.0], backgroundColor: ['#2563eb', '#0ea5e9',
                                '#fbbf24', '#c026d3'
                            ], borderWidth: 0 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '75%',
                        plugins: { legend: { position: 'right' } } }
                });

                new Chart(document.getElementById('gapDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: ['Gap', 'Sesuai'], datasets: [{ data: [51.7, 48.3],
                            backgroundColor: ['#ef4444', '#10b981'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '75%', rotation: -90,
                        plugins: { legend: { display: false } } }
                });

                const chartDataLabels = {
                    id: 'chartDataLabels',
                    afterDatasetsDraw(chart) {
                        const ctx = chart.ctx;
                        ctx.font = 'bold 12px Inter';
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        chart.data.datasets.forEach((dataset, i) => {
                            chart.getDatasetMeta(i).data.forEach((bar, index) => {
                                if (dataset.data[index] > 0) ctx.fillText(dataset.data[index] + '%', bar
                                    .x - (bar.width / 2), bar.y);
                            });
                        });
                    }
                };

                new Chart(document.getElementById('gapStackedBarChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Digital', 'Data', 'Marketing', 'Business', 'Soft Skills'],
                        datasets: [
                            { label: 'Sesuai', data: [60, 45, 50, 55, 70], backgroundColor: '#10b981',
                                barPercentage: 0.6 },
                            { label: 'Gap', data: [40, 55, 50, 45, 30], backgroundColor: '#ef4444',
                                barPercentage: 0.6 }
                        ]
                    },
                    plugins: [chartDataLabels],
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } }, scales: { x: { stacked: true, max: 100,
                                display: false }, y: { stacked: true, grid: { display: false } } } }
                });

                new Chart(document.getElementById('trendLineChart').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['2025', '2026', '2027', '2028', '2029', '2030'],
                        datasets: [
                            { label: 'AI & Big Data', data: [38, 48, 56, 61, 65, 71.8], borderColor: '#2563eb',
                                backgroundColor: '#2563eb', borderWidth: 2, pointRadius: 3, tension: 0.3 },
                            { label: 'Cybersecurity', data: [28, 38, 46, 52, 57, 61.3], borderColor: '#10b981',
                                backgroundColor: '#10b981', borderWidth: 2, pointRadius: 3, tension: 0.3 },
                            { label: 'Green Economy', data: [22, 31, 40, 47, 51, 58.7], borderColor: '#f59e0b',
                                backgroundColor: '#f59e0b', borderWidth: 2, pointRadius: 3, tension: 0.3 },
                            { label: 'Digital Marketing', data: [15, 24, 32, 38, 43, 52.4], borderColor: '#8b5cf6',
                                backgroundColor: '#8b5cf6', borderWidth: 2, pointRadius: 3, tension: 0.3 }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { boxWidth: 8, usePointStyle: true, font: { size: 11,
                                        family: 'Inter' } }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, max: 80, ticks: { callback: function(value) { return value +
                                        '%'; } }, grid: { color: '#f1f5f9' } },
                            x: { grid: { display: false } }
                        }
                    }
                });

                new Chart(document.getElementById('domainRadarChart').getContext('2d'), {
                    type: 'radar',
                    data: {
                        labels: ['Data & Analytics', 'Software Development', 'Cybersecurity',
                            'Business & Management', 'Digital Skills & Tools'
                        ],
                        datasets: [{ label: 'Tingkat Kecocokan', data: [54, 75, 60, 62, 60],
                            backgroundColor: 'rgba(29, 78, 216, 0.2)', borderColor: '#1d4ed8',
                            pointBackgroundColor: '#1d4ed8', borderWidth: 2 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true,
                                max: 100, ticks: { font: { size: 9 } }, grid: { color: '#e2e8f0' } } },
                        plugins: { legend: { display: false } } }
                });

                new Chart(document.getElementById('kurikulumVsIndustriChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Data & Analytics', 'Software Development', 'Cybersecurity',
                            'Business & Management', 'Digital Skills & Tools'
                        ],
                        datasets: [
                            { label: 'Kurikulum', data: [58, 62, 54, 48, 42],
                                backgroundColor: 'rgba(29, 78, 216, 0.7)', borderColor: '#1d4ed8',
                                borderWidth: 1 },
                            { label: 'Industri', data: [75, 68, 62, 58, 54],
                                backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: '#10b981',
                                borderWidth: 1 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value +
                                        '%'; } } }, x: { grid: { display: false } } } }
                });

                new Chart(document.getElementById('tracerDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Bekerja', 'Melanjutkan Studi', 'Berwirausaha', 'Belum Bekerja'],
                        datasets: [{ data: [74.18, 14.22, 5.47, 6.12],
                            backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'], borderWidth: 0 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
                });

                new Chart(document.getElementById('waitingTimeChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['0 - 3 bulan', '4 - 6 bulan', '7 - 12 bulan', '> 12 bulan'],
                        datasets: [{ label: 'Persentase', data: [34.5, 28.9, 23.1, 13.5],
                            backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'], borderRadius: 4 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, max: 40, ticks: { callback: function(value) { return value +
                                        '%'; } } } } }
                });

                new Chart(document.getElementById('kesesuaianDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Sesuai', 'Cukup Sesuai', 'Tidak Sesuai'],
                        datasets: [{ data: [85.1, 11.5, 2.4], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                            borderWidth: 0 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '75%', rotation: -90,
                        plugins: { legend: { display: false } } }
                });

                new Chart(document.getElementById('satisfactionChart').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['1', '2', '3', '4', '5'],
                        datasets: [{ label: 'Persentase', data: [0.5, 1.6, 8.1, 34.5, 55.3],
                            backgroundColor: ['#fca5a5', '#f87171', '#fbbf24', '#60a5fa', '#34d399'],
                        borderRadius: 4 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, max: 60, ticks: { callback: function(value) { return value +
                                        '%'; } } }, x: { grid: { display: false } } } }
                });

                new Chart(document.getElementById('laporanTrendChart').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                        datasets: [
                            { label: 'Laporan Dibuat', data: [8, 6, 10, 12, 9, 14, 11, 16, 13, 18, 15, 20],
                                borderColor: '#1d4ed8', backgroundColor: 'rgba(29, 78, 216, 0.1)', fill: true,
                                tension: 0.3, pointRadius: 3 },
                            { label: 'Laporan Unduh', data: [5, 7, 8, 10, 12, 15, 14, 18, 16, 22, 19, 25],
                                borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true,
                                tension: 0.3, pointRadius: 3 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
                });

                new Chart(document.getElementById('laporanDonutChart').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Kebutuhan Industri', 'Analisis Gap', 'Future Skills', 'Rekomendasi Kurikulum',
                            'Tracer Study'
                        ],
                        datasets: [{ data: [6, 5, 4, 5, 4],
                            backgroundColor: ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'],
                            borderWidth: 0 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
                });
            }

            // ==============================================================
            // 9. ANIMASI ANGKA STATISTIK
            // ==============================================================
            function jalankanAnimasiAngka() {
                const statValues = document.querySelectorAll('.view-section.active .num-animate');
                statValues.forEach(stat => {
                    let textNode = stat.childNodes[0];
                    let text = textNode.nodeValue;
                    if (!text) return;

                    let isCurrency = text.includes('Rp');
                    let isPercent = text.includes('%');
                    let isDecimal = text.includes(',');

                    let endValue = parseFloat(text.replace(/[^0-9,]/g, '').replace(',', '.'));

                    if (!isNaN(endValue)) {
                        let startTime = null;
                        const step = (timestamp) => {
                            if (!startTime) startTime = timestamp;
                            const progress = Math.min((timestamp - startTime) / 1000, 1);
                            const easeOutQuad = progress * (2 - progress);
                            let currentVal = easeOutQuad * endValue;

                            let formattedVal = "";
                            if (isDecimal) {
                                formattedVal = currentVal.toFixed(1).replace('.', ',');
                            } else {
                                formattedVal = Math.floor(currentVal).toLocaleString('id-ID');
                            }

                            textNode.nodeValue = (isCurrency ? 'Rp ' : '') + formattedVal + (isPercent ? '%' :
                                '') + " ";

                            if (progress < 1) window.requestAnimationFrame(step);
                            else {
                                textNode.nodeValue = (isCurrency ? 'Rp ' : '') + (isDecimal ? endValue.toFixed(
                                    1).replace('.', ',') : endValue.toLocaleString('id-ID')) + (
                                    isPercent ? '%' : '') + " ";
                            }
                        };
                        window.requestAnimationFrame(step);
                    }
                });
            }

            // ==============================================================
            // 10. NAVIGASI MENU DASHBOARD
            // ==============================================================
            const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
            const viewSections = document.querySelectorAll('.view-section');

            navItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => nav.classList.remove(
                    'active'));
                    this.classList.add('active');

                    viewSections.forEach(section => section.classList.remove('active'));

                    const targetId = this.getAttribute('data-target');
                    document.getElementById(targetId).classList.add('active');

                    jalankanAnimasiAngka();
                    document.querySelectorAll('.user-profile').forEach(el => el.classList.remove('show'));
                });
            });

            // ==============================================================
            // 12. ANTARMUKA JOBPROVIDER
            //     Ringkasan Rekrutmen · Kelola Kompetensi · Rekomendasi Kandidat
            // ==============================================================
            const JP_DEMO_KEY = 'c-dfs_jp_demo_v2';
            const JP = { demo: false, kompetensi: [], shortlist: [], candidates: [] };

            const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const allProdi = () => Object.entries(PRODI_BY_JALUR).flatMap(([jalur, list]) => list.map(p => ({...p, jalur})));
            const prodiKode = (nama) => (allProdi().find(p => p.nama === nama) || {}).kode || nama;

            // Kandidat contoh hanya dipakai saat PHP/MySQL belum aktif (mode demo)
            const JP_DEMO_CANDIDATES = [
                {id: 'd1', name: 'Alya Rahma', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Teknologi Rekayasa Sistem Elektronika'},
                {id: 'd2', name: 'Bima Pratama', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Teknologi Rekayasa Sistem Elektronika'},
                {id: 'd3', name: 'Citra Lestari', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Manajemen Pemasaran'},
                {id: 'd4', name: 'Dimas Saputra', instansi: 'Universitas Negeri Malang', jalur: 'Vocational', prodi: 'Manajemen Pemasaran'},
                {id: 'd5', name: 'Eka Wulandari', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Matematika'},
                {id: 'd6', name: 'Fajar Nugroho', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Matematika'},
                {id: 'd7', name: 'Gita Anjani', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Anak Usia Dini (PAUD)'},
                {id: 'd8', name: 'Hana Puspita', instansi: 'Universitas Negeri Malang', jalur: 'Akademis', prodi: 'Pendidikan Anak Usia Dini (PAUD)'}
            ];

            function jpSaveDemo() {
                try { sessionStorage.setItem(JP_DEMO_KEY, JSON.stringify({kompetensi: JP.kompetensi, shortlist: JP.shortlist})); } catch (e) {}
            }
            async function jpLoad() {
                const res = await apiRequest('jp_bootstrap');
                if (res && res.success) {
                    JP.demo = false;
                    JP.kompetensi = res.kompetensi || [];
                    JP.shortlist = (res.shortlist || []).map(String);
                    JP.candidates = res.candidates || [];
                } else {
                    JP.demo = true;
                    let saved = {};
                    try { saved = JSON.parse(sessionStorage.getItem(JP_DEMO_KEY) || '{}'); } catch (e) {}
                    JP.kompetensi = saved.kompetensi || [];
                    JP.shortlist = saved.shortlist || [];
                    JP.candidates = JP_DEMO_CANDIDATES;
                }
            }

            // ---------- Skor kecocokan kandidat terhadap daftar kompetensi ----------
            function jpMatch(cand) {
                const profil = (PRODI_SKILLS[cand.prodi] || []).map(s => s.toLowerCase());
                const hit = [], miss = [];
                JP.kompetensi.forEach(k => {
                    const n = k.nama.toLowerCase();
                    (profil.some(p => p === n || p.includes(n) || n.includes(p)) ? hit : miss).push(k.nama);
                });
                const prodiOk = JP.kompetensi.some(k => k.prodi === cand.prodi);
                const total = JP.kompetensi.length;
                const score = total ? Math.round((prodiOk ? 40 : 0) + 60 * hit.length / total) : 0;
                return {score, hit, miss, prodiOk};
            }
            const jpRanked = () => JP.candidates.map(c => ({c, m: jpMatch(c), sl: JP.shortlist.includes(String(c.id))}))
                .sort((a, b) => b.m.score - a.m.score);

            // ---------- Ringkasan Rekrutmen ----------
            function jpRenderDashboard() {
                document.getElementById('jpCompanyName').textContent = sessionStorage.getItem('c-dfs_user_instansi') || 'Perusahaan Anda';
                const prodiSet = new Set(JP.kompetensi.map(k => k.prodi));
                const ranked = jpRanked();
                document.getElementById('jpStatKompetensi').textContent = JP.kompetensi.length;
                document.getElementById('jpStatProdi').textContent = `untuk ${prodiSet.size} program studi`;
                document.getElementById('jpStatKandidat').textContent = ranked.filter(r => r.m.score >= 60).length;
                document.getElementById('jpStatShortlist').textContent = JP.shortlist.length;

                const byProdi = allProdi().map(p => ({...p, n: JP.kompetensi.filter(k => k.prodi === p.nama).length}));
                const maxN = Math.max(1, ...byProdi.map(p => p.n));
                document.getElementById('jpProdiBars').innerHTML = byProdi.map(p => `
                    <div class="jp-prodi-row">
                        <span class="name">${esc(p.kode)} <span class="jp-muted">· ${esc(p.jalur)}</span></span>
                        <span class="val">${p.n}</span>
                        <div class="track"><div class="fill" style="width:${(p.n / maxN) * 100}%"></div></div>
                    </div>`).join('');

                const top = JP.kompetensi.length ? ranked.slice(0, 5) : [];
                document.getElementById('jpTopBody').innerHTML = top.length ? top.map(({c, m, sl}) => `
                    <tr>
                        <td><strong>${esc(c.name)}</strong>${JP.demo ? '<span class="jp-demo-badge">CONTOH</span>' : ''}</td>
                        <td>${esc(prodiKode(c.prodi))} <span class="jp-muted">· ${esc(c.jalur)}</span></td>
                        <td class="text-center"><strong>${m.score}%</strong></td>
                        <td class="text-center">${sl ? '<span class="badge badge-orange">Shortlist</span>' : '<span class="jp-muted">-</span>'}</td>
                    </tr>`).join('')
                    : `<tr><td colspan="4" class="text-center jp-muted" style="padding:24px;">Tambahkan kompetensi terlebih dahulu agar kandidat bisa dinilai.</td></tr>`;
            }

            // ---------- Kelola Kompetensi ----------
            const jpKompProdi = document.getElementById('jpKompProdi');
            jpKompProdi.innerHTML = allProdi().map(p => `<option value="${esc(p.nama)}">${esc(p.kode)} — ${esc(p.nama)}</option>`).join('');

            function jpRenderSuggest() {
                const prodi = jpKompProdi.value;
                const ada = JP.kompetensi.filter(k => k.prodi === prodi).map(k => k.nama.toLowerCase());
                const pool = (PRODI_SKILLS[prodi] || []).filter(s => !ada.includes(s.toLowerCase()));
                const box = document.getElementById('jpKompSuggest');
                box.innerHTML = pool.length ? `<span class="jp-muted" style="width:100%;">Saran untuk ${esc(prodiKode(prodi))} (klik untuk menambah):</span>` : '';
                pool.forEach(s => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.textContent = '+ ' + s;
                    b.addEventListener('click', () => jpAddKompetensi(s, prodi));
                    box.appendChild(b);
                });
            }
            jpKompProdi.addEventListener('change', jpRenderSuggest);

            async function jpAddKompetensi(nama, prodi) {
                nama = nama.trim();
                if (!nama) return;
                if (JP.kompetensi.some(k => k.prodi === prodi && k.nama.toLowerCase() === nama.toLowerCase())) {
                    return showToast('Kompetensi sudah ada');
                }
                if (JP.demo) {
                    JP.kompetensi.push({id: 'k' + Date.now(), nama, prodi});
                    jpSaveDemo();
                } else {
                    const res = await apiRequest('jp_kompetensi_add', {nama, prodi});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal menambah kompetensi.');
                    JP.kompetensi.push(res.kompetensi);
                }
                showToast('Kompetensi ditambahkan');
                jpRenderAll();
            }
            document.getElementById('formJpKompetensi').addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('jpKompNama');
                jpAddKompetensi(input.value, jpKompProdi.value);
                input.value = '';
                input.focus();
            });

            function jpRenderKompetensi() {
                document.getElementById('jpKompCount').textContent = `${JP.kompetensi.length} kompetensi`;
                document.getElementById('jpKompBody').innerHTML = JP.kompetensi.length ? JP.kompetensi.map((k, i) => `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td><strong>${esc(k.nama)}</strong></td>
                        <td><span class="badge badge-blue">${esc(prodiKode(k.prodi))}</span> <span class="jp-muted">${esc(k.prodi)}</span></td>
                        <td class="text-center"><button class="jp-btn-sm danger" data-hapus="${esc(k.id)}" aria-label="Hapus ${esc(k.nama)}"><i class="fa-regular fa-trash-can"></i> Hapus</button></td>
                    </tr>`).join('')
                    : `<tr><td colspan="4" class="text-center jp-muted" style="padding:24px;">Belum ada kompetensi. Tambahkan lewat form di atas atau klik saran.</td></tr>`;
                jpRenderSuggest();
            }
            document.getElementById('jpKompBody').addEventListener('click', async (e) => {
                const b = e.target.closest('button[data-hapus]');
                if (!b) return;
                const k = JP.kompetensi.find(x => String(x.id) === b.dataset.hapus);
                if (!k) return;
                if (!JP.demo) {
                    const res = await apiRequest('jp_kompetensi_delete', {id: k.id});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal menghapus.');
                }
                JP.kompetensi = JP.kompetensi.filter(x => x !== k);
                if (JP.demo) jpSaveDemo();
                showToast('Kompetensi dihapus');
                jpRenderAll();
            });

            // ---------- Rekomendasi Kandidat ----------
            const jpFilterProdi = document.getElementById('jpFilterProdi');
            jpFilterProdi.innerHTML = '<option value="">Semua program studi</option>' +
                allProdi().map(p => `<option value="${esc(p.nama)}">${esc(p.kode)} — ${esc(p.nama)}</option>`).join('');

            function jpRenderCandidates() {
                const grid = document.getElementById('jpCandidateGrid');
                const empty = (icon, msg) => `<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid ${icon}"></i>${msg}</div>`;
                if (!JP.kompetensi.length) {
                    grid.innerHTML = empty('fa-list-check', 'Tambahkan kompetensi di menu <strong>Kelola Kompetensi</strong> agar kandidat bisa dinilai.');
                    return;
                }
                if (!JP.candidates.length) {
                    grid.innerHTML = empty('fa-user-graduate', 'Belum ada Jobseeker yang memilih program studi.');
                    return;
                }
                const minSkor = parseInt(document.getElementById('jpFilterSkor').value, 10);
                const onlyShort = document.getElementById('jpHanyaShortlist').checked;
                const prodi = jpFilterProdi.value;
                const rows = jpRanked().filter(r => r.m.score >= minSkor && (!onlyShort || r.sl) && (!prodi || r.c.prodi === prodi));
                if (!rows.length) {
                    grid.innerHTML = empty('fa-filter', 'Tidak ada kandidat yang memenuhi filter. Coba turunkan skor minimal.');
                    return;
                }
                grid.innerHTML = rows.map(({c, m, sl}) => {
                    const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    const level = m.score >= 60 ? '' : (m.score >= 40 ? 'mid' : 'low');
                    return `
                    <div class="jp-cand">
                        <div class="jp-cand-head">
                            <div class="jp-cand-avatar">${esc(initials)}</div>
                            <div>
                                <div class="jp-cand-name">${esc(c.name)}${JP.demo ? '<span class="jp-demo-badge">DATA CONTOH</span>' : ''}</div>
                                <div class="jp-cand-sub">${esc(prodiKode(c.prodi))} · ${esc(c.jalur)} · ${esc(c.instansi || '-')}</div>
                            </div>
                            <div class="jp-score"><strong>${m.score}%</strong><span>kecocokan</span></div>
                        </div>
                        <div class="jp-meter ${level}"><div style="width:${m.score}%"></div></div>
                        <div class="jp-cand-sub">${m.prodiOk ? '<i class="fa-solid fa-circle-check" style="color:#16a34a"></i> Prodi dibutuhkan' : '<i class="fa-solid fa-circle-minus"></i> Prodi di luar kebutuhan'} · ${m.hit.length}/${JP.kompetensi.length} kompetensi cocok</div>
                        <div class="jp-cand-skills">
                            ${m.hit.map(s => `<span class="s hit">${esc(s)}</span>`).join('')}
                            ${m.miss.map(s => `<span class="s miss">${esc(s)}</span>`).join('')}
                        </div>
                        <button class="jp-btn-sm ${sl ? 'primary' : ''}" data-short="${esc(c.id)}">
                            <i class="fa-${sl ? 'solid' : 'regular'} fa-bookmark"></i> ${sl ? 'Di-shortlist' : 'Tambah ke Shortlist'}
                        </button>
                    </div>`;
                }).join('');
            }
            document.getElementById('jpCandidateGrid').addEventListener('click', async (e) => {
                const b = e.target.closest('button[data-short]');
                if (!b) return;
                const id = b.dataset.short;
                const on = !JP.shortlist.includes(id);
                if (!JP.demo) {
                    const res = await apiRequest('jp_shortlist', {jobseeker_id: id, on});
                    if (!res || !res.success) return alert((res && res.message) || 'Gagal memperbarui shortlist.');
                }
                JP.shortlist = on ? [...JP.shortlist, id] : JP.shortlist.filter(x => x !== id);
                if (JP.demo) jpSaveDemo();
                showToast(on ? 'Kandidat ditambahkan ke shortlist' : 'Kandidat dihapus dari shortlist');
                jpRenderCandidates();
                jpRenderDashboard();
            });
            ['jpFilterProdi', 'jpFilterSkor', 'jpHanyaShortlist'].forEach(id =>
                document.getElementById(id).addEventListener('change', jpRenderCandidates));

            // ---------- Navigasi & inisialisasi ----------
            function jpGoto(target) {
                const nav = document.querySelector(`.sidebar-nav .nav-item[data-target="${target}"]`);
                if (nav) nav.click();
            }
            document.querySelectorAll('.jp-goto').forEach(b => b.addEventListener('click', () => jpGoto(b.dataset.goto)));

            function jpRenderAll() {
                jpRenderDashboard();
                jpRenderKompetensi();
                jpRenderCandidates();
            }
            async function initJobprovider() {
                await jpLoad();
                jpRenderAll();
            }

            // Tampilkan menu & halaman sesuai peran
            function applyRoleLayout() {
                const role = sessionStorage.getItem('c-dfs_user_role') || 'Jobseeker';
                document.body.dataset.role = role;
                const first = role === 'Jobprovider' ? 'view-jp-dashboard' : 'view-dashboard';
                document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === first));
                document.querySelectorAll('.view-section').forEach(v => v.classList.toggle('active', v.id === first));
                if (role === 'Jobprovider') initJobprovider(); else initJobMatching();
            }

            // ==============================================================
            // 13. TAB PADA HALAMAN GABUNGAN
            // ==============================================================
            document.querySelectorAll('.page-tabs').forEach(bar => {
                bar.addEventListener('click', (e) => {
                    const btn = e.target.closest('.tab-btn');
                    if (!btn) return;
                    const g = bar.dataset.group;
                    bar.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
                    document.querySelectorAll(`.tab-panel[data-group="${g}"]`).forEach(p =>
                        p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
                    jalankanAnimasiAngka();
                });
            });

            // ==============================================================
            // 14. JOB MATCHING (Jobseeker)
            //     Upload transkrip & sertifikat -> deteksi otomatis -> analisis AI
            // ==============================================================
            const JM_DEMO_KEY = 'c-dfs_jm_demo_v2';
            // Bobot nilai mengikuti pedoman UM (A-=3,7; B+=3,3; dst.). Jika transkrip memuat nilai angka (NA), angka itu yang dipakai.
            const GRADE = {'A': 4, 'A-': 3.7, 'AB': 3.5, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'BC': 2.5, 'C+': 2.3, 'C': 2, 'D': 1, 'E': 0};
            const bobot = (m) => (typeof m.na === 'number' && m.na >= 0 && m.na <= 4) ? m.na : (GRADE[m.nilai] ?? 0);
            const JM = { loaded: false, demo: false, aiEnabled: false, mk: [], mkMeta: {}, cert: [], lowongan: [], results: [], roles: [], sort: 'peluang' };

            // Lowongan contoh — hanya tampil saat PHP/MySQL belum aktif
            const JM_DEMO_LOWONGAN = [
                {id: 'd1', perusahaan: 'PT Contoh Elektronika', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Rangkaian Elektronika', 'Mikrokontroler', 'Internet of Things (IoT)', 'PLC & Otomasi']},
                {id: 'd2', perusahaan: 'PT Contoh Niaga', prodi: 'Manajemen Pemasaran', kompetensi: ['Digital Marketing', 'Riset Pasar', 'Penjualan (Sales)']},
                {id: 'd3', perusahaan: 'CV Contoh Data', prodi: 'Matematika', kompetensi: ['Analisis Data', 'Statistika', 'Pemrograman Python']},
                {id: 'd4', perusahaan: 'TK Contoh Ceria', prodi: 'Pendidikan Anak Usia Dini (PAUD)', kompetensi: ['Perencanaan Pembelajaran', 'Asesmen Perkembangan', 'Media Ajar Kreatif']}
            ];

            // Profil pekerjaan (kompetensi inti) untuk rekomendasi "cocok di pekerjaan apa".
            // Sesuaikan dengan profil lulusan / CPL masing-masing prodi.
            const JOB_ROLES = [
                {nama: 'Teknisi Elektronika', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Elektronika Analog', 'Elektronika Digital', 'Rangkaian Listrik', 'Pengukuran Elektronika', 'Pemeliharaan dan Perbaikan Perangkat Elektronika']},
                {nama: 'Embedded System Engineer', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Mikrokontroler', 'Embedded System', 'Algoritma dan Pemrograman', 'Elektronika Digital']},
                {nama: 'IoT Engineer', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Internet of Things', 'Sensor dan Transduser', 'Komputer dan Jaringan', 'Mikrokontroler']},
                {nama: 'Teknisi Instrumentasi & Kontrol', prodi: 'Teknologi Rekayasa Sistem Elektronika', kompetensi: ['Instrumentasi', 'Sistem Kendali', 'Sensor dan Transduser', 'PLC']},
                {nama: 'Digital Marketing Specialist', prodi: 'Manajemen Pemasaran', kompetensi: ['Digital Marketing', 'Media Sosial', 'Komunikasi Pemasaran', 'Periklanan']},
                {nama: 'Sales Executive', prodi: 'Manajemen Pemasaran', kompetensi: ['Penjualan', 'Negosiasi', 'Perilaku Konsumen', 'Komunikasi Bisnis']},
                {nama: 'Market Research Analyst', prodi: 'Manajemen Pemasaran', kompetensi: ['Riset Pasar', 'Riset Pemasaran', 'Statistika', 'Perilaku Konsumen']},
                {nama: 'Data Analyst', prodi: 'Matematika', kompetensi: ['Analisis Data', 'Statistika', 'Pemrograman', 'Basis Data']},
                {nama: 'Analis Risiko / Aktuaria', prodi: 'Matematika', kompetensi: ['Teori Peluang', 'Statistika Matematika', 'Matematika Keuangan', 'Aktuaria']},
                {nama: 'Programmer / Analis Komputasi', prodi: 'Matematika', kompetensi: ['Algoritma dan Pemrograman', 'Metode Numerik', 'Struktur Data', 'Pemrograman']},
                {nama: 'Guru PAUD / TK', prodi: 'Pendidikan Anak Usia Dini (PAUD)', kompetensi: ['Perencanaan Pembelajaran', 'Kurikulum PAUD', 'Asesmen Perkembangan', 'Manajemen Kelas']},
                {nama: 'Fasilitator Tumbuh Kembang Anak', prodi: 'Pendidikan Anak Usia Dini (PAUD)', kompetensi: ['Psikologi Perkembangan Anak', 'Gizi Anak', 'Deteksi Dini Tumbuh Kembang', 'Bimbingan Anak']},
                {nama: 'Pengembang Media Ajar Anak', prodi: 'Pendidikan Anak Usia Dini (PAUD)', kompetensi: ['Media Pembelajaran', 'Alat Permainan Edukatif', 'Seni Anak', 'Literasi Anak']}
            ];
            const kodeProdi = (nama) => { for (const l of Object.values(PRODI_BY_JALUR)) { const p = l.find(x => x.nama === nama); if (p) return p.kode; } return nama || '-'; };
            const jalurOf = (nama) => Object.keys(PRODI_BY_JALUR).find(j => PRODI_BY_JALUR[j].some(p => p.nama === nama)) || '';

            // ---------- Pencocokan teks kompetensi ----------
            const STOP = new Set(['dan', 'atau', 'the', 'of', 'and', 'untuk', 'dengan', 'dalam', 'pada', 'dasar', 'lanjut', 'lanjutan', 'pengantar', 'praktik', 'praktikum', 'teori', 'sistem', 'teknik', 'manajemen', 'pengembangan', 'aplikasi', 'tenaga', 'mata', 'kuliah']);
            const tokens = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length >= 3 && !STOP.has(w));
            // Kata umum: tidak cukup sendirian untuk menyatakan cocok
            const WEAK = new Set(['digital', 'data', 'dasar', 'terapan', 'umum', 'modern', 'bisnis', 'industri', 'komputer', 'profesional', 'fundamentals', 'fundamental', 'kreatif', 'anak', 'matematika']);
            const same = (x, y) => x === y || (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x)));
            // Skor kemiripan: 0 = tidak terkait; makin besar = makin banyak kata yang sama
            function relScore(a, b) {
                const ta = tokens(a), tb = tokens(b);
                if (!ta.length || !tb.length) return 0;
                const hits = ta.filter(x => tb.some(y => same(x, y)));
                const ok = hits.some(x => !WEAK.has(x)) || hits.length === ta.length;
                return ok ? hits.length / ta.length + hits.length / tb.length : 0;
            }
            const related = (a, b) => relScore(a, b) > 0;

            function jmIpk() {
                const sks = JM.mk.reduce((a, m) => a + Number(m.sks), 0);
                const mutu = JM.mk.reduce((a, m) => a + Number(m.sks) * bobot(m), 0);
                return {ipk: sks ? mutu / sks : 0, sks};
            }
            // Bukti untuk satu kompetensi dari dokumen (mata kuliah & sertifikat)
            function evidenceFor(k, withProfil) {
                // Pilih bukti dengan nilai tertinggi; jika sama, pilih yang namanya paling mirip
                let best = {v: 0, r: 0, src: 'Belum ada bukti', mk: null};
                const consider = (v, r, src, mk) => { if (r > 0 && (v > best.v || (v === best.v && r > best.r))) best = {v, r, src, mk}; };
                JM.mk.forEach(m => consider(bobot(m) / 4, relScore(k, m.nama), `MK ${m.nama} (${m.nilai})`, m.nama));
                JM.cert.forEach(c => consider(c.jenis === 'BNSP' ? 1 : 0.8, relScore(k, c.nama), `Sertifikat ${c.jenis}: ${c.nama}`, null));
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                if (withProfil && best.v < 0.5 && (PRODI_SKILLS[prodi] || []).some(p => related(k, p))) best = {v: 0.5, r: 0, src: 'Profil kompetensi prodi', mk: null};
                return best;
            }
            function jmAnalyze(low) {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const detail = low.kompetensi.map(k => ({nama: k, ...evidenceFor(k, true)}));
                const avg = detail.length ? detail.reduce((a, d) => a + d.v, 0) / detail.length : 0;
                const prodiOk = !!prodi && prodi === low.prodi;
                const kecocokan = Math.round((prodiOk ? 30 : 0) + 70 * avg);
                const {ipk} = jmIpk();
                const nB = JM.cert.filter(c => c.jenis === 'BNSP').length, nN = JM.cert.length - nB;
                const certStrength = Math.min(1, (nB + 0.5 * nN) / 2);
                const peluang = Math.round(0.6 * kecocokan + 25 * (ipk / 4) + 15 * certStrength);
                const kategori = peluang >= 75 ? 'Tinggi' : (peluang >= 50 ? 'Sedang' : 'Rendah');
                return {low, detail, kecocokan, peluang, kategori, prodiOk,
                    terpenuhi: detail.filter(d => d.v >= 0.5).map(d => d.nama),
                    kurang: detail.filter(d => d.v < 0.5).map(d => d.nama)};
            }
            function jmRoles() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const all = JOB_ROLES.map(r => {
                    const detail = r.kompetensi.map(k => ({nama: k, ...evidenceFor(k, false)}));
                    const skor = Math.round(100 * detail.reduce((a, d) => a + d.v, 0) / detail.length);
                    const dukung = [...new Set(detail.filter(d => d.v > 0).map(d => d.src))];
                    return {...r, skor, dukung, kurang: detail.filter(d => d.v === 0).map(d => d.nama), sendiri: r.prodi === prodi};
                }).sort((a, b) => b.skor - a.skor);
                const own = all.filter(r => r.sendiri);
                const other = all.filter(r => !r.sendiri && r.skor >= 50).slice(0, 1).map(r => ({...r, lintas: true}));
                return (own.length ? own : all.slice(0, 3)).concat(other).filter(r => r.skor > 0).slice(0, 5);
            }

            // ---------- Muat & simpan ----------
            async function jmLoad() {
                const res = await apiRequest('js_profile');
                if (res && res.success) {
                    JM.demo = false;
                    JM.aiEnabled = !!res.ai_enabled;
                    JM.mk = res.transkrip || [];
                    JM.mkMeta = res.transkrip_meta || {};
                    JM.cert = res.sertifikat || [];
                    JM.lowongan = res.lowongan || [];
                } else {
                    JM.demo = true;
                    JM.aiEnabled = false;
                    let saved = {};
                    try { saved = JSON.parse(sessionStorage.getItem(JM_DEMO_KEY) || '{}'); } catch (e) {}
                    JM.mk = saved.mk || [];
                    JM.mkMeta = saved.mkMeta || {};
                    JM.cert = saved.cert || [];
                    JM.lowongan = JM_DEMO_LOWONGAN;
                }
                JM.loaded = true;
            }
            async function jmSave() {
                if (JM.demo) {
                    try { sessionStorage.setItem(JM_DEMO_KEY, JSON.stringify({mk: JM.mk, mkMeta: JM.mkMeta, cert: JM.cert})); } catch (e) {}
                    return true;
                }
                const res = await apiRequest('js_profile_save', {transkrip: JM.mk, transkrip_meta: JM.mkMeta, sertifikat: JM.cert});
                if (!res || !res.success) { alert((res && res.message) || 'Gagal menyimpan data.'); return false; }
                return true;
            }

            // ---------- Membaca PDF di browser (pdf.js) ----------
            let pdfjsPromise = null;
            function loadPdfJs() {
                if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
                if (!pdfjsPromise) pdfjsPromise = new Promise((resolve, reject) => {
                    const sc = document.createElement('script');
                    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    sc.onload = () => {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        resolve(window.pdfjsLib);
                    };
                    sc.onerror = () => { pdfjsPromise = null; reject(new Error('Pustaka pembaca PDF gagal dimuat (periksa koneksi internet).')); };
                    document.head.appendChild(sc);
                });
                return pdfjsPromise;
            }
            // Susun teks PDF menjadi baris berdasarkan posisi vertikal
            async function pdfLines(file) {
                const pdfjs = await loadPdfJs();
                const doc = await pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer())}).promise;
                const out = [];
                for (let n = 1; n <= Math.min(doc.numPages, 15); n++) {
                    const page = await doc.getPage(n);
                    const tc = await page.getTextContent();
                    const rows = [];
                    tc.items.forEach(it => {
                        if (!it.str || !it.str.trim()) return;
                        const x = it.transform[4], y = it.transform[5];
                        let row = rows.find(r => Math.abs(r.y - y) < 3);
                        if (!row) { row = {y, items: []}; rows.push(row); }
                        row.items.push({x, s: it.str.trim()});
                    });
                    rows.sort((a, b) => b.y - a.y).forEach(r => out.push(r.items.sort((a, b) => a.x - b.x).map(i => i.s).join(' ').replace(/\s+/g, ' ').trim()));
                }
                return out;
            }
            const fileToBase64 = (file) => new Promise((res, rej) => {
                const fr = new FileReader();
                fr.onload = () => res(String(fr.result).split(',')[1]);
                fr.onerror = rej;
                fr.readAsDataURL(file);
            });
            async function aiExtract(kind, file) {
                if (!JM.aiEnabled) return null;
                if (file.size > 5 * 1024 * 1024) { showToast('File terlalu besar untuk dibaca AI (maks. 5 MB)'); return null; }
                const res = await apiRequest('js_ai_extract', {kind, media_type: file.type || 'application/pdf', data: await fileToBase64(file)});
                return res && res.success && res.data ? res.data : null;
            }

            // ---------- Deteksi transkrip ----------
            const GRADE_RE = '(A-|AB|A|B\\+|B-|BC|B|C\\+|C|D|E)';
            // Mata kuliah umum/wajib universitas (tidak dihitung sebagai "nilai terbaik" bidang)
            const RE_UMUM = /^(UNIV|UKKN|MKU|MKDU|MPK|MKWU)/i;
            const NAMA_UMUM = /(agama|pancasila|kewarganegaraan|bahasa indonesia|kuliah kerja nyata|\bkkn\b|kemampuan kerjasama|etika profesi)/i;
            function parseTranskrip(lines) {
                const rows = [];
                const reKode = new RegExp('^\\d{1,3}\\s+([A-Z]{2,8}\\d{3,8})\\s+(.+?)\\s+(\\d{1,2})\\s+(?:(\\d(?:[.,]\\d{1,2})?)\\s+)?' + GRADE_RE + '(?:\\s|$)');
                const reUmum = new RegExp('^(?:\\d{1,3}\\s+)?(?:([A-Z]{2,8}\\d{3,8})\\s+)?([A-Za-z][^\\d]*?(?:\\s\\d)?)\\s+(\\d{1,2})\\s+(?:(\\d(?:[.,]\\d{1,2})?)\\s+)?' + GRADE_RE + '(?:\\s|$)');
                let prodiText = '', ipkDoc = null;
                lines.forEach(line => {
                    const pm = line.match(/Program\s*Studi\s*:?\s*(.+)/i);
                    if (pm && !prodiText) prodiText = pm[1].trim();
                    const im = line.match(/\bIPK\s*:?\s*([0-4](?:[.,]\d{1,2})?)\b/i);
                    if (im) ipkDoc = parseFloat(im[1].replace(',', '.'));
                    if (/^\s*IP[K]?\s*[\d.,]/i.test(line)) return;
                    const m = line.match(reKode) || line.match(reUmum);
                    if (!m) return;
                    const kode = m[1] || '', nama = m[2].replace(/\s+/g, ' ').trim(), sks = parseInt(m[3], 10);
                    const na = m[4] ? parseFloat(m[4].replace(',', '.')) : null, nilai = m[5].toUpperCase();
                    if (nama.length >= 3 && sks >= 1 && sks <= 8 && nilai in GRADE) {
                        const row = {nama, sks, nilai};
                        if (na !== null && na <= 4) row.na = na;
                        if (RE_UMUM.test(kode) || NAMA_UMUM.test(nama)) row.umum = true;
                        rows.push(row);
                    }
                });
                const prodi = matchProdi(prodiText);
                return {rows, prodiText, prodi, ipkDoc};
            }
            function matchProdi(text) {
                if (!text) return '';
                const t = text.toLowerCase();
                for (const l of Object.values(PRODI_BY_JALUR)) for (const p of l) {
                    const core = p.nama.toLowerCase().replace(/\s*\(.*\)\s*/, '');
                    if (t.includes(core) || new RegExp('\\b' + p.kode.toLowerCase() + '\\b').test(t)) return p.nama;
                }
                return '';
            }
            function applyDetectedProdi(prodi) {
                if (!prodi) return;
                const cur = sessionStorage.getItem('c-dfs_user_prodi') || '';
                if (cur === prodi) return;
                sessionStorage.setItem('c-dfs_user_jalur', jalurOf(prodi));
                sessionStorage.setItem('c-dfs_user_prodi', prodi);
                renderJobseekerDashboard();
                cdfsUpdateProdi(jalurOf(prodi), prodi);
                showToast(`Program Studi diatur otomatis: ${prodi}`);
            }

            async function handleTranskrip(file) {
                if (!file) return;
                const info = document.getElementById('jmTranskripInfo');
                info.classList.remove('is-hidden');
                info.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Membaca dokumen...';
                let hasil = null, sumber = '';
                try {
                    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
                        hasil = parseTranskrip(await pdfLines(file));
                        sumber = 'Deteksi otomatis';
                    }
                } catch (e) { console.warn(e); }
                if ((!hasil || !hasil.rows.length) && JM.aiEnabled) {
                    info.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Format tidak dikenali, dokumen dibaca oleh AI...';
                    const d = await aiExtract('transkrip', file);
                    if (d && Array.isArray(d.mata_kuliah)) {
                        hasil = {
                            rows: d.mata_kuliah.map(m => ({nama: String(m.nama || '').trim(), sks: parseInt(m.sks, 10) || 0, nilai: String(m.nilai || '').toUpperCase().trim()}))
                                .filter(m => m.nama && m.sks >= 1 && m.sks <= 8 && m.nilai in GRADE).map(m => NAMA_UMUM.test(m.nama) ? {...m, umum: true} : m),
                            prodiText: d.prodi || '', prodi: matchProdi(d.prodi || ''), ipkDoc: d.ipk ? Number(d.ipk) : null
                        };
                        sumber = 'Dibaca AI';
                    }
                }
                if (!hasil || !hasil.rows.length) {
                    info.innerHTML = `<div class="jm-detect-warn"><i class="fa-solid fa-triangle-exclamation"></i> Mata kuliah tidak terdeteksi dari <strong>${escHtml(file.name)}</strong>.
                        ${JM.aiEnabled ? 'Pastikan file adalah transkrip yang jelas.' : 'Pastikan PDF berupa teks (bukan hasil scan), atau isi API key AI di php/config.php agar dokumen scan bisa dibaca.'}
                        Anda juga bisa menambah mata kuliah secara manual di bagian bawah.</div>`;
                    document.getElementById('jmManual').open = true;
                    return;
                }
                JM.mk = hasil.rows;
                JM.mkMeta = {file: file.name, sumber, prodi_dokumen: hasil.prodiText, ipk_dokumen: hasil.ipkDoc};
                applyDetectedProdi(hasil.prodi);
                await jmSave();
                jmRenderMk();
                showToast(`${hasil.rows.length} mata kuliah terdeteksi`);
            }

            // ---------- Deteksi sertifikat ----------
            const RE_BNSP = /\bBNSP\b|Badan\s+Nasional\s+Sertifikasi\s+Profesi|Lembaga\s+Sertifikasi\s+Profesi|\bLSP\b|National\s+Professional\s+Certification\s+Agency/i;
            const cleanName = (n) => n.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
            function parseSertifikat(lines, fileName) {
                const text = lines.join('\n');
                const jenis = RE_BNSP.test(text) ? 'BNSP' : 'Non-BNSP';
                let nama = '', lembaga = '';
                // Urutan prioritas: Skema > Kualifikasi/Okupasi/Klaster > "Bidang/Unit Kompetensi :"
                const POLA = [
                    /(?:Skema(?:\s+Sertifikasi)?|Certification\s+Scheme|Scheme)\s*[:\-]\s*(.*)$/i,
                    /(?:Kualifikasi|Qualification|Okupasi|Occupation|Klaster|Cluster)\s*[:\-]\s*(.*)$/i,
                    /(?:Bidang|Unit)\s+Kompetensi\s*[:\-]\s*(.*)$/i
                ];
                for (const re of POLA) {
                    for (let i = 0; i < lines.length && !nama; i++) {
                        const m = lines[i].match(re);
                        if (m) { const v = (m[1] || '').trim(); nama = v.length >= 3 ? v : (lines[i + 1] || '').trim(); }
                    }
                    if (nama) break;
                }
                for (const l of lines) {
                    const lm = l.match(/(LSP\s+[A-Za-z0-9 .\-]{3,70}|Lembaga\s+Sertifikasi\s+Profesi\s+[A-Za-z0-9 .\-]{3,70})/i);
                    if (lm) { lembaga = lm[1].trim(); break; }
                }
                if (!nama) {
                    // Sertifikat umum: ambil baris setelah "Sertifikat / Certificate of ..." atau "telah menyelesaikan"
                    for (let i = 0; i < lines.length; i++) {
                        if (/(certificate\s+of|sertifikat|piagam|telah\s+(menyelesaikan|mengikuti|lulus)|has\s+(successfully\s+)?completed)/i.test(lines[i])) {
                            const after = lines[i].replace(/.*?(certificate\s+of\s+\w+|sertifikat|piagam|telah\s+(menyelesaikan|mengikuti|lulus)|has\s+(successfully\s+)?completed)\s*:?/i, '').trim();
                            nama = after.length >= 4 ? after : '';
                            if (nama) break;
                        }
                    }
                }
                return {nama: (nama || cleanName(fileName)).slice(0, 150), jenis, lembaga: lembaga.slice(0, 150)};
            }
            async function handleSertifikat(files) {
                for (const file of files) {
                    const item = {nama: cleanName(file.name), jenis: /bnsp|lsp/i.test(file.name) ? 'BNSP' : 'Non-BNSP', lembaga: '', file: file.name, sumber: 'Perlu dicek'};
                    JM.cert.push(item);
                    jmRenderCert(JM.cert.length - 1);
                    try {
                        let ok = false;
                        if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
                            const lines = await pdfLines(file);
                            if (lines.join('').replace(/\s/g, '').length > 30) {
                                Object.assign(item, parseSertifikat(lines, file.name), {sumber: 'Deteksi otomatis'});
                                ok = true;
                            }
                        }
                        if (!ok && JM.aiEnabled) {
                            const d = await aiExtract('sertifikat', file);
                            if (d && d.nama) {
                                Object.assign(item, {nama: String(d.nama).slice(0, 150), jenis: d.jenis === 'BNSP' ? 'BNSP' : 'Non-BNSP', lembaga: String(d.lembaga || '').slice(0, 150), sumber: 'Dibaca AI'});
                                ok = true;
                            }
                        }
                    } catch (e) { console.warn(e); }
                    jmRenderCert();
                }
                await jmSave();
                showToast(`${files.length} sertifikat diproses`);
            }

            // ---------- Drag & drop ----------
            function setupDrop(zoneId, inputId, handler, multiple) {
                const zone = document.getElementById(zoneId), input = document.getElementById(inputId);
                input.addEventListener('change', () => { if (input.files.length) handler(multiple ? [...input.files] : input.files[0]); input.value = ''; });
                ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
                ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
                zone.addEventListener('drop', (e) => { const f = [...e.dataTransfer.files]; if (f.length) handler(multiple ? f : f[0]); });
            }
            setupDrop('jmDropTranskrip', 'jmFileTranskrip', handleTranskrip, false);
            setupDrop('jmDropCert', 'jmFileCert', handleSertifikat, true);

            // ---------- Render ----------
            function jmRefreshStats() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '';
                const jalur = sessionStorage.getItem('c-dfs_user_jalur') || '';
                document.getElementById('jmStatProdi').textContent = prodi ? kodeProdi(prodi) : '-';
                document.getElementById('jmStatJalur').textContent = prodi ? `${jalur} · ${prodi}` : 'Terdeteksi dari transkrip';
                const {ipk, sks} = jmIpk();
                document.getElementById('jmStatIpk').textContent = ipk.toFixed(2).replace('.', ',');
                document.getElementById('jmStatSks').textContent = `${sks} SKS · ${JM.mk.length} mata kuliah`;
                const nB = JM.cert.filter(c => c.jenis === 'BNSP').length;
                document.getElementById('jmStatCert').textContent = JM.cert.length;
                document.getElementById('jmStatCertDetail').textContent = `${nB} BNSP · ${JM.cert.length - nB} Non-BNSP`;
                document.getElementById('jmStatLowongan').textContent = `dari ${JM.lowongan.length} lowongan${JM.demo ? ' (contoh)' : ''}`;
            }
            function bestCourses(n) {
                const bidang = JM.mk.filter(m => !m.umum);
                return [...(bidang.length ? bidang : JM.mk)].sort((a, b) => (bobot(b) - bobot(a)) || (b.sks - a.sks)).slice(0, n);
            }
            function jmRenderMk() {
                const body = document.getElementById('jmMkBody');
                document.getElementById('jmMkCount').textContent = JM.mk.length;
                body.innerHTML = JM.mk.length ? JM.mk.map((m, i) => {
                    const g = bobot(m);
                    const cls = g >= 3.5 ? 'g-hi' : (g >= 2.5 ? 'g-mid' : 'g-lo');
                    return `<tr><td>${escHtml(m.nama)}${m.umum ? ' <span class="jm-umum">umum</span>' : ''}</td><td class="text-center">${escHtml(m.sks)}</td>
                        <td class="text-center"><span class="jm-grade ${cls}">${escHtml(m.nilai)}</span></td>
                        <td class="text-center"><button class="jm-icon-btn" data-del-mk="${i}" aria-label="Hapus ${escHtml(m.nama)}"><i class="fa-regular fa-trash-can"></i></button></td></tr>`;
                }).join('') : '<tr><td colspan="4" class="text-center jp-muted" style="padding:20px;">Belum ada data. Upload transkrip PDF di atas.</td></tr>';

                const info = document.getElementById('jmTranskripInfo');
                const badge = document.getElementById('jmMkSourceBadge');
                if (JM.mk.length) {
                    const {ipk, sks} = jmIpk();
                    const meta = JM.mkMeta || {};
                    const ipkDoc = meta.ipk_dokumen;
                    const cocokIpk = ipkDoc ? Math.abs(ipkDoc - ipk) < 0.02 : null;
                    info.classList.remove('is-hidden');
                    info.innerHTML = `
                        <div class="jm-detect-ok">
                            <i class="fa-solid fa-circle-check"></i>
                            <div>
                                <strong>${JM.mk.length} mata kuliah · ${sks} SKS terdeteksi</strong>${meta.file ? ` dari <em>${escHtml(meta.file)}</em>` : ''}
                                <div class="jm-detect-meta">
                                    ${meta.prodi_dokumen ? `<span><i class="fa-solid fa-graduation-cap"></i> ${escHtml(meta.prodi_dokumen)}</span>` : ''}
                                    <span><i class="fa-solid fa-calculator"></i> IPK dihitung ${ipk.toFixed(2).replace('.', ',')}</span>
                                    ${ipkDoc ? `<span class="${cocokIpk ? 'ok' : 'warn'}"><i class="fa-solid ${cocokIpk ? 'fa-check' : 'fa-triangle-exclamation'}"></i> IPK di dokumen ${String(ipkDoc).replace('.', ',')}${cocokIpk ? ' (sesuai)' : ' (berbeda, cek data)'}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
                    badge.textContent = meta.sumber || 'Input manual';
                    badge.classList.remove('is-hidden');
                    document.getElementById('jmBestBox').classList.remove('is-hidden');
                    document.getElementById('jmBestList').innerHTML = bestCourses(6).map(m => `
                        <div class="jm-best-item"><span class="jm-grade g-hi">${escHtml(m.nilai)}</span><span class="nm">${escHtml(m.nama)}</span><span class="sks">${escHtml(m.sks)} SKS</span></div>`).join('');
                } else {
                    info.classList.add('is-hidden');
                    badge.classList.add('is-hidden');
                    document.getElementById('jmBestBox').classList.add('is-hidden');
                }
                jmRefreshStats();
            }
            function jmRenderCert() {
                const box = document.getElementById('jmCertListView');
                box.innerHTML = JM.cert.length ? JM.cert.map((c, i) => `
                    <div class="jm-cert">
                        <div class="jm-cert-main">
                            <select class="jm-cert-jenis ${c.jenis === 'BNSP' ? 'bnsp' : 'non'}" data-i="${i}" aria-label="Jenis sertifikat">
                                <option ${c.jenis === 'BNSP' ? 'selected' : ''}>BNSP</option><option ${c.jenis !== 'BNSP' ? 'selected' : ''}>Non-BNSP</option>
                            </select>
                            <input class="jm-cert-nama" data-i="${i}" value="${escHtml(c.nama)}" aria-label="Nama sertifikat" list="jmCertList" />
                            <button class="jm-icon-btn" data-del-cert="${i}" aria-label="Hapus ${escHtml(c.nama)}"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                        <div class="jm-cert-meta">
                            <span class="src ${c.sumber === 'Perlu dicek' ? 'warn' : ''}">${escHtml(c.sumber || 'Manual')}</span>
                            ${c.lembaga ? `<span>${escHtml(c.lembaga)}</span>` : ''}
                            ${c.file ? `<span class="file"><i class="fa-regular fa-file"></i> ${escHtml(c.file)}</span>` : ''}
                        </div>
                    </div>`).join('') : '<p class="jp-muted" style="text-align:center;padding:10px;">Belum ada sertifikat.</p>';
                jmRefreshStats();
            }
            document.getElementById('jmCertListView').addEventListener('change', async (e) => {
                const i = e.target.dataset.i;
                if (i === undefined) return;
                if (e.target.classList.contains('jm-cert-jenis')) JM.cert[i].jenis = e.target.value;
                if (e.target.classList.contains('jm-cert-nama')) JM.cert[i].nama = e.target.value.trim().slice(0, 150);
                JM.cert[i].sumber = 'Dikoreksi manual';
                jmRenderCert();
                await jmSave();
            });
            document.getElementById('jmCertListView').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-del-cert]');
                if (b) { JM.cert.splice(+b.dataset.delCert, 1); jmRenderCert(); await jmSave(); }
            });
            document.getElementById('formJmMk').addEventListener('submit', async (e) => {
                e.preventDefault();
                const nama = document.getElementById('jmMkNama').value.trim();
                if (!nama) return;
                JM.mk.push({nama, sks: Math.max(1, parseInt(document.getElementById('jmMkSks').value, 10) || 1), nilai: document.getElementById('jmMkNilai').value});
                if (!JM.mkMeta.sumber) JM.mkMeta.sumber = 'Input manual';
                document.getElementById('jmMkNama').value = '';
                jmRenderMk();
                await jmSave();
            });
            document.getElementById('jmMkBody').addEventListener('click', async (e) => {
                const b = e.target.closest('[data-del-mk]');
                if (b) { JM.mk.splice(+b.dataset.delMk, 1); jmRenderMk(); await jmSave(); }
            });

            // ---------- Hasil analisis ----------
            function jmLocalNarrative() {
                const prodi = sessionStorage.getItem('c-dfs_user_prodi') || '-';
                const {ipk} = jmIpk();
                const top = JM.results[0];
                const tinggi = JM.results.filter(r => r.kategori === 'Tinggi');
                const best = bestCourses(3).map(m => `${m.nama} (${m.nilai})`).join(', ');
                const roles = JM.roles.filter(r => !r.lintas).slice(0, 2).map(r => `**${r.nama}** (${r.skor}%)`).join(' dan ');
                const relevan = JM.results.filter(r => r.prodiOk);
                const kurang = [...new Set((relevan.length ? relevan : JM.results.slice(0, 1)).flatMap(r => r.kurang))].slice(0, 3);
                let t = `Transkrip menunjukkan IPK ${ipk.toFixed(2).replace('.', ',')} dengan nilai terbaik pada ${best || '-'}. `;
                t += `Sertifikat yang terdeteksi: ${JM.cert.length ? JM.cert.map(c => `${c.nama} (${c.jenis})`).join(', ') : 'belum ada'}.`;
                t += '\n\n';
                if (roles) t += `Berdasarkan kedua dokumen, Anda paling cocok bekerja sebagai ${roles}. `;
                if (top) t += tinggi.length ? `Ada **${tinggi.length} lowongan dengan peluang tinggi**; yang paling relevan adalah **${top.low.perusahaan}** (kecocokan ${top.kecocokan}%, peluang ${top.peluang}%).`
                    : `Lowongan paling relevan saat ini adalah **${top.low.perusahaan}** (kecocokan ${top.kecocokan}%, peluang ${top.peluang}%).`;
                else t += 'Belum ada lowongan dari Jobprovider untuk dicocokkan.';
                t += '\n\n';
                const langkah = [];
                kurang.forEach(k => langkah.push(`Perkuat kompetensi ${k} melalui mata kuliah pilihan, proyek, atau pelatihan.`));
                if (!JM.cert.some(c => c.jenis === 'BNSP')) langkah.push('Ambil sertifikasi BNSP pada skema yang sesuai bidang Anda untuk menaikkan skor peluang.');
                if (langkah.length) t += 'Langkah berikutnya:\n' + langkah.slice(0, 3).map(l => `- ${l}`).join('\n');
                return t;
            }
            function jmMd(text) {
                const blocks = escHtml(text).split(/\n{2,}/);
                return blocks.map(b => {
                    const lines = b.split('\n');
                    const isLi = (l) => /^\s*[-*•]\s+/.test(l);
                    const li = (l) => `<li>${l.replace(/^\s*[-*•]\s+/, '')}</li>`;
                    if (lines.every(isLi)) return '<ul>' + lines.map(li).join('') + '</ul>';
                    if (lines.length > 1 && lines.slice(1).every(isLi)) return `<p>${lines[0]}</p><ul>` + lines.slice(1).map(li).join('') + '</ul>';
                    return '<p>' + lines.join('<br>') + '</p>';
                }).join('').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            }
            function jmRenderRoles() {
                const grid = document.getElementById('jmRoleGrid');
                grid.innerHTML = JM.roles.length ? JM.roles.map((r, i) => `
                    <div class="jm-role ${i === 0 ? 'best' : ''}">
                        <div class="jm-role-head">
                            <div><strong>${escHtml(r.nama)}</strong><span>${r.lintas ? 'Alternatif lintas prodi · ' : ''}${escHtml(kodeProdi(r.prodi))}</span></div>
                            <div class="jm-role-score">${r.skor}%</div>
                        </div>
                        <div class="jm-bar"><div style="width:${r.skor}%"></div></div>
                        <div class="jm-role-ev">${r.dukung.slice(0, 4).map(d => `<span>${escHtml(d)}</span>`).join('')}</div>
                        ${r.kurang.length ? `<div class="jm-role-gap">Belum terlihat: ${r.kurang.map(escHtml).join(', ')}</div>` : ''}
                    </div>`).join('')
                    : '<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid fa-briefcase"></i>Belum ada mata kuliah atau sertifikat yang terkait dengan profil pekerjaan.</div>';
            }
            function jmRenderResults() {
                const grid = document.getElementById('jmJobGrid');
                const rows = [...JM.results].sort((a, b) => b[JM.sort] - a[JM.sort]);
                document.getElementById('jmStatTinggi').textContent = JM.results.filter(r => r.kategori === 'Tinggi').length;
                if (!rows.length) {
                    grid.innerHTML = '<div class="jp-empty-block" style="grid-column:1/-1;"><i class="fa-solid fa-briefcase"></i>Belum ada lowongan dari Jobprovider. Lowongan muncul setelah Jobprovider mengisi menu Kelola Kompetensi.</div>';
                    return;
                }
                grid.innerHTML = rows.map((r, i) => `
                    <div class="jm-job ${i === 0 ? 'best' : ''}">
                        <div class="jm-job-top">
                            <div>
                                <div class="jm-job-co">${escHtml(r.low.perusahaan)}${JM.demo ? '<span class="jp-demo-badge">DATA CONTOH</span>' : ''}</div>
                                <div class="jm-job-sub">Kebutuhan ${escHtml(kodeProdi(r.low.prodi))} · ${r.low.kompetensi.length} kompetensi ${r.prodiOk ? '· <span style="color:#16a34a;font-weight:600;">sesuai prodi Anda</span>' : ''}</div>
                            </div>
                            <span class="jm-chance ${r.kategori.toLowerCase()}">Peluang ${r.kategori}</span>
                        </div>
                        <div class="jm-scores">
                            <div class="jm-score-box"><span>Kecocokan</span><strong>${r.kecocokan}%</strong><div class="jm-bar"><div style="width:${r.kecocokan}%"></div></div></div>
                            <div class="jm-score-box"><span>Peluang</span><strong>${r.peluang}%</strong><div class="jm-bar peluang"><div style="width:${r.peluang}%"></div></div></div>
                        </div>
                        <div class="jm-komp-list">
                            ${r.detail.map(d => `<div class="jm-komp ${d.v >= 0.5 ? '' : 'miss'}">
                                <i class="fa-solid ${d.v >= 0.5 ? 'fa-circle-check ok' : 'fa-circle-xmark no'}"></i>
                                <span>${escHtml(d.nama)}</span><span class="src">${escHtml(d.src)}</span></div>`).join('')}
                        </div>
                        ${r.kurang.length ? `<div class="jm-tip"><i class="fa-solid fa-lightbulb"></i> Perkuat <strong>${r.kurang.slice(0, 2).map(escHtml).join('</strong> dan <strong>')}</strong> melalui mata kuliah pilihan, pelatihan, atau sertifikasi BNSP pada skema terkait.</div>` : '<div class="jm-tip"><i class="fa-solid fa-star"></i> Semua kompetensi lowongan ini sudah didukung bukti dari transkrip/sertifikat Anda.</div>'}
                    </div>`).join('');
            }
            document.querySelectorAll('#jmSort .seg-btn').forEach(b => b.addEventListener('click', () => {
                JM.sort = b.dataset.sort;
                document.querySelectorAll('#jmSort .seg-btn').forEach(x => x.classList.toggle('active', x === b));
                jmRenderResults();
            }));

            document.getElementById('jmRunBtn').addEventListener('click', async () => {
                if (!JM.mk.length) return alert('Upload transkrip nilai (PDF) terlebih dahulu.');
                if (!sessionStorage.getItem('c-dfs_user_prodi')) return alert('Program studi belum terdeteksi. Pilih program studi di halaman Dashboard.');
                const btn = document.getElementById('jmRunBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menganalisis...';
                try {
                    if (!(await jmSave())) return;
                    if (!JM.demo) { const fresh = await apiRequest('js_profile'); if (fresh && fresh.success) JM.lowongan = fresh.lowongan || []; }
                    JM.results = JM.lowongan.map(jmAnalyze).sort((a, b) => b.peluang - a.peluang);
                    JM.roles = jmRoles();
                    jmRefreshStats();
                    document.getElementById('jmResults').classList.remove('is-hidden');
                    jmRenderRoles();
                    jmRenderResults();

                    const aiText = document.getElementById('jmAiText');
                    const src = document.getElementById('jmAiSource');
                    aiText.innerHTML = '<p class="jp-muted"><i class="fa-solid fa-spinner fa-spin"></i> AI sedang menyusun analisis...</p>';
                    let ai = null;
                    if (!JM.demo && JM.aiEnabled) {
                        const {ipk, sks} = jmIpk();
                        ai = await apiRequest('js_ai_analisis', {
                            prodi: sessionStorage.getItem('c-dfs_user_prodi'), ipk: +ipk.toFixed(2), sks,
                            nilai_terbaik: bestCourses(8),
                            sertifikat: JM.cert.map(c => ({nama: c.nama, jenis: c.jenis, lembaga: c.lembaga})),
                            pekerjaan_cocok: JM.roles.map(r => ({pekerjaan: r.nama, skor: r.skor, bukti: r.dukung.slice(0, 4), belum_terlihat: r.kurang})),
                            lowongan: JM.results.slice(0, 5).map(r => ({perusahaan: r.low.perusahaan, prodi_lowongan: r.low.prodi,
                                kecocokan: r.kecocokan, peluang: r.peluang, kategori: r.kategori, terpenuhi: r.terpenuhi, kurang: r.kurang}))
                        });
                    }
                    if (ai && ai.success && ai.ai && ai.text) {
                        aiText.innerHTML = jmMd(ai.text);
                        src.textContent = 'Dibuat oleh AI (Claude)';
                    } else {
                        aiText.innerHTML = jmMd(jmLocalNarrative());
                        src.textContent = JM.aiEnabled ? 'Ringkasan otomatis (AI tidak terhubung)' : 'Ringkasan otomatis';
                    }
                    document.getElementById('jmResults').scrollIntoView({behavior: 'smooth', block: 'start'});
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analisis dengan AI';
                }
            });

            async function initJobMatching() {
                await jmLoad();
                JM.results = [];
                document.getElementById('jmResults').classList.add('is-hidden');
                document.getElementById('jmStatTinggi').textContent = '-';
                document.getElementById('jmCertList').innerHTML = Object.values(PRODI_SKILLS).flat().map(n => `<option value="${escHtml(n)}"></option>`).join('');
                jmRenderMk();
                jmRenderCert();
            }

            // ==============================================================
            // 11. INISIALISASI
            // ==============================================================
            showLanding();

            if (window.location.search.includes('dashboard')) {
                showDashboard();
            }

            if (window.location.search.includes('login')) {
                showAuth();
                setMode('login');
            }

        });
