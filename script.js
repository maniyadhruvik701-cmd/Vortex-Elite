document.addEventListener('DOMContentLoaded', () => {
    // Auth & Layout elements
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const signinForm = document.getElementById('signin-form');
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplayName = document.getElementById('user-display-name');
    const tableScroll = document.getElementById('main-table-scroll');
    const paginationControls = document.getElementById('pagination-controls');

    // Global Controls
    const addRowBtnTrigger = document.getElementById('add-row-trigger');
    const add50Btn = document.querySelector('.btn-gray');
    const clearAllBtn = document.getElementById('clear-all');
    const searchInput = document.querySelector('.search-box input');
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    const sectionTitle = document.getElementById('current-section-title');

    // Performance & Sync State
    let isEditing = false;
    let localUpdateTimer;
    let pendingCloudData = null;

    // State
    let currentSection = 'data-entry';
    let appData = { 'data-entry': [], 'buy-entry': [], 'giving-data': [], 'kharch': [], 'upad': [] };
    let currentPage = { 'data-entry': 0, 'buy-entry': 0, 'giving-data': 0, 'kharch': 0, 'upad': 0 };
    const PAGE_SIZE = 20;

    const sections = ['data-entry', 'buy-entry', 'giving-data', 'kharch', 'upad'];
    const navItems = sections.map(id => document.getElementById(`nav-${id}`));
    const tableConfigs = {
        'data-entry': ['date', 'text', 'number'],
        'buy-entry': ['date', 'text', 'text', 'text', 'text', 'number', 'number', 'number', 'select'],
        'giving-data': ['date', 'text', 'text', 'text', 'text', 'number', 'number', 'number', 'date', 'select'],
        'kharch': ['date', 'text', 'number', 'select'],
        'upad': ['date', 'text', 'number']
    };

    const sectionLabels = {
        'data-entry': 'Home', 'buy-entry': 'Buy Entry', 'giving-data': 'Sell Entry', 'kharch': 'Kharch', 'upad': 'Upad'
    };

    const GLOBAL_ID = "maniyadhruvik07@gmail.com";
    const GLOBAL_PASS = "maniya@#07";

    // --- Core Logic ---

    function initialize() {
        // Jump To logic
        const jumpInput = document.getElementById('jump-page-input');
        const jumpBtn = document.getElementById('jump-page-btn');

        const executeJump = () => {
            const pageNum = parseInt(jumpInput.value);
            if (!isNaN(pageNum)) {
                const totalItems = appData[currentSection].length;
                const totalPages = Math.ceil(totalItems / PAGE_SIZE);
                if (pageNum >= 1 && pageNum <= totalPages) {
                    currentPage[currentSection] = pageNum - 1;
                    renderTable();
                    showToast(`Jumped to Page ${pageNum}`, 'success');
                } else {
                    showToast(`Please enter a page between 1 and ${totalPages}`, 'error');
                }
            }
            jumpInput.value = '';
        };

        jumpBtn.onclick = executeJump;
        jumpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeJump(); });

        // Firebase Setup (for Data Only)
        const firebaseConfig = {
            apiKey: "AIzaSyDontIQzCFDKlj4p1X_2iihQ3ujEz4Dt1U",
            authDomain: "dm1234-2e39c.firebaseapp.com",
            databaseURL: "https://dm1234-2e39c-default-rtdb.firebaseio.com",
            projectId: "dm1234-2e39c",
            storageBucket: "dm1234-2e39c.firebasestorage.app",
            messagingSenderId: "626743630865",
            appId: "1:626743630865:web:2b088603358afd6c41a5b0"
        };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        // Check Login State
        const currentUser = localStorage.getItem('datapro_active_user');
        if (currentUser) {
            authContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            userDisplayName.textContent = currentUser.split('@')[0];
            
            // Firebase Anonymous Auth for cloud syncing
            firebase.auth().signInAnonymously().then(() => {
                // Real-time Database Sync (Always active)
                db.ref('appData').on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        if (isEditing) {
                            pendingCloudData = data;
                        } else {
                            appData = { ...appData, ...data };
                            // Automatic background backup on every sync
                            localStorage.setItem('vortex_cloud_backup', JSON.stringify(appData));
                            checkDueSignals();
                            renderTable();
                        }
                    }
                });
            }).catch(err => {
                console.error("Firebase Anonymous Login Failed:", err);
                showToast("Cloud connection failed. Check your Firebase settings.", "error");
            });
        }

        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;

            if (email === GLOBAL_ID && password === GLOBAL_PASS) {
                localStorage.setItem('datapro_active_user', email);
                location.reload();
            } else {
                showToast("Invalid ID or Password. Contact Admin.", "error");
            }
        });

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('datapro_active_user');
            location.reload();
        });


        // Navigation setup
        navItems.forEach((nav, idx) => {
            nav.addEventListener('click', (e) => {
                e.preventDefault();
                currentSection = sections[idx];
                navItems.forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.sub-item').forEach(s => s.classList.remove('active'));
                nav.classList.add('active');
                sectionTitle.textContent = sectionLabels[currentSection];
                addRowBtnTrigger.setAttribute('data-type', currentSection);

                // Reset UI from reports
                crudControls.classList.remove('hidden');
                reportControls.classList.add('hidden');
                tableScroll.classList.remove('hidden');
                reportResult.classList.add('hidden');
                document.querySelector('.pagination-footer').classList.remove('hidden');
                if (document.getElementById('contact-filter-group')) {
                    document.getElementById('contact-filter-group').classList.add('hidden');
                }

                renderTable();
            });
        });

        // Group toggle logic
        document.querySelectorAll('.group-header').forEach(header => {
            header.onclick = () => {
                header.parentElement.classList.toggle('active');
            };
        });

    const addRowBtnTrigger = document.getElementById('add-row-trigger');
    const add50Btn = document.getElementById('add-50-trigger');
    const clearAllBtn = document.getElementById('clear-all');
    const searchInput = document.querySelector('.search-box input');
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    const sectionTitle = document.getElementById('current-section-title');

    // ... (State & Config ...)

    // Controls
    addRowBtnTrigger.addEventListener('click', () => {
        if (currentSection.includes('report')) return;
        const newRow = tableConfigs[currentSection].map(type => (type === 'number' ? 0 : ''));
        appData[currentSection].push(newRow);
        currentPage[currentSection] = Math.max(0, Math.ceil(appData[currentSection].length / PAGE_SIZE) - 1);
        
        // Push section structure
        if (localStorage.getItem('datapro_active_user')) {
             firebase.database().ref(`appData/${currentSection}`).set(appData[currentSection]);
        }
        
        renderTable();
        showToast('New row added', 'info');
    });

    add50Btn.addEventListener('click', () => {
        if (currentSection.includes('report')) return;
        for (let i = 0; i < 50; i++) {
            appData[currentSection].push(tableConfigs[currentSection].map(type => (type === 'number' ? 0 : '')));
        }
        currentPage[currentSection] = Math.max(0, Math.ceil(appData[currentSection].length / PAGE_SIZE) - 1);
        
        // Push full section after bulk add
        if (localStorage.getItem('datapro_active_user')) {
             firebase.database().ref(`appData/${currentSection}`).set(appData[currentSection]);
        }
        
        renderTable();
        showToast('Added 50 rows', 'success');
    });

    clearAllBtn.addEventListener('click', () => {
        if (currentSection.includes('report')) return;
        if (confirm('Wipe all data in this section?')) {
            appData[currentSection] = [];
            currentPage[currentSection] = 0;
            
            // Wipe from cloud
            if (localStorage.getItem('datapro_active_user')) {
                 firebase.database().ref(`appData/${currentSection}`).set([]);
            }
            
            renderTable();
            showToast('Cleared section', 'error');
        }
    });

    const restoreBackupBtn = document.getElementById('restore-backup');
    restoreBackupBtn.addEventListener('click', () => {
        const backup = localStorage.getItem('vortex_cloud_backup') || localStorage.getItem('pis_admin_db_v2');
        if (backup) {
            const parsed = JSON.parse(backup);
            if (confirm('RESTORE DATA? This will overwrite existing cloud data with local backup!')) {
                appData = parsed;
                if (localStorage.getItem('datapro_active_user')) {
                     firebase.database().ref('appData').set(appData);
                }
                renderTable();
                showToast('Database Restored Successfully', 'success');
            }
        } else {
            showToast('No backup found on this device', 'error');
        }
    });

        bulkDeleteBtn.addEventListener('click', () => {
            if (appData[currentSection].length > 0) {
                appData[currentSection].pop();
                
                // Sync structural change
                if (localStorage.getItem('datapro_active_user')) {
                     firebase.database().ref(`appData/${currentSection}`).set(appData[currentSection]);
                }
                
                renderTable();
                showToast('Last row deleted', 'info');
            }
        });

        searchInput.addEventListener('input', () => {
            currentPage[currentSection] = 0; // Reset to page 1 on search
            renderTable();
        });

        // Report Logic
        const navBuyReport = document.getElementById('nav-buy-report');
        const navSellReport = document.getElementById('nav-sell-report');
        const reportControls = document.getElementById('report-controls');
        const crudControls = document.getElementById('crud-controls');
        const reportResult = document.getElementById('report-result');
        const generateReportBtn = document.getElementById('generate-report-btn');
        const printReportBtn = document.getElementById('print-report-btn');
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');

        const setupReportSection = (type) => {
            currentSection = `${type}-report`;
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.sub-item').forEach(s => s.classList.remove('active'));
            document.getElementById(`nav-${type}-report`).classList.add('active');
            sectionTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

            crudControls.classList.add('hidden');
            reportControls.classList.remove('hidden');
            tableScroll.classList.add('hidden');
            reportResult.classList.remove('hidden');
            document.querySelector('.pagination-footer').classList.add('hidden');
            document.getElementById('contact-filter-group').classList.add('hidden');
            reportResult.innerHTML = '';
        };

        navBuyReport.onclick = (e) => { e.preventDefault(); setupReportSection('buy'); };
        navSellReport.onclick = (e) => { e.preventDefault(); setupReportSection('sell'); };
        const navPaymentReport = document.getElementById('nav-payment-report');
        navPaymentReport.onclick = (e) => { e.preventDefault(); setupReportSection('payment'); };
        const navSellPaymentReport = document.getElementById('nav-sell-payment-report');
        navSellPaymentReport.onclick = (e) => { e.preventDefault(); setupReportSection('sell-payment'); };
        const navUpadReport = document.getElementById('nav-upad-report');
        navUpadReport.onclick = (e) => { e.preventDefault(); setupReportSection('upad'); };
        const navTotalStock = document.getElementById('nav-total-stock-report');
        navTotalStock.onclick = (e) => { e.preventDefault(); setupReportSection('total-stock'); };
        const navHomeReport = document.getElementById('nav-home-report');
        navHomeReport.onclick = (e) => { e.preventDefault(); setupReportSection('home'); };

        const navCompanyBuyInvoice = document.getElementById('nav-company-buy-invoice');
        const navCompanySellInvoice = document.getElementById('nav-company-sell-invoice');

        const setupInvoiceSection = (type) => {
            currentSection = `company-${type}-invoice`;
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.sub-item').forEach(s => s.classList.remove('active'));
            document.getElementById(`nav-company-${type}-invoice`).classList.add('active');
            sectionTitle.textContent = `Company ${type.charAt(0).toUpperCase() + type.slice(1)} Invoice`;

            crudControls.classList.add('hidden');
            reportControls.classList.remove('hidden');
            tableScroll.classList.add('hidden');
            reportResult.classList.remove('hidden');
            document.querySelector('.pagination-footer').classList.add('hidden');
            
            // Show contact filter
            contactFilterGroup.classList.remove('hidden');
            
            // Populate contact datalist
            const sourceKey = type === 'buy' ? 'buy-entry' : 'giving-data';
            const contacts = [...new Set(appData[sourceKey].map(row => row[1]))].filter(Boolean).sort();
            contactDatalist.innerHTML = contacts.map(c => `<option value="${c}">`).join('');
            contactSearch.value = '';
            
            reportResult.innerHTML = '';
        };

        navCompanyBuyInvoice.onclick = (e) => { e.preventDefault(); setupInvoiceSection('buy'); };
        navCompanySellInvoice.onclick = (e) => { e.preventDefault(); setupInvoiceSection('sell'); };

        const navBuyLedger = document.getElementById('nav-buy-ledger');
        const navSellLedger = document.getElementById('nav-sell-ledger');
        const contactFilterGroup = document.getElementById('contact-filter-group');
        const contactSearch = document.getElementById('report-contact-search');
        const contactDatalist = document.getElementById('contact-datalist');

        const setupLedgerSection = (type) => {
            currentSection = `${type}-ledger`;
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.sub-item').forEach(s => s.classList.remove('active'));
            document.getElementById(`nav-${type}-ledger`).classList.add('active');
            sectionTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Ledger`;

            crudControls.classList.add('hidden');
            reportControls.classList.remove('hidden');
            tableScroll.classList.add('hidden');
            reportResult.classList.remove('hidden');
            document.querySelector('.pagination-footer').classList.add('hidden');
            
            // Show contact filter
            contactFilterGroup.classList.remove('hidden');
            
            // Populate contact datalist
            const sourceKey = type === 'buy' ? 'buy-entry' : 'giving-data';
            const contacts = [...new Set(appData[sourceKey].map(row => row[1]))].filter(Boolean).sort();
            contactDatalist.innerHTML = contacts.map(c => `<option value="${c}">`).join('');
            contactSearch.value = '';
            
            reportResult.innerHTML = '';
        };

        navBuyLedger.onclick = (e) => { e.preventDefault(); setupLedgerSection('buy'); };
        navSellLedger.onclick = (e) => { e.preventDefault(); setupLedgerSection('sell'); };

        navBuyLedger.onclick = (e) => { e.preventDefault(); setupLedgerSection('buy'); };
        navSellLedger.onclick = (e) => { e.preventDefault(); setupLedgerSection('sell'); };

        generateReportBtn.addEventListener('click', () => {
            const start = startDateInput.value;
            const end = endDateInput.value;
            
            // For Company Invoices, we only REALLY need the start date (acting as target date)
            const isInvoice = currentSection.includes('invoice');

            if (!start || (!isInvoice && !end)) {
                showToast(isInvoice ? 'Please select a date' : 'Please select both dates', 'error');
                return;
            }

            if (currentSection === 'home-report') {
                const data = appData['data-entry'];
                const filtered = data.filter(row => row[0] >= start && row[0] <= end);

                if (filtered.length === 0) {
                    showToast('No data found for these dates', 'info');
                    reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No data records found for the selected period.</div>';
                    return;
                }

                let totalAmt = 0;

                reportResult.innerHTML = `
                    <div class="report-header" style="text-align:center; margin-bottom: 2rem;">
                        <h2 style="color: var(--primary);">Home Report Summary</h2>
                        <p style="color: var(--text-dim);">${start} to ${end}</p>
                    </div>
                    <table class="report-summary-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Name</th>
                                <th style="background: rgba(var(--primary-rgb), 0.1);">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map((row, i) => {
                                const amt = parseFloat(row[2] || 0);
                                totalAmt += amt;
                                return `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${row[0]}</td>
                                        <td>${row[1]}</td>
                                        <td style="font-weight: 700; color: white;">₹${amt.toLocaleString()}</td>
                                    </tr>
                                `;
                            }).join('')}
                            <tr style="background: var(--primary); color: white;">
                                <td colspan="3" style="text-align:left; padding-left: 2.5rem; font-weight: 800;">GRAND TOTAL:</td>
                                <td style="font-size: 1.25rem; font-weight: 900;">₹${totalAmt.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                showToast('Home Report Generated', 'success');
                return;
            }

            if (currentSection === 'total-stock-report') {
                const data = appData['buy-entry'];
                const filtered = data.filter(row => row[0] >= start && row[0] <= end);

                if (filtered.length === 0) {
                    showToast('No data found for these dates', 'info');
                    reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No data records found for the selected period.</div>';
                    return;
                }

                const skus = [...new Set(filtered.map(r => r[2]))].sort();
                const codes = [...new Set(filtered.map(r => r[3]))].sort();

                let html = `
                    <div class="report-header" style="text-align:center; margin-bottom: 2rem;">
                        <h2 style="color: var(--primary);">Total Stock Matrix (Pivot)</h2>
                        <p style="color: var(--text-dim);">${start} to ${end}</p>
                    </div>
                    <div style="overflow-x: auto; width: 100%; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                        <table class="report-summary-table" style="min-width: 100%;">
                            <thead>
                                <tr>
                                    <th>SKU / CODE</th>
                                    ${codes.map(c => `<th>${c}</th>`).join('')}
                                    <th style="background: rgba(var(--primary-rgb), 0.2);">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                const colTotals = new Array(codes.length).fill(0);
                let grandTotal = 0;

                skus.forEach(sku => {
                    let rowTotal = 0;
                    html += `<tr><td style="font-weight: 700;">${sku}</td>`;
                    
                    codes.forEach((code, i) => {
                        const exists = filtered.some(r => r[2] === sku && r[3] === code);
                        const val = exists ? 1 : 0;
                        rowTotal += val;
                        colTotals[i] += val;
                        html += `<td style="opacity: ${val ? '1' : '0.3'}; color: ${val ? 'var(--primary)' : 'var(--text-dim)'};">${val}</td>`;
                    });

                    grandTotal += rowTotal;
                    html += `
                        <td style="font-weight: 800; color: white; background: rgba(255,255,255,0.05);">${rowTotal}</td>
                    </tr>`;
                });

                // Add footer row
                html += `
                    <tr style="background: var(--primary); color: white; font-weight: 900;">
                        <td>GRAND TOTAL:</td>
                        ${colTotals.map(t => `<td>${t}</td>`).join('')}
                        <td style="font-size: 1.25rem;">${grandTotal}</td>
                    </tr>
                `;

                html += `</tbody></table></div>`;
                reportResult.innerHTML = html;
                showToast('Stock Matrix Generated', 'success');
                return;
            }

            if (currentSection === 'buy-ledger' || currentSection === 'sell-ledger') {
                const isSell = currentSection.startsWith('sell');
                const type = isSell ? 'giving-data' : 'buy-entry';
                const contactSearch = document.getElementById('report-contact-search');
                const contactName = contactSearch.value;

                if (!contactName) {
                    showToast('Please select a contact', 'error');
                    return;
                }

                const data = appData[type];
                const filtered = data.filter(row => 
                    row[1] === contactName && 
                    (!start || row[0] >= start) && 
                    (!end || row[0] <= end)
                );

                if (filtered.length === 0) {
                    showToast('No entries found for this contact', 'info');
                    reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No matching entries found.</div>';
                    return;
                }

                let totalAmt = 0;

                const amtIndex = 7;
                const statusIndex = isSell ? 9 : 8;
                const timelineIndex = isSell ? 8 : null;

                reportResult.innerHTML = `
                    <div class="invoice-container printable-invoice">
                        <header class="invoice-header">
                            <div class="left-section">
                                <h1 class="invoice-title">${isSell ? 'Contacts Receivable' : 'Contacts Payable'}</h1>
                                <div class="contact-details">
                                    <p class="company-label">Contact: <strong>HONEST EXPORT</strong></p>
                                    <p class="sub-detail">PLOT NO. 401/402, PANDOL INDUSTIAL CO.OP SER SOCIETY LID, Ved Road Surat, 395004, Gujarat</p>
                                    <p class="sub-detail">Mobile : 9924297264</p>
                                </div>
                            </div>
                            <div class="right-section">
                                <h2 class="business-name">${contactName}</h2>
                                <p class="business-sub">SURAT</p>
                            </div>
                        </header>

                        <div class="invoice-table-wrapper">
                            <table class="ledger-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Due Date (Remaining)</th>
                                        <th>Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filtered.map((row) => {
                                        const amt = parseFloat(row[amtIndex] || 0);
                                        totalAmt += amt;
                                        const date = row[0] ? new Date(row[0]).toLocaleDateString('en-GB') : '-';
                                        const timeline = timelineIndex ? row[timelineIndex] : '-';
                                        const sku = row[2] || '-';
                                        const code = row[3] || '-';
                                        
                                        return `
                                            <tr>
                                                <td>${date}</td>
                                                <td>${isSell ? 'Sales' : 'Purchase'}#${sku}-${code}</td>
                                                <td>${timeline || '-'}</td>
                                                <td>${amt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="total-row">
                                        <td colspan="3" style="text-align: right; padding-right: 2rem;">Total</td>
                                        <td><strong>₹ ${totalAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                `;
                showToast(`${isSell ? 'Sell' : 'Buy'} Ledger Generated`, 'success');
                return;
            }

            if (currentSection === 'company-buy-invoice' || currentSection === 'company-sell-invoice') {
                const isSell = currentSection.includes('sell');
                const type = isSell ? 'giving-data' : 'buy-entry';
                const contactSearch = document.getElementById('report-contact-search');
                const contactName = contactSearch.value;

                if (!contactName) {
                    showToast('Please select a company name', 'error');
                    return;
                }

                const data = appData[type];
                // To be safe and flexible, allow range if End Date is provided, otherwise single day
                const realEnd = end || start;
                const filtered = data.filter(row => 
                    row[1] && row[1].toString().trim() === contactName.trim() && 
                    row[0] >= start && row[0] <= realEnd
                );

                if (filtered.length === 0) {
                    showToast('No entries found for this company on selected date', 'info');
                    reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No matching entries found for the selected date and company.</div>';
                    return;
                }

                let totalAmt = 0;
                let totalWeight = 0;
                const amtIndex = 7;
                const weightIndex = 5;

                const invoiceNo = Math.floor(Math.random() * 90000) + 10000;
                const dateFormatted = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                reportResult.innerHTML = `
                    <div class="invoice-container printable-invoice">
                        <div class="invoice-badge">${isSell ? 'Tax Invoice' : 'Purchase Bill'}</div>
                        <header class="invoice-header">
                            <div class="left-section">
                                <h1 class="invoice-title">HONEST EXPORT</h1>
                                <div class="contact-details">
                                    <p class="sub-detail">PLOT NO. 401/402, PANDOL INDUSTIAL CO.OP SER SOCIETY LID, Ved Road Surat, 395004, Gujarat</p>
                                    <p class="sub-detail">Mobile : 9924297264</p>
                                    <p class="sub-detail" style="margin-top: 1rem; color: #1e293b; font-weight: 700;">BILL TO:</p>
                                    <h2 class="business-name" style="font-size: 1.5rem; color: var(--primary);">${contactName}</h2>
                                    <p class="sub-detail">SURAT, GUJARAT</p>
                                </div>
                            </div>
                            <div class="right-section" style="text-align: right;">
                                <div style="margin-bottom: 2rem;">
                                    <p style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;">Invoice Number</p>
                                    <p style="font-size: 1.5rem; font-weight: 800; color: #1e293b;">#INV-${invoiceNo}</p>
                                </div>
                                <div style="margin-bottom: 2rem;">
                                    <p style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;">Date</p>
                                    <p style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${dateFormatted}</p>
                                </div>
                                <div>
                                    <p style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em;">Status</p>
                                    <p style="font-size: 1rem; font-weight: 800; color: #22c55e;">COMPLETED</p>
                                </div>
                            </div>
                        </header>

                        <div class="invoice-table-wrapper">
                            <table class="ledger-table invoice-items-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Description (SKU / CODE)</th>
                                        <th>Size</th>
                                        <th>Weight (KG)</th>
                                        <th>Price</th>
                                        <th style="text-align: right;">Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filtered.map((row, i) => {
                                        const amt = parseFloat(row[amtIndex] || 0);
                                        const wgt = parseFloat(row[weightIndex] || 0);
                                        totalAmt += amt;
                                        totalWeight += wgt;
                                        const sku = row[2] || '-';
                                        const code = row[3] || '-';
                                        const size = row[4] || '-';
                                        const price = row[6] || '0';
                                        
                                        return `
                                            <tr>
                                                <td style="width: 40px; color: #94a3b8;">${(i + 1).toString().padStart(2, '0')}</td>
                                                <td>
                                                    <div style="font-weight: 700; color: #1e293b;">${sku}</div>
                                                    <div style="font-size: 0.75rem; color: #64748b;">Code: ${code}</div>
                                                </td>
                                                <td>${size}</td>
                                                <td>${wgt}</td>
                                                <td>₹ ${parseFloat(price).toLocaleString()}</td>
                                                <td style="text-align: right; font-weight: 800; color: #1e293b;">${amt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display: flex; justify-content: flex-end; margin-top: 3rem;">
                            <div style="width: 350px;">
                                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                                    <span style="color: #64748b; font-weight: 600;">Total Weight:</span>
                                    <span style="font-weight: 700; color: #1e293b;">${totalWeight.toLocaleString()} KG</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 1.5rem 0; border-top: 2px solid #1e293b; margin-top: 0.5rem;">
                                    <span style="font-size: 1.25rem; font-weight: 800; color: #1e293b;">Grand Total:</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">₹ ${totalAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div style="margin-top: 3rem; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
                                    <p style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Thank you for your business!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                showToast(`Invoice Generated for ${contactName}`, 'success');
                return;
            }

            if (currentSection.includes('payment-report') || currentSection === 'kharch-report') {
                const isSell = currentSection.startsWith('sell-');
                const isKharch = currentSection === 'kharch-report';
                const type = isKharch ? 'kharch' : (isSell ? 'giving-data' : 'buy-entry');
                
                // Indices: 
                // Buy: 7 (Amt), 8 (Status)
                // Sell: 7 (Amt), 9 (Status)
                // Kharch: 2 (Amt), 3 (Status)
                const amtIndex = isKharch ? 2 : 7;
                const statusIndex = isKharch ? 3 : (isSell ? 9 : 8);

                const data = appData[type];
                const filtered = data.filter(row => row[0] >= start && row[0] <= end);

                if (filtered.length === 0) {
                    showToast('No data found for these dates', 'info');
                    reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No data records found for the selected period.</div>';
                    return;
                }

                let paidTotal = 0;
                let pendingTotal = 0;
                
                filtered.forEach(row => {
                    const amt = parseFloat(row[amtIndex] || 0);
                    const status = row[statusIndex];
                    if (status === 'Paid') paidTotal += amt;
                    else if (status === 'Pending') pendingTotal += amt;
                });

                reportResult.innerHTML = `
                    <div class="report-header" style="text-align:center; margin-bottom: 2rem;">
                        <h2 style="color: var(--primary);">${isKharch ? 'Kharch' : (isSell ? 'Sell' : 'Buy')} Payment Status Report</h2>
                        <p style="color: var(--text-dim);">${start} to ${end}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                        <div class="stat-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e44; padding: 1.5rem; border-radius: 1rem; text-align:center;">
                            <div style="color: #22c55e; font-size: 0.9rem; font-weight: 800; text-transform: uppercase;">Payment Received (Paid)</div>
                            <div style="color: white; font-size: 2rem; font-weight: 900; margin-top: 0.5rem;">₹${paidTotal.toLocaleString()}</div>
                        </div>
                        <div class="stat-card" style="background: rgba(249, 115, 22, 0.1); border: 1px solid #f9731644; padding: 1.5rem; border-radius: 1rem; text-align:center;">
                            <div style="color: #f97316; font-size: 0.9rem; font-weight: 800; text-transform: uppercase;">Payment Pending (Baki)</div>
                            <div style="color: white; font-size: 2rem; font-weight: 900; margin-top: 0.5rem;">₹${pendingTotal.toLocaleString()}</div>
                        </div>
                    </div>
                    <table class="report-summary-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>${isKharch ? 'Expense Info' : 'Company'}</th>
                                <th>Paid Amt</th>
                                <th>Pending Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map((row, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${row[1]}</td>
                                    <td style="color: #22c55e;">${row[statusIndex] === 'Paid' ? '₹' + parseFloat(row[amtIndex] || 0).toLocaleString() : '-'}</td>
                                    <td style="color: #f97316;">${row[statusIndex] === 'Pending' ? '₹' + parseFloat(row[amtIndex] || 0).toLocaleString() : '-'}</td>
                                </tr>
                            `).join('')}
                            <tr style="background: var(--primary); color: white;">
                                <td colspan="2" style="text-align:left; padding-left: 2.5rem; font-weight: 800;">GRAND TOTAL:</td>
                                <td style="font-weight: 900;">₹${paidTotal.toLocaleString()}</td>
                                <td style="font-weight: 900;">₹${pendingTotal.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                showToast(`${isKharch ? 'Kharch' : (isSell ? 'Sell' : 'Buy')} Report Generated`, 'success');
                return;
            }

            // Upad, Buy-Entry, Giving-Data simple summaries
            let type;
            let displayTitle;
            let col1Header = 'Detail';
            
            if (currentSection === 'upad-report') {
                type = 'upad';
                displayTitle = 'Upad Report';
                col1Header = 'Person/Company Name';
            } else {
                const isBuy = currentSection === 'buy-report';
                type = isBuy ? 'buy-entry' : 'giving-data';
                displayTitle = `${isBuy ? 'Buy' : 'Sell'} Report Summary`;
                col1Header = 'Weight (KG/GM)';
            }

            const data = appData[type];
            const filtered = data.filter(row => row[0] >= start && row[0] <= end);

            if (filtered.length === 0) {
                showToast('No data found for these dates', 'info');
                reportResult.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-dim);">No data records found for the selected period.</div>';
                return;
            }

            let totalAmt = 0;
            let totalWeight = 0;

            const isUpad = currentSection === 'upad-report';
            
            reportResult.innerHTML = `
                <div class="report-header" style="text-align:center; margin-bottom: 2rem;">
                    <h2 style="color: var(--primary);">${displayTitle}</h2>
                    <p style="color: var(--text-dim);">${start} to ${end}</p>
                </div>
                <table class="report-summary-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>${isUpad ? 'Person/Company' : 'Weight (KG/GM)'}</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((row, i) => {
                            const amt = parseFloat(row[isUpad ? 2 : 7] || 0);
                            const wgt = parseFloat(row[5] || 0);
                            totalAmt += amt;
                            totalWeight += wgt;
                            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${isUpad ? row[1] : wgt}</td>
                                    <td>₹${amt.toLocaleString()}</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: var(--primary); color: white;">
                            <td colspan="2" style="text-align:left; padding-left: 2.5rem; font-weight: 800;">GRAND TOTAL:</td>
                            <td style="font-weight: 900;">₹${totalAmt.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            `;
            showToast(`${displayTitle} Generated`, 'success');
        });

        printReportBtn.addEventListener('click', () => {
            window.print();
        });
    }

    function renderTable() {
        if (currentSection.includes('report')) return; // Don't render CRUD table for reports

        // Save current focus and selection
        const activeItem = document.activeElement;
        let focusedInfo = null;
        if (activeItem && activeItem.classList.contains('table-input')) {
            const tr = activeItem.closest('tr');
            if (tr) {
                const tds = Array.from(tr.querySelectorAll('td'));
                focusedInfo = {
                    originalIdx: tr.getAttribute('data-idx'),
                    colIdx: tds.indexOf(activeItem.parentElement),
                    selectionStart: activeItem.selectionStart,
                    selectionEnd: activeItem.selectionEnd
                };
            }
        }

        const query = searchInput.value.toLowerCase();
        let filteredData = appData[currentSection].map((row, idx) => ({ data: row, originalIndex: idx }));

        if (query) {
            filteredData = filteredData.filter(item =>
                item.data.some(val => val && val.toString().toLowerCase().includes(query))
            );
        }

        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);

        if (currentPage[currentSection] >= totalPages && totalPages > 0) currentPage[currentSection] = totalPages - 1;

        const startIdx = currentPage[currentSection] * PAGE_SIZE;
        const pageItems = filteredData.slice(startIdx, startIdx + PAGE_SIZE);

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        ${getHeaderForSection(currentSection)}
                        <th class="actions-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const todayStr = new Date().toISOString().split('T')[0];

        pageItems.forEach((item, pIdx) => {
            const rowIdx = startIdx + pIdx + 1;
            const originalDataIdx = item.originalIndex;
            html += `<tr data-idx="${originalDataIdx}"><td>${rowIdx}</td>`;

            tableConfigs[currentSection].forEach((type, colIdx) => {
                const val = item.data[colIdx];
                if (type === 'select') {
                    const statusClass = val === 'Paid' ? 'status-paid' : (val === 'Pending' ? 'status-pending' : '');
                    html += `
                        <td>
                            <select class="table-input ${statusClass}" 
                                onchange="updateData('${currentSection}', ${originalDataIdx}, ${colIdx}, this.value, this); renderTable();"
                                onfocus="isEditing = true" onblur="isEditing = false">
                                <option value="" ${!val ? 'selected' : ''} disabled>Select</option>
                                <option value="Pending" ${val === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Paid" ${val === 'Paid' ? 'selected' : ''}>Paid</option>
                            </select>
                        </td>`;
                } else {
                    const widthStyle = type === 'text' ? `style="width: ${Math.max(14, (val ? val.toString().length : 0) + 2)}ch"` : '';
                    let dueClass = '';
                    if (currentSection === 'giving-data' && colIdx === 8 && val && val <= todayStr) {
                        const status = item.data[9];
                        if (status === 'Pending') dueClass = 'due-signal-input';
                    }

                    html += `<td><input type="${type}" class="table-input ${dueClass}" value="${val}" ${widthStyle} 
                        oninput="updateData('${currentSection}', ${originalDataIdx}, ${colIdx}, this.value, this)"
                        onfocus="isEditing = true" onblur="isEditing = false"></td>`;
                }
            });

            html += `
                <td class="actions-col">
                    <button class="btn-control btn-red" onclick="deleteRow('${currentSection}', ${originalDataIdx})" style="padding: 0.25rem 0.5rem">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        });

        if (pageItems.length === 0) {
            html += `<tr><td colspan="20" style="text-align:center; padding: 2rem;">No data entries found.</td></tr>`;
        }

        html += `</tbody></table>`;
        tableScroll.innerHTML = html;

        // Restore focus and selection
        if (focusedInfo) {
            const targetTr = tableScroll.querySelector(`tr[data-idx="${focusedInfo.originalIdx}"]`);
            if (targetTr) {
                const targetTd = targetTr.querySelectorAll('td')[focusedInfo.colIdx];
                const input = targetTd?.querySelector('.table-input');
                if (input) {
                    input.focus();
                    if (typeof input.selectionStart === 'number' && focusedInfo.selectionStart !== null) {
                        input.selectionStart = focusedInfo.selectionStart;
                        input.selectionEnd = focusedInfo.selectionEnd;
                    }
                }
            }
        }

        renderPagination(totalPages);
    }

    function getHeaderForSection(section) {
        const headers = {
            'data-entry': ['Date', 'Name', 'Amount'],
            'buy-entry': ['Date', 'Company', 'SKU', 'Code', 'Size', 'Weight', 'Price', 'Total', 'Payment'],
            'giving-data': ['Date', 'Company', 'SKU', 'Code', 'Size', 'Weight', 'Price', 'Total', 'Timeline', 'Payment'],
            'kharch': ['Date', 'Company', 'Amount', 'Payment'],
            'upad': ['Date', 'Name', 'Amount']
        };
        return headers[section].map(h => `<th>${h}</th>`).join('');
    }

    function renderPagination(total) {
        paginationControls.innerHTML = '';
        if (total <= 1) return;

        // Simple pagination buttons
        for (let i = 0; i < total; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage[currentSection] ? 'active' : ''}`;
            btn.textContent = i + 1;
            btn.onclick = () => {
                currentPage[currentSection] = i;
                renderTable();
            };
            paginationControls.appendChild(btn);
        }
    }

    // --- Global Operations (Exposed for inline handlers) ---
    window.updateData = (section, rowIdx, colIdx, value, el) => {
        isEditing = true;
        appData[section][rowIdx][colIdx] = value;
        checkDueSignals();

        // Immediate width update for text inputs (expand as you type)
        if (el && el.tagName === 'INPUT' && el.type === 'text') {
            el.style.width = Math.max(14, value.length + 2) + 'ch';
        }

        // Update status colors for select boxes
        if (el && el.tagName === 'SELECT') {
            el.className = `table-input ${value === 'Paid' ? 'status-paid' : (value === 'Pending' ? 'status-pending' : '')}`;
        }
        
        // Instant Cell Push (Ultra Granular)
        if (localStorage.getItem('datapro_active_user')) {
            const db = firebase.database();
            db.ref(`appData/${section}/${rowIdx}/${colIdx}`).set(value);
        }

        // Reset editing state after inactivity
        clearTimeout(localUpdateTimer);
        localUpdateTimer = setTimeout(() => { 
            isEditing = false; 
            if (pendingCloudData) {
                appData = { ...appData, ...pendingCloudData };
                pendingCloudData = null;
                renderTable();
            }
        }, 800);
    };

    window.deleteRow = (section, rowIdx) => {
        appData[section].splice(rowIdx, 1);
        
        // Sync structural change
        if (localStorage.getItem('datapro_active_user')) {
            firebase.database().ref(`appData/${section}`).set(appData[section]);
        }
        
        renderTable();
        showToast('Row deleted', 'info');
    };

    function saveAndRender(section = currentSection) {
        checkDueSignals();
        renderTable();
        debounce(() => saveToFirebase(section), 1000)();
    }

    function checkDueSignals() {
        const todayStr = new Date().toISOString().split('T')[0];
        const banner = document.getElementById('due-notification-banner');
        const textElement = document.getElementById('due-notification-text');
        
        const dueRows = appData['giving-data'] ? appData['giving-data'].filter(row => {
            const timelineDate = row[8];
            const status = row[9];
            return timelineDate && timelineDate <= todayStr && status === 'Pending';
        }) : [];

        if (dueRows.length > 0) {
            banner.classList.remove('hidden');
            textElement.textContent = `Alert: There are ${dueRows.length} pending payments due today or earlier from Sell Entry!`;
        } else {
            banner.classList.add('hidden');
        }
    }

    // --- Keyboard Navigation ---
    tableScroll.addEventListener('keydown', (e) => {
        if (!e.target.classList.contains('table-input')) return;

        const currentInput = e.target;
        const currentTd = currentInput.closest('td');
        const currentTr = currentTd.closest('tr');
        const allTds = Array.from(currentTr.querySelectorAll('td'));
        const colIdx = allTds.indexOf(currentTd);
        const rows = Array.from(tableScroll.querySelectorAll('tbody tr'));
        const rowIdx = rows.indexOf(currentTr);

        let targetInput = null;

        switch (e.key) {
            case 'ArrowRight':
                const nextTd = allTds[colIdx + 1];
                if (nextTd) targetInput = nextTd.querySelector('.table-input');
                break;
            case 'ArrowLeft':
                const prevTd = allTds[colIdx - 1];
                if (prevTd) targetInput = prevTd.querySelector('.table-input');
                break;
            case 'ArrowDown':
                const nextRow = rows[rowIdx + 1];
                if (nextRow) targetInput = nextRow.querySelectorAll('td')[colIdx]?.querySelector('.table-input');
                break;
            case 'ArrowUp':
                const prevRow = rows[rowIdx - 1];
                if (prevRow) targetInput = prevRow.querySelectorAll('td')[colIdx]?.querySelector('.table-input');
                break;
            case 'Enter':
                e.preventDefault();
                const nextColTd = allTds[colIdx + 1];
                if (nextColTd) {
                    targetInput = nextColTd.querySelector('.table-input');
                } else {
                    const nextLine = rows[rowIdx + 1];
                    if (nextLine) targetInput = nextLine.querySelector('.table-input');
                }
                break;
        }

        if (targetInput) {
            targetInput.focus();
            if (targetInput.select) targetInput.select();
        }
    });

    function saveToFirebase(section) {
        const db = firebase.database();
        // Skip check if user is logged in via static credentials
        if (localStorage.getItem('datapro_active_user')) {
            if (section) {
                db.ref(`appData/${section}`).set(appData[section]);
            } else {
                db.ref('appData').set(appData);
            }
        } else {
            localStorage.setItem('pis_admin_db_v2', JSON.stringify(appData));
        }
    }

    let debounceTimer;
    function debounce(fn, delay) {
        return function () { clearTimeout(debounceTimer); debounceTimer = setTimeout(fn, delay); }
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        const colors = { success: 'linear-gradient(135deg, #10b981, #059669)', error: 'linear-gradient(135deg, #f43f5e, #e11d48)', info: 'linear-gradient(135deg, #6366f1, #4f46e5)' };
        Object.assign(toast.style, {
            position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.5rem',
            background: colors[type], color: 'white', borderRadius: '0.75rem', zIndex: '9999',
            display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '700',
            animation: 'toastIn 0.5s ease'
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
    }

    initialize();
});

const s = document.createElement('style');
s.textContent = `@keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
document.head.appendChild(s);
