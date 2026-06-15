import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    shipping_method: "pickup",
    shipping_service_code: "",
    shipping_label: "Pickup di Toko",
    shipping_cost: 0,
    payment_method: "midtrans",
    notes: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const isLoggedIn = !!localStorage.getItem("auth_token");

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  useEffect(() => {
    const prefillFromProfile = async () => {
      if (!isLoggedIn) {
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await api.get("/me");
        const user = res.data.user || res.data;

        setForm((prev) => ({
          ...prev,
          customer_name: user.name || prev.customer_name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
          address: user.address || prev.address,
          city: user.city || prev.city,
          postal_code: user.postal_code || prev.postal_code,
        }));
      } catch (err) {
        console.error("Gagal prefill profile di checkout", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    prefillFromProfile();
  }, [isLoggedIn]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + Number(item.price) * Number(item.qty);
    }, 0);
  }, [cartItems]);

  const shippingCost = useMemo(() => {
    if (form.shipping_method === "pickup") return 0;
    return Number(form.shipping_cost || 0);
  }, [form.shipping_method, form.shipping_cost]);

  const grandTotal = subtotal + shippingCost;

  const formatPrice = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getOrderIdFromResponse = (res) => {
    return res?.data?.id || res?.data?.data?.id || res?.data?.order?.id || null;
  };

  const loadMidtransSnap = (clientKey) => {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById("midtrans-snap-script");

      if (existing) {
        existing.setAttribute("data-client-key", clientKey);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "midtrans-snap-script";
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", clientKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Gagal load snap.js"));
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/payment-token`);
      const { snap_token, client_key } = res.data;

      if (!snap_token) {
        setMessage("Snap token tidak ditemukan dari backend.");
        setLoading(false);
        return;
      }

      await loadMidtransSnap(client_key);

      if (!window.snap) {
        setMessage("Snap Midtrans gagal dimuat.");
        setLoading(false);
        return;
      }

      window.snap.pay(snap_token, {
        onSuccess: () => {
          localStorage.removeItem("cart");
          navigate(`/order-success/${orderId}`, { replace: true });
        },
        onPending: () => {
          navigate(`/order-success/${orderId}`, { replace: true });
        },
        onError: () => {
          setMessage("Pembayaran gagal. Silakan coba lagi.");
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal memulai pembayaran.");
      setLoading(false);
    }
  };

  const fetchShippingRates = async () => {
    if (!form.postal_code) {
      setMessage("Kode pos wajib diisi untuk menghitung ongkir.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Keranjang masih kosong.");
      return;
    }

    try {
      setShippingLoading(true);
      setMessage("");

      const payload = {
        destination_postal_code: form.postal_code,
        items: cartItems.map((item) => ({
          product_name:
            item.product_name || item.name || item.title || "Produk",
          qty: Number(item.qty),
          price: Number(item.price),
          weight: Number(item.weight || 500),
        })),
      };

      const res = await api.post("/shipping/rates", payload);
      const options = (res.data.options || []).filter((option) => {
        const courier = String(option.courier_code || "").toLowerCase();
        const courierName = String(option.courier_name || "").toLowerCase();
        return (
          courier.includes("jnt") ||
          courierName.includes("j&t") ||
          courierName.includes("jnt")
        );
      });

      setShippingOptions(options);

      if (options.length > 0) {
        const first = options[0];
        setForm((prev) => ({
          ...prev,
          shipping_method: "jnt",
          shipping_service_code: first.service_code,
          shipping_label: `${first.courier_name} ${first.service_name}`,
          shipping_cost: Number(first.price || 0),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          shipping_service_code: "",
          shipping_label: "",
          shipping_cost: 0,
        }));
        setMessage("Layanan J&T tidak tersedia untuk kode pos ini.");
      }
    } catch (err) {
      console.error("FETCH SHIPPING RATES ERROR:", err);
      setShippingOptions([]);
      setForm((prev) => ({
        ...prev,
        shipping_service_code: "",
        shipping_label: "",
        shipping_cost: 0,
      }));
      setMessage(
        err.response?.data?.message || "Gagal mengambil ongkir dari server."
      );
    } finally {
      setShippingLoading(false);
    }
  };

  const handleShippingMethodChange = async (e) => {
    const value = e.target.value;

    if (value === "pickup") {
      setShippingOptions([]);
      setMessage("");
      setForm((prev) => ({
        ...prev,
        shipping_method: "pickup",
        shipping_service_code: "",
        shipping_label: "Pickup di Toko",
        shipping_cost: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      shipping_method: "jnt",
      shipping_service_code: "",
      shipping_label: "",
      shipping_cost: 0,
    }));

    setShippingOptions([]);

    if (!form.postal_code) {
      setMessage("Isi kode pos dulu sebelum memilih J&T Express.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Keranjang masih kosong.");
      return;
    }

    await fetchShippingRates();
  };

  const handleShippingServiceChange = (e) => {
    const selectedCode = e.target.value;
    const selected = shippingOptions.find(
      (option) => option.service_code === selectedCode
    );

    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      shipping_method: "jnt",
      shipping_service_code: selected.service_code,
      shipping_label: `${selected.courier_name} ${selected.service_name}`,
      shipping_cost: Number(selected.price || 0),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setMessage("Keranjang masih kosong.");
      return;
    }

    if (
      !form.customer_name ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.postal_code
    ) {
      setMessage("Mohon lengkapi semua data checkout.");
      return;
    }

    if (form.shipping_method === "jnt" && !form.shipping_service_code) {
      setMessage("Layanan pengiriman belum dipilih.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postal_code: form.postal_code,
        shipping_method: form.shipping_method,
        shipping_service_code: form.shipping_service_code,
        shipping_label: form.shipping_label,
        shipping_cost: Number(form.shipping_cost || 0),
        payment_method: form.payment_method,
        notes: form.notes,
        items: cartItems.map((item) => ({
          product_variant_id: item.product_variant_id,
          qty: Number(item.qty),
        })),
      };

      const res = await api.post("/orders", payload);
      const orderId = getOrderIdFromResponse(res);

      if (!orderId) {
        setMessage("Order berhasil dibuat, tetapi ID order tidak ditemukan.");
        setLoading(false);
        return;
      }

      if (form.payment_method === "pay_at_store") {
        localStorage.removeItem("cart");
        navigate(`/order-success/${orderId}`, { replace: true });
        return;
      }

      await handlePayment(orderId);
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setMessage(firstError || "Validasi gagal.");
      } else {
        setMessage(err.response?.data?.message || "Gagal membuat order.");
      }

      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 10,
    border: "1px solid #d8d2ca",
    background: "#fcfbf8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    color: "#111111",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: "#4a4a4a",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      style={{
        width: "100%",
        background: "#f8f6f1",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(1156px, calc(100% - 48px))",
          margin: "0 auto",
          padding: "28px 0 56px",
          color: "#222",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: 22,
            textAlign: "left",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#0f766e",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Checkout
          </p>
        </div>

        <main
          className="checkout-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.85fr)",
            gap: 36,
            alignItems: "start",
          }}
        >
          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: 22 }}>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: 22,
                  color: "#111111",
                }}
              >
                Data Customer
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6b665f",
                  fontSize: 14,
                }}
              >
                Pastikan semua data terisi dengan benar agar order mudah diproses.
              </p>
            </div>

            {loadingProfile && isLoggedIn && (
              <div
                style={{
                  marginBottom: 18,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#eef7f5",
                  color: "#245c52",
                  border: "1px solid #c8e3dc",
                  fontSize: 13,
                }}
              >
                Mengambil data profil...
              </div>
            )}

            {message && (
              <div
                style={{
                  marginBottom: 18,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "#fff3f0",
                  color: "#9f2d20",
                  border: "1px solid #f0c8c2",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {message}
              </div>
            )}

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nama lengkap</label>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Masukkan nama lengkap"
                  value={form.customer_name}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div
                className="checkout-grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="contoh@email.com"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Nomor telepon</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Alamat lengkap</label>
                <textarea
                  name="address"
                  placeholder="Masukkan alamat lengkap"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
                />
              </div>

              <div
                className="checkout-grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>Kota</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Contoh: Jakarta"
                    value={form.city}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Kode pos</label>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="Contoh: 12345"
                    value={form.postal_code}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                className="checkout-grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>Metode pengiriman</label>
                  <select
                    name="shipping_method"
                    value={form.shipping_method}
                    onChange={handleShippingMethodChange}
                    style={inputStyle}
                  >
                    <option value="pickup">Pickup di Toko</option>
                    <option value="jnt">J&T Express</option>
                  </select>

                  {form.shipping_method === "jnt" && (
                    <div style={{ marginTop: 10 }}>
                      <label style={labelStyle}>Layanan pengiriman</label>
                      <select
                        name="shipping_service_code"
                        value={form.shipping_service_code}
                        onChange={handleShippingServiceChange}
                        style={inputStyle}
                        disabled={shippingLoading || shippingOptions.length === 0}
                      >
                        <option value="">
                          {shippingLoading
                            ? "Mengambil ongkir..."
                            : shippingOptions.length > 0
                            ? "Pilih layanan J&T"
                            : "Belum ada layanan tersedia"}
                        </option>
                        {shippingOptions.map((option) => (
                          <option
                            key={`${option.courier_code}-${option.service_code}`}
                            value={option.service_code}
                          >
                            {option.courier_name} {option.service_name} - {formatPrice(option.price)} - Estimasi {option.etd || "-"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Metode pembayaran</label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="midtrans">Bayar Online (Midtrans)</option>
                    <option value="pay_at_store">Bayar di Toko</option>
                  </select>
                </div>
              </div>

              {form.shipping_method === "pickup" && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#eef7f5",
                    border: "1px solid #c8e3dc",
                    color: "#245c52",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Pesanan akan diambil langsung di toko. Opsi ini tidak memakai ongkir kurir.
                </div>
              )}

              {form.shipping_method === "jnt" && shippingLoading && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#eef7f5",
                    border: "1px solid #c8e3dc",
                    color: "#245c52",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Sedang mengambil ongkir J&T...
                </div>
              )}

              {form.payment_method === "pay_at_store" && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "#fff8e6",
                    border: "1px solid #f0d080",
                    color: "#7a5500",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Bayar di Toko:</strong> pembayaran bisa dilakukan saat pengambilan pesanan di toko.
                </div>
              )}

              <div>
                <label style={labelStyle}>Catatan pesanan</label>
                <textarea
                  name="notes"
                  placeholder="Contoh: tolong packing rapi / hadiah / warna tertentu"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: "15px 18px",
                  border: "none",
                  borderRadius: 12,
                  background: loading ? "#b5b5b5" : "#0f766e",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                }}
              >
                {loading
                  ? "Memproses..."
                  : form.payment_method === "pay_at_store"
                  ? "Buat Pesanan"
                  : "Buat Pesanan & Bayar"}
              </button>
            </div>
          </form>

          <section
            style={{
              position: "sticky",
              top: 20,
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: 22,
                  color: "#111111",
                }}
              >
                Ringkasan Pesanan
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6b665f",
                  fontSize: 14,
                }}
              >
                Periksa item yang akan dibeli sebelum checkout.
              </p>
            </div>

            {cartItems.length === 0 ? (
              <div
                style={{
                  padding: "18px 0",
                  color: "#666",
                }}
              >
                Keranjang kosong.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 0 }}>
                {cartItems.map((item) => (
                  <div
                    key={item.product_variant_id}
                    className="checkout-item-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "76px minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom: "1px solid #e7e1d8",
                    }}
                  >
                    <div
                      style={{
                        width: 76,
                        height: 94,
                        background: "#efe9df",
                        overflow: "hidden",
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      {item.featured_image ? (
                        <img
                          src={item.featured_image}
                          alt={
                            item.product_name ||
                            item.name ||
                            item.title ||
                            "Produk"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8a847b",
                            fontSize: 11,
                            textAlign: "center",
                            padding: 8,
                          }}
                        >
                          Gambar
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: "0 0 6px",
                          fontSize: 15,
                          lineHeight: 1.4,
                          color: "#111111",
                        }}
                      >
                        {item.product_name ||
                          item.name ||
                          item.title ||
                          "Produk Tanpa Nama"}
                      </h3>

                      <p
                        style={{
                          margin: "0 0 4px",
                          color: "#666",
                          fontSize: 13,
                        }}
                      >
                        Warna: {item.color || "-"} · Size: {item.size || "-"}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          color: "#666",
                          fontSize: 13,
                        }}
                      >
                        Qty: {item.qty}
                      </p>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        color: "#111111",
                        fontSize: 14,
                      }}
                    >
                      {formatPrice(Number(item.price) * Number(item.qty))}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    paddingTop: 16,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px",
                      color: "#6b665f",
                      fontSize: 13,
                    }}
                  >
                    Total sudah termasuk ongkos kirim sesuai metode yang dipilih.
                  </p>

                  {form.shipping_label && (
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#6b665f",
                        fontSize: 13,
                      }}
                    >
                      Pengiriman: {form.shipping_label}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      color: "#555",
                      fontSize: 14,
                    }}
                  >
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      color: "#555",
                      fontSize: 14,
                    }}
                  >
                    <span>Ongkir</span>
                    <span style={{ fontWeight: 700 }}>
                      {form.shipping_method === "pickup"
                        ? formatPrice(0)
                        : form.shipping_service_code
                        ? formatPrice(shippingCost)
                        : "-"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 12,
                      borderTop: "1px solid #ddd5ca",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#111111",
                    }}
                  >
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background:
                        form.payment_method === "pay_at_store"
                          ? "#fff8e6"
                          : "#eef7f5",
                      border: `1px solid ${
                        form.payment_method === "pay_at_store"
                          ? "#f0d080"
                          : "#c8e3dc"
                      }`,
                      color:
                        form.payment_method === "pay_at_store"
                          ? "#7a5500"
                          : "#245c52",
                      fontSize: 13,
                      textAlign: "center",
                      fontWeight: 700,
                    }}
                  >
                    {form.payment_method === "pay_at_store"
                      ? "Pembayaran dilakukan di toko"
                      : "Pembayaran via Midtrans"}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }

        @media (max-width: 640px) {
          .checkout-grid-2 {
            grid-template-columns: 1fr !important;
          }

          .checkout-item-row {
            grid-template-columns: 76px minmax(0, 1fr) !important;
            align-items: start !important;
          }

          .checkout-item-row > :nth-child(3) {
            grid-column: 2 / 3;
            text-align: left !important;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default CheckoutPage;