let expenses = [];
let savingsGoal = 0;

const profileColors = [
    ['#FF6B6B','#FFD93D'], ['#4ECDC4','#556270'], ['#C44D58','#FFA500'],
    ['#6A0572','#00A8E8'], ['#F3FFBD','#FF9A8B'], ['#A1FFCE','#FAFFD1'],
    ['#FF9A8B','#FF6A88'], ['#00F260','#0575E6'], ['#E1EEC3','#F05053'], ['#FFAFBD','#ffc3a0']
];


const categoryCtx = document.getElementById('categoryChart').getContext('2d');
let categoryChart = new Chart(categoryCtx, { type:'bar', data:{ labels: [], datasets:[{ label:'Spending', data:[], backgroundColor:[] }] }, options:{ responsive:true } });

const trendCtx = document.getElementById('trendChart').getContext('2d');
let trendChart = new Chart(trendCtx, { type:'bar', data:{ labels:[], datasets:[{ label:'Spending', data:[], backgroundColor:[] }] }, options:{ responsive:true } });


function showSignup() { document.getElementById("login-form").style.display="none"; document.getElementById("signup-form").style.display="block"; }
function showLogin() { document.getElementById("signup-form").style.display="none"; document.getElementById("login-form").style.display="block"; }

function signup(){
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    if(!username||!password||!email){ alert("Enter valid details"); return; }
    let users = JSON.parse(localStorage.getItem("users"))||{};
    if(users[username]){ alert("Username exists"); return; }
    users[username] = { password, email, expenses: [], savingsGoal:0 };
    localStorage.setItem("users", JSON.stringify(users));
    alert("Account created! Login.");
    showLogin();
}

function login(){
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    let users = JSON.parse(localStorage.getItem("users"))||{};
    if(users[username] && users[username].password===password){
        localStorage.setItem("currentUser", username);
        loadUserData();
        document.getElementById("auth-container").style.display="none";
        document.getElementById("app-container").style.display="block";
    } else alert("Invalid credentials");
}

function logout(){
    localStorage.removeItem("currentUser");
    document.getElementById("app-container").style.display="none";
    document.getElementById("auth-container").style.display="block";
}


function getRandomGradient(){
    const rand = profileColors[Math.floor(Math.random()*profileColors.length)];
    return `linear-gradient(135deg, ${rand[0]}, ${rand[1]}, ${rand[0]}, ${rand[1]})`;
}


function loadUserData(){
    const username = localStorage.getItem("currentUser");
    const users = JSON.parse(localStorage.getItem("users"));
    if(!username||!users[username]) return;

    expenses = users[username].expenses||[];
    savingsGoal = users[username].savingsGoal||0;

    document.getElementById("profile-username").innerText = username;
    document.getElementById("profile-email").innerText = users[username].email||'';

    const photoContainer = document.getElementById("profile-photo");
    const letterDiv = document.getElementById("profile-photo-letter");

    if(users[username].photo){
        photoContainer.src = users[username].photo;
        photoContainer.style.display="block";
        letterDiv.style.display="none";
    } else {
        photoContainer.style.display="none";
        letterDiv.style.display="flex";
        letterDiv.innerText = username.charAt(0).toUpperCase();
        letterDiv.style.background = getRandomGradient();
    }

    updateUI();
}


function saveData(){
    const username = localStorage.getItem("currentUser");
    if(username){
        let users = JSON.parse(localStorage.getItem("users"));
        users[username].expenses = expenses;
        users[username].savingsGoal = savingsGoal;
        localStorage.setItem("users", JSON.stringify(users));
    }
}


document.getElementById('expense-category').addEventListener('change', function(){
    document.getElementById("custom-category").style.display = this.value==="Others"?"block":"none";
});
document.getElementById('set-goal-btn').addEventListener('click', updateGoal);

function addExpense(){
    const title = document.getElementById("expense-title").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value);
    let category = document.getElementById("expense-category").value;
    if(category==="Others" && document.getElementById("custom-category").value.trim()!=="") category=document.getElementById("custom-category").value.trim();
    const dateVal = document.getElementById("expense-date").value;
    const timeVal = document.getElementById("expense-time").value;
    if(!title||isNaN(amount)||amount<=0||!dateVal||!timeVal){ alert("Enter valid details"); return; }

    expenses.push({title, amount, category, date:new Date(`${dateVal}T${timeVal}`).toISOString()});
    saveData();
    updateUI();

    document.getElementById("expense-title").value="";
    document.getElementById("expense-amount").value="";
    document.getElementById("custom-category").value="";
    document.getElementById("expense-date").value="";
    document.getElementById("expense-time").value="";
}

