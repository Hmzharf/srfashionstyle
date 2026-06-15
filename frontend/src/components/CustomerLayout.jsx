import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";

function CustomerLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const refreshAuthState = () => {
    try {
      const token = localStorage.getItem("auth_token");
      const user = JSON.parse(localStorage.getItem("auth_user") || "null");

      setIsLoggedIn(!!token);
      setAuthUser(user);
    } catch {
      setIsLoggedIn(false);
      setAuthUser(null);
    }
  };

  const refreshCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCartCount();
    refreshAuthState();

    const onCartUpdated = () => refreshCartCount();
    const onAuthUpdated = () => refreshAuthState();

    window.addEventListener("cartUpdated", onCartUpdated);
    window.addEventListener("authUpdated", onAuthUpdated);

    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated);
      window.removeEventListener("authUpdated", onAuthUpdated);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAuthPage = useMemo(
    () => ["/login", "/register"].includes(location.pathname),
    [location.pathname]
  );

  const userRole = String(
    authUser?.role || authUser?.user_role || authUser?.role_name || ""
  ).toLowerCase();

  const getRoleTarget = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "cashier" || userRole === "kasir") return "/pos";
    return "/profile";
  };

  const getRoleDisplayName = () => {
    if (userRole === "admin") return authUser?.name || "Admin";
    if (userRole === "cashier" || userRole === "kasir") {
      return authUser?.name || "Kasir POS";
    }
    return authUser?.name || authUser?.email || "Akun Saya";
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setIsLoggedIn(false);
    setAuthUser(null);
    window.dispatchEvent(new Event("authUpdated"));
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const keyword = searchValue.trim();

    if (!keyword) {
      navigate("/catalog");
      return;
    }

    navigate(`/catalog?q=${encodeURIComponent(keyword)}`);
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/catalog", label: "Katalog" },
    { to: "/blogs", label: "Blogs" },
    { to: "/about", label: "Tentang Kami" },
  ];

  const pageStyle = {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#1f1f1f",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const shellStyle = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  };

  const containerStyle = {
    width: "min(1156px, calc(100% - 48px))",
    margin: "0 auto",
  };

  const headerStyle = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e9e5df",
  };

  const topBarStyle = {
    minHeight: 62,
    display: "grid",
    gridTemplateColumns: "220px 1fr 220px",
    alignItems: "center",
    gap: 24,
  };

  const logoStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
    color: "#111111",
  };

  const logoInitialStyle = {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.5px",
  };

  const logoTextStyle = {
    fontSize: 11,
    letterSpacing: "2.6px",
    textTransform: "uppercase",
    color: "#5d5d5d",
    fontWeight: 700,
  };

  const desktopNavStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  };

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#2f8f63" : "#616161",
    fontSize: 14,
    fontWeight: isActive ? 700 : 600,
    lineHeight: 1,
    transition: "color 160ms ease",
  });

  const actionWrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
  };

  const iconButtonStyle = {
    border: "none",
    background: "transparent",
    padding: 0,
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#4b4b4b",
    textDecoration: "none",
    position: "relative",
  };

  const cartBadgeStyle = {
    position: "absolute",
    top: -10,
    right: -10,
    minWidth: 17,
    height: 17,
    padding: "0 5px",
    borderRadius: 999,
    background: "#2f8f63",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  };

  const mobilePanelStyle = {
    display: mobileMenuOpen ? "block" : "none",
    borderTop: "1px solid #e9e5df",
    padding: "16px 0 20px",
    background: "#ffffff",
  };

  const footerTitleStyle = {
    margin: "0 0 18px",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#111111",
  };

  const footerLinkStyle = {
    display: "block",
    color: "#5f6368",
    textDecoration: "none",
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: "left",
  };

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div style={containerStyle}>
            <div className="customer-topbar" style={topBarStyle}>
              <Link to="/" style={logoStyle} aria-label="SR Fashion Style">
                <span style={logoInitialStyle}>SR</span>
                <span style={logoTextStyle}>Fashion Style</span>
              </Link>

              <nav className="customer-desktop-nav" style={desktopNavStyle}>
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} style={navLinkStyle}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="customer-actions" style={actionWrapStyle}>
                {!isAuthPage && (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="customer-search-form desktop-search-form"
                    onMouseEnter={() => setDesktopSearchOpen(true)}
                    onMouseLeave={() => {
                      if (!searchValue.trim()) setDesktopSearchOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      flex: "0 0 auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: desktopSearchOpen
                          ? "flex-start"
                          : "center",
                        gap: desktopSearchOpen ? 6 : 0,
                        width: desktopSearchOpen ? 180 : 34,
                        height: 34,
                        border: "1px solid #e2ded8",
                        borderRadius: 999,
                        padding: desktopSearchOpen ? "0 10px" : 0,
                        background: "#ffffff",
                        overflow: "hidden",
                        transition:
                          "width 200ms ease, padding 200ms ease, justify-content 200ms ease",
                      }}
                    >
                      <button
                        type="submit"
                        aria-label="Cari produk"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          width: 18,
                          height: 18,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#6b6b6b",
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="M20 20L17 17" />
                        </svg>
                      </button>

                      <input
                        type="text"
                        value={searchValue}
                        onFocus={() => setDesktopSearchOpen(true)}
                        onBlur={() => {
                          if (!searchValue.trim()) setDesktopSearchOpen(false);
                        }}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Cari produk"
                        style={{
                          width: desktopSearchOpen ? "100%" : 0,
                          opacity: desktopSearchOpen ? 1 : 0,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: 12,
                          color: "#333333",
                          pointerEvents: desktopSearchOpen ? "auto" : "none",
                          transition: "opacity 160ms ease, width 160ms ease",
                        }}
                      />
                    </div>
                  </form>
                )}

                {isLoggedIn ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => navigate(getRoleTarget())}
                      style={{
                        border: "1px solid #ded9d2",
                        background: "#ffffff",
                        padding: "8px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#333333",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getRoleDisplayName()}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        border: "1px solid #ded9d2",
                        background: "#ffffff",
                        padding: "7px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#333333",
                        cursor: "pointer",
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/login" style={iconButtonStyle} aria-label="Login">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>
                )}

                <Link to="/cart" style={iconButtonStyle} aria-label="Keranjang">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                    <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H7" />
                  </svg>

                  {cartCount > 0 && (
                    <span style={cartBadgeStyle}>{cartCount}</span>
                  )}
                </Link>

                <button
                  type="button"
                  className="customer-mobile-toggle"
                  style={iconButtonStyle}
                  aria-label="Buka menu"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="customer-mobile-panel" style={mobilePanelStyle}>
              {!isAuthPage && (
                <form
                  onSubmit={handleSearchSubmit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid #e2ded8",
                    borderRadius: 10,
                    padding: "0 14px",
                    height: 46,
                    marginBottom: 14,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b6b6b"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20L17 17" />
                  </svg>

                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Cari produk"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                    }}
                  />
                </form>
              )}

              <nav style={{ display: "grid", gap: 10 }}>
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      color: isActive ? "#2f8f63" : "#333333",
                      background: isActive ? "#f2f8f5" : "#ffffff",
                      border: "1px solid #e7e1da",
                      borderRadius: 10,
                      padding: "13px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, width: "100%" }}>{children}</main>

        <footer
          style={{
            width: "100%",
            background: "#ffffff",
            borderTop: "1px solid #e9e5df",
            marginTop: 80,
          }}
        >
          <div style={containerStyle}>
            <div
              className="customer-footer-grid-v2"
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
                gap: 32,
                alignItems: "start",
                padding: "28px 0 16px",
              }}
            >
              <section style={{ textAlign: "left" }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#111111",
                  }}
                >
                  SR Fashion Style
                </h3>
                <p
                  style={{
                    margin: "14px 0 0",
                    color: "#5f6368",
                    fontSize: 14,
                    lineHeight: 1.8,
                    maxWidth: 280,
                  }}
                >
                  Fashion berkualitas untuk gaya hidup modern Anda. Temukan
                  koleksi terbaru kami.
                </p>
              </section>

              <section
                className="footer-col-shop"
                style={{
                  justifySelf: "start",
                  textAlign: "left",
                  width: "fit-content",
                }}
              >
                <h4 style={footerTitleStyle}>Belanja</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <Link to="/catalog?category=kemeja" style={footerLinkStyle}>
                    Kemeja
                  </Link>
                  <Link to="/catalog?category=kaos" style={footerLinkStyle}>
                    Kaos
                  </Link>
                  <Link to="/catalog?category=celana" style={footerLinkStyle}>
                    Celana
                  </Link>
                  <Link to="/catalog?category=jaket" style={footerLinkStyle}>
                    Jaket
                  </Link>
                  <Link
                    to="/catalog?category=aksesoris"
                    style={footerLinkStyle}
                  >
                    Aksesoris
                  </Link>
                </div>
              </section>

              <section
                className="footer-col-info"
                style={{
                  justifySelf: "center",
                  textAlign: "left",
                  width: "fit-content",
                }}
              >
                <h4 style={footerTitleStyle}>Informasi</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <Link to="/about" style={footerLinkStyle}>
                    Tentang Kami
                  </Link>
                  <Link to="/privacy-policy" style={footerLinkStyle}>
                    Kebijakan Privasi
                  </Link>
                  <Link to="/terms" style={footerLinkStyle}>
                    Syarat & Ketentuan
                  </Link>
                  <Link to="/faq" style={footerLinkStyle}>
                    FAQ
                  </Link>
                  <Link to="/contact" style={footerLinkStyle}>
                    Kontak
                  </Link>
                </div>
              </section>

              <section
                className="footer-col-contact"
                style={{
                  justifySelf: "end",
                  textAlign: "left",
                  width: "fit-content",
                }}
              >
                <h4 style={footerTitleStyle}>Kontak</h4>
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    color: "#5f6368",
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  <p style={{ margin: 0 }}>Jl. Fashion No. 123</p>
                  <p style={{ margin: 0 }}>Jakarta Selatan, 12345</p>
                  <p style={{ margin: 0 }}>hello@srfashion.com</p>
                  <p style={{ margin: 0 }}>+62 812 3456 7890</p>
                </div>
              </section>
            </div>

            <div
              className="customer-footer-bottom-v2"
              style={{
                marginTop: 18,
                paddingTop: 12,
                paddingBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#5f6368",
                  fontSize: 12,
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                © 2025 SR Fashion Style. All rights reserved.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#5f6368",
                    textDecoration: "none",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  Instagram
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#5f6368",
                    textDecoration: "none",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  TikTok
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#5f6368",
                    textDecoration: "none",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <FloatingWhatsAppButton />

      <style>{`
        .customer-footer-grid-v2 {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .customer-footer-bottom-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 48px;
          padding-top: 24px;
        }

        @media (min-width: 1024px) {
          .customer-mobile-toggle {
            display: none !important;
          }
        }

        @media (max-width: 1023px) {
          .customer-topbar {
            grid-template-columns: 1fr auto !important;
            min-height: 64px !important;
          }

          .customer-desktop-nav {
            display: none !important;
          }

          .customer-actions {
            gap: 16px !important;
          }

          .customer-footer-grid-v2 {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }

          .footer-col-shop,
          .footer-col-info,
          .footer-col-contact {
            justify-self: start !important;
            width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .customer-footer-grid-v2 {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            padding: 40px 0 28px !important;
          }

          .customer-footer-bottom-v2 {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CustomerLayout;