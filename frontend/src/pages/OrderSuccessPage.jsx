import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios";

function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const aliveRef = useRef(true);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState("");

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const fetchOrderDetail = async (showLoader = false) => {
    try {
      if (showLoader && aliveRef.current) setLoading(true);

      const res = await api.get(`/orders/${id}`);
      const data = res.data?.order || res.data?.data || res.data;

      if (!aliveRef.current) return;

      setOrder(data || null);
      setMessage("");
    } catch (err) {
      if (!aliveRef.current) return;

      console.error("ORDER DETAIL ERROR:", err);

      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 401) {
        setMessage("Sesi login kamu sudah habis. Silakan login kembali.");
      } else if (status === 403) {
        setMessage("Kamu tidak memiliki akses ke detail pesanan ini.");
      } else if (status === 404) {
        setMessage("Pesanan tidak ditemukan.");
      } else {
        setMessage(apiMessage || "Gagal memuat detail pesanan.");
      }

      setOrder(null);
    } finally {
      if (showLoader && aliveRef.current) setLoading(false);
    }
  };

  const fetchTracking = async (showLoader = false) => {
    if (!id) return;
    try {
      if (showLoader && aliveRef.current) setTrackingLoading(true);
      setTrackingMessage("");

      const res = await api.get(`/orders/${id}/tracking`);
      const data = res.data?.tracking ?? null;
      const msg = res.data?.message ?? "";

      if (!aliveRef.current) return;

      setTracking(data);
      setTrackingMessage(msg || "");
    } catch (err) {
      if (!aliveRef.current) return;

      console.error("TRACKING ERROR:", err);
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 401) {
        setTrackingMessage("Sesi login kamu sudah habis. Silakan login kembali.");
      } else if (status === 403) {
        setTrackingMessage("Kamu tidak memiliki akses ke tracking pesanan ini.");
      } else if (status === 404) {
        setTrackingMessage("Data tracking belum tersedia.");
      } else {
        setTrackingMessage(apiMessage || "Gagal memuat tracking pengiriman.");
      }

      setTracking(null);
    } finally {
      if (showLoader && aliveRef.current) setTrackingLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    const ok = window.confirm("Konfirmasi bahwa pesanan ini sudah kamu terima?");
    if (!ok) return;

    try {
      setConfirmLoading(true);
      setConfirmMessage("");

      const res = await api.post(`/orders/${id}/confirm-received`);
      const msg = res.data?.message || "Pesanan berhasil dikonfirmasi diterima.";

      setConfirmMessage(msg);
      await fetchOrderDetail(false);
      if (order?.shipping_method === "jnt") {
        await fetchTracking(false);
      }
    } catch (err) {
      console.error("CONFIRM RECEIVED ERROR:", err);
      setConfirmMessage(
        err.response?.data?.message || "Gagal mengonfirmasi pesanan diterima."
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    setPollCount(0);
    setOrder(null);
    setMessage("");
    setTracking(null);
    setTrackingMessage("");
    setConfirmMessage("");
    fetchOrderDetail(true);
  }, [id]);

  useEffect(() => {
    if (!order) return;

    if (order.shipping_method === "jnt") {
      fetchTracking(true);
    }

    const isPending = order.payment_status === "pending";
    const isPayAtStore = order.payment_method === "pay_at_store";
    const maxPoll = 18;

    if (isPending && !isPayAtStore && pollCount < maxPoll) {
      const timer = setTimeout(async () => {
        await fetchOrderDetail(false);
        if (aliveRef.current) {
          setPollCount((prev) => prev + 1);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [order, pollCount, id]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

  const formatShipping = (value, label) => {
    if (label) return label;

    const map = {
      jnt: "J&T",
      pickup: "Pickup di Toko",
      regular: "Regular Delivery",
      express: "Express Delivery",
    };

    return map[value] || value || "-";
  };

  const formatPaymentMethod = (value) => {
    const map = {
      midtrans: "ONLINE (Payment Gateway)",
      pay_at_store: "BAYAR DI TOKO",
      cash: "CASH",
      qris: "QRIS",
      transfer_bca: "TRANSFER BCA",
      card: "CARD",
    };
    return map[value] || value?.replace(/_/g, " ")?.toUpperCase() || "-";
  };

  const formatPaymentStatus = (value) => {
    const map = {
      pending: "Menunggu Pembayaran",
      paid: "Sudah Dibayar",
      failed: "Pembayaran Gagal",
      expired: "Pembayaran Kedaluwarsa",
      refund: "Refund",
    };
    return map[value] || value || "-";
  };

  const formatOrderStatus = (value) => {
    const map = {
      pending: "Menunggu Konfirmasi",
      processing: "Sedang Diproses",
      shipped: "Sedang Dikirim",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return map[value] || value || "-";
  };

  const formatShippingStatus = (value) => {
    if (!value) return "-";
    const v = String(value).toLowerCase();

    const map = {
      pending: "Menunggu diproses",
      confirmed: "Pesanan dikonfirmasi",
      allocated: "Kurir dialokasikan",
      picking_up: "Kurir menuju lokasi pickup",
      picked: "Paket sudah di-pickup",
      in_transit: "Dalam perjalanan",
      dropping_off: "Kurir akan mengantarkan",
      delivered: "Paket sudah diterima",
      cancelled: "Pengiriman dibatalkan",
      returned: "Paket dikembalikan",
    };

    return map[v] || value;
  };

  const statusStyle = (status) => {
    const map = {
      pending: { bg: "#fff8e6", color: "#92640a", border: "#f5d97d" },
      processing: { bg: "#e6f0ff", color: "#1a4fa1", border: "#a3beec" },
      shipped: { bg: "#e6f4f1", color: "#0f5d53", border: "#7ec9be" },
      completed: { bg: "#e6f5ea", color: "#1a6b2f", border: "#82c993" },
      cancelled: { bg: "#fdecea", color: "#9a2420", border: "#f0a9a6" },
    };
    return map[status] || { bg: "#f3f2ef", color: "#555", border: "#ccc" };
  };

  const paymentStatusStyle = (status) => {
    const map = {
      pending: { bg: "#fff8e6", color: "#92640a", border: "#f5d97d" },
      paid: { bg: "#e6f5ea", color: "#1a6b2f", border: "#82c993" },
      failed: { bg: "#fdecea", color: "#9a2420", border: "#f0a9a6" },
      expired: { bg: "#f3f2ef", color: "#666", border: "#d7d2ca" },
      refund: { bg: "#f3f2ef", color: "#555", border: "#d7d2ca" },
    };
    return map[status] || { bg: "#f3f2ef", color: "#555", border: "#ccc" };
  };

  const sectionStyle = {
    background: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: 0,
    padding: 24,
    boxShadow: "none",
    textAlign: "left",
  };

  const infoBoxStyle = {
    padding: "12px 14px",
    borderRadius: 0,
    background: "#faf8f4",
    border: "1px solid #ece7df",
    textAlign: "left",
  };

  const orderItems = order?.items || order?.order_items || [];

  const orderHasReview = useMemo(
    () =>
      Boolean(order?.has_review) ||
      orderItems.some(
        (item) =>
          Boolean(item?.is_reviewed) ||
          Boolean(item?.review_id) ||
          Boolean(item?.review)
      ),
    [order, orderItems]
  );

  const isPending = order?.payment_status === "pending";
  const isPayAtStore = order?.payment_method === "pay_at_store";
  const canConfirmReceived =
    order?.status === "shipped" ||
    tracking?.shipping_status === "delivered";
  const canReview = order?.status === "completed";

  return (
    <div
      style={{
        width: "min(1156px, calc(100% - 48px))",
        margin: "0 auto",
        padding: "28px 0 48px",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#222",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      {/* Bagian atas: hanya tombol aksi */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/profile?tab=orders")}
          style={{
            background: "#fff",
            color: "#0f766e",
            padding: "10px 16px",
            borderRadius: 0,
            fontWeight: 700,
            border: "1px solid #0f766e",
            cursor: "pointer",
          }}
        >
          Pesanan Saya
        </button>
        <button
          type="button"
          onClick={() => navigate("/catalog")}
          style={{
            background: "#0f766e",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 0,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Belanja Lagi
        </button>
      </div>

      {loading ? (
        <div style={sectionStyle}>Memuat detail pesanan...</div>
      ) : message ? (
        <div
          style={{
            ...sectionStyle,
            background: "#fff3f0",
            border: "1px solid #f0c8c2",
            color: "#9f2d20",
          }}
        >
          {message}
        </div>
      ) : order ? (
        <div style={{ display: "grid", gap: 18 }}>
          {/* STATUS BOX */}
          <div
            style={{
              background: order.payment_status === "paid" ? "#e6f5ea" : "#fff8e6",
              border:
                order.payment_status === "paid"
                  ? "1px solid #82c993"
                  : "1px solid #f5d97d",
              borderRadius: 0,
              padding: "22px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 0,
                background: order.payment_status === "paid" ? "#1a6b2f" : "#92640a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {order.payment_status === "paid" ? "✓" : "!"}
            </div>

            <div style={{ flex: 1 }}>
              <h2
                style={{
                  margin: "0 0 4px",
                  color: order.payment_status === "paid" ? "#1a6b2f" : "#92640a",
                }}
              >
                {order.payment_status === "paid"
                  ? "Pembayaran berhasil dikonfirmasi"
                  : "Pesanan berhasil dibuat"}
              </h2>
              <p style={{ margin: 0, color: "#555" }}>
                Kode order:{" "}
                <strong style={{ fontFamily: "monospace", fontSize: 16 }}>
                  {order.order_code}
                </strong>
              </p>

              {isPending && !isPayAtStore && (
                <p style={{ margin: "8px 0 0", color: "#92640a", fontSize: 13 }}>
                  Halaman ini cek otomatis setiap 5 detik
                  {pollCount > 0 ? ` (cek ke-${pollCount})` : ""}.
                </p>
              )}

              {isPending && isPayAtStore && (
                <p style={{ margin: "8px 0 0", color: "#92640a", fontSize: 13 }}>
                  Pembayaran dilakukan di toko dan menunggu konfirmasi kasir.
                </p>
              )}
            </div>
          </div>

          {/* INFORMASI PENERIMA */}
          <div style={sectionStyle}>
            <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>Informasi Penerima</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px 16px",
              }}
            >
              {[
                ["Nama", order.customer_name],
                ["Email", order.email],
                ["Telepon", order.phone],
                ["Metode Pembayaran", formatPaymentMethod(order.payment_method)],
                ["Metode Pengiriman", formatShipping(order.shipping_method, order.shipping_label)],
                ["Tanggal Order", formatDate(order.created_at)],
              ].map(([label, val]) => (
                <div key={label} style={infoBoxStyle}>
                  <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                    {label}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700 }}>{val || "-"}</p>
                </div>
              ))}

              <div style={infoBoxStyle}>
                <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                  Status Order
                </p>
                {(() => {
                  const s = statusStyle(order.status);
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 12px",
                        borderRadius: 0,
                        border: `1px solid ${s.border}`,
                        background: s.bg,
                        color: s.color,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  );
                })()}
              </div>

              <div style={infoBoxStyle}>
                <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                  Status Pembayaran
                </p>
                {(() => {
                  const s = paymentStatusStyle(order.payment_status);
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 12px",
                        borderRadius: 0,
                        border: `1px solid ${s.border}`,
                        background: s.bg,
                        color: s.color,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {formatPaymentStatus(order.payment_status)}
                    </span>
                  );
                })()}
              </div>

              {order.paid_at && (
                <div style={infoBoxStyle}>
                  <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                    Dibayar Pada
                  </p>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {formatDate(order.paid_at)}
                  </p>
                </div>
              )}

              <div
                style={{
                  ...infoBoxStyle,
                  gridColumn: "1 / -1",
                }}
              >
                <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                  Alamat
                </p>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {order.address}, {order.city}, {order.postal_code}
                </p>
              </div>

              {order.notes && (
                <div
                  style={{
                    ...infoBoxStyle,
                    gridColumn: "1 / -1",
                  }}
                >
                  <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                    Catatan
                  </p>
                  <p style={{ margin: 0, fontWeight: 700 }}>{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ITEM PESANAN */}
          <div style={sectionStyle}>
            <h3 style={{ margin: "0 0 16px", fontSize: 22 }}>Item Pesanan</h3>

            <div style={{ display: "grid", gap: 12 }}>
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 0,
                      background: "#f8f7f4",
                      border: "1px solid #ece7df",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                        {item.product_name}
                      </p>
                      <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
                        {item.color || "-"} / {item.size || "-"} | SKU: {item.sku || "-"}
                      </p>
                      {item?.is_reviewed && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            padding: "4px 10px",
                            borderRadius: 0,
                            background: "#eef8f1",
                            color: "#1a6b2f",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Sudah diberi ulasan
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: "right", minWidth: 160 }}>
                      <p style={{ margin: "0 0 4px", color: "#555" }}>
                        {item.qty} pcs × {formatPrice(item.price)}
                      </p>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#666" }}>Belum ada item pesanan.</div>
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid #ece7df",
              }}
            >
              {[
                ["Subtotal", order.subtotal],
                ["Ongkir", order.shipping_cost],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    color: "#555",
                    gap: 16,
                  }}
                >
                  <span>{label}</span>
                  <span>{formatPrice(val)}</span>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid #ddd",
                  fontWeight: 800,
                  fontSize: 20,
                  gap: 16,
                }}
              >
                <span>Total</span>
                <span>{formatPrice(order.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* TRACKING */}
          {order.shipping_method === "jnt" && (
            <div style={sectionStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 22 }}>Tracking Pengiriman</h3>
                <button
                  type="button"
                  onClick={() => fetchTracking(true)}
                  style={{
                    background: "#fff",
                    border: "1px solid #0f766e",
                    borderRadius: 0,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f766e",
                    cursor: "pointer",
                  }}
                >
                  {trackingLoading ? "Menyegarkan..." : "Refresh Tracking"}
                </button>
              </div>

              {trackingLoading && !tracking && (
                <p style={{ margin: 0, color: "#666" }}>
                  Memuat tracking pengiriman...
                </p>
              )}

              {!trackingLoading && trackingMessage && !tracking && (
                <p style={{ margin: 0, color: "#9a2420" }}>{trackingMessage}</p>
              )}

              {tracking && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div style={infoBoxStyle}>
                      <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                        Kurir
                      </p>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        {tracking.courier_company || "J&T"}{" "}
                        {tracking.courier_type
                          ? `• ${tracking.courier_type.toUpperCase()}`
                          : ""}
                      </p>
                    </div>

                    <div style={infoBoxStyle}>
                      <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                        Nomor Resi
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontFamily: "monospace",
                          fontSize: 14,
                        }}
                      >
                        {tracking.waybill_id || tracking.tracking_id || "-"}
                      </p>
                    </div>

                    <div style={infoBoxStyle}>
                      <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                        Status Pengiriman
                      </p>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        {formatShippingStatus(tracking.shipping_status)}
                      </p>
                    </div>

                    <div style={infoBoxStyle}>
                      <p style={{ margin: "0 0 4px", color: "#666", fontSize: 13 }}>
                        Tujuan
                      </p>
                      <p style={{ margin: 0, fontWeight: 700 }}>
                        {tracking.destination?.contact_name || order.customer_name}
                        <br />
                        {tracking.destination?.address ||
                          `${order.address}, ${order.city}, ${order.postal_code}`}
                      </p>
                    </div>
                  </div>

                  {tracking.courier_link && (
                    <a
                      href={tracking.courier_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 13,
                        color: "#0f766e",
                        textDecoration: "underline",
                      }}
                    >
                      Lihat detail tracking di halaman kurir
                    </a>
                  )}

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 10,
                      borderTop: "1px solid #ece7df",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>
                      Riwayat Perjalanan Paket
                    </p>
                    {tracking.history && tracking.history.length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          fontSize: 13,
                          color: "#555",
                        }}
                      >
                        {tracking.history.map((h, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                marginTop: 5,
                                borderRadius: 0,
                                background: idx === 0 ? "#0f766e" : "#d7d2ca",
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <p style={{ margin: 0, fontWeight: 600 }}>
                                {formatShippingStatus(h.status)}
                              </p>
                              {h.note && (
                                <p style={{ margin: "2px 0 0", color: "#777" }}>
                                  {h.note}
                                </p>
                              )}
                              {h.updated_at && (
                                <p
                                  style={{
                                    margin: "2px 0 0",
                                    color: "#999",
                                    fontSize: 12,
                                  }}
                                >
                                  {formatDate(h.updated_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "#777", fontSize: 13 }}>
                        Riwayat perjalanan paket belum tersedia.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AKSI PESANAN */}
          {(canConfirmReceived || canReview || confirmMessage) && (
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 14px", fontSize: 22 }}>Aksi Pesanan</h3>

              {confirmMessage && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    borderRadius: 0,
                    background: "#f5fbf8",
                    border: "1px solid #b9e3cd",
                    color: "#1a6b2f",
                    fontSize: 14,
                  }}
                >
                  {confirmMessage}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {canConfirmReceived && order.status !== "completed" && (
                  <button
                    type="button"
                    onClick={handleConfirmReceived}
                    disabled={confirmLoading}
                    style={{
                      background: "#0f766e",
                      color: "#fff",
                      padding: "10px 16px",
                      borderRadius: 0,
                      fontWeight: 700,
                      border: "none",
                      cursor: confirmLoading ? "not-allowed" : "pointer",
                      opacity: confirmLoading ? 0.7 : 1,
                    }}
                  >
                    {confirmLoading ? "Memproses..." : "Konfirmasi Pesanan Diterima"}
                  </button>
                )}

                {canReview && (
                  <button
                    type="button"
                    onClick={() => navigate(`/order-review/${order.id}`)}
                    style={{
                      background: orderHasReview ? "#f5fbf8" : "#fff",
                      color: "#0f766e",
                      padding: "10px 16px",
                      borderRadius: 0,
                      fontWeight: 700,
                      border: "1px solid #0f766e",
                      cursor: "pointer",
                    }}
                  >
                    {orderHasReview
                      ? "Perlihatkan Rating"
                      : "Beri Ulasan & Rating"}
                  </button>
                )}
              </div>

              {!canConfirmReceived && !canReview && (
                <p style={{ margin: "10px 0 0", color: "#666", fontSize: 14 }}>
                  Tombol aksi akan muncul setelah pesanan dikirim atau selesai.
                </p>
              )}
            </div>
          )}

          {/* INFO PENDING */}
          {isPending && !isPayAtStore && (
            <div
              style={{
                ...sectionStyle,
                background: "#fff8e6",
                border: "1px solid #f0d080",
                color: "#7a5500",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              <strong>Pembayaran masih pending.</strong> Jika kamu sudah
              menyelesaikan pembayaran di Midtrans tetapi status belum berubah,
              tunggu beberapa detik. Halaman ini akan mengecek status secara
              otomatis.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default OrderSuccessPage;