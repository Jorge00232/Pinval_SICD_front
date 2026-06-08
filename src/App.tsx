import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import GoogleLoginMock from './pages/GoogleLoginMock';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Movements from './pages/Movements';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/ChatbotWidget';
import { ThemeProvider } from './state/ThemeContext';
import { LanguageProvider } from './language/LanguageContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '765101398982-o4fj859u4emt6v2uks754cf0fq1p3edq.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              <Route path="/google-login" element={<GoogleLoginMock />} />

              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/purchases"
                element={
                  <ProtectedRoute>
                    <Purchases />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/suppliers"
                element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/movements"
                element={
                  <ProtectedRoute>
                    <Movements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ChatbotWidget />
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
