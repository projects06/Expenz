const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require('path')

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

mongoose.connect("mongodb+srv://ExpensesTracker:Expenses%402025@expensestracker.ofwgcnq.mongodb.net/prod")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Models
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  password: String
}));

const Expense = mongoose.model("Expense", new mongoose.Schema({
  userId: String,
  date: Date,
  amount: Number,
  description: String
}));

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ error: "Username exists" });

  await new User({ username, password }).save();
  res.json({ message: "Signup success" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.json({ error: "Invalid credentials" });
  res.json({ message: "Login success", userId: user._id });
});

app.post("/add-expense", async (req, res) => {
    const { userId, date, amount, description } = req.body;
  
    if (!userId || !amount || isNaN(amount)) {
      return res.json({ error: "Invalid data" });
    }
  
    await new Expense({
      userId,
      date: new Date(date),
      amount: parseFloat(amount),
      description: description ? description.toString().substring(0, 300) : ""
    }).save();
  
    res.json({ message: "Expense added" });
  });
  

app.get("/expenses/:userId", async (req, res) => {
  const { userId } = req.params;
  const expenses = await Expense.find({ userId }).sort({ date: -1 });

  const dailyTotals = {};
  let overallTotal = 0;
  expenses.forEach(e => {
    const day = new Date(e.date).toISOString().split("T")[0];
    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
    overallTotal += e.amount;
  });

  res.json({ expenses, dailyTotals, overallTotal });
});

app.delete("/delete-expense/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await Expense.findByIdAndDelete(id);
      res.json({ message: "Expense deleted" });
    } catch (err) {
      res.json({ error: "Failed to delete" });
    }
  });
  
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
  });
  

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
