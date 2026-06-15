import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function ProfileMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const formatStatus = (order) => {
    if (order.payment_status && order.status) {
      return `${order.status} · ${order.payment_status}`;
    }
    return order.status || order.payment_status || "Tidak diketahui";
  };

  const formatSource = (order) => {
    if (order.is_pos) return "POS Toko";
    if (order.source) return order.source;
    return "Online";
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setMessage("");

        const res = await api.get("/my-orders");
        const list = res.data?.data || res.data?.orders || res.data || [];

        if (!active) return;
        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!active) return;

        console.error("Gagal memuat my orders", err);
        setOrders([]);

        const status = err.response?.status;
        const apiMessage = err.response?.data?.message;

        if (status === 401) {
          setMessage("Sesi login kamu sudah habis. Silakan login kembali.");
        } else if (status === 403) {
          setMessage("Kamu tidak memiliki akses ke halaman pesanan.");
        } else {
          setMessage(apiMessage || "Gagal memuat riwayat pesanan.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p>Memuat riwayat pesanan...</p>;
  }

  if (message) {
    return (
      <div>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, color: "#111111" }}>
          Riwayat Pesanan
        </h1>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 14, color: "#b42318" }}>
          {message}
        </p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, color: "#111111" }}>
          Riwayat Pesanan
        </h1>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 14, color: "#6b665f" }}>
          Kamu belum memiliki pesanan. Yuk mulai belanja di katalog.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, color: "#111111" }}>
        Riwayat Pesanan
      </h1>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: "#6b665f" }}>
        Lihat status dan detail transaksi belanja kamu.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              borderRadius: 10,
              border: "1px solid #e7e1d8",
              padding: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#111111",
                    marginBottom: 2,
                  }}
                >
                  Order #{order.order_code || order.code || order.id}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b665f",
                    marginBottom: 2,
                  }}
                >
                  {order.created_date || order.created_at}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  Sumber: {formatSource(order)}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#111111",
                    fontSize: 13,
                    marginBottom: 2,
                  }}
                >
                  {formatPrice(order.grand_total || order.total)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b665f",
                    marginBottom: 8,
                  }}
                >
                  {order.items_count || order.items?.length || 0} item
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/order-success/${order.id}`)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Lihat Detail
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 6,
                fontSize: 12,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                {formatStatus(order)}
              </span>

              {order.shipping_status && (
                <span style={{ color: "#6b665f" }}>
                  Pengiriman: {order.shipping_status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileMyOrders;