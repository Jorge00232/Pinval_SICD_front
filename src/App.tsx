import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Movements from './pages/Movements';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import { ThemeProvider } from './state/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
