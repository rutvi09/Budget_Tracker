
let expenses = [];
let currentUser = null;
let categoryChart = null;
let trendChart = null;

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function signup() {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !password) {
        alert('Please fill all fields!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        alert('Username already exists!');
        return;
    }

    users[username] = { email, password };
    localStorage.setItem('users', JSON.stringify(users));
    alert('Signup successful! Login now.');
    showLogin();
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username].password === password) {
        currentUser = username;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        loadProfile();
        loadExpenses();
    } else {
        alert('Invalid username or password!');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
    expenses = [];
    if (categoryChart) categoryChart.destroy();
    if (trendChart) trendChart.destroy();
}

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('users'))[currentUser];
    document.getElementById('profile-username').textContent = currentUser;
    document.getElementById('profile-email').textContent = user.email;
    updateProfileStats();
}

function updateProfileStats() {
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const dates = expenses.map(e => new Date(e.date));
    const firstDate = dates.length ? new Date(Math.min(...dates)) : new Date();
    const lastDate = dates.length ? new Date(Math.max(...dates)) : new Date();
    const days = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
    const months = Math.max(1, days / 30);
    const years = Math.max(1, days / 365);

    document.getElementById('profile-total-spent').textContent = totalSpent.toFixed(2);
    document.getElementById('profile-daily-avg').textContent = (totalSpent / days).toFixed(2);
    document.getElementById('profile-monthly-avg').textContent = (totalSpent / months).toFixed(2);
    document.getElementById('profile-yearly-avg').textContent = (totalSpent / years).toFixed(2);

    const goal = Number(document.getElementById('savings-goal').value) || 0;
    document.getElementById('profile-goal').textContent = goal.toFixed(2);
}

function addExpense() {
    const title = document.getElementById('expense-title').value;
    const amount = Number(document.getElementById('expense-amount').value);
    let category = document.getElementById('expense-category').value;
    const customCategory = document.getElementById('custom-category').value;
    const date = document.getElementById('expense-date').value;
    const time = document.getElementById('expense-time').value;

    if (!title || !amount || (!category && !customCategory) || !date || !time) {
        alert('Please fill all fields!');
        return;
    }

    if (category === 'Others' && customCategory) category = customCategory;

    const expense = { title, amount, category, date, time };
    expenses.push(expense);
    saveExpenses();
    renderExpenses();
    updateProfileStats();
    renderCategoryChart();
    renderTrendChart();
}

function saveExpenses() {
    localStorage.setItem(currentUser + '_expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    expenses = JSON.parse(localStorage.getItem(currentUser + '_expenses') || '[]');
    renderExpenses();
    renderCategoryChart();
    renderTrendChart();
}

function resetExpenses() {
    if (!confirm('Are you sure you want to reset all expenses?')) return;
    expenses = [];
    saveExpenses();
    renderExpenses();
    updateProfileStats();
    renderCategoryChart();
    renderTrendChart();
}

function renderExpenses() {
    const tbody = document.querySelector('#expense-table tbody');
    tbody.innerHTML = '';
    expenses.forEach((exp, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${exp.title}</td>
            <td>₹ ${exp.amount.toFixed(2)}</td>
            <td>${exp.category}</td>
            <td>${exp.date} ${exp.time}</td>
            <td><button onclick="deleteExpense(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    document.getElementById('total-spent').textContent = total.toFixed(2);
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    saveExpenses();
    renderExpenses();
    updateProfileStats();
    renderCategoryChart();
    renderTrendChart();
}

document.getElementById('set-goal-btn').addEventListener('click', () => {
    const goal = Number(document.getElementById('savings-goal').value);
    if (!goal) return;
    updateProfileStats();
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const remaining = Math.max(0, goal - total);
    document.getElementById('goal-msg').textContent = `Goal: ₹ ${goal.toFixed(2)}`;
    document.getElementById('goal-remaining').textContent = `Remaining: ₹ ${remaining.toFixed(2)}`;
    const progress = Math.min((total / goal) * 100, 100);
    document.getElementById('goal-progress-bar').style.width = progress + '%';
});

const categorySelect = document.getElementById('expense-category');
const customCategoryInput = document.getElementById('custom-category');

categorySelect.addEventListener('change', () => {
    if (categorySelect.value === 'Others') {
        customCategoryInput.style.display = 'block';
    } else {
        customCategoryInput.style.display = 'none';
        customCategoryInput.value = '';
    }
});

function renderCategoryChart(type = 'bar') {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryMap = {};
    expenses.forEach(exp => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + Number(exp.amount);
    });

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, {
        type: type,
        data: {
            labels: Object.keys(categoryMap),
            datasets: [{
                label: 'Expenses',
                data: Object.values(categoryMap),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
                ]
            }]
        }
    });
}

function updateCategoryChartType(type) {
    renderCategoryChart(type);
}

function renderTrendChart() {
    const period = document.getElementById('trend-period-select').value;
    const ctx = document.getElementById('trendChart').getContext('2d');

    const trendMap = {};

    expenses.forEach(exp => {
        const date = new Date(exp.date);
        let key;
        if (period === 'daily') key = exp.date;
        else if (period === 'monthly') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        else key = `${date.getFullYear()}`;
        trendMap[key] = (trendMap[key] || 0) + Number(exp.amount);
    });

    const sortedKeys = Object.keys(trendMap).sort((a, b) => new Date(a) - new Date(b));

    const labels = sortedKeys.map(key => {
        const parts = key.split('-');
        if (period === 'daily') {
            const date = new Date(key);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        } else if (period === 'monthly') {
            const month = parseInt(parts[1], 10) - 1;
            const year = parts[0];
            return new Date(year, month).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        } else {
            return key;
        }
    });

    const data = sortedKeys.map(key => trendMap[key]);

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending',
                data: data,
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            plugins: { legend: { display: true } },
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }
            }
        }
    });
}

document.getElementById('trend-period-select').addEventListener('change', renderTrendChart);

function downloadCSV() {
    let csv = 'Title,Amount,Category,Date,Time\n';
    expenses.forEach(exp => {
        csv += `${exp.title},${exp.amount},${exp.category},${exp.date},${exp.time}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expenses.csv';
    a.click();
}

function downloadPDF() {
    html2canvas(document.querySelector('.dashboard')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('expenses.pdf');
    });
}
