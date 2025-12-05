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
    }
});


// ===========================================
// WALLET APP FUNCTIONS
// ===========================================

let currentBalance = 0;
let savingsGoal = {
    name: "",
    amount: 0
};
let transactions = []; // Store transaction history
let currentUser = null; // Track logged in user

// Load data from LocalStorage on startup
function loadUserData(username) {
    const users = JSON.parse(localStorage.getItem('walletUsers')) || {};
    if (users[username]) {
        const userData = users[username];
        currentBalance = userData.balance || 0;
        transactions = userData.transactions || [];
        savingsGoal = userData.goal || { name: "", amount: 0 };

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
        balanceSet: existingUser.balanceSet || false // Persist the flag
    };
    localStorage.setItem('walletUsers', JSON.stringify(users));
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('darkModeToggle');
    if (document.body.classList.contains('dark-mode')) {
        btn.innerText = '☀️ Light Mode';
        btn.style.backgroundColor = '#f1c40f';
        btn.style.color = '#333';
    } else {
        btn.innerText = '🌙 Dark Mode';
        btn.style.backgroundColor = '#333';
        btn.style.color = 'white';
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
            document.getElementById('walletContent').style.display = 'block';
        } else {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
        }
    }
}

// Switch to Sign Up Form
function showSignUp() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
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
        document.getElementById('userDisplay').innerText = `👤 ${currentUser}`;

        loadUserData(username);

        // Check if balance is set
        if (users[username].balanceSet) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('setupSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'block';
        } else {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('walletContent').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
        }

        // Clear inputs
        usernameInput.value = '';
        passwordInput.value = '';
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

    document.getElementById('walletContent').style.display = 'none';
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('authSection').style.display = 'block';
    showLogin();
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
        addHistoryItem(reason, amount, 'gain', source);
    } else if (type === 'spend') {
        if (currentBalance >= amount) {
            currentBalance -= amount;
            alert(`You spent $${amount} on: ${reason} (${source === 'bank' ? 'Bank' : 'Cash'})`);
            addHistoryItem(reason, amount, 'spend', source);
        } else {
            alert("Insufficient funds! You cannot spend more than you have.");
            return;
        }
    }

    updateBalanceDisplay();
    saveUserData();

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
function addHistoryItem(reason, amount, type, source) {
    const transaction = {
        id: Date.now(),
        reason: reason,
        amount: amount,
        type: type, // 'gain', 'spend', 'set'
        source: source, // 'cash', 'bank'
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
        openHistory();
    }
}
