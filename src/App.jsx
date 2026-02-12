import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerShop from './pages/BuyerShop';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import { CartProvider } from './context/CartContext';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';

import PaymentModal from './components/PaymentModal';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<BuyerShop />} />
          <Route path="/shop" element={<BuyerShop />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Protected: Seller & Admin can manage their store (Admin has superpowers usually, but per specs: Seller -> SellerDashboard) */}
          <Route
            path="/seller-dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin Only */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Chatbot />
      </Router>
    </CartProvider>
  );
}

export default App;
