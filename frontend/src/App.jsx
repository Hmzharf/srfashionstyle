import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/admin/CategoryPage";
import ProductPage from "./pages/ProductPage";
import ProductVariantPage from "./pages/ProductVariantPage";
import InventoryPage from "./pages/InventoryPage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderReviewPage from "./pages/OrderReviewPage";
import ProfilePage from "./pages/customer/ProfilePage";
import AdminOrderListPage from "./pages/AdminOrderListPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminReportsPage from "./pages/AdminReportsPage";

import POSPage from "./pages/pos/POSPage";
import ShiftPage from "./pages/pos/ShiftPage";
import PayAtStorePage from "./pages/pos/PayAtStorePage";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import CustomerLayout from "./components/CustomerLayout";
import AdminLayout from "./components/AdminLayout";
import POSLayout from "./components/POSLayout";
import PosTransactionsPage from "./pages/Pos/PosTransactionsPage";

import CashierStaffPage from "./pages/admin/CashierStaffPage";
import AdminPromotionMediaPage from "./pages/admin/AdminPromotionMediaPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailOtpPage from "./pages/VerifyEmailOtpPage";

function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f2ea",
        textAlign: "center",
        gap: 12,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div>
        <div style={{ fontSize: 80, fontWeight: 900, color: "#e3dbcf" }}>
          404
        </div>
        <h1 style={{ color: "#3b342d", marginBottom: 8 }}>
          Halaman tidak ditemukan
        </h1>
        <a
          href="/"
          style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none" }}
        >
          ← Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* CUSTOMER ROUTES */}
        <Route
          path="/"
          element={
            <CustomerLayout>
              <HomePage />
            </CustomerLayout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email-otp" element={<VerifyEmailOtpPage />} />
        <Route
          path="/catalog"
          element={
            <CustomerLayout>
              <CatalogPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/product/:id"
          element={
            <CustomerLayout>
              <ProductDetailPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/cart"
          element={
            <CustomerLayout>
              <CartPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CustomerLayout>
                <CheckoutPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CustomerLayout>
                <ProfilePage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success/:id"
          element={
            <ProtectedRoute>
              <CustomerLayout>
                <OrderSuccessPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-review/:id"
          element={
            <ProtectedRoute>
              <CustomerLayout>
                <OrderReviewPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <CategoryPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <ProductPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/product-variants"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <ProductVariantPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventories"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <InventoryPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <AdminOrderListPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <AdminReportsPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
                <Route
          path="/admin/cashier-staff"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <CashierStaffPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
                        <Route
          path="/admin/promotion-media"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "owner"]}>
                <AdminLayout>
                  <AdminPromotionMediaPage />
                </AdminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />


        {/* POS ROUTES */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout hideSidebar compactHeader>
                  <POSPage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/products"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout
                  title="Produk"
                  subtitle="Kelola produk, varian, dan inventory"
                >
                  <ProductPage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/orders"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout
                  title="Order Online"
                  subtitle="Pantau dan proses pesanan customer"
                >
                  <AdminOrderListPage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/shifts"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout
                  title="Shift"
                  subtitle="Kelola shift kasir"
                >
                  <ShiftPage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos/pay-at-store"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout
                  title="Pay at Store"
                  subtitle="Kelola order bayar di toko"
                >
                  <PayAtStorePage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
                <Route
          path="/pos/transactions"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["cashier", "admin", "owner"]}>
                <POSLayout
                  title="Transactions"
                  subtitle="Kelola transaksi POS, termasuk refund"
                >
                  <PosTransactionsPage />
                </POSLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;