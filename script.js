/* =========================================
   EXPENSE TRACKER
========================================= */

/* =========================================
   DOM ELEMENTS
========================================= */

const transactionForm = document.getElementById("transaction-form");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const currentBalanceElement = document.getElementById("current-balance");

const transactionsContainer = document.getElementById("transactions-container");
const noTransactionsElement = document.getElementById("no-transactions");

const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");

const transactionCount = document.getElementById("transaction-count");

const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");

const formMessage = document.getElementById("form-message");

const monthlyExpenseElement = document.getElementById("monthly-expense");
const categoryChart = document.getElementById("category-chart");

/* =========================================
   LOCAL STORAGE
========================================= */

const STORAGE_KEY = "expenseTrackerTransactions";

let transactions = loadTransactions();

let editingId = null;

/* =========================================
   LOAD TRANSACTIONS
========================================= */

function loadTransactions() {
  try {
    const savedTransactions = localStorage.getItem(STORAGE_KEY);

    if (!savedTransactions) {
      return [];
    }

    const parsedTransactions = JSON.parse(savedTransactions);

    if (!Array.isArray(parsedTransactions)) {
      return [];
    }

    return parsedTransactions.filter(
      (transaction) =>
        transaction &&
        typeof transaction.id === "string" &&
        typeof transaction.type === "string" &&
        typeof transaction.amount === "number" &&
        typeof transaction.category === "string" &&
        typeof transaction.date === "string" &&
        typeof transaction.description === "string",
    );
  } catch (error) {
    console.error("Unable to load transactions:", error);

    return [];
  }
}

/* =========================================
   SAVE TRANSACTIONS
========================================= */

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* =========================================
   FORMAT CURRENCY
========================================= */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    }

    if (transaction.type === "expense") {
      totalExpenses += transaction.amount;
    }
  });

  const balance = totalIncome - totalExpenses;

  totalIncomeElement.textContent = formatCurrency(totalIncome);

  totalExpensesElement.textContent = formatCurrency(totalExpenses);

  currentBalanceElement.textContent = formatCurrency(balance);
}

/* =========================================
   DISPLAY TRANSACTIONS
========================================= */

function displayTransactions() {
  const selectedType = filterType.value;
  const categorySearch = filterCategory.value.trim().toLowerCase();

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesType =
        selectedType === "all" || transaction.type === selectedType;

      const matchesCategory = transaction.category
        .toLowerCase()
        .includes(categorySearch);

      return matchesType && matchesCategory;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  transactionsContainer.innerHTML = "";

  transactionCount.textContent = `${filteredTransactions.length} ${
    filteredTransactions.length === 1 ? "transaction" : "transactions"
  }`;

  if (filteredTransactions.length === 0) {
    transactionsContainer.appendChild(noTransactionsElement);

    return;
  }

  filteredTransactions.forEach((transaction) => {
    const transactionItem = document.createElement("div");

    transactionItem.className = "transaction-item";

    /* Transaction information */

    const transactionInfo = document.createElement("div");

    transactionInfo.className = "transaction-info";

    const description = document.createElement("span");

    description.className = "transaction-description";

    description.textContent = transaction.description;

    const meta = document.createElement("span");

    meta.className = "transaction-meta";

    meta.textContent = `${transaction.category} • ${transaction.date}`;

    transactionInfo.append(description, meta);

    /* Right side */

    const transactionRight = document.createElement("div");

    transactionRight.className = "transaction-right";

    const amount = document.createElement("span");

    amount.className = `transaction-amount ${
      transaction.type === "income" ? "income-amount" : "expense-amount"
    }`;

    amount.textContent = `${transaction.type === "income" ? "+" : "-"}${formatCurrency(
      transaction.amount,
    )}`;

    /* Action buttons */

    const actions = document.createElement("div");

    actions.className = "transaction-actions";

    const editButton = document.createElement("button");

    editButton.className = "action-btn";

    editButton.textContent = "Edit";

    editButton.dataset.action = "edit";

    editButton.dataset.id = transaction.id;

    const deleteButton = document.createElement("button");

    deleteButton.className = "action-btn delete-btn";

    deleteButton.textContent = "Delete";

    deleteButton.dataset.action = "delete";

    deleteButton.dataset.id = transaction.id;

    actions.append(editButton, deleteButton);

    transactionRight.append(amount, actions);

    transactionItem.append(transactionInfo, transactionRight);

    transactionsContainer.appendChild(transactionItem);
  });
}

/* =========================================
   FORM MESSAGE
========================================= */

function showFormMessage(message, type) {
  formMessage.textContent = message;

  formMessage.className = `form-message ${type}`;
}

/* =========================================
   GET TODAY'S DATE
========================================= */

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================
   RESET FORM
========================================= */

function resetForm() {
  transactionForm.reset();

  editingId = null;

  formTitle.textContent = "Add New Transaction";

  submitButton.textContent = "Add Transaction";

  cancelButton.hidden = true;

  dateInput.value = getTodayDate();
}

/* =========================================
   MONTHLY EXPENSE
========================================= */

function updateMonthlyExpense() {
  const today = new Date();

  const currentYear = today.getFullYear();

  const currentMonth = today.getMonth();

  let monthlyExpense = 0;

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") {
      return;
    }

    const transactionDate = new Date(`${transaction.date}T00:00:00`);

    if (
      transactionDate.getFullYear() === currentYear &&
      transactionDate.getMonth() === currentMonth
    ) {
      monthlyExpense += transaction.amount;
    }
  });

  monthlyExpenseElement.textContent = formatCurrency(monthlyExpense);
}

/* =========================================
   CATEGORY-WISE EXPENSE
========================================= */

function updateCategoryChart() {
  const categoryTotals = {};

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") {
      return;
    }

    const category = transaction.category.trim();

    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }

    categoryTotals[category] += transaction.amount;
  });

  categoryChart.innerHTML = "";

  const categories = Object.entries(categoryTotals);

  if (categories.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "chart-empty";

    emptyMessage.textContent = "No expense data available.";

    categoryChart.appendChild(emptyMessage);

    return;
  }

  categories.sort((a, b) => b[1] - a[1]);

  const maximumAmount = categories[0][1];

  categories.forEach(([category, amount]) => {
    const row = document.createElement("div");

    row.className = "category-row";

    const name = document.createElement("span");

    name.className = "category-name";

    name.textContent = category;

    const barContainer = document.createElement("div");

    barContainer.className = "category-bar-container";

    const bar = document.createElement("div");

    bar.className = "category-bar";

    bar.style.width = `${(amount / maximumAmount) * 100}%`;

    barContainer.appendChild(bar);

    const value = document.createElement("span");

    value.className = "category-value";

    value.textContent = formatCurrency(amount);

    row.append(name, barContainer, value);

    categoryChart.appendChild(row);
  });
}

/* =========================================
   UPDATE ALL INSIGHTS
========================================= */

function updateInsights() {
  updateMonthlyExpense();

  updateCategoryChart();
}

/* =========================================
   FORM SUBMISSION
========================================= */

transactionForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const type = typeInput.value;

  const amount = Number(amountInput.value);

  const category = categoryInput.value.trim();

  const date = dateInput.value;

  const description = descriptionInput.value.trim();

  /* Validation */

  if (!type || !category || !date || !description) {
    showFormMessage("Please fill in all the required fields.", "error");

    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showFormMessage("Please enter a valid amount greater than zero.", "error");

    return;
  }

  /* Create transaction */

  const transactionData = {
    type,
    amount,
    category,
    date,
    description,
  };

  const wasEditing = editingId !== null;

  /* Edit existing transaction */

  if (editingId !== null) {
    transactions = transactions.map((transaction) => {
      if (transaction.id === editingId) {
        return {
          ...transaction,
          ...transactionData,
        };
      }

      return transaction;
    });
  } else {

  /* Add new transaction */
    transactions.push({
      id: crypto.randomUUID(),

      ...transactionData,
    });
  }

  /* Save & update UI */

  saveTransactions();

  updateSummary();

  displayTransactions();

  updateInsights();

  resetForm();

  showFormMessage(
    wasEditing
      ? "Transaction updated successfully."
      : "Transaction added successfully.",

    "success",
  );
});

/* =========================================
   EDIT / DELETE TRANSACTION
========================================= */

transactionsContainer.addEventListener("click", function (event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  const id = button.dataset.id;

  if (action === "edit") {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction) {
      return;
    }

    editingId = transaction.id;

    typeInput.value = transaction.type;

    amountInput.value = transaction.amount;

    categoryInput.value = transaction.category;

    dateInput.value = transaction.date;

    descriptionInput.value = transaction.description;

    formTitle.textContent = "Edit Transaction";

    submitButton.textContent = "Update Transaction";

    cancelButton.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (action === "delete") {
    const confirmed = confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmed) {
      return;
    }

    transactions = transactions.filter((transaction) => transaction.id !== id);

    saveTransactions();

    updateSummary();

    displayTransactions();

    updateInsights();

    showFormMessage("Transaction deleted successfully.", "success");
  }
});

/* =========================================
   CANCEL EDIT
========================================= */

cancelButton.addEventListener("click", function () {
  resetForm();

  formMessage.textContent = "";

  formMessage.className = "form-message";
});

/* =========================================
   FILTERS
========================================= */

filterType.addEventListener("change", displayTransactions);

filterCategory.addEventListener("input", displayTransactions);

/* =========================================
   INITIALIZE APP
========================================= */

function initializeApp() {
  dateInput.value = getTodayDate();

  updateSummary();

  displayTransactions();

  updateInsights();
}

initializeApp();
