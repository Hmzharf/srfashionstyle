import { NavLink, useNavigate } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();

  let user = null;

  try {
    const userRaw = localStorage.getItem("auth_user");
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (error) {
    user = null;
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return null;
  }

  const menuItems = [
    { path: "/admin", label: "Dashboard", end: true },
    { path: "/admin/products", label: "Produk" },
    { path: "/admin/orders", label: "Orders" },
    { path: "/admin/reports", label: "Laporan" },
    { path: "/admin/cashier-staff", label: "Kasir" },
    { path: "/admin/promotion-media", label: "Media Promosi" }, // ✅ menu baru
  ];

  const navLinkStyle = ({ isActive }) => ({
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
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "1px solid #f1f5f9",
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
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        >
          SR
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              letterSpacing: 0.2,
              fontSize: 17,
              color: "#0f172a",
              lineHeight: 1.2,
            }}
          >
            SR Fashion
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 6,
              textTransform: "capitalize",
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
          fontSize: 14,
        }}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            style={navLinkStyle}
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
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/catalog")}
          style={{
            width: "100%",
            padding: "11px 12px",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#334155",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <span>Kembali ke Toko</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;