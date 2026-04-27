import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Configurator from "./pages/Configurator.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Orders from "./pages/Orders.jsx";
import Product from "./pages/Product.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/configurator" element={<Configurator />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
