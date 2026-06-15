import POSSidebar from "./POSSidebar";

function POSLayout({
  children,
  title = "POS",
  subtitle = "Area operasional kasir",
  hideSidebar = false,
  compactHeader = false,
}) {
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
      {!hideSidebar && (
        <div
          style={{
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
            height: "100vh",
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          <POSSidebar />
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!compactHeader && (
          <header
            style={{
              padding: "14px 24px",
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
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {title}
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginTop: 4,
                }}
              >
                {subtitle}
              </div>
            </div>
          </header>
        )}

        <main
          style={{
            flex: 1,
            padding: compactHeader ? 0 : 24,
            boxSizing: "border-box",
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default POSLayout;