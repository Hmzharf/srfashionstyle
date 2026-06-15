import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/axios";

function CustomerNavbar() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
    loadCartCount();

    const handleCartUpdated = () => loadCartCount();

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    loadCartCount();
    loadUser();
  }, [location.pathname]);

  const loadUser = () => {
    const userRaw = localStorage.getItem("auth_user");

    if (!userRaw) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(userRaw));
    } catch (error) {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  };

  const loadCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalQty = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    setCartCount(totalQty);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    } finally {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    textDecoration: "none",
    color: isActive(path) ? "#0f766e" : "#333",
    fontWeight: isActive(path) ? 700 : 500,
    padding: "8px 0",
    borderBottom: isActive(path) ? "2px solid #0f766e" : "2px solid transparent",
  });

  return (
    <header
      style={{
        width: "100%",
        borderBottom: "1px solid #ddd7cf",
        background: "#fbfaf7",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <a
            href="/catalog"
            style={{
              textDecoration: "none",
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            Toko Fashion
          </a>

          <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="/catalog" style={navLinkStyle("/catalog")}>
              Katalog
            </a>
            <a href="/my-orders" style={navLinkStyle("/my-orders")}>
              Pesanan Saya
            </a>
            <a href="/cart" style={navLinkStyle("/cart")}>
              Keranjang ({cartCount})
            </a>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {user ? (
            <>
              <span
                style={{
                  fontSize: 14,
                  color: "#555",
                  background: "#f3f0ea",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                {user.name} ({user.role})
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 10,
                  background: "#0f766e",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="/login"
              style={{
                textDecoration: "none",
                background: "#0f766e",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              Login
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default CustomerNavbar;