import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function AdminOrderListPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentFilter]);

  const isMobile = viewportWidth < 768;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get("/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("GET ORDERS ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal memuat data order.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

  const formatPaymentStatus = (value) => {
    const map = {
      pending: "Menunggu Bayar",
      paid: "Sudah Dibayar",
      failed: "Pembayaran Gagal",
      expired: "Kedaluwarsa",
      refund: "Refund",
    };
    return map[value] || value || "-";
  };

  const formatOrderStatus = (value) => {
    const map = {
      pending: "Pending",
      processing: "Diproses",
      shipped: "Terkirim",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return map[value] || value || "-";
  };

  const getOrderStatusStyle = (status) => {
    const map = {
      pending: { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
      processing: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      shipped: { bg: "#ecfeff", color: "#0f766e", border: "#99f6e4" },
      completed: { bg: "#ecfdf5", color: "#15803d", border: "#bbf7d0" },
      cancelled: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    };
    return map[status] || { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" };
  };

  const getPaymentStatusStyle = (status) => {
    const map = {
      pending: { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
      paid: { bg: "#ecfdf5", color: "#15803d", border: "#bbf7d0" },
      failed: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
      expired: { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
      refund: { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
    };
    return map[status] || { bg: "#f8fafc", color: "#475569", border: "#cbd5e1" };
  };

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { status });
      await fetchOrders();
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      alert(err.response?.data?.message || "Gagal update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const matchPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

      const haystack = [
        order.order_code,
        order.customer_name,
        order.email,
        order.phone,
        order.city,
        order.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !keyword || haystack.includes(keyword);
      return matchStatus && matchPayment && matchSearch;
    });
  }, [orders, statusFilter, paymentFilter, search]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      unpaid: orders.filter((o) => o.payment_status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      paid: orders.filter((o) => o.payment_status === "paid").length,
    }),
    [orders]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const startItem = filteredOrders.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, filteredOrders.length);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: isMobile ? 16 : 20,
    padding: isMobile ? 16 : 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
    minWidth: 0,
  };

  const heroCardStyle = {
    ...cardStyle,
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
  };

  const inputStyle = {
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 13,
    background: "#fff",
    color: "#334155",
    outline: "none",
    width: "100%",
    minWidth: 0,
  };

  const softButtonStyle = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #d1fae5",
    background: "#ecfdf5",
    color: "#0f766e",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const badgeStyle = (styles) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${styles.border}`,
    background: styles.bg,
    color: styles.color,
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: "nowrap",
  });

  const tableHeadStyle = {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  };

  const tableCellStyle = {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 13,
    color: "#334155",
    verticalAlign: "top",
    textAlign: "left",
  };

  const renderMetricCard = (label, value, accent) => {
    const colorMap = {
      blue: {
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        border: "1px solid #bfdbfe",
        value: "#1d4ed8",
      },
      orange: {
        background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
        border: "1px solid #fed7aa",
        value: "#c2410c",
      },
      teal: {
        background: "linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)",
        border: "1px solid #99f6e4",
        value: "#0f766e",
      },
      green: {
        background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
        border: "1px solid #bbf7d0",
        value: "#15803d",
      },
    };

    const theme = colorMap[accent] || colorMap.blue;

    return (
      <div
        key={label}
        style={{
          ...cardStyle,
          background: theme.background,
          border: theme.border,
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#6b7280",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: isMobile ? 22 : 28,
            fontWeight: 800,
            color: theme.value,
          }}
        >
          {value}
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
      <section style={heroCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 30, textAlign: "left"  ,color: "#0f172a" }}>
              Monitoring Order
            </h1>
          </div>

          <button onClick={fetchOrders} style={softButtonStyle}>
            {loading ? "Memuat..." : "Refresh Order"}
          </button>
        </div>
      </section>

      {message && (
        <div
          style={{
            ...cardStyle,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {renderMetricCard("Total Order", summary.total, "blue")}
        {renderMetricCard("Menunggu Bayar", summary.unpaid, "orange")}
        {renderMetricCard("Pengiriman", summary.processing, "teal")}
        {renderMetricCard("Terkirim", summary.shipped, "teal")}
        {renderMetricCard("Sudah Bayar", summary.paid, "green")}
      </section>

      <section style={{ ...cardStyle, display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr 1fr auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Cari no order / nama / email / alamat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="all">Semua Status Order</option>
            <option value="pending">Pending</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Terkirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="all">Semua Status Bayar</option>
            <option value="pending">Menunggu Bayar</option>
            <option value="paid">Sudah Dibayar</option>
            <option value="failed">Gagal</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="refund">Refund</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPaymentFilter("all");
            }}
            style={{
              padding: "11px 14px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#334155",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            Reset Filter
          </button>
        </div>
      </section>

      <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: isMobile ? "14px 16px" : "16px 18px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Daftar Order</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
              Menampilkan nomor order, nama pelanggan, email, alamat, status, total, dan update status.
            </p>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Menampilkan {startItem}-{endItem} dari {filteredOrders.length} data
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, color: "#64748b", fontSize: 13 }}>Memuat data order...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: 18, color: "#64748b", fontSize: 13 }}>Belum ada pesanan pada filter ini.</div>
        ) : (
          <>
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
                <thead>
                  <tr>
                    {[
                      "No",
                      "No Order",
                      "Nama Pelanggan",
                      "Email",
                      "Alamat",
                      "Status Order",
                      "Status Bayar",
                      "Total",
                      "Update",
                    ].map((head) => (
                      <th key={head} style={tableHeadStyle}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order, index) => {
                    const orderStatusStyles = getOrderStatusStyle(order.status);
                    const paymentStatusStyles = getPaymentStatusStyle(order.payment_status);
                    const alamatSingkat = [order.address, order.city, order.postal_code]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr key={order.id}>
                        <td style={tableCellStyle}>{(safePage - 1) * pageSize + index + 1}</td>
                        <td style={{ ...tableCellStyle, fontWeight: 700, color: "#0f172a" }}>
                          <div>{order.order_code}</div>
                          <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{order.customer_name || "-"}</td>
                        <td style={{ ...tableCellStyle, color: "#64748b" }}>{order.email || "-"}</td>
                        <td
                          style={{
                            ...tableCellStyle,
                            maxWidth: 260,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={alamatSingkat}
                        >
                          {alamatSingkat || "-"}
                        </td>
                        <td style={tableCellStyle}>
                          <span style={badgeStyle(orderStatusStyles)}>
                            {formatOrderStatus(order.status)}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={badgeStyle(paymentStatusStyles)}>
                            {formatPaymentStatus(order.payment_status)}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: 700 }}>
                          {formatPrice(order.grand_total)}
                        </td>
                        <td style={tableCellStyle}>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            disabled={
                              ["completed", "cancelled"].includes(order.status) ||
                              updatingId === order.id
                            }
                            style={{
                              width: "100%",
                              minWidth: 150,
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid #d1d5db",
                              background:
                                ["completed", "cancelled"].includes(order.status) || updatingId === order.id
                                  ? "#f8fafc"
                                  : "#fff",
                              color: "#334155",
                              fontSize: 12,
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Diproses</option>
                            <option value="shipped">Terkirim</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                          {updatingId === order.id && (
                            <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
                              Menyimpan...
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: isMobile ? "14px 16px" : "16px 18px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Halaman {safePage} / {totalPages}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: safePage === 1 ? "#f8fafc" : "#fff",
                    color: "#334155",
                    cursor: safePage === 1 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: safePage === totalPages ? "#f8fafc" : "#fff",
                    color: "#334155",
                    cursor: safePage === totalPages ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminOrderListPage;
