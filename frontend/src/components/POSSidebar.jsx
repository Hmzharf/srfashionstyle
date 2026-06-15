import { NavLink, useNavigate } from "react-router-dom";

function POSSidebar() {
  const navigate = useNavigate();

  let user = null;
  try {
    const userRaw = localStorage.getItem("auth_user");
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (error) {
    console.error("AUTH USER PARSE ERROR:", error);
    user = null;
  }

  if (!user || !["cashier", "admin", "owner"].includes(user.role)) {
    return null;
  }

  const menuItems = [
    { path: "/pos", label: "Kasir", end: true },
    { path: "/pos/transactions", label: "Transaksi POS" },
    { path: "/pos/products", label: "Produk" },
    { path: "/pos/orders", label: "Order Online" },
    { path: "/pos/shifts", label: "Shift" },
    { path: "/pos/pay-at-store", label: "Pay at Store" },
  ];

  const navStyle = ({ isActive }) => ({
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: isActive ? "#0f172a" : "#475569",
    background: isActive ? "#f1f5f9" : "transparent",
    border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
    fontWeight: isActive ? 700 : 500,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 180ms ease",
  });

  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        background: "#ffffff",
        padding: 18,
        boxSizing: "border-box",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 14,
          borderBottom: "1px solid #f1f5f9",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 15,
            color: "#fff",
          }}
        >
          SR
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: "#0f172a",
              lineHeight: 1.2,
            }}
          >
            SR POS
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 6,
            }}
          >
            {user.name} · {user.role}
          </div>
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            style={navStyle}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid #f1f5f9",
          display: "grid",
          gap: 8,
        }}
      >
        {["admin", "owner"].includes(user.role) && (
          <button
            onClick={() => navigate("/admin")}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Buka Admin
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#334155",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Kembali ke Toko
        </button>
      </div>
    </aside>
  );
}

export default POSSidebar;