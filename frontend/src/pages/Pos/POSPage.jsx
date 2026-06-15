import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

/* ─── icon helpers (inline SVG, no dep) ─── */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const SearchIcon = () => (
  <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
);
const TrashIcon = () => (
  <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={14} />
);
const PrintIcon = () => (
  <Icon
    d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
    size={14}
  />
);
const PlusIcon = () => <Icon d="M12 5v14M5 12h14" size={14} />;
const ShiftIcon = () => (
  <Icon
    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
    size={14}
  />
);
const LogoutIcon = () => (
  <Icon
    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
    size={14}
  />
);

function POSPage() {
  const [user, setUser] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [txMessage, setTxMessage] = useState({ text: "", type: "" });
  const [loadingTx, setLoadingTx] = useState(false);
  const [lastTxInfo, setLastTxInfo] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const navigate = useNavigate();

  useEffect(() => {
    loadMe();
    loadActiveShift();
  }, []);

  useEffect(() => {
    const h = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile = viewportWidth < 768;
  const msg = (text, type = "error") => setTxMessage({ text, type });

  const loadMe = async () => {
    try {
      const r = await api.get("/me");
      setUser(r.data.user);
    } catch {
      /* ignore */
    }
  };

  const loadActiveShift = async () => {
    try {
      const r = await api.get("/pos/shifts/active");
      setActiveShift(r.data.data || null);
    } catch {
      /* ignore */
    }
  };

  const handleSearchProduct = async (value) => {
    setSearch(value);
    setTxMessage({ text: "", type: "" });
    if (!value.trim()) {
      setProducts([]);
      return;
    }
    try {
      const r = await api.get(
        `/pos/products/search?q=${encodeURIComponent(value)}`
      );
      setProducts(r.data.data || []);
    } catch {
      setProducts([]);
      msg("Gagal mencari produk.");
    }
  };

  const addToCart = (product) => {
    setTxMessage({ text: "", type: "" });
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product_variant_id === product.product_variant_id
      );
      const stock = Number(product.stock || 0);
      if (existing) {
        const next = existing.qty + 1;
        if (next > stock) {
          msg("Qty melebihi stok tersedia.");
          return prev;
        }
        return prev.map((i) =>
          i.product_variant_id === product.product_variant_id
            ? { ...i, qty: next }
            : i
        );
      }
      if (stock <= 0) {
        msg("Stok produk ini kosong.");
        return prev;
      }
      return [
        ...prev,
        {
          product_variant_id: product.product_variant_id,
          product_name: product.product_name,
          sku: product.sku,
          color: product.color,
          size: product.size,
          price: Number(product.price || 0),
          qty: 1,
          stock,
        },
      ];
    });
  };

  const updateQty = (variantId, qty) => {
    setTxMessage({ text: "", type: "" });
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      setCart((prev) =>
        prev.filter((i) => i.product_variant_id !== variantId)
      );
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_variant_id !== variantId) return i;
        const max = Number(i.stock || n);
        if (n > max) msg("Qty melebihi stok tersedia.");
        return { ...i, qty: Math.min(n, max) };
      })
    );
  };

  const removeFromCart = (variantId) =>
    setCart((prev) => prev.filter((i) => i.product_variant_id !== variantId));

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );
  const numPct = Math.min(Math.max(Number(discountPercent || 0), 0), 100);
  const discountAmount = Math.floor((subtotal * numPct) / 100);
  const grandTotal = Math.max(subtotal - discountAmount, 0);
  const changeAmount =
    paymentMethod === "cash"
      ? Math.max(Number(cashReceived || 0) - grandTotal, 0)
      : 0;

  const fmt = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(v || 0));

  const fmtDate = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("id-ID");
  };

  const handleCheckout = async () => {
    setTxMessage({ text: "", type: "" });
    setLastTxInfo(null);

    if (!activeShift?.id) {
      msg("Tidak ada shift aktif. Buka shift dulu.");
      return;
    }
    if (cart.length === 0) {
      msg("Keranjang kosong.");
      return;
    }
    if (paymentMethod === "cash" && Number(cashReceived || 0) < grandTotal) {
      msg("Uang tunai kurang dari total.");
      return;
    }
    if (paymentMethod === "transfer_bca" && !transferRef.trim()) {
      msg("Referensi transfer wajib diisi.");
      return;
    }

    setLoadingTx(true);
    try {
      const payload = {
        pos_shift_id: activeShift.id,
        cashier_staff_id: activeShift.cashier_staff_id,
        payment_method: paymentMethod,
        cash_received:
          paymentMethod === "cash" ? Number(cashReceived) : null,
        transfer_ref:
          paymentMethod === "transfer_bca" ? transferRef : null,
        discount: discountAmount,
        items: cart.map((i) => ({
          product_variant_id: i.product_variant_id,
          qty: i.qty,
        })),
      };
      const res = await api.post("/pos/transactions", payload);

      msg(res.data.message || "Transaksi berhasil.", "success");
      const tx = res.data.data?.transaction || null;
      setLastTxInfo(tx);

      setCart([]);
      setSearch("");
      setProducts([]);
      setCashReceived("");
      setTransferRef("");
      setDiscountPercent("");
      loadActiveShift();

      // Hook ke native Android (kalau nanti pakai bridge)
      try {
        if (tx && window.Android && typeof window.Android.printReceipt === "function") {
          window.Android.printReceipt(JSON.stringify(tx));
        }
      } catch {
        /* ignore bridge error */
      }
    } catch (err) {
      msg(err.response?.data?.message || "Transaksi POS gagal.");
    } finally {
      setLoadingTx(false);
    }
  };

  const t = {
    bg: "#f5f3ef",
    surface: "#ffffff",
    border: "#e5e0d8",
    borderLight: "#ede9e3",
    text: "#1a1714",
    muted: "#6b6560",
    faint: "#b0a89e",
    primary: "#0f766e",
    primaryHover: "#0c5e57",
    accent: "#2563eb",
    danger: "#b91c1c",
    dangerBg: "#fef2f2",
    dangerBorder: "#fecaca",
    successBg: "#ecfdf5",
    successBorder: "#bbf7d0",
    successText: "#15803d",
    radius: 14,
    radiusSm: 9,
  };

  const css = {
    page: {
      minHeight: "100vh",
      background: t.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: t.text,
      fontSize: 14,
    },
    topbar: {
      background: t.surface,
      borderBottom: `1px solid ${t.border}`,
      padding: isMobile ? "12px 16px" : "0 24px",
      height: isMobile ? "auto" : 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      position: "sticky",
      top: 0,
      zIndex: 30,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    logoMark: {
      width: 34,
      height: 34,
      background: t.text,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: 13,
      color: "#fff",
      flexShrink: 0,
    },
    topbarActions: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center",
    },
    navBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: t.radiusSm,
      border: `1px solid ${active ? t.primary : t.border}`,
      background: active ? `${t.primary}10` : t.surface,
      color: active ? t.primary : t.muted,
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 150ms",
    }),
    logoutBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: t.radiusSm,
      border: `1px solid ${t.dangerBorder}`,
      background: t.dangerBg,
      color: t.danger,
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
    },
    layout: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 400px",
      gap: 16,
      padding: isMobile ? 12 : "16px 20px",
      maxWidth: 1440,
      margin: "0 auto",
      alignItems: "start",
      boxSizing: "border-box",
    },
    card: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      overflow: "hidden",
    },
    cardHeader: {
      padding: "14px 18px",
      borderBottom: `1px solid ${t.borderLight}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    cardTitle: { margin: 0, fontSize: 15, fontWeight: 700 },
    cardBody: { padding: "14px 18px" },
    shiftBadge: (active) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 999,
      background: active ? t.successBg : t.dangerBg,
      border: `1px solid ${active ? t.successBorder : t.dangerBorder}`,
      color: active ? t.successText : t.danger,
      fontSize: 12,
      fontWeight: 700,
    }),
    dot: (active) => ({
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: active ? t.successText : t.danger,
    }),
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: t.radiusSm,
      border: `1px solid ${t.border}`,
      fontSize: 14,
      background: "#faf9f7",
      color: t.text,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    searchWrap: {
      position: "relative",
      marginBottom: 12,
    },
    searchInput: {
      width: "100%",
      padding: "11px 12px 11px 38px",
      borderRadius: t.radiusSm,
      border: `1px solid ${t.border}`,
      fontSize: 14,
      background: "#faf9f7",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    searchIcon: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: t.faint,
      pointerEvents: "none",
    },
    productCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 14px",
      borderRadius: 10,
      border: `1px solid ${t.borderLight}`,
      background: "#faf9f7",
      gap: 10,
      cursor: "pointer",
      transition: "border-color 150ms, box-shadow 150ms",
    },
    addBtn: {
      width: 32,
      height: 32,
      flexShrink: 0,
      borderRadius: 8,
      border: "none",
      background: t.primary,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    cartItem: {
      padding: "12px 0",
      borderBottom: `1px solid ${t.borderLight}`,
    },
    qtyWrap: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 7,
      border: `1px solid ${t.border}`,
      background: t.surface,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 15,
      color: t.text,
    },
    qtyInput: {
      width: 52,
      height: 28,
      textAlign: "center",
      borderRadius: 7,
      border: `1px solid ${t.border}`,
      fontSize: 13,
      fontWeight: 600,
      background: t.surface,
      outline: "none",
    },
    removeBtn: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: 7,
      border: `1px solid ${t.dangerBorder}`,
      background: t.dangerBg,
      color: t.danger,
      cursor: "pointer",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
      color: t.muted,
      marginBottom: 6,
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 18,
      fontWeight: 800,
      color: t.text,
      paddingTop: 12,
      borderTop: `1px solid ${t.borderLight}`,
      marginTop: 4,
      marginBottom: 16,
    },
    paySelect: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: t.radiusSm,
      border: `1px solid ${t.border}`,
      fontSize: 14,
      background: "#faf9f7",
      marginBottom: 10,
      outline: "none",
      fontFamily: "inherit",
    },
    changePill: {
      padding: "10px 14px",
      borderRadius: 10,
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      color: t.successText,
      fontWeight: 700,
      fontSize: 14,
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    checkoutBtn: {
      width: "100%",
      padding: "14px",
      border: "none",
      borderRadius: 10,
      background: loadingTx ? "#aaa" : t.primary,
      color: "#fff",
      fontWeight: 800,
      fontSize: 15,
      cursor: loadingTx ? "not-allowed" : "pointer",
      letterSpacing: 0.3,
      transition: "background 150ms",
    },
    notice: (type) => ({
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 10,
      marginBottom: 12,
      fontSize: 13,
      ...(type === "error"
        ? {
            background: t.dangerBg,
            border: `1px solid ${t.dangerBorder}`,
            color: t.danger,
          }
        : {
            background: t.successBg,
            border: `1px solid ${t.successBorder}`,
            color: t.successText,
          }),
    }),
    emptyState: {
      textAlign: "center",
      padding: "40px 0",
      color: t.faint,
      fontSize: 13,
    },
    receipt: {
      marginTop: 14,
      padding: "14px 16px",
      borderRadius: 12,
      border: `1px dashed ${t.border}`,
      background: "#fdfcfb",
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
    },
  };

  return (
    <div style={css.page}>
      {/* Topbar */}
      <header style={css.topbar}>
        <div style={css.logo}>
          <div style={css.logoMark}>SR</div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1.2,
              }}
            >
              SR POS
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.muted,
                marginTop: 2,
              }}
            >
              {user?.name || "—"} · {user?.role || "—"}
            </div>
          </div>
        </div>

        <div style={css.topbarActions}>
          <button
            onClick={() => navigate("/pos/shifts")}
            style={css.navBtn(false)}
          >
            <ShiftIcon /> Shift
          </button>
          <button
            onClick={() => navigate("/pos/pay-at-store")}
            style={css.navBtn(false)}
          >
            Bayar di Toko
          </button>
          <button
            onClick={() => navigate("/pos/products")}
            style={css.navBtn(false)}
          >
            Produk
          </button>
          <button
            onClick={() => navigate("/pos/orders")}
            style={css.navBtn(false)}
          >
            Order Online
          </button>
            <button onClick={() => navigate("/pos/transactions")} style={css.navBtn(false)}>
            Transaksi POS
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              window.location.href = "/login";
            }}
            style={css.logoutBtn}
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div style={css.layout}>
        {/* Left: produk & shift */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          {/* Shift info */}
          <div style={css.card}>
            <div style={css.cardHeader}>
              <span style={css.cardTitle}>Shift Aktif</span>
              <span style={css.shiftBadge(!!activeShift)}>
                <span style={css.dot(!!activeShift)} />
                {activeShift ? "Aktif" : "Tidak ada shift"}
              </span>
            </div>
            <div style={{ ...css.cardBody, padding: "12px 18px" }}>
              {activeShift ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "6px 16px",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ color: t.muted }}>Kode:</span>{" "}
                    <strong>{activeShift.shift_code}</strong>
                  </div>
                  <div>
                    <span style={{ color: t.muted }}>Kasir:</span>{" "}
                    {activeShift.cashier_staff?.name || "—"}
                  </div>
                  <div>
                    <span style={{ color: t.muted }}>Dibuka:</span>{" "}
                    {fmtDate(activeShift.opened_at)}
                  </div>
                  <div>
                    <span style={{ color: t.muted }}>Saldo awal:</span>{" "}
                    {fmt(activeShift.opening_cash)}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: t.danger }}>
                  Belum ada shift aktif. Buka shift terlebih dahulu di halaman{" "}
                  <strong>Shift</strong>.
                </div>
              )}
            </div>
          </div>

          {/* Cari produk */}
          <div style={css.card}>
            <div style={css.cardHeader}>
              <span style={css.cardTitle}>Cari Produk</span>
              <span style={{ fontSize: 12, color: t.faint }}>
                SKU / nama / warna / ukuran
              </span>
            </div>
            <div style={css.cardBody}>
              <div style={css.searchWrap}>
                <span style={css.searchIcon}>
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Ketik SKU, nama produk, warna, atau ukuran..."
                  value={search}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                  style={css.searchInput}
                  autoComplete="off"
                />
              </div>

              {products.length === 0 ? (
                <div style={css.emptyState}>
                  {search
                    ? "Produk tidak ditemukan."
                    : "Mulai ketik untuk mencari produk."}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {products.map((item) => (
                    <div
                      key={item.product_variant_id}
                      style={css.productCard}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = t.primary;
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(15,118,110,0.10)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = t.borderLight;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 3,
                          }}
                        >
                          {item.product_name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.muted,
                            marginBottom: 2,
                          }}
                        >
                          {[item.sku, item.color, item.size]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: t.primary,
                              fontSize: 14,
                            }}
                          >
                            {fmt(item.price)}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background:
                                item.stock > 0 ? t.successBg : t.dangerBg,
                              color:
                                item.stock > 0 ? t.successText : t.danger,
                              border: `1px solid ${
                                item.stock > 0
                                  ? t.successBorder
                                  : t.dangerBorder
                              }`,
                            }}
                          >
                            Stok: {item.stock}
                          </span>
                        </div>
                      </div>
                      <button
                        style={css.addBtn}
                        onClick={() => addToCart(item)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = t.primaryHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = t.primary)
                        }
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: cart + summary + receipt */}
        <div
          style={{
            ...css.card,
            position: isMobile ? "static" : "sticky",
            top: isMobile ? "auto" : 76,
            maxHeight: isMobile ? "none" : "calc(100vh - 92px)",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div style={css.cardHeader}>
            <span style={css.cardTitle}>Keranjang</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 999,
                background: cart.length > 0 ? "#f0fdf4" : "#f8fafc",
                color: cart.length > 0 ? t.successText : t.faint,
                border: `1px solid ${
                  cart.length > 0 ? t.successBorder : t.borderLight
                }`,
              }}
            >
              {cart.length} item
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 18px",
            }}
          >
            {txMessage.text && (
              <div
                style={{
                  ...css.notice(txMessage.type),
                  marginTop: 12,
                }}
              >
                {txMessage.text}
              </div>
            )}

            {cart.length === 0 ? (
              <div style={{ ...css.emptyState, padding: "48px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
                <div>Belum ada item di keranjang.</div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_variant_id} style={css.cartItem}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 2,
                        }}
                      >
                        {item.product_name}
                      </div>
                      <div style={{ fontSize: 11, color: t.muted }}>
                        {[item.color, item.size, item.sku]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: t.primary,
                        marginLeft: 8,
                      }}
                    >
                      {fmt(item.price * item.qty)}
                    </div>
                  </div>
                  <div style={css.qtyWrap}>
                    <button
                      style={css.qtyBtn}
                      onClick={() =>
                        updateQty(item.product_variant_id, item.qty - 1)
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateQty(
                          item.product_variant_id,
                          e.target.value
                        )
                      }
                      style={css.qtyInput}
                    />
                    <button
                      style={css.qtyBtn}
                      onClick={() =>
                        updateQty(item.product_variant_id, item.qty + 1)
                      }
                    >
                      +
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        color: t.faint,
                        marginLeft: 4,
                      }}
                    >
                      /{fmt(item.price)} per item
                    </span>
                    <button
                      style={css.removeBtn}
                      onClick={() =>
                        removeFromCart(item.product_variant_id)
                      }
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary + checkout */}
          {cart.length > 0 && (
            <div
              style={{
                padding: "14px 18px",
                borderTop: `1px solid ${t.borderLight}`,
              }}
            >
              <div style={css.summaryRow}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 6,
                  alignItems: "center",
                }}
              >
                <input
                  type="number"
                  placeholder="Diskon %"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  style={{
                    ...css.input,
                    flex: 1,
                    padding: "8px 10px",
                    fontSize: 13,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: t.danger,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  − {fmt(discountAmount)}
                </span>
              </div>

              <div style={css.totalRow}>
                <span>Total</span>
                <span>{fmt(grandTotal)}</span>
              </div>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={css.paySelect}
              >
                <option value="cash">💵 Cash</option>
                <option value="qris">📱 QRIS</option>
                <option value="transfer_bca">🏦 Transfer BCA</option>
                <option value="card">💳 Card</option>
              </select>

              {paymentMethod === "cash" && (
                <>
                  <input
                    type="number"
                    placeholder="Uang diterima"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{ ...css.input, marginBottom: 10 }}
                  />
                  <div style={css.changePill}>
                    <span>Kembalian</span>
                    <span>{fmt(changeAmount)}</span>
                  </div>
                </>
              )}

              {paymentMethod === "transfer_bca" && (
                <input
                  type="text"
                  placeholder="No. referensi transfer"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  style={{ ...css.input, marginBottom: 10 }}
                />
              )}

              <button
                onClick={handleCheckout}
                disabled={loadingTx}
                style={css.checkoutBtn}
                onMouseEnter={(e) => {
                  if (!loadingTx)
                    e.currentTarget.style.background = t.primaryHover;
                }}
                onMouseLeave={(e) => {
                  if (!loadingTx)
                    e.currentTarget.style.background = t.primary;
                }}
              >
                {loadingTx ? "Memproses..." : "Simpan Transaksi"}
              </button>
            </div>
          )}

          {/* Receipt */}
          {lastTxInfo && (
            <div style={{ padding: "0 18px 16px" }}>
              <div id="receipt-area" style={css.receipt}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 8,
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>SRFashionStyle</div>
                  <div>JL. Suka karya desa babakan asem kecamatan teluknaga kabupaten tangerang banten 15510</div>
                  <div
                    style={{
                      borderTop: "1px dashed #d4d4d4",
                      margin: "8px 0",
                    }}
                  />
                </div>
                <div>
                  Kode:{" "}
                  <strong>{lastTxInfo.transaction_code}</strong>
                </div>
                <div>Tanggal: {fmtDate(lastTxInfo.created_at)}</div>
                <div>
                  Kasir:{" "}
                  {lastTxInfo.cashier_staff?.name || "—"}
                </div>
                <div>
                  Shift: {lastTxInfo.shift?.shift_code || "—"}
                </div>
                <div
                  style={{
                    borderTop: "1px dashed #d4d4d4",
                    margin: "8px 0",
                  }}
                />
                {lastTxInfo.items?.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {it.qty}x {it.product_name}
                    </span>
                    <span>{fmt(it.subtotal)}</span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px dashed #d4d4d4",
                    margin: "8px 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Subtotal</span>
                  <span>{fmt(lastTxInfo.subtotal)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: t.danger,
                  }}
                >
                  <span>Diskon</span>
                  <span>-{fmt(lastTxInfo.discount)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{fmt(lastTxInfo.grand_total)}</span>
                </div>
                {lastTxInfo.cash_received != null && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Dibayar</span>
                    <span>{fmt(lastTxInfo.cash_received)}</span>
                  </div>
                )}
                {lastTxInfo.change_given != null && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Kembali</span>
                    <span>{fmt(lastTxInfo.change_given)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Metode</span>
                  <span>
                    {lastTxInfo.payment_method?.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  — Terima kasih —
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("receipt-area");
                    if (!el) {
                      window.print();
                      return;
                    }

                    const printWindow = window.open(
                      "",
                      "PRINT",
                      "height=600,width=400"
                    );
                    if (!printWindow) {
                      window.print();
                      return;
                    }

                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Struk POS</title>
                          <style>
                            @page {
                              size: auto;
                              margin: 5mm;
                            }
                            body {
                              font-family: 'Courier New', monospace;
                              font-size: 11px;
                              margin: 0;
                              padding: 8px;
                            }
                          </style>
                        </head>
                        <body>${el.innerHTML}</body>
                      </html>
                    `);

                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  }}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px",
                    borderRadius: 7,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <PrintIcon /> Cetak Struk
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default POSPage;