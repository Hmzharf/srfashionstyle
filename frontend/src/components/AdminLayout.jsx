import AdminSidebar from "./AdminSidebar";

function AdminLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "Inter, sans-serif",
        color: "#111827",
        display: "flex",
      }}
    >
      {/* INI YANG BIKIN SIDEBAR DIEM */}
      <div
        style={{
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          zIndex: 20,
        }}
      >
        <AdminSidebar />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            SRFashionStyle Admin
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Panel administrasi toko
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "24px 24px",
            boxSizing: "border-box",
            overflowY: "auto", // hanya konten kanan yang scroll
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;