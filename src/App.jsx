import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Categories from "./pages/Categories";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Shop from "./pages/Shop";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import Notifications from "./pages/admin/Notifications";
import CreateOrder from "./pages/admin/CreateOrder";
import Returns from "./pages/admin/Returns";

function Protected() {
  const { admin, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-10">Loading...</div>;
  return admin ? (
    <OutletProxy />
  ) : (
    <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />
  );
}
function OutletProxy() {
  return <AdminLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:slug" element={<Category />} />
        <Route path="/offers" element={<Catalog mode="offers" />} />
        <Route path="/most-demanded" element={<Catalog mode="popular" />} />
        <Route path="/search" element={<Catalog />} />
        <Route path="/products/:slug" element={<Product />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="orders/new" element={<CreateOrder />} />
        <Route path="returns" element={<Returns />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
