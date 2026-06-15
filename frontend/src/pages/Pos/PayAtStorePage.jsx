import { useEffect, useState } from "react";
import api from "../../lib/axios";

function PayAtStorePage() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [storeMessage, setStoreMessage] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [storePaymentMethod, setStorePaymentMethod] = useState("cash");
  const [storeTransferRef, setStoreTransferRef] = useState("");
  const [loadingStorePayment, setLoadingStorePayment] = useState(false);

  useEffect(() => {
    loadPendingStoreOrders();
  }, []);

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("id-ID");
  };

  const loadPendingStoreOrders = async () => {
    setStoreMessage("");
    setLoadingOrders(true);
    try {
      const res = await api.get("/pos/pending-store-orders");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("PENDING STORE ORDERS ERROR:", err);
      setStoreMessage(
        err.response?.data?.message || "Gagal memuat order bayar di toko."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleConfirmStorePayment = async () => {
    if (!selectedOrder) {
      setStoreMessage("Pilih order terlebih dahulu.");
      return;
    }

    if (
      storePaymentMethod === "transfer_bca" &&
      !storeTransferRef.trim()
    ) {
      setStoreMessage("Nomor referensi transfer wajib diisi.");
      return;
    }

    setLoadingStorePayment(true);
    setStoreMessage("");

    try {
      const res = await api.post(
        `/pos/confirm-store-payment/${selectedOrder.id}`,
        {
          pos_payment_method: storePaymentMethod,
          transfer_ref:
            storePaymentMethod === "transfer_bca"
              ? storeTransferRef
              : null,
          cashier_staff_id: null,
        }
      );

      setStoreMessage(
        res.data.message || "Pembayaran di toko berhasil dikonfirmasi."
      );
      setSelectedOrder(null);
      setStorePaymentMethod("cash");
      setStoreTransferRef("");
      loadPendingStoreOrders();
    } catch (err) {
      console.error("CONFIRM STORE PAYMENT ERROR:", err);
      setStoreMessage(
        err.response?.data?.message || "Gagal konfirmasi pembayaran di toko."
      );
    } finally {
      setLoadingStorePayment(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "transparent",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 24,
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 20,
        }}
      >
        {/* Kiri: daftar order pending */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e2ddd6",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Order Pending Bayar di Toko</h2>

          {storeMessage && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "#fff3f0",
                color: "#9f2d20",
                border: "1px solid #f0c8c2",
                fontSize: 14,
              }}
            >
              {storeMessage}
            </div>
          )}

          <button
            onClick={loadPendingStoreOrders}
            disabled={loadingOrders}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: loadingOrders ? "#aaa" : "#0f766e",
              color: "#fff",
              fontWeight: 600,
              cursor: loadingOrders ? "not-allowed" : "pointer",
              marginBottom: 10,
              fontSize: 13,
            }}
          >
            {loadingOrders ? "Memuat..." : "Muat ulang daftar order"}
          </button>

          {loadingOrders ? (
            <div style={{ color: "#777", fontSize: 13 }}>
              Memuat order...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ color: "#777", fontSize: 13 }}>
              Tidak ada order pending bayar di toko.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid #ece7df",
                    borderRadius: 10,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    background:
                      selectedOrder?.id === order.id
                        ? "#eef7f5"
                        : "#fff",
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>
                      Order #{order.id}
                    </div>
                    <div>
                      Total:{" "}
                      {formatPrice(
                        order.grand_total ||
                          order.total ||
                          order.subtotal ||
                          0
                      )}
                    </div>
                    <div style={{ color: "#666" }}>
                      {order.customer_name ||
                        order.customer_email ||
                        order.email ||
                        "-"}
                    </div>
                    <div style={{ color: "#999", fontSize: 12 }}>
                      {formatDateTime(order.created_at)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setStorePaymentMethod("cash");
                      setStoreTransferRef("");
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        selectedOrder?.id === order.id
                          ? "#15803d"
                          : "#0f766e",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {selectedOrder?.id === order.id
                      ? "Dipilih"
                      : "Bayar sekarang"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Kanan: form konfirmasi pembayaran */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e2ddd6",
            borderRadius: 16,
            padding: 20,
            height: "fit-content",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Konfirmasi Pembayaran</h2>

          {!selectedOrder ? (
            <div style={{ color: "#777", fontSize: 13 }}>
              Pilih order terlebih dahulu dari daftar sebelah kiri.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Order #{selectedOrder.id}
                </div>
                <div>
                  Total:{" "}
                  {formatPrice(
                    selectedOrder.grand_total ||
                      selectedOrder.total ||
                      selectedOrder.subtotal ||
                      0
                  )}
                </div>
                <div>
                  Customer:{" "}
                  {selectedOrder.customer_name ||
                    selectedOrder.customer_email ||
                    selectedOrder.email ||
                    "-"}
                </div>
                <div>
                  Dibuat: {formatDateTime(selectedOrder.created_at)}
                </div>
              </div>

              <select
                value={storePaymentMethod}
                onChange={(e) => setStorePaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #d8d2ca",
                }}
              >
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer_bca">Transfer BCA</option>
              </select>

              {storePaymentMethod === "transfer_bca" && (
                <input
                  type="text"
                  placeholder="Nomor referensi transfer"
                  value={storeTransferRef}
                  onChange={(e) => setStoreTransferRef(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #d8d2ca",
                  }}
                />
              )}

              <button
                onClick={handleConfirmStorePayment}
                disabled={loadingStorePayment}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: loadingStorePayment ? "#aaa" : "#9f2d20",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: loadingStorePayment
                    ? "not-allowed"
                    : "pointer",
                  marginTop: 4,
                  fontSize: 14,
                }}
              >
                {loadingStorePayment
                  ? "Memproses..."
                  : "Konfirmasi Pembayaran di Toko"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PayAtStorePage;