function updateGoal(){
    const goal = parseFloat(document.getElementById("savings-goal").value);
    if(isNaN(goal)||goal<=0){ alert("Enter valid goal"); return; }
    savingsGoal = goal;
    saveData();
    updateUI();
}

function resetExpenses(){ if(!confirm("Delete all expenses?")) return; expenses=[]; savingsGoal=0; saveData(); updateUI(); }
function deleteExpense(index){ expenses.splice(index,1); saveData(); updateUI(); }


function updateUI(){
    const total = expenses.reduce((s,e)=>s+e.amount,0);
    document.getElementById("total-spent").innerText = total.toFixed(2);

    
    const tbody = document.querySelector("#expense-table tbody");
    tbody.innerHTML="";
    expenses.sort((a,b)=>new Date(b.date)-new Date(a.date));
    expenses.forEach((e,i)=>{
        const d = new Date(e.date);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${e.title}</td><td>₹${e.amount.toFixed(2)}</td><td>${e.category}</td><td>${d.toLocaleString()}</td><td><span onclick="deleteExpense(${i})" class="link-text">❌</span></td>`;
        tbody.appendChild(tr);
    });

    
    const goalMsg = document.getElementById("goal-msg");
    const goalRemaining = document.getElementById("goal-remaining");
    const progressContainer = document.querySelector(".goal-progress-container");
    const progressBar = document.getElementById("goal-progress-bar");
    if(savingsGoal>0){
        const diff = savingsGoal-total;
        goalMsg.innerText = `Savings Goal: ₹${savingsGoal.toFixed(2)}`;
        goalRemaining.innerText = diff>=0?`Remaining: ₹${diff.toFixed(2)}`:`Exceeded by ₹${(-diff).toFixed(2)}`;
        progressContainer.style.display="block";
        progressBar.style.width = Math.min(Math.max((total/savingsGoal)*100,0),100)+"%";
    } else { goalMsg.innerText=""; goalRemaining.innerText=""; progressContainer.style.display="none"; progressBar.style.width="0%"; }

    
    document.getElementById("profile-total-spent").innerText = total.toFixed(2);
    const today = new Date();
    const startDate = expenses.length ? new Date(Math.min(...expenses.map(e=>new Date(e.date)))) : today;
    const daysUsed = Math.max(1, Math.floor((today-startDate)/(1000*60*60*24))+1);
    const monthsUsed = Math.max(1, today.getMonth() - startDate.getMonth() +1);
    document.getElementById("profile-daily-avg").innerText = (total/daysUsed).toFixed(2);
    document.getElementById("profile-monthly-avg").innerText = (total/monthsUsed).toFixed(2);
    document.getElementById("profile-goal").innerText = savingsGoal.toFixed(2);

    
    const totals = {};
    expenses.forEach(e=>totals[e.category]=(totals[e.category]||0)+e.amount);
    const categories = Object.keys(totals);
    const data = categories.map(c=>totals[c]);
    const colors = ['#FFCDD2','#FFEB3B','#FF9800','#4DB6AC','#90CAF9','#D7CCC8','#B39DDB','#F48FB1','#CE93D8','#81D4FA','#A5D6A7','#FFE082'];
    categoryChart.data.labels = categories;
    categoryChart.data.datasets[0].data = data;
    categoryChart.data.datasets[0].backgroundColor = colors.slice(0,categories.length);
    categoryChart.update();

    
    const trendData = {};
    expenses.forEach(e=>{
        const d = new Date(e.date);
        const key = d.toLocaleDateString();
        trendData[key] = (trendData[key]||0)+e.amount;
    });
    trendChart.data.labels = Object.keys(trendData);
    trendChart.data.datasets[0].data = Object.values(trendData);
    trendChart.data.datasets[0].backgroundColor = colors[0];
    trendChart.update();
}


function downloadCSV(){
    if(expenses.length===0){ alert("No expenses"); return; }
    let csv = "Title,Amount,Category,Date\n";
    expenses.forEach(e=>{ csv+=`${e.title},${e.amount},${e.category},${new Date(e.date).toLocaleString()}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download="expenses.csv";
    a.click();
}

function downloadPDF(){
    html2canvas(document.querySelector('.dashboard')).then(canvas=>{
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth)/imgProps.width;
        pdf.addImage(imgData,'PNG',0,0,pdfWidth,pdfHeight);
        pdf.save("expenses.pdf");
    });
}


function updateCategoryChartType(type){ categoryChart.config.type=type; categoryChart.update(); }
function updateTrendChart(type){  }
