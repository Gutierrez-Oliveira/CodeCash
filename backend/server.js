const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Middleware para autenticação
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};

// Schema do usuário
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 5000 },
});

const User = mongoose.model("User", UserSchema);

// Schema de transação
const TransactionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// Registro de usuário
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "Usuário registrado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Login de usuário
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar login" });
  }
});

// Verificar saldo
app.get("/balance", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar saldo" });
  }
});

// Transferir dinheiro
app.post("/transfer", authenticate, async (req, res) => {
  const { amount, toUsername } = req.body;

  if (amount <= 0) {
    return res.status(400).json({ error: "O valor deve ser maior que zero" });
  }

  try {
    const fromUser = await User.findById(req.userId);
    const toUser = await User.findOne({ username: toUsername });

    if (!toUser) {
      return res.status(404).json({ error: "Destinatário não encontrado" });
    }

    if (fromUser.balance < amount) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    fromUser.balance -= amount;
    toUser.balance += amount;

    await fromUser.save();
    await toUser.save();

    const transaction = new Transaction({
      fromUser: fromUser._id,
      toUser: toUser._id,
      amount,
    });

    await transaction.save();

    res.json({ message: "Transferência realizada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar transferência" });
  }
});

// Listar transações de um usuário
app.get("/transactions", authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ fromUser: req.userId }, { toUser: req.userId }],
    }).populate("fromUser toUser");

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});

// Depósito
app.post("/deposit", authenticate, async (req, res) => {
  let { amount } = req.body;

  if (typeof amount !== "number" || isNaN(amount)) {
    return res.status(400).json({ error: "Valor inválido. Deve ser um número." });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "O valor deve ser maior que zero." });
  }

  try {
    const user = await User.findById(req.userId);
    user.balance += amount;
    await user.save();
    res.json({
      message: "Depósito realizado com sucesso",
      balance: user.balance,
    });
  } catch (error) {
    console.error("Erro ao processar depósito:", error);
    res.status(500).json({ error: "Erro ao processar depósito" });
  }
});

// Saque
app.post("/withdraw", authenticate, async (req, res) => {
  let { amount } = req.body;

  if (typeof amount !== "number" || isNaN(amount)) {
    return res.status(400).json({ error: "Valor inválido. Deve ser um número." });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "O valor deve ser maior que zero." });
  }

  try {
    const user = await User.findById(req.userId);

    if (user.balance < amount) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    user.balance -= amount;
    await user.save();
    res.json({
      message: "Saque realizado com sucesso",
      balance: user.balance,
    });
  } catch (error) {
    console.error("Erro ao processar saque:", error);
    res.status(500).json({ error: "Erro ao processar saque" });
  }
});

// Iniciar servidor
app.listen(5000, () => console.log("Servidor rodando na porta 3000"));