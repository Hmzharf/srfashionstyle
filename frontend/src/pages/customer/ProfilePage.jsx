import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProfileOverview from "./ProfileOverview";
import ProfileMyOrders from "./ProfileMyOrders";
import ProfileCart from "./ProfileCart";
import ProfileReviews from "./ProfileReviews";

function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: "overview", label: "Profil Saya" },
    { id: "cart", label: "Keranjang" },
    { id: "orders", label: "Riwayat Pesanan" },
    { id: "reviews", label: "Ulasan" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <ProfileOverview />;
      case "cart":
        return <ProfileCart />;
      case "orders":
        return <ProfileMyOrders />;
      case "reviews":
        return <ProfileReviews />;
      default:
        return <ProfileOverview />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff", // sama dengan CustomerLayout
        padding: "32px 0",
        boxSizing: "border-box",
      }}
    >
      <div
        className="profile-dashboard-layout"
        style={{
          width: "min(1156px, calc(100% - 48px))", // sama dengan containerStyle di CustomerLayout
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        {/* Sidebar tanpa card/border */}
        <aside
          style={{
            paddingRight: 16,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#0f766e",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Dashboard Customer
          </p>

          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 22,
              color: "#111111",
              fontWeight: 800,
            }}
          >
            Akun Saya
          </h1>

          <p
            style={{
              marginTop: 0,
              marginBottom: 20,
              color: "#6b665f",
              fontSize: 13,
              lineHeight: 1.6,
              maxWidth: 260,
            }}
          >
            Kelola profil, keranjang, pesanan, dan ulasan dalam satu tempat.
          </p>

          <nav style={{ display: "grid", gap: 6 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: 0,
                    border: "none",
                    padding: "8px 0",
                    background: "transparent",
                    color: isActive ? "#0f766e" : "#374151",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Konten utama tanpa card/border, semua teks ke kiri */}
        <section
          style={{
            paddingLeft: 8,
            minHeight: 400,
            boxSizing: "border-box",
          }}
        >
          {renderContent()}
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .profile-dashboard-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfilePage;