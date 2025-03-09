import { useState, useEffect } from "react";
import axios from "axios";
import { Button, TextField, Container, Typography, Box, Card, CardContent, Grid } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { NumericFormat } from "react-number-format";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState(0);
  const [transactionMessage, setTransactionMessage] = useState("");

  useEffect(() => {
    if (token) {
      getBalance();
    }
  }, [token]);

  const register = async () => {
    await axios.post("http://localhost:5000/register", { username, password });
    alert("Usuário registrado");
  };

  const login = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { username, password });
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      alert("Login efetuado com sucesso");
      getBalance();
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.error || "Unknown error"));
    }
  };

  const getBalance = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance);
    } catch (error) {
      alert("Error fetching balance: " + (error.response?.data?.error || "Unknown error"));
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactionMessage("Depósito bem sucedido!");
      getBalance();
    } catch (error) {
      setTransactionMessage("Depósito falhou: " + (error.response?.data?.error || "Unknown error"));
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactionMessage("Retirada bem-sucedida!");
      getBalance();
    } catch (error) {
      setTransactionMessage(error.response?.data?.error || "Withdrawal failed: Unknown error");
    }
  };

  const theme = createTheme({
    palette: {
      primary: { main: "#0D47A1" },
      secondary: { main: "#D32F2F" },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ backgroundColor: "#f4f6f8", padding: 3, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", marginTop: 5 }}>
          <Typography variant="h3">
            <AccountBalanceIcon /> CodeCash
          </Typography>
          <Card sx={{ marginTop: 3 }}>
            <CardContent>
              <TextField label="Usuário" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ marginBottom: 2 }} />
              <TextField label="Senha" fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ marginBottom: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}><Button variant="contained" color="primary" onClick={register} fullWidth>Criar conta</Button></Grid>
                <Grid item xs={6}><Button variant="contained" color="secondary" onClick={login} fullWidth>Login</Button></Grid>
              </Grid>
            </CardContent>
          </Card>
          {token && balance !== null && (
            <Card sx={{ marginTop: 3 }}>
              <CardContent>
              <Typography variant="h6">Saldo: R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Typography>
                <Button variant="contained" color="primary" onClick={getBalance} fullWidth sx={{ marginTop: 2 }}>Atualizar Saldo</Button>
              </CardContent>
            </Card>
          )}
          {token && (
            <Card sx={{ marginTop: 3 }}>
              <CardContent>
                {/* <NumericFormat
                  // label="Quantidade"
                  // fullWidth
                  // customInput={TextField}
                  // value={amount}
                  // decimalSeparator="," 
                  // thousandSeparator="."
                  // allowNegative={false}
                  // prefix="R$ "
                  // onValueChange={(values) => setAmount(values.floatValue || 0)}
                  // sx={{ marginBottom: 2 }}
                /> */}
                <Grid container spacing={2}>
                  {/* <Grid item xs={6}><Button variant="contained" color="success" onClick={deposit} fullWidth>Depositar</Button></Grid>
                  <Grid item xs={6}><Button variant="contained" color="error" onClick={withdraw} fullWidth>Retirar</Button></Grid> */}
                </Grid>
                {transactionMessage && <Typography variant="body1" sx={{ marginTop: 2, color: "green" }}>{transactionMessage}</Typography>}
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;