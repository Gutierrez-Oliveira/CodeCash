import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Button,
  TextField,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { NumericFormat } from "react-number-format";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState(0);
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    if (token) {
      getBalance();
    }
  }, [token]);

  const register = async () => {
    try {
      await axios.post("http://localhost:5000/register", { username, password });
      alert("Usuário registrado com sucesso!");
    } catch (error) {
      alert("Erro ao registrar: " + (error.response?.data?.error || "Erro desconhecido"));
    }
  };

  const login = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { username, password });
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      alert("Login efetuado com sucesso!");
      getBalance();
    } catch (error) {
      alert("Erro ao efetuar login: " + (error.response?.data?.error || "Erro desconhecido"));
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setBalance(null);
    setUsername("");
    setPassword("");
    setTransactions([]);
    setShowTransactions(false);
  };

  const getBalance = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance);
    } catch (error) {
      alert("Erro ao buscar saldo: " + (error.response?.data?.error || "Token inválido. Faça login novamente."));
      logout();
    }
  };

  const deposit = async () => {
    if (amount <= 0) {
      alert("O valor deve ser maior que zero.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5000/deposit",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactionMessage("Depósito realizado com sucesso!");
      getBalance();
    } catch (error) {
      setTransactionMessage("Erro ao depositar: " + (error.response?.data?.error || "Erro desconhecido"));
    }
  };

  const withdraw = async () => {
    if (amount <= 0) {
      alert("O valor deve ser maior que zero.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:5000/withdraw",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactionMessage("Saque realizado com sucesso!");
      getBalance();
    } catch (error) {
      setTransactionMessage("Erro ao sacar: " + (error.response?.data?.error || "Erro desconhecido"));
    }
  };

  const getTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
      setShowTransactions(true);
    } catch (error) {
      alert("Erro ao buscar transações: " + (error.response?.data?.error || "Erro desconhecido"));
    }
  };

  const theme = createTheme({
    palette: {
      primary: { main: "#0D47A1" },
      secondary: { main: "#D32F2F" },
      success: { main: "#388E3C" },
    },
  });

  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(to right, #0D47A1, #1976D2)",
          padding: 3,
        }}
      >
        <Container
          maxWidth="sm"
          sx={{
            backgroundColor: "#ffffff",
            padding: 4,
            borderRadius: 3,
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
            transition: "0.3s",
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, marginBottom: 3 }}>
            <AccountBalanceIcon sx={{ fontSize: 50, color: "#0D47A1" }} />
            <Typography variant="h3" fontWeight="bold" color="primary">
              CodeCash
            </Typography>
          </Box>

          {!token && (
            <Card sx={{ marginTop: 3 }}>
              <CardContent>
                <TextField label="Usuário" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ marginBottom: 2 }} />
                <TextField label="Senha" fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ marginBottom: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button variant="contained" color="primary" onClick={register} fullWidth disabled={!isFormValid}>
                      Criar conta
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="contained" color="secondary" onClick={login} fullWidth disabled={!isFormValid}>
                      Login
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {token && (
            <>
              <Card sx={{ marginTop: 3 }}>
                <CardContent>
                  <Typography variant="h6">
                    Saldo: R$ {balance !== null ? balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "Carregando..."}
                  </Typography>
                  <Button variant="contained" color="primary" onClick={getBalance} fullWidth sx={{ marginTop: 2 }}>
                    Atualizar Saldo
                  </Button>
                  <Button variant="outlined" color="primary" onClick={getTransactions} fullWidth sx={{ marginTop: 2 }}>
                    Ver Histórico
                  </Button>
                  <Button variant="contained" color="error" onClick={logout} fullWidth sx={{ marginTop: 2 }}>
                    <ExitToAppIcon sx={{ marginRight: 1 }} />
                    Logout
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ marginTop: 3 }}>
                <CardContent>
                  <NumericFormat
                    label="Valor"
                    fullWidth
                    customInput={TextField}
                    value={amount}
                    decimalSeparator="," 
                    thousandSeparator="."
                    allowNegative={false}
                    prefix="R$ "
                    onValueChange={(values) => setAmount(values.floatValue || 0)}
                    sx={{ marginBottom: 2 }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button variant="contained" color="success" onClick={deposit} fullWidth>
                        <AttachMoneyIcon sx={{ marginRight: 1 }} />
                        Depositar
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="contained" color="error" onClick={withdraw} fullWidth>
                        Sacar
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {showTransactions && (
  <Card sx={{ marginTop: 3, maxHeight: 300, overflow: "auto" }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Histórico de Transações
      </Typography>
      {transactions.length === 0 ? (
        <Typography variant="body2">Nenhuma transação encontrada.</Typography>
      ) : (
        transactions.map((tx, index) => {
          const userId = jwtDecode(token).id;
          let tipo = "";
          let descricao = "";
          let cor = "text.primary";

          if (!tx.fromUser && tx.toUser._id === userId) {
            tipo = "Depósito";
            descricao = "Depósito recebido";
            cor = "green";
          } else if (!tx.toUser && tx.fromUser._id === userId) {
            tipo = "Saque";
            descricao = "Saque realizado";
            cor = "red";
          } else {
            const isIncoming = tx.toUser._id === userId;
            tipo = "Transferência";
            descricao = isIncoming
              ? `Recebido de ${tx.fromUser?.username || "desconhecido"}`
              : `Enviado para ${tx.toUser?.username || "desconhecido"}`;
            cor = isIncoming ? "green" : "red";
          }

          return (
            <Box key={index} sx={{ borderBottom: "1px solid #ccc", padding: 1 }}>
              <Typography variant="body2"><strong>{tipo}:</strong> {descricao}</Typography>
              <Typography variant="body2" color={cor}>
                {cor === "green" ? "+" : "-"} R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(tx.date).toLocaleString("pt-BR")}
              </Typography>
            </Box>
          );
        })
      )}
    </CardContent>
  </Card>
)}

            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
