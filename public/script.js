// ====== COMMON UTILITY ======
function getClientDate() {
  const d = new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ====== LOGIN & SIGNUP PAGES ======
if (window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("signup.html")) {
  
  async function signup() {
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;
    if (!username || !password) return alert("Please enter username and password");
    
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
      alert("Signup successful! Please login.");
      window.location.href = "login.html";
    }
  }

  async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    if (!username || !password) return alert("Please enter username and password");

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const text = await res.text();
      return alert("Server error: " + text);
    }

    const data = await res.json();
    if (data.userId) {
      localStorage.setItem("userId", data.userId);
      window.location.href = "tracker.html";
    } else {
      alert(data.error);
    }
  }

  window.signup = signup;
  window.login = login;
}

// ====== TRACKER PAGE ======
if (window.location.pathname.endsWith("tracker.html")) {
  const userId = localStorage.getItem("userId");
  if (!userId) window.location.href = "login.html";

  // --- Show/hide add-expense modal ---
  function showAddForm() {
    const dateInput = document.getElementById("date");
    if (dateInput) dateInput.value = getClientDate();
    document.getElementById("addModal").style.display = "block";
  }

  function hideAddForm() {
    document.getElementById("addModal").style.display = "none";
  }

  // --- Add expense ---
  async function addExpense() {
    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value || getClientDate();

    if (!amount) return alert("Please enter amount");

    const res = await fetch("/add-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, date, amount, description })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
      hideAddForm();
      loadExpenses();
    }
  }

  // --- Delete expense ---
  async function deleteExpense(expenseId) {
    const res = await fetch(`/delete-expense/${expenseId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) return alert(data.error);
    loadExpenses();
  }

  // --- Load expenses ---
  async function loadExpenses() {
    if (!userId) return;
    const res = await fetch(`/expenses/${userId}`);
    const data = await res.json();

    // Daily totals
    const dailyList = document.getElementById("dailyTotals");
if (dailyList) {
  dailyList.innerHTML = "";

  // Today's date string
  const today = getClientDate(); // YYYY-MM-DD

  // Flag to check if today exists in data
  let hasToday = false;

  for (let day in data.dailyTotals) {
    const li = document.createElement("li");
    li.textContent = `${new Date(day).toLocaleDateString()} - ₹${data.dailyTotals[day]}`;
    dailyList.appendChild(li);

    if (day === today) hasToday = true;
  }

  // If today has no expenses, show a message
  if (!hasToday) {
    const li = document.createElement("li");
    li.textContent = "No expenses today";
    dailyList.appendChild(li);
  }
    }

    // Overall total
    const overall = document.getElementById("overallTotal");
    if (overall) overall.textContent = "₹" + data.overallTotal;

    // Group expenses by date
    const grouped = {};
    data.expenses.forEach(exp => {
      const day = new Date(exp.date).toISOString().split("T")[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(exp);
    });

    // Render collapsible cards
    const container = document.getElementById("dailyExpensesContainer");
    if (!container) return;
    container.innerHTML = "";

    for (let day in grouped) {
      const card = document.createElement("div");
      card.className = "card collapsible";

      // Header
      const header = document.createElement("div");
      header.className = "card-header";
      const total = grouped[day].reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      header.innerHTML = `
        <span class="date-text">${new Date(day).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })}</span>
        <span class="total-text">₹${total}</span>
      `;
      header.addEventListener("click", () => body.classList.toggle("active"));

      // Body
      const body = document.createElement("div");
      body.className = "card-body";

      const ul = document.createElement("ul");
      grouped[day].forEach(exp => {
        const li = document.createElement("li");
        li.innerHTML = `${exp.description || "No Info"} - ₹${exp.amount}  
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteExpense('${exp._id}')">X</button>`;
        ul.appendChild(li);
      });
      body.appendChild(ul);

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    }
  }

  // Expose functions to HTML
  window.showAddForm = showAddForm;
  window.hideAddForm = hideAddForm;
  window.addExpense = addExpense;
  window.deleteExpense = deleteExpense;

  // Auto-load
  loadExpenses();
}
