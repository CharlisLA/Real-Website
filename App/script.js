// ===========================================
// POPUP FUNCTIONS
// ===========================================

// Open the popup
function openPopup() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.add('active');
}

// Close the popup
function closePopup() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.remove('active');
}

// Close popup when clicking outside the box
function closePopupOnOverlay(event) {
    if (event.target.id === 'popupOverlay') {
        closePopup();
    }
}

// Close popup with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closePopup();
        closeFullPage();
    }
});

// ===========================================
// FULL PAGE OVERLAY FUNCTIONS
// ===========================================

function openFullPage() {
    document.getElementById('fullPageOverlay').classList.add('active');
}

function closeFullPage() {
    document.getElementById('fullPageOverlay').classList.remove('active');
}



// ===========================================
// NAVIGATION FUNCTIONS
// ===========================================

function navigateTo(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const target = document.getElementById(pageId + '-page');
    if (target) {
        target.classList.add('active');
    }

    // Update Nav State
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        // Simple check if the onclick contains the pageId
        if (item.getAttribute('onclick').includes(pageId)) {
            item.classList.add('active');
        }
    });

    // Deactivate Wallet in nav if we are navigating elsewhere
    // (Wallet is an overlay, but we want the nav to reflect "current view" roughly)
}

function sendEmail() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;

    if (!name || !email || !message) {
        showToast("Please fill in all fields.", true);
        return;
    }

    const subject = `Message from ${name} (${email})`;
    const body = `${message}`;

    // Construct Mailto Link
    const mailtoLink = `mailto:ackninzcharlie@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Use a temporary link to open the mail client to avoid "blank screen" navigation issues
    const tempLink = document.createElement('a');
    tempLink.href = mailtoLink;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);

    // Clear Inputs
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactMessage').value = '';

    // Show Notification
    showToast("Message Sent!");
}

function showToast(message, isError = false) {
    const x = document.getElementById("toast");
    x.innerText = message;
    x.style.backgroundColor = isError ? "#d32f2f" : "#333";
    x.style.visibility = "visible";
    x.style.animation = "fadein 0.5s, fadeout 0.5s 2.5s";

    // Reset after 3 seconds
    setTimeout(function () {
        x.style.visibility = "hidden";
        x.style.animation = "";
    }, 3000);
}

// Add CSS keyframes for toast via JS or ensure they are in CSS. 
// Adding style tag for toast animations if not present is safer, ensuring self-contained JS mostly,
// but since we are editing HTML/CSS file too, let's keep it simple. 
// I will rely on CSS being added or add injection here. 
// To be safe I will inject a style block for the animation.
if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
        @keyframes fadein {
            from {bottom: 0; opacity: 0;}
            to {bottom: 30px; opacity: 1;}
        }
        @keyframes fadeout {
            from {bottom: 30px; opacity: 1;}
            to {bottom: 0; opacity: 0;}
        }
    `;
    document.head.appendChild(style);
}

// ===========================================
// WALLET APP FUNCTIONS
// ===========================================

let currentBalance = 0;
let savingsGoal = {
    name: "",
    amount: 0
};
let transactions = []; // Store transaction history
let jobSettings = {
    hourlyRate: 0,
    weekdayHours: 0,
    weekend: false,
    weekendHours: 0
};
let lastPaycheck = 0; // Timestamp
let currentUser = null; // Track logged in user
let spendingChart = null; // Chart instance

// Check for logged in user on startup
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('loggedInUser');
    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};

    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        // User Badge Update
        updateUserBadge();

        loadUserData(currentUser);

        // Show wallet immediately if balance is set
        if (users[currentUser].balanceSet) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'block';
            renderChart(); // Render chart on load
        } else {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
        }
    }
    updateDailyDashboard();
});

// Load data from LocalStorage on startup
function loadUserData(username) {
    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
    if (users[username]) {
        const userData = users[username];
        currentBalance = userData.balance || 0;
        transactions = userData.transactions || [];
        savingsGoal = userData.goal || { name: "", amount: 0 };
        jobSettings = userData.jobSettings || { hourlyRate: 0, weekdayHours: 0, weekend: false, weekendHours: 0 };
        lastPaycheck = userData.lastPaycheck || 0;

        // Update UI
        updateBalanceDisplay();
        if (savingsGoal.name) {
            document.getElementById('goalNameDisplay').innerText = savingsGoal.name;
            document.getElementById('goalAmountDisplay').innerText = savingsGoal.amount.toFixed(2);
            document.getElementById('goalDisplay').style.display = 'block';
            document.getElementById('setGoalSection').style.display = 'none';
        } else {
            document.getElementById('goalDisplay').style.display = 'none';
            document.getElementById('setGoalSection').style.display = 'block';
        }

        // Initialize Job UI
        document.getElementById('hourlyRateInput').value = jobSettings.hourlyRate || '';
        document.getElementById('weekdayHoursInput').value = jobSettings.weekdayHours || '';
        document.getElementById('weekendWorkDetailsCheckbox').checked = jobSettings.weekend;
        document.getElementById('weekendHoursInput').value = jobSettings.weekendHours || '';
        toggleWeekendInput(); // Update visibility
        calculateJobEarnings(); // Update calculation display
        checkPaycheckStatus(); // Check button state
    }
}

// Save data to LocalStorage
function saveUserData() {
    if (!currentUser) return;

    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
    // Ensure we preserve the balanceSet flag if it exists
    const existingUser = users[currentUser] || {};

    users[currentUser] = {
        password: users[currentUser]?.password || existingUser.password,
        balance: currentBalance,
        transactions: transactions,
        goal: savingsGoal,
        jobSettings: jobSettings,
        lastPaycheck: lastPaycheck,
        balanceSet: existingUser.balanceSet || false,
        avatar: existingUser.avatar || null // Persist avatar
    };
    localStorage.setItem('walletUsers', JSON.stringify(users));
    updateDailyDashboard();
    updateUserBadge(); // Ensure badge is always in sync
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('navDarkModeIcon');

    if (document.body.classList.contains('dark-mode')) {
        if (icon) icon.src = 'assets/icons/sun.svg';
    } else {
        if (icon) icon.src = 'assets/icons/moon.svg';
    }
}

// Open the Wallet Popup
function openWallet() {
    const wallet = document.getElementById('walletOverlay');
    wallet.classList.add('active');

    // Check if user is already logged in
    if (!currentUser) {
        showLogin();
        document.getElementById('walletContent').style.display = 'none';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('authSection').style.display = 'block';
    } else {
        // User is logged in, check if they need to set balance
        const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
        if (users[currentUser] && users[currentUser].balanceSet) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'block';
            renderChart(); // Render chart when opening wallet
        } else {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
        }
    }
}

function showSignUp() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function toggleSettings() {
    const settings = document.getElementById('settingsSection');
    if (settings.style.display === 'none') {
        settings.style.display = 'block';
        loadSettingsProfile();
    } else {
        settings.style.display = 'none';
    }
}

function loadSettingsProfile() {
    if (!currentUser) return;
    document.getElementById('settings-username').innerText = '@' + currentUser;
    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
    if (users[currentUser] && users[currentUser].avatar) {
        document.getElementById('wallet-avatar-preview').src = users[currentUser].avatar;
    }
}

function handleAvatarUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Limit size to 500KB
        if (file.size > 500000) {
            alert("File is too large! Please upload user an image under 500KB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const base64Image = e.target.result;

            // Update Preview
            document.getElementById('wallet-avatar-preview').src = base64Image;

            // Save to User
            const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
            if (users[currentUser]) {
                users[currentUser].avatar = base64Image;
                localStorage.setItem('walletUsers', JSON.stringify(users));
                updateUserBadge(); // Real-time update
                showToast("Profile picture updated!");
            }
        }

        reader.readAsDataURL(file);
    }
}

function updateUserBadge() {
    const badge = document.getElementById('user-badge');
    const nameEl = document.getElementById('user-name-badge');
    const imgEl = document.getElementById('user-avatar-small');

    if (currentUser) {
        badge.style.display = 'flex';
        nameEl.innerText = currentUser;

        const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
        if (users[currentUser] && users[currentUser].avatar) {
            imgEl.src = users[currentUser].avatar;
        } else {
            imgEl.src = 'assets/icons/house-face-open.svg'; // Default
        }
    } else {
        badge.style.display = 'none';
    }
}

// Switch to Login Form
function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Login Function
function login() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};

    if (users[username] && users[username].password === password) {
        currentUser = username;
        // Badge update
        updateUserBadge();
        loadUserData(username);

        // Check if balance is set
        if (users[username].balanceSet) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'block';
            renderChart();
        } else {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
        }

        // Clear inputs
        usernameInput.value = '';
        passwordInput.value = '';

        // Save login state
        localStorage.setItem('loggedInUser', currentUser);
    } else {
        alert("Invalid username or password.");
    }
}

// Sign Up Function
function signup() {
    const usernameInput = document.getElementById('signupUsername');
    const passwordInput = document.getElementById('signupPassword');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert("Please enter a username and password.");
        return;
    }

    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};

    if (users[username]) {
        alert("Username already exists. Please choose another.");
        return;
    }

    // Create new user
    users[username] = {
        password: password,
        balance: 0,
        transactions: [],
        goal: { name: "", amount: 0 },
        balanceSet: false // Flag to force setup
    };
    localStorage.setItem('walletUsers', JSON.stringify(users));

    alert("Account created! Please log in.");
    showLogin();

    // Pre-fill login username
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = '';
}

// Logout Function
function logout() {
    currentUser = null;
    currentBalance = 0;
    transactions = [];
    savingsGoal = { name: "", amount: 0 };
    jobSettings = { hourlyRate: 0, weekdayHours: 0, weekend: false, weekendHours: 0 };
    lastPaycheck = 0;

    document.getElementById('walletContent').style.display = 'none';
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('authSection').style.display = 'block';
    showLogin();

    // Clear login state
    localStorage.removeItem('loggedInUser');
    updateUserBadge(); // Hide badge
    updateDailyDashboard(); // Clear Dashboard
}

// Close the Wallet Popup
function closeWallet() {
    const wallet = document.getElementById('walletOverlay');
    wallet.classList.remove('active');
}

// Close Wallet when clicking outside
function closeWalletOnOverlay(event) {
    if (event.target.id === 'walletOverlay') {
        closeWallet();
    }
}

// Set Initial Balance
function setBalance() {
    const input = document.getElementById('initialBalanceInput');
    const amount = parseFloat(input.value);

    if (!isNaN(amount)) {
        currentBalance = amount;
        updateBalanceDisplay();

        // Mark balance as set for this user
        const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
        if (users[currentUser]) {
            users[currentUser].balanceSet = true;
            users[currentUser].balance = currentBalance;
            localStorage.setItem('walletUsers', JSON.stringify(users));
        }

        addHistoryItem('Initial Balance', amount, 'set', 'cash');
        saveUserData();

        // Transition to Wallet Content
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('walletContent').style.display = 'block';
        renderChart();
    } else {
        alert("Please enter a valid number for the balance.");
    }
}

// Add Transaction (Gain or Spend)
function addTransaction() {
    const type = document.getElementById('transactionType').value;
    const source = document.getElementById('transactionSource').value;
    const amountInput = document.getElementById('transactionAmount');
    const reasonInput = document.getElementById('transactionReason');
    const amount = parseFloat(amountInput.value);
    const reason = reasonInput.value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }

    if (reason.trim() === "") {
        alert("Please enter a reason for this transaction.");
        return;
    }

    if (type === 'gain') {
        currentBalance += amount;
        alert(`You gained $${amount} from: ${reason} (${source === 'bank' ? 'Bank' : 'Cash'})`);
        addHistoryItem(reason, amount, 'gain', source, 'General'); // Default category for gain
    } else if (type === 'spend') {
        const category = document.getElementById('transactionCategory').value;
        if (currentBalance >= amount) {
            currentBalance -= amount;
            alert(`You spent $${amount} on: ${reason} (${source === 'bank' ? 'Bank' : 'Cash'})`);
            addHistoryItem(reason, amount, 'spend', source, category);
        } else {
            alert("Insufficient funds! You cannot spend more than you have.");
            return;
        }
    }

    updateBalanceDisplay();
    saveUserData();
    renderChart(); // Update chart
    updateDailyDashboard(); // Update home screen

    // Clear inputs
    amountInput.value = '';
    reasonInput.value = '';
}

// Set Savings Goal
function setGoal() {
    const nameInput = document.getElementById('goalNameInput');
    const amountInput = document.getElementById('goalAmountInput');
    const name = nameInput.value;
    const amount = parseFloat(amountInput.value);

    if (name.trim() !== "" && !isNaN(amount) && amount > 0) {
        savingsGoal.name = name;
        savingsGoal.amount = amount;

        document.getElementById('goalNameDisplay').innerText = name;
        document.getElementById('goalAmountDisplay').innerText = amount.toFixed(2);

        document.getElementById('goalDisplay').style.display = 'block';
        document.getElementById('setGoalSection').style.display = 'none';

        saveUserData();
    } else {
        alert("Please enter a valid goal name and amount.");
    }
}

// Update the Balance Display on the screen
function updateBalanceDisplay() {
    document.getElementById('displayBalance').innerText = '$' + currentBalance.toFixed(2);
}

// History Functions
function addHistoryItem(reason, amount, type, source, category = 'General') {
    const transaction = {
        id: Date.now(),
        reason: reason,
        amount: amount,
        type: type, // 'gain', 'spend', 'set'
        source: source, // 'cash', 'bank'
        category: category,
        date: new Date().toLocaleString()
    };
    transactions.unshift(transaction);
}

function openHistory() {
    const historyOverlay = document.getElementById('historyOverlay');
    const historyList = document.getElementById('historyList');
    historyOverlay.classList.add('active');

    // Render History
    historyList.innerHTML = '';
    if (transactions.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">No transactions yet.</p>';
        return;
    }

    transactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'history-item';

        let icon = '➖';
        let color = 'red';
        if (t.type === 'gain') { icon = '➕'; color = 'green'; }
        if (t.type === 'set') { icon = '🏁'; color = 'blue'; }

        let sourceIcon = t.source === 'bank' ? '🏦' : '💵';

        item.innerHTML = `
            <div>
                <strong style="color: ${color}">${icon} ${t.reason}</strong> <br>
                <small>${t.date} • ${sourceIcon} ${t.source.toUpperCase()}</small>
            </div>
            <div style="display:flex; align-items:center;">
                <span style="font-size:0.8rem; margin-right:10px; background:#f0f0f0; padding:2px 6px; border-radius:4px; color:#555;">${t.category || 'General'}</span>
                <span style="font-weight:bold; margin-right: 10px;">$${t.amount.toFixed(2)}</span>
                <button onclick="deleteTransaction(${t.id})">🗑️</button>
            </div>
        `;
        historyList.appendChild(item);
    });
}

function closeHistory() {
    document.getElementById('historyOverlay').classList.remove('active');
}

function closeHistoryOnOverlay(event) {
    if (event.target.id === 'historyOverlay') {
        closeHistory();
    }
}

function deleteTransaction(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        const t = transactions[index];

        // Reverse the balance effect
        if (t.type === 'gain') {
            currentBalance -= t.amount;
        } else if (t.type === 'spend') {
            currentBalance += t.amount;
        } else if (t.type === 'set') {
            currentBalance -= t.amount;
            // We don't want to show the setup screen again if they delete the initial balance transaction
            // because they are already "in" the wallet. They can just add another transaction.
        }

        transactions.splice(index, 1);
        updateBalanceDisplay();
        saveUserData();
        renderChart();
        updateDailyDashboard();
    }
}

// Undo the last transaction
function undoLastTransaction() {
    if (transactions.length === 0) {
        alert("No transactions to undo.");
        return;
    }

    // The most recent transaction is always at index 0 because we unshift()
    const lastTransactionId = transactions[0].id;
    deleteTransaction(lastTransactionId);
}

// ===========================================
// ANIMATION FUNCTIONS
// ===========================================

function triggerWink() {
    const icon = document.querySelector('.house-wink-icon');
    if (!icon) return;

    icon.classList.add('wink');

    // remove after animation ends
    setTimeout(() => {
        icon.classList.remove('wink');
    }, 600);
}


// ===========================================
// CHART & DASHBOARD FUNCTIONS
// ===========================================

function renderChart() {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;

    // Calculate Spending by Category
    const categories = {};
    transactions.forEach(t => {
        if (t.type === 'spend') {
            const cat = t.category || 'General';
            categories[cat] = (categories[cat] || 0) + t.amount;
        }
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const colors = ['#e57373', '#ba68c8', '#64b5f6', '#4db6ac', '#ffd54f', '#ff8a65', '#90a4ae'];

    if (spendingChart) {
        spendingChart.destroy();
    }

    // Don't show chart if no spending
    if (labels.length === 0) {
        // Create a placeholder
        spendingChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Spending Yet'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e0e0e0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateDailyDashboard() {
    // Calculate today's spend
    const today = new Date().toLocaleDateString();
    let spentToday = 0;

    if (currentUser && transactions) {
        transactions.forEach(t => {
            if (t.type === 'spend' && new Date(t.id).toLocaleDateString() === today) {
                spentToday += t.amount;
            }
        });

        const spendEl = document.getElementById('daily-spend-display');
        const balanceEl = document.getElementById('daily-balance-display');

        if (spendEl) spendEl.innerText = '$' + spentToday.toFixed(2);
        if (balanceEl) balanceEl.innerText = '$' + currentBalance.toFixed(2);
    } else {
        const spendEl = document.getElementById('daily-spend-display');
        const balanceEl = document.getElementById('daily-balance-display');
        if (spendEl) spendEl.innerText = '$0.00';
        if (balanceEl) balanceEl.innerText = '$0.00';
    }
}

// ===========================================
// JOB & INCOME FUNCTIONS
// ===========================================

function toggleJobPanel() {
    const panel = document.getElementById('jobSection');
    const settings = document.getElementById('settingsSection');

    // Close settings if open
    settings.style.display = 'none';

    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function toggleWeekendInput() {
    const isChecked = document.getElementById('weekendWorkDetailsCheckbox').checked;
    const container = document.getElementById('weekendInputContainer');
    if (isChecked) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
    calculateJobEarnings();
}

function calculateJobEarnings() {
    const rate = parseFloat(document.getElementById('hourlyRateInput').value) || 0;
    const dayHours = parseFloat(document.getElementById('weekdayHoursInput').value) || 0;
    const weekendHours = parseFloat(document.getElementById('weekendHoursInput').value) || 0;
    const isWeekend = document.getElementById('weekendWorkDetailsCheckbox').checked;

    // Save to localized state
    jobSettings.hourlyRate = rate;
    jobSettings.weekdayHours = dayHours;
    jobSettings.weekend = isWeekend;
    jobSettings.weekendHours = isWeekend ? weekendHours : 0;

    // Calculate
    const weeklyBase = (dayHours * 5 * rate);
    const weekendBase = isWeekend ? (weekendHours * 2 * rate) : 0;
    const weeklyTotal = weeklyBase + weekendBase;

    // Monthly (approx 4.33 weeks)
    const monthlyTotal = weeklyTotal * 4.33;

    // Display
    document.getElementById('calcWeeklyEarn').innerText = '$' + weeklyTotal.toFixed(2);
    document.getElementById('calcMonthlyEarn').innerText = '$' + monthlyTotal.toFixed(2);

    // Save implicitly if user is editing
    if (currentUser) {
        saveUserData();
    }

    checkPaycheckStatus(weeklyTotal);
}

function checkPaycheckStatus(weeklyAmount = null) {
    if (weeklyAmount === null) {
        // Recalculate if not provided to be safe
        const rate = jobSettings.hourlyRate || 0;
        const dayHours = jobSettings.weekdayHours || 0;
        const weekendHours = jobSettings.weekendHours || 0;
        const weeklyBase = (dayHours * 5 * rate);
        const weekendBase = jobSettings.weekend ? (weekendHours * 2 * rate) : 0;
        weeklyAmount = weeklyBase + weekendBase;
    }

    const btn = document.getElementById('collectPayBtn');
    const msg = document.getElementById('paycheckTimer');

    if (weeklyAmount <= 0) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        msg.innerText = "Please set your hours and rate first.";
        return;
    }

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    // const oneWeekMs = 10000; // Debug: 10 seconds for testing

    if (lastPaycheck === 0) {
        // Never collected
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        msg.innerText = "You can collect your first paycheck now!";
        msg.style.color = "var(--primary-color)";
    } else if (now - lastPaycheck >= oneWeekMs) {
        // Time passed
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        msg.innerText = "Paycheck is ready!";
        msg.style.color = "var(--primary-color)";
    } else {
        // Still waiting
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        // Calculate remaining days
        const diff = oneWeekMs - (now - lastPaycheck);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        msg.innerText = `Next paycheck available in: ${days}d ${hours}h`;
        msg.style.color = "#666";
    }
}

function collectPaycheck() {
    const rate = jobSettings.hourlyRate || 0;
    const dayHours = jobSettings.weekdayHours || 0;
    const weekendHours = jobSettings.weekendHours || 0;
    const weeklyBase = (dayHours * 5 * rate);
    const weekendBase = jobSettings.weekend ? (weekendHours * 2 * rate) : 0;
    const totalPay = weeklyBase + weekendBase;

    if (totalPay <= 0) return;

    // Update Balance
    currentBalance += totalPay;

    // Update timestamp
    lastPaycheck = Date.now();

    // Add transaction
    // 'Income' category is not in the default list but we can add it or just pass it as string
    addHistoryItem('Weekly Paycheck', totalPay, 'gain', 'bank', 'Income');

    // Save
    saveUserData();

    // Update UI
    updateBalanceDisplay();
    renderChart();
    updateDailyDashboard();
    checkPaycheckStatus(totalPay);

    // Celebrate
    showToast(`💰 Cha-ching! Collected $${totalPay.toFixed(2)}`);
    triggerWink();
}
