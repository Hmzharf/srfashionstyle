import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

function MyOrdersPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const lastEmail = localStorage.getItem("last_order_email") || "";
    setEmail(lastEmail);
    if (lastEmail) {
      fetchOrders(lastEmail);
    }
  }, []);

  const fetchOrders = async (targetEmail) => {
    if (!targetEmail) {
      setMessage("Masukkan email untuk melihat pesanan.");
      setOrders([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.get("/my-orders", {
        params: { email: targetEmail },
      });
      setOrders(res.data);
      if (res.data.length === 0) {
        setMessage("Belum ada pesanan untuk email ini.");
      }
    } catch (err) {
      console.error("MY ORDERS ERROR:", err);
      setMessage(
        err.response?.data?.message || "Gagal mengambil data pesanan."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchOrders(email);
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

  const formatShipping = (value) => {
    const map = {
      regular: "Regular Delivery",
      express: "Express Delivery",
      pickup: "Pickup di Toko",
    };
    return map[value] || value || "-";
  };

  const formatPaymentStatus = (value) => {
    const map = {
      pending: "Menunggu Pembayaran",
      paid: "Sudah Dibayar",
      failed: "Pembayaran Gagal",
      expired: "Pembayaran Kedaluwarsa",
    };
    return map[value] || value || "-";
  };

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "36px 20px 50px",
        fontFamily: "Inter, sans-serif",
        color: "#222",
        boxSizing: "border-box",
      }}
    >
      {/* Header halaman */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              color: "#0f766e",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            SRFashionStyle
          </p>
          <h1 style={{ margin: 0, fontSize: 28 }}>Pesanan Saya</h1>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            Cek status pesanan menggunakan email kamu.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fetchOrders(email)}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #0f766e",
              background: "#fff",
              color: "#0f766e",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/catalog")}
            style={{
              background: "#0f766e",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Lanjut Belanja
          </button>
        </div>
      </div>

      {/* Form cari pesanan */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e2ddd6",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          type="email"
          placeholder="Masukkan email yang digunakan saat checkout"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #d8d2ca",
            fontSize: 15,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#aaa" : "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Mencari..." : "Cari Pesanan"}
        </button>
      </form>

      {/* Pesan info / error */}
      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fff3f0",
            color: "#9f2d20",
            border: "1px solid #f0c8c2",
          }}
        >
          {message}
        </div>
      )}

      {/* Tidak ada pesanan */}
      {orders.length === 0 && !loading && !message && email && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2ddd6",
            borderRadius: 16,
            padding: 24,
            color: "#666",
          }}
        >
          Tidak ada pesanan untuk email <strong>{email}</strong>.
        </div>
      )}

      {/* List pesanan */}
      {orders.length > 0 && (
        <div style={{ display: "grid", gap: 18 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid #e2ddd6",
                borderRadius: 16,
                padding: 20,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: "1px solid #ece7df",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>
                    {order.order_code}
                  </h2>
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    {order.customer_name} &mdash; {order.email}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    Pengiriman: {formatShipping(order.shipping_method)}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px",
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    Pembayaran:{" "}
                    {order.payment_method
                      ?.replace(/_/g, " ")
                      ?.toUpperCase() || "-"}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#888",
                      fontSize: 13,
                    }}
                  >
                    {formatDate(order.created_at)}
                  </p>
                  {order.paid_at && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#666",
                        fontSize: 13,
                      }}
                    >
                      Dibayar pada: {formatDate(order.paid_at)}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {formatPrice(order.grand_total)}
                  </p>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    Status pembayaran:{" "}
                    <strong>{formatPaymentStatus(order.payment_status)}</strong>
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Status order:{" "}
                    <strong>{order.status?.toUpperCase() || "-"}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/order-success/${order.id}`)}
                    style={{
                      marginTop: 8,
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <ul
                  style={{
                    paddingLeft: 16,
                    margin: 0,
                    fontSize: 13,
                    color: "#444",
                  }}
                >
                  {order.items.map((item) => (
                    <li key={item.id} style={{ marginBottom: 4 }}>
                      {item.product_name} ({item.color || "-"} /{" "}
                      {item.size || "-"}) × {item.qty} —{" "}
                      {formatPrice(item.subtotal)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrdersPage;