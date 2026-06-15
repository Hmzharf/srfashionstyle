import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function ProfileCart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // cek apakah user login dari localStorage auth_token / auth_user
  const isLoggedIn = !!localStorage.getItem("auth_token");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  };

  // sync ke backend kalau user login
  const syncCartToServer = async (items) => {
    if (!isLoggedIn) return;
    try {
      await api.post("/cart/sync", {
        items: items.map((item) => ({
          product_variant_id: item.product_variant_id,
          qty: item.qty,
        })),
      });
    } catch (err) {
      console.error("Gagal sync cart ke server", err);
    }
  };

  const updateCart = (updatedCart) => {
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
    syncCartToServer(updatedCart);
  };

  const increaseQty = (variantId) => {
    const updatedCart = cartItems.map((item) => {
      if (item.product_variant_id === variantId) {
        const nextQty = item.qty + 1;
        if (nextQty > item.stock_available) return item;
        return { ...item, qty: nextQty };
      }
      return item;
    });

    updateCart(updatedCart);
  };

  const decreaseQty = (variantId) => {
    const updatedCart = cartItems
      .map((item) => {
        if (item.product_variant_id === variantId) {
          const nextQty = item.qty - 1;
          return { ...item, qty: nextQty };
        }
        return item;
      })
      .filter((item) => item.qty > 0);

    updateCart(updatedCart);
  };

  const removeItem = (variantId) => {
    const updatedCart = cartItems.filter(
      (item) => item.product_variant_id !== variantId
    );
    updateCart(updatedCart);
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + Number(item.price) * Number(item.qty);
    }, 0);
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <section
        style={{
          paddingTop: 4,
          textAlign: "left",
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
          Keranjang
        </p>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 20,
            color: "#111111",
          }}
        >
          Keranjang masih kosong
        </h2>
        <p
          style={{
            color: "#6b665f",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Tambahkan produk dari katalog terlebih dahulu.
        </p>
        <button
          type="button"
          onClick={() => navigate("/catalog")}
          style={{
            background: "#0f766e",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          Lihat Produk di Katalog
        </button>
      </section>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 18,
          textAlign: "left",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            color: "#0f766e",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Keranjang
        </p>
        <p
          style={{
            margin: 0,
            color: "#6b665f",
            fontSize: 14,
          }}
        >
          Periksa item sebelum lanjut ke proses checkout.
        </p>
      </div>

      <main
        className="cart-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.8fr) minmax(260px, 0.8fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <section
          style={{
            paddingTop: 4,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 0,
            }}
          >
            {cartItems.map((item) => {
              const subtotal = Number(item.price) * Number(item.qty);

              return (
                <div
                  key={item.product_variant_id}
                  className="cart-item-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px minmax(0, 1fr) auto auto",
                    gap: 18,
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: "1px solid #e7e1d8",
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 120,
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
                          fontSize: 12,
                          textAlign: "center",
                          padding: 8,
                        }}
                      >
                        Gambar Produk
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: 16,
                        color: "#111111",
                        lineHeight: 1.45,
                        fontWeight: 700,
                      }}
                    >
                      {item.product_name ||
                        item.name ||
                        item.title ||
                        "Produk Tanpa Nama"}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#5f5b55",
                        fontSize: 13,
                      }}
                    >
                      Warna: {item.color || "-"} · Size: {item.size || "-"}
                    </p>

                    <p
                      style={{
                        margin: "0 0 6px",
                        color: "#5f5b55",
                        fontSize: 13,
                      }}
                    >
                      SKU: {item.sku || "-"}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#111111",
                        fontSize: 14,
                      }}
                    >
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        decreaseQty(item.product_variant_id)
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #d9d3cb",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#333",
                      }}
                    >
                      -
                    </button>

                    <span
                      style={{
                        minWidth: 24,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#111111",
                      }}
                    >
                      {item.qty}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        increaseQty(item.product_variant_id)
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1px solid #d9d3cb",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#333",
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontWeight: 700,
                        color: "#111111",
                        fontSize: 14,
                      }}
                    >
                      {formatPrice(subtotal)}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.product_variant_id)
                      }
                      style={{
                        padding: "7px 0",
                        border: "none",
                        background: "transparent",
                        color: "#b42318",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          style={{
            paddingTop: 4,
            position: "sticky",
            top: 20,
            textAlign: "left",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: 10,
              fontSize: 18,
              color: "#111111",
            }}
          >
            Ringkasan
          </h2>

          <p
            style={{
              margin: "0 0 14px",
              color: "#6b665f",
              fontSize: 13,
            }}
          >
            Total belum termasuk ongkos kirim.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              color: "#5f5b55",
              fontSize: 14,
            }}
          >
            <span>Subtotal</span>
            <span
              style={{ fontWeight: 700, color: "#111111" }}
            >
              {formatPrice(totalPrice)}
            </span>
          </div>

          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid #e7e1d8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 13, color: "#5f5b55" }}>
              Total produk
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#111111",
              }}
            >
              {cartItems.length} item
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#0f766e",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Lanjut Checkout
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #ddd5ca",
              background: "transparent",
              color: "#374151",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Buka Halaman Keranjang
          </button>
        </section>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
        }

        @media (max-width: 640px) {
          .cart-item-row {
            grid-template-columns: 80px minmax(0, 1fr) !important;
            gap: 14px !important;
            align-items: start !important;
          }

          .cart-item-row > :nth-child(3) {
            grid-column: 2 / 3;
            justify-content: flex-start !important;
            margin-top: 2px;
          }

          .cart-item-row > :nth-child(4) {
            grid-column: 2 / 3;
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfileCart;