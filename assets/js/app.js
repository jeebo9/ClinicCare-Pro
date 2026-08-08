
// API Base URL
const API_URL = '/api';

// Multi-language support
const LANGUAGES = ['so', 'en', 'ar'];
let currentLang = localStorage.getItem('clinic_lang') || 'so';

const TRANSLATIONS = {
    so: {
        dashboard: 'Dashboard',
        patients: 'Bukaannada',
        appointments: 'Ballamaha',
        billing: 'Lacagaha',
        users: 'Isticmaalayaasha',
        settings: 'Dejinta',
        logout: 'Ka Bax',
        search: 'Raadi...',
        add: 'Kudar',
        welcome: 'Soo dhowow',
        // ...add more as needed
    },
    en: {
        dashboard: 'Dashboard',
        patients: 'Patients',
        appointments: 'Appointments',
        billing: 'Billing',
        users: 'Users',
        settings: 'Settings',
        logout: 'Logout',
        search: 'Search...',
        add: 'Add',
        welcome: 'Welcome',
        // ...add more as needed
    },
    ar: {
        dashboard: 'لوحة القيادة',
        patients: 'المرضى',
        appointments: 'المواعيد',
        billing: 'الفواتير',
        users: 'المستخدمون',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        search: 'بحث...',
        add: 'إضافة',
        welcome: 'مرحبا',
        // ...add more as needed
    }
};

function setLanguage(lang) {
    if (!LANGUAGES.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem('clinic_lang', lang);
    translatePage();
}

function translatePage() {
    // Example: translate nav menu and some static elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[currentLang][key]) {
            el.textContent = TRANSLATIONS[currentLang][key];
        }
    });
}

// Add language selector to sidebar if not present
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('lang-selector')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const langDiv = document.createElement('div');
            langDiv.id = 'lang-selector';
            langDiv.style = 'margin: 1rem 0; text-align: center;';
            langDiv.innerHTML = `
                <select style="padding:0.3rem 0.7rem;border-radius:6px;" onchange="setLanguage(this.value)">
                    <option value="so">Af-Soomaali</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                </select>
            `;
            sidebar.appendChild(langDiv);
            langDiv.querySelector('select').value = currentLang;
        }
    }
    translatePage();
});

// Global state
let patients = [];
let appointments = [];
let users = [];
// AI Expanded mode settings & history
const AI_HISTORY_KEY = 'clinic_ai_history';
const AI_EXPANDED_KEY = 'clinic_ai_expanded_mode';
const AI_MAX_PAIRS = 100; // max Q&A pairs

function loadAIExpandedMode() {
    try {
        return localStorage.getItem(AI_EXPANDED_KEY) === '1';
    } catch (e) { return false; }
}

function setAIExpandedMode(enabled) {
    try {
        localStorage.setItem(AI_EXPANDED_KEY, enabled ? '1' : '0');
    } catch (e) {}
}

function loadAIHistory() {
    try {
        const raw = localStorage.getItem(AI_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveAIHistory(arr) {
    try {
        localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(arr));
    } catch (e) {}
}

function clearAIHistory() {
    saveAIHistory([]);
    showToast('AI history cleared', 'success');
    const body = document.getElementById('ai-chat-body');
    if (body) {
        body.innerHTML = `<div class="ai-message system">${(localStorage.getItem('clinic_lang')==='so')?"Salama Alaikum! Anigu waxaan ahay ClinicCare AI. Sidee baan kuu caawin karaa maanta?":"Hello! I am ClinicCare AI. How can I help you today?"}</div>`;
    }
}

function exportAIHistory() {
    const arr = loadAIHistory();
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinic_ai_history.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Fetch Data from Backend
async function fetchData() {
    try {
        const [patientsRes, appointmentsRes] = await Promise.all([
            fetch(`${API_URL}/patients`),
            fetch(`${API_URL}/appointments`)
        ]);
        patients = await patientsRes.json();
        appointments = await appointmentsRes.json();
        
        // Fetch users if on users.html
        if (window.location.pathname.endsWith('users.html')) {
            const usersRes = await fetch(`${API_URL}/users`);
            users = await usersRes.json();
        }
        
        // Refresh UI based on current page
        const path = window.location.pathname.toLowerCase();
        if (path.includes('dashboard') || path === '/' || path === '') initDashboard();
        if (path.includes('patients')) initPatients();
        if (path.includes('appointments')) initAppointments();
        if (path.includes('users')) initUsers();
        
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// Users Logic
function initUsers() {
    renderUsersTable(users);
    setupModal('new-user-modal', 'btn-new-user', 'close-user-modal');
    
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const username = e.target.dataset.username;
            const newRole = e.target.value;
            await updateUserRole(username, newRole);
        });
    });
}

function renderUsersTable(data) {
    const grid = document.querySelector('.user-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (data.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-muted);padding:2rem;">No users found</div>';
        return;
    }
    data.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card slide-in';
        card.innerHTML = `
            <div class="user-actions">
                <button class="btn btn-outline" style="padding:0.4rem 0.6rem;border:none;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            </div>
            <div class="user-card-header">
                <div class="user-info">
                    <div class="avatar" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">${user.name ? user.name[0] : 'U'}</div>
                    <div>
                        <h3 style="font-size:1.1rem;color:var(--text-main);">${user.name || 'Unknown'}</h3>
                        <div class="role-badge role-${(user.role || 'user').toLowerCase()}">${user.role || 'User'}</div>
                    </div>
                </div>
            </div>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;"><i class="fa-solid fa-envelope" style="margin-right:0.5rem;"></i> ${user.username}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-building" style="margin-right:0.5rem;"></i> ${user.department || ''}</p>
            <div class="user-stats">
                <div class="stat-item">
                    <div class="stat-value" style="color:var(--success);">Online</div>
                    <div class="stat-label">Status</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">-</div>
                    <div class="stat-label">Last Login</div>
                </div>
            </div>
            <div style="margin-top:1rem;">
                <label style="font-size:0.8rem;color:var(--text-muted);">Role:</label>
                <select class="role-select" data-username="${user.username}" style="width:100%;padding:0.5rem;margin-top:0.3rem;">
                    <option value="Admin" ${user.role==='Admin'?'selected':''}>Admin</option>
                    <option value="Doctor" ${user.role==='Doctor'?'selected':''}>Doctor</option>
                    <option value="Receptionist" ${user.role==='Receptionist'?'selected':''}>Receptionist</option>
                    <option value="Lab Technician" ${user.role==='Lab Technician'?'selected':''}>Lab Technician</option>
                </select>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function updateUserRole(username, role) {
    try {
        const res = await fetch(`${API_URL}/users/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (res.ok) {
            showToast(`Role updated to ${role} for ${username}`, 'success');
        }
    } catch (err) {
        console.error('Error updating role:', err);
    }
}

// Patients Logic
function initPatients() {
    renderPatientsTable(patients);
    setupModal('new-patient-modal', 'btn-new-patient', 'close-patient-modal');
    
    const patientForm = document.getElementById('patient-form');
    if (patientForm) {
        patientForm.addEventListener('submit', handleAddPatient);
    }
}

function renderPatientsTable(data) {
    const tbody = document.getElementById('patients-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach((pt, index) => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.innerHTML = `
            <td>
                <div style="font-weight:700;color:var(--primary);">${pt.id}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">Registered: ${pt.regDate || 'N/A'}</div>
            </td>
            <td>
                <div style="font-weight:600;">${pt.name}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${pt.phone}</div>
            </td>
            <td>${pt.gender || 'N/A'} / ${pt.age} Yrs</td>
            <td><span class="badge badge-success">Active</span></td>
            <td>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-outline" style="padding:0.4rem;" onclick="printPatientCard('${pt.id}', '${pt.name}', '${pt.phone}', '${pt.age}')"><i class="fa-solid fa-address-card"></i> Card</button>
                    <button class="btn btn-outline" style="padding:0.4rem;" onclick="loadMedicalHistory('${pt.id}','${pt.name}')"><i class="fa-solid fa-notes-medical"></i> History</button>
                    <button class="btn btn-outline" style="padding:0.4rem;"><i class="fa-solid fa-eye"></i> View</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadMedicalHistory(patientId, patientName) {
    try {
        const res = await fetch(`${API_URL}/medical-history/${patientId}`);
        const history = await res.json();
        const container = document.getElementById('medical-history-list');
        if (!container) return;
        if (history.length === 0) {
            container.innerHTML = `<div style="color:var(--text-muted);">No medical history for ${patientName}.</div>`;
            return;
        }
        let html = `<h4 style="margin-bottom:0.75rem;">History for ${patientName}</h4><ul style="padding-left:1rem;">`;
        history.forEach(h => {
            html += `<li style="margin-bottom:0.5rem;"><strong>${h.date}</strong>: ${h.summary} <div style="font-size:0.85rem;color:var(--text-muted);">Doctor: ${h.doctor || 'N/A'}</div></li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Error loading medical history:', err);
    }
}

// Add medical history entry
async function addMedicalHistoryEntry(entry) {
    try {
        const res = await fetch(`${API_URL}/medical-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (res.ok) {
            showToast('Medical history saved', 'success');
        }
    } catch (err) {
        console.error('Error saving medical history:', err);
    }
}

async function handleAddPatient(event) {
    event.preventDefault();
    const name = document.getElementById('p-name').value;
    const phone = document.getElementById('p-phone').value;
    const age = document.getElementById('p-age').value;
    const gender = document.getElementById('p-gender').value;

    const newPatient = {
        id: 'PT-' + String(patients.length + 1).padStart(4, '0'),
        name,
        phone,
        age,
        gender,
        regDate: new Date().toLocaleDateString()
    };

    try {
        const res = await fetch(`${API_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPatient)
        });
        if (res.ok) {
            patients.push(newPatient);
            document.getElementById('new-patient-modal').classList.remove('active');
            document.getElementById('patient-form').reset();
            renderPatientsTable(patients);
            showToast('Bukaan Cusub Waa La Diiwaangeliyay!', 'success');
        }
    } catch (err) {
        console.error('Error adding patient:', err);
    }
}

// Appointments Logic
function initAppointments() {
    renderAppointmentsTable(appointments);
    setupModal('new-appointment-modal', 'btn-new-appointment', 'close-appointment-modal');
    const patientSelect = document.getElementById('a-patient');
    if (patientSelect) {
        patientSelect.innerHTML = '<option value="" disabled selected>-- Choose from registered patients --</option>';
        patients.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = `${p.name} (${p.id})`;
            patientSelect.appendChild(option);
        });
    }
}

function renderAppointmentsTable(data) {
    const tbody = document.getElementById('appointments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    data.forEach((app, index) => {
        let badgeClass = 'badge-primary';
        if (app.status === 'Completed') badgeClass = 'badge-success';
        if (app.status === 'Waiting') badgeClass = 'badge-warning';
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.innerHTML = `
            <td>${app.date}</td>
            <td>${app.time}</td>
            <td class="font-semibold">${app.patientName}</td>
            <td>${app.doctor}</td>
            <td><span class="badge ${badgeClass}">${app.status}</span></td>
            <td>
                ${app.status === 'Waiting' ? 
                    `<button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="markCompleted('${app.id}')">Mark Done</button>` 
                    : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleAddAppointment(event) {
    event.preventDefault();
    const patientName = document.getElementById('a-patient').value;
    const doctor = document.getElementById('a-doctor').value;
    const date = document.getElementById('a-date').value;
    const time = document.getElementById('a-time').value;

    const newApp = {
        id: 'AP-' + String(appointments.length + 1).padStart(3, '0'),
        patientName,
        doctor,
        date,
        time,
        status: 'Upcoming'
    };

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newApp)
        });
        if (res.ok) {
            appointments.push(newApp);
            document.getElementById('new-appointment-modal').classList.remove('active');
            renderAppointmentsTable(appointments);
            showToast('Ballan Cusub Waa La Diwaangeliyay!', 'success');
        }
    } catch (err) {
        console.error('Error adding appointment:', err);
    }
}

async function markCompleted(id) {
    try {
        const res = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Completed' })
        });
        if (res.ok) {
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index].status = 'Completed';
                renderAppointmentsTable(appointments);
            }
        }
    } catch (err) {
        console.error('Error updating appointment:', err);
    }
}

// Modal Helper
function setupModal(modalId, btnId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const btn = document.getElementById(btnId);
    const closeBtn = document.getElementById(closeBtnId);
    if (btn && modal) btn.onclick = () => modal.classList.add('active');
    if (closeBtn && modal) closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); }
}

// Router Initializer
document.addEventListener('DOMContentLoaded', () => {
    // Theme logic
    const savedTheme = localStorage.getItem('clinic_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        // Set initial icon
        if (savedTheme === 'dark') {
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
        
        themeBtn.addEventListener('click', () => {
            let currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('clinic_theme', 'light');
                themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('clinic_theme', 'dark');
                themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        });
    }

    checkAuth();
    fetchData();
    
    const userNameEl = document.getElementById('sidebar-user-name');
    if (userNameEl) userNameEl.textContent = localStorage.getItem('clinic_user') || 'User';

    const navLinks = document.querySelectorAll('.nav-item a, .sidebar-footer a');
    navLinks.forEach(link => {
        if (link.textContent.toLowerCase().includes('logout') || link.querySelector('[data-i18n="logout"]')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });

    window.addEventListener('languageChanged', (e) => {
        // Redraw chart if it exists
        if (window.myChartInstance) {
            window.myChartInstance.destroy();
            window.myChartInstance = null;
            initDashboard();
        }
        
        // Update AI Chat Greeting
        const aiBody = document.getElementById('ai-chat-body');
        if (aiBody && aiBody.children.length === 1 && aiBody.children[0].classList.contains('system')) {
            const greetings = {
                en: "Hello! I am ClinicCare AI. How can I help you today?",
                so: "Salama Alaikum! Anigu waxaan ahay ClinicCare AI. Sidee baan kuu caawin karaa maanta?",
                ar: "مرحباً! أنا مساعد كلينيك كير الذكي. كيف يمكنني مساعدتك اليوم؟"
            };
            aiBody.children[0].textContent = greetings[e.detail] || greetings['en'];
        }
        
        // Update AI Input Placeholder
        const aiInput = document.getElementById('ai-input');
        if (aiInput) {
            const placeholders = {
                en: "Ask a question...",
                so: "Wydii su'aal...",
                ar: "اسأل سؤالاً..."
            };
            aiInput.placeholder = placeholders[e.detail] || placeholders['en'];
        }
    });

    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    if (!document.getElementById('ai-chat-widget') && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        const lang = localStorage.getItem('clinic_lang') || 'en';
        const greetings = {
            en: "Hello! I am ClinicCare AI. How can I help you today?",
            so: "Salama Alaikum! Anigu waxaan ahay ClinicCare AI. Sidee baan kuu caawin karaa maanta?",
            ar: "مرحباً! أنا مساعد كلينيك كير الذكي. كيف يمكنني مساعدتك اليوم؟"
        };
        const placeholders = {
            en: "Ask a question...",
            so: "Wydii su'aal...",
            ar: "اسأل سؤالاً..."
        };

        const aiWidget = document.createElement('div');
        aiWidget.id = 'ai-chat-widget';
        aiWidget.className = 'ai-chat-widget fade-in';
        aiWidget.innerHTML = `
            <div class="ai-chat-header" onclick="toggleAIChat()">
                <span><i class="fa-solid fa-robot"></i> <span data-i18n="brand_name">ClinicCare</span> AI</span>
                <i class="fa-solid fa-chevron-up" id="ai-chat-toggle-icon"></i>
            </div>
            <div class="ai-chat-body" id="ai-chat-body">
                <div class="ai-message system">${greetings[lang] || greetings['en']}</div>
            </div>
            <div class="ai-chat-input">
                <input type="text" id="ai-input" placeholder="${placeholders[lang] || placeholders['en']}" onkeypress="if(event.key === 'Enter') sendAIMessage()">
                <button onclick="sendAIMessage()"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(aiWidget);
    }

    // Initialize AI Expanded controls in Help page if present
    const expandedToggle = document.getElementById('ai-expanded-toggle');
    if (expandedToggle) {
        expandedToggle.checked = loadAIExpandedMode();
        expandedToggle.addEventListener('change', (e) => {
            setAIExpandedMode(e.target.checked);
            showToast('Expanded Q&A ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
        });
    }

    const aiClearBtn = document.getElementById('ai-clear-history');
    if (aiClearBtn) aiClearBtn.addEventListener('click', (e) => { e.preventDefault(); clearAIHistory(); });

    const aiExportBtn = document.getElementById('ai-export-history');
    if (aiExportBtn) aiExportBtn.addEventListener('click', (e) => { e.preventDefault(); exportAIHistory(); });

    // Add WhatsApp Floating Button
    if (!document.getElementById('wa-floating-btn')) {
        const waBtn = document.createElement('a');
        waBtn.id = 'wa-floating-btn';
        waBtn.href = 'https://wa.me/252654828586';
        waBtn.target = '_blank';
        waBtn.className = 'wa-float-btn fade-in';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        waBtn.style.position = 'fixed';
        waBtn.style.bottom = '20px';
        waBtn.style.left = '20px';
        waBtn.style.backgroundColor = '#25D366';
        waBtn.style.color = '#FFF';
        waBtn.style.borderRadius = '50px';
        waBtn.style.textAlign = 'center';
        waBtn.style.fontSize = '35px';
        waBtn.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
        waBtn.style.zIndex = '9999';
        waBtn.style.width = '60px';
        waBtn.style.height = '60px';
        waBtn.style.display = 'flex';
        waBtn.style.alignItems = 'center';
        waBtn.style.justifyContent = 'center';
        waBtn.style.textDecoration = 'none';
        document.body.appendChild(waBtn);
    }

    // Add Mobile Menu Toggle Button
    if (!document.getElementById('mobile-menu-toggle')) {
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'mobile-menu-toggle';
        toggleBtn.className = 'mobile-toggle fade-in';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        document.body.appendChild(toggleBtn);
        
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-active');
                if (sidebar.classList.contains('mobile-active')) {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                } else {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
                }
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-active');
                toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });
    }
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-check-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'error') icon = 'fa-times-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

function toggleAIChat() {
    const widget = document.getElementById('ai-chat-widget');
    const icon = document.getElementById('ai-chat-toggle-icon');
    if (widget) {
        widget.classList.toggle('expanded');
        if (widget.classList.contains('expanded')) {
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else {
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
    }
}

function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const body = document.getElementById('ai-chat-body');
    const text = input.value.trim();
    if (!text || !body) return;
    
    const lang = localStorage.getItem('clinic_lang') || 'en';
    
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message user fade-in';
    userMsg.textContent = text;
    body.appendChild(userMsg);
    input.value = '';
    body.scrollTop = body.scrollHeight;
    
    // Typing indicator simulation
    const typingMsg = document.createElement('div');
    typingMsg.className = 'ai-message system typing fade-in';
    typingMsg.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    body.appendChild(typingMsg);
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
        typingMsg.remove();
        const aiMsg = document.createElement('div');
        aiMsg.className = 'ai-message system fade-in';
        
        const lowerText = text.toLowerCase();
        let response = "";

        // Knowledge Base & Logic
        const knowledge = {
            system: {
                keywords: ['system', 'dhismaha', 'technology', 'tech', 'stack', 'software', 'nidaamka'],
                responses: {
                    en: "ClinicCare Pro is a high-performance Digital Health Record system built with Node.js, Vanilla JavaScript, and a JSON-based database for maximum speed and security.",
                    so: "ClinicCare Pro waa nidaam caafimaad oo heer sare ah (DHR), kaasoo lagu dhisay Node.js, Vanilla JavaScript, iyo database ku dhisan JSON si loo helo xawaare iyo amni sare.",
                    ar: "كلينيك كير برو هو نظام سجلات صحية رقمي عالي الأداء، تم بناؤه باستخدام Node.js و Vanilla JavaScript وقاعدة بيانات JSON لضمان السرعة والأمان."
                }
            },
            medical: {
                fever: {
                    keywords: ['fever', 'xumad', 'madax xanuun', 'headache', 'حرارة', 'صداع'],
                    responses: {
                        en: "A fever is usually a sign that your body is fighting an infection. Please rest, stay hydrated, and consult a doctor if it exceeds 39°C (102°F).",
                        so: "Xumaddu badanaa waa calaamad muujinaysa in jirkaagu la dagaallamayo caabuq. Fadlan naso, cab biyo badan, lana tasho dhakhtar haddii ay kor u dhaafto 39°C.",
                        ar: "الحمى هي عادة علامة على أن جسمك يحارب العدوى. يرجى الراحة وشرب الكثير من السوائل واستشارة الطبيب إذا تجاوزت 39 درجة مئوية."
                    }
                },
                diabetes: {
                    keywords: ['diabetes', 'sonkor', 'sukari', 'sugar', 'سكري'],
                    responses: {
                        en: "Diabetes management involves monitoring blood glucose levels, a healthy diet, and regular exercise. Consult our specialist for a personalized plan.",
                        so: "Maareynta sonkorowga waxay u baahantahay la socodka heerka sonkorta dhiigga, cunto caafimaad leh, iyo jimicsi joogto ah. Kala tasho takhasuskayaga qorshe gaar ah.",
                        ar: "تتضمن إدارة السكري مراقبة مستويات الجلوكوز في الدم، واتباع نظامائي صحي، وممارسة الرياضة بانتظام. استشر أخصائينا للحصول على خطة مخصصة."
                    }
                }
            }
        };

        // Real-time System Stats
        if (lowerText.includes('bukan') || lowerText.includes('patient') || lowerText.includes('مريض')) {
            const count = patients.length;
            const ptResponses = {
                en: `We currently have ${count} patients registered in our system. You can manage them in the 'Patients Management' section.`,
                so: `Hadda waxaan haynaa ${count} bukaan oo ku diiwaangashan system-ka. Waxaad ka maamuli kartaa qaybta 'Patients Management'.`,
                ar: `لدينا حالياً ${count} مريض مسجل في النظام. يمكنك إدارتهم في قسم 'إدارة المرضى'.`
            };
            response = ptResponses[lang] || ptResponses['en'];
        } else if (lowerText.includes('ballan') || lowerText.includes('appointment') || lowerText.includes('موعد')) {
            const today = new Date().toISOString().split('T')[0];
            const count = appointments.filter(a => a.date === today).length;
            const appResponses = {
                en: `There are ${count} appointments scheduled for today. Check the 'Appointments' module for the full schedule.`,
                so: `Maanta waxaa jira ${count} ballamood oo loo qorsheeyay. Ka eeg qaybta 'Appointments' jadwalka oo dhan.`,
                ar: `هناك ${count} مواعيد مجدولة لهذا اليوم. تحقق من وحدة 'المواعيد' للجدول الكامل.`
            };
            response = appResponses[lang] || appResponses['en'];
        } else if (knowledge.system.keywords.some(k => lowerText.includes(k))) {
            response = knowledge.system.responses[lang] || knowledge.system.responses['en'];
        } else {
            // Check Medical keywords
            for (const key in knowledge.medical) {
                if (knowledge.medical[key].keywords.some(k => lowerText.includes(k))) {
                    response = knowledge.medical[key].responses[lang] || knowledge.medical[key].responses['en'];
                    break;
                }
            }
        }

        // Fallback random responses
        if (!response) {
            const defaults = {
                en: ["I'm listening, tell me more.", "I can help with system data or general health info.", "Could you clarify your question?", "ClinicCare Pro is here to support you."],
                so: ["Waan ku dhaysanayaa, iisheeg wax kasta.", "Waxaan kaa caawin karaa xogta system-ka ama caafimaadka guud.", "Fadlan su'aasha iisii sharax?", "ClinicCare Pro waxay halkan u joogtaa inay ku caawiso."],
                ar: ["أنا أستمع، أخبرني المزيد.", "يمكنني المساعدة في بيانات النظام أو المعلومات الصحية العامة.", "هل يمكنك توضيح سؤالك؟", "كلينيك كير برو هنا لدعمك."]
            };
            const langDefaults = defaults[lang] || defaults['en'];
            response = langDefaults[Math.floor(Math.random() * langDefaults.length)];
        }
        
        aiMsg.textContent = response;
        body.appendChild(aiMsg);
        // Save to AI history when Expanded mode is enabled
        try {
            if (loadAIExpandedMode()) {
                const hist = loadAIHistory();
                // push user then ai responses as pairs; ensure ordering
                hist.push({ role: 'user', text: text, time: Date.now() });
                hist.push({ role: 'ai', text: response, time: Date.now() });
                // Trim to last AI_MAX_PAIRS * 2 entries
                const maxEntries = AI_MAX_PAIRS * 2;
                if (hist.length > maxEntries) {
                    hist.splice(0, hist.length - maxEntries);
                }
                saveAIHistory(hist);
            }
        } catch (e) {
            console.error('AI history save failed', e);
        }
        body.scrollTop = body.scrollHeight;
    }, 1200);
}

function printPatientCard(id, name, phone, age) {
    let printArea = document.getElementById('print-area');
    if (!printArea) {
        printArea = document.createElement('div');
        printArea.id = 'print-area';
        document.body.appendChild(printArea);
    }
    const today = new Date().toLocaleDateString();
    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; border: 2px solid #3b82f6; border-radius: 10px; text-align: center;">
            <div style="background: #3b82f6; color: white; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 20px;">CLINICCARE PRO</h2>
                <p style="margin: 0; font-size: 12px;">Patient Identity Card</p>
            </div>
            <div style="margin-bottom: 20px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${id}-${name}" alt="QR Code" style="margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 22px; color: #333;">${name}</h3>
                <p style="margin: 5px 0; color: #666; font-weight: bold; font-size: 18px;">ID: ${id}</p>
            </div>
            <table style="width: 100%; text-align: left; font-size: 14px; color: #444; border-collapse: collapse;">
                <tr><td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td> <td style="padding: 5px; border-bottom: 1px solid #eee;">${phone}</td></tr>
                <tr><td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Age:</strong></td> <td style="padding: 5px; border-bottom: 1px solid #eee;">${age} Years</td></tr>
                <tr><td style="padding: 5px; border-bottom: 1px solid #eee;"><strong>Issued:</strong></td> <td style="padding: 5px; border-bottom: 1px solid #eee;">${today}</td></tr>
            </table>
            <div style="margin-top: 20px; font-size: 10px; color: #888;">This card must be presented at every visit.</div>
        </div>
    `;
    window.print();
}

function initDashboard() {
    const chartCanvas = document.getElementById('patientAnalyticsChart');
    if (chartCanvas && typeof Chart !== 'undefined') {
        const lang = localStorage.getItem('clinic_lang') || 'en';
        const labelsMap = {
            'en': ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'so': ['Sabti', 'Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco'],
            'ar': ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
        };
        const datasetLabelMap = {
            'en': 'New Patients',
            'so': 'Bukaannada Cusub',
            'ar': 'المرضى الجدد'
        };

        const ctx = chartCanvas.getContext('2d');
        // Add a slight delay to ensure container is fully sized
        setTimeout(() => {
            if (window.myChartInstance) window.myChartInstance.destroy();
            window.myChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelsMap[lang] || labelsMap['en'],
                    datasets: [{
                        label: datasetLabelMap[lang] || datasetLabelMap['en'],
                        data: [12, 19, 3, 5, 2, 3, 7],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }, 100);
    }
    
    // Quick Stats Logic
    const statsTotalPatients = document.getElementById('stats-total-patients');
    if (statsTotalPatients) statsTotalPatients.textContent = patients.length;
    
    const statsTodayApp = document.getElementById('stats-today-appointments');
    if (statsTodayApp) {
        const today = new Date().toISOString().split('T')[0];
        statsTodayApp.textContent = appointments.filter(a => a.date === today).length;
    }
    
    renderLiveQueue();
}

function renderLiveQueue() {
    const queueBody = document.getElementById('live-queue-body');
    if (!queueBody) return;
    queueBody.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const todaysApps = appointments.filter(a => a.date === today).slice(0, 5);
    todaysApps.forEach(app => {
        let badgeClass = 'badge-primary';
        if (app.status === 'Waiting') badgeClass = 'badge-warning';
        if (app.status === 'Completed') badgeClass = 'badge-success';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${app.patientName}</td>
            <td>${app.doctor}</td>
            <td>${app.time}</td>
            <td><span class="badge ${badgeClass}">${app.status}</span></td>
        `;
        queueBody.appendChild(tr);
    });
}

function checkAuth() {
    const user = localStorage.getItem('clinic_user');
    if (!user && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('clinic_user');
    window.location.href = 'login.html';
}

// Login & Security Simulation
let _generatedOTP = '';

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    const validUsers = [
        { email: 'admin@gmail.com', pass: 'admin123', name: 'Admin' },
        { email: 'mahad_analyst', pass: 'password123', name: 'Mahad Nuur' }
    ];

    const user = validUsers.find(u => u.email === email && u.pass === pass);

    if (user) {
        localStorage.setItem('clinic_user', user.name);

        // Generate random 4-digit OTP
        _generatedOTP = String(Math.floor(1000 + Math.random() * 9000));
        const digits = _generatedOTP.split('');

        // Show in SMS notification
        const smsDisplay = document.getElementById('sms-otp-display');
        if (smsDisplay) {
            smsDisplay.textContent = digits.join(' ');
        }

        // Fill OTP input boxes
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`otp-${i}`);
            if (input) input.value = digits[i - 1];
        }

        // Show SMS notification then open modal
        const smsNotif = document.getElementById('sms-notif');
        if (smsNotif) {
            smsNotif.classList.add('active');
            setTimeout(() => {
                smsNotif.classList.remove('active');
                document.getElementById('verify-modal').classList.add('active');
            }, 2000);
        } else {
            window.location.href = 'dashboard.html';
        }
    } else {
        showToast('Invalid credentials. Please try again.', 'error');
    }
}

function complete2FA() {
    const entered = [
        document.getElementById('otp-1')?.value,
        document.getElementById('otp-2')?.value,
        document.getElementById('otp-3')?.value,
        document.getElementById('otp-4')?.value
    ].join('');

    if (entered === _generatedOTP) {
        // Close the verify modal first
        document.getElementById('verify-modal').classList.remove('active');
        // Show the beautiful welcome screen
        showWelcomeScreen();
    } else {
        showToast('Wrong code! Please check the SMS and try again.', 'error');
        // Shake the OTP inputs
        const otpContainer = document.getElementById('otp-inputs');
        if (otpContainer) {
            otpContainer.style.animation = 'none';
            otpContainer.offsetHeight; // reflow
            otpContainer.style.animation = 'shake 0.4s ease';
        }
    }
}

function togglePassVisibility() {
    const passInput = document.getElementById('login-password');
    const icon = document.getElementById('toggle-pass');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function startFaceID() {
    const modal = document.getElementById('faceid-modal');
    const video = document.getElementById('face-video');
    const status = document.getElementById('face-status');
    
    modal.classList.add('active');
    status.textContent = "Initializing camera...";

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            status.textContent = "Scanning face... 0%";
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                status.textContent = `Scanning face... ${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    status.textContent = "Face Recognized! Access Granted.";
                    status.style.color = "var(--success)";
                    setTimeout(() => {
                        localStorage.setItem('clinic_user', 'Mahad Ali Nuur');
                        stopFaceID();
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            }, 200);
        })
        .catch(err => {
            console.error(err);
            status.textContent = "Camera access denied or not found.";
            status.style.color = "var(--danger)";
        });
}

function stopFaceID() {
    const modal = document.getElementById('faceid-modal');
    const video = document.getElementById('face-video');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    modal.classList.remove('active');
}

function showWelcomeScreen() {
    const userName = localStorage.getItem('clinic_user') || 'Doctor';
    const lang = localStorage.getItem('clinic_lang') || 'en';

    const welcomeTexts = {
        en: { greeting: 'Welcome Back', sub: 'Your clinic dashboard is ready.', loading: 'Loading your workspace...' },
        so: { greeting: 'Ku soo dhawoow', sub: 'Dashboard-kaagu wuu diyaar yahay.', loading: 'Workspace-kaaga waa la rarayo...' },
        ar: { greeting: 'مرحباً بعودتك', sub: 'لوحة التحكم جاهزة لك.', loading: 'جاري تحميل مساحة العمل...' }
    };
    const t = welcomeTexts[lang] || welcomeTexts['en'];

    // Inject CSS styles
    const style = document.createElement('style');
    style.textContent = `
        #welcome-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            overflow: hidden;
        }
        #welcome-overlay .particle {
            position: absolute; border-radius: 50%;
            background: rgba(59, 130, 246, 0.15);
            animation: floatUp linear infinite;
        }
        @keyframes floatUp {
            0% { transform: translateY(110vh) scale(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.5; }
            100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }
        #welcome-overlay .ring {
            position: absolute; border-radius: 50%;
            border: 1px solid rgba(59, 130, 246, 0.1);
            animation: expandRing 3s ease-out infinite;
        }
        @keyframes expandRing {
            0% { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(3); opacity: 0; }
        }
        .wlc-logo {
            font-size: 5rem; color: #3b82f6;
            filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.6));
            animation: pulseLogo 1.5s ease-in-out infinite alternate;
            margin-bottom: 2rem; position: relative; z-index: 2;
        }
        @keyframes pulseLogo {
            from { transform: scale(1); filter: drop-shadow(0 0 20px rgba(59,130,246,0.4)); }
            to { transform: scale(1.08); filter: drop-shadow(0 0 50px rgba(59,130,246,0.9)); }
        }
        .wlc-greeting {
            font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900;
            background: linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #3b82f6 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; text-align: center;
            animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both;
            position: relative; z-index: 2; letter-spacing: -1px;
        }
        .wlc-name {
            font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 700;
            color: #60a5fa; text-align: center; margin-top: 0.5rem;
            animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both;
            position: relative; z-index: 2;
        }
        .wlc-sub {
            font-size: 1rem; color: #94a3b8; margin-top: 0.75rem;
            text-align: center;
            animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.7s both;
            position: relative; z-index: 2;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .wlc-divider {
            width: 60px; height: 3px; margin: 2rem auto;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 999px;
            animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.9s both;
            position: relative; z-index: 2;
        }
        .wlc-progress-bar-wrap {
            width: min(400px, 80vw); height: 6px;
            background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;
            margin-top: 3rem; position: relative; z-index: 2;
            animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 1.1s both;
        }
        .wlc-progress-bar {
            height: 100%; width: 0%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            border-radius: 999px;
            transition: width 2.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .wlc-loading-text {
            font-size: 0.8rem; color: #475569; margin-top: 0.75rem;
            letter-spacing: 1px; text-transform: uppercase;
            animation: blink 1.5s ease-in-out infinite;
            position: relative; z-index: 2;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        #welcome-overlay.fade-out {
            animation: fadeOutOverlay 0.8s ease forwards;
        }
        @keyframes fadeOutOverlay {
            to { opacity: 0; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);

    // Build overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';

    // Floating particles
    let particlesHTML = '';
    for (let i = 0; i < 20; i++) {
        const size = Math.random() * 80 + 20;
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = Math.random() * 8 + 6;
        particlesHTML += `<div class="particle" style="width:${size}px;height:${size}px;left:${left}%;animation-duration:${duration}s;animation-delay:${delay}s;"></div>`;
    }

    // Rings
    let ringsHTML = '';
    for (let i = 0; i < 3; i++) {
        ringsHTML += `<div class="ring" style="width:400px;height:400px;animation-delay:${i * 1}s;"></div>`;
    }

    overlay.innerHTML = `
        ${particlesHTML}
        ${ringsHTML}
        <i class="fa-solid fa-notes-medical wlc-logo"></i>
        <div class="wlc-greeting">${t.greeting},</div>
        <div class="wlc-name">${userName} 👋</div>
        <div class="wlc-sub">${t.sub}</div>
        <div class="wlc-divider"></div>
        <div class="wlc-progress-bar-wrap">
            <div class="wlc-progress-bar" id="wlc-bar"></div>
        </div>
        <div class="wlc-loading-text">${t.loading}</div>
    `;

    document.body.appendChild(overlay);

    // Start the progress bar
    setTimeout(() => {
        const bar = document.getElementById('wlc-bar');
        if (bar) bar.style.width = '100%';
    }, 100);

    // Fade out and redirect
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    }, 3200);
}
