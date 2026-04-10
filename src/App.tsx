import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Products from './pages/Products';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz redirige a Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Páginas principales */}
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/products" element={<Products />} />

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
