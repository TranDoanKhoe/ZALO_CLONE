import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import { zaloTheme } from "./theme/theme";

function App() {
  // Lấy userId và accessToken từ localStorage
  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem('accessToken');

  return (
    <ThemeProvider theme={zaloTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home userId={userId} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;