import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios";

function OrderReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoverRatings, setHoverRatings] = useState({});

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        if (alive) {
          setLoading(true);
          setMessage("");
        }

        const orderRes = await api.get(`/orders/${id}`);
        const data = orderRes.data?.order || orderRes.data?.data || orderRes.data;

        if (!alive) return;

        setOrder(data);

        const items = data?.items || data?.order_items || [];

        const initial = items.map((item) => {
          const existingReview =
            item.review ||
            item.existing_review ||
            item.user_review ||
            null;

          const existingRating =
            existingReview?.rating ??
            item.review_rating ??
            item.rating ??
            5;

          const existingComment =
            existingReview?.comment ??
            existingReview?.review ??
            item.review_comment ??
            item.comment ??
            "";

          return {
            order_item_id: item.id,
            product_id: item.product_id,
            review_id: existingReview?.id || item.review_id || null,
            is_reviewed:
              Boolean(item.is_reviewed) ||
              Boolean(item.review_id) ||
              Boolean(existingReview),
            rating: Number(existingRating) || 5,
            comment: existingComment || "",
            product_name: item.product_name || item.product?.name || "Produk",
            color: item.color || "-",
            size: item.size || "-",
            qty: item.qty || 1,
            image:
              item.product_image ||
              item.image ||
              item.product?.image_url ||
              item.product?.image ||
              "",
          };
        });

        setReviews(initial);
      } catch (err) {
        if (!alive) return;

        console.error("ORDER REVIEW LOAD ERROR:", err);

        const status = err.response?.status;
        const apiMessage = err.response?.data?.message;

        if (status === 401) {
          setMessage("Sesi login kamu sudah habis. Silakan login kembali.");
        } else if (status === 403) {
          setMessage("Kamu tidak memiliki akses ke halaman ulasan ini.");
        } else if (status === 404) {
          setMessage("Pesanan tidak ditemukan.");
        } else {
          setMessage(apiMessage || "Gagal memuat halaman ulasan.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  const updateReview = (index, key, value) => {
    setReviews((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  };

  const submitReview = async () => {
    try {
      setSaving(true);
      setMessage("");

      const payload = {
        reviews: reviews.map(
          ({ order_item_id, product_id, review_id, rating, comment }) => ({
            order_item_id,
            product_id,
            review_id,
            rating,
            comment,
          })
        ),
      };

      const res = await api.post(`/orders/${id}/reviews`, payload);
      setMessage(res.data?.message || "Ulasan berhasil disimpan.");

      setTimeout(() => {
        navigate("/profile?tab=reviews");
      }, 900);
    } catch (err) {
      console.error("SUBMIT REVIEW ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal menyimpan ulasan.");
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (index, rating) => {
    const activeRating = hoverRatings[index] || rating;

    return (
      <div
        onMouseLeave={() =>
          setHoverRatings((prev) => ({ ...prev, [index]: 0 }))
        }
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= activeRating;

          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() =>
                setHoverRatings((prev) => ({ ...prev, [index]: star }))
              }
              onClick={() => updateReview(index, "rating", star)}
              aria-label={`Beri ${star} bintang`}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                fontSize: 28,
                lineHeight: 1,
                color: active ? "#f59e0b" : "#d6d3d1",
                transition: "color 0.15s ease",
              }}
            >
              ★
            </button>
          );
        })}

        <span
          style={{
            marginLeft: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "#6b665f",
          }}
        >
          {rating}/5
        </span>
      </div>
    );
  };

  const pageWrap = {
    width: "min(1156px, calc(100% - 48px))",
    margin: "0 auto",
    padding: "36px 0 56px",
    color: "#1f1f1f",
    boxSizing: "border-box",
    textAlign: "left",
  };

  const sectionLine = {
    borderBottom: "1px solid #ece7df",
    paddingBottom: 16,
    marginBottom: 24,
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #ddd6cd",
    borderRadius: 0,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#222",
    boxSizing: "border-box",
  };

  const buttonPrimary = {
    background: "#111111",
    color: "#ffffff",
    border: "none",
    borderRadius: 0,
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    minHeight: 44,
  };

  const buttonSecondary = {
    background: "#ffffff",
    color: "#222222",
    border: "1px solid #ddd6cd",
    borderRadius: 0,
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    minHeight: 44,
  };

  if (loading) {
    return (
      <div style={pageWrap}>
        <p style={{ margin: 0, color: "#6b665f", fontSize: 14 }}>
          Memuat data ulasan...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={pageWrap}>
        <div style={{ maxWidth: 760, textAlign: "left" }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 28,
              lineHeight: 1.2,
              color: "#111111",
            }}
          >
            Halaman Ulasan
          </h1>

          <p style={{ margin: 0, fontSize: 14, color: "#a63c2f", lineHeight: 1.7 }}>
            {message || "Data pesanan tidak dapat dimuat."}
          </p>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={buttonSecondary}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={sectionLine}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 12px",
              fontSize: 13,
              fontWeight: 700,
              color: "#333",
              background: "#f7f4ef",
            }}
          >
            Kode Order: {order.order_code || "-"}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 12px",
              fontSize: 13,
              fontWeight: 700,
              color: "#333",
              background: "#f7f4ef",
            }}
          >
            Total Item: {reviews.length}
          </span>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: "1px solid #ece7df",
            color: message.toLowerCase().includes("berhasil") ? "#1d6b3c" : "#a63c2f",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "left",
          }}
        >
          {message}
        </div>
      )}

      <div>
        {reviews.map((item, index) => (
          <section
            key={item.order_item_id}
            style={{
              borderBottom: "1px solid #ece7df",
              paddingBottom: 24,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div
              className="order-review-item-grid"
              style={{
                display: "grid",
                gridTemplateColumns: item.image ? "92px minmax(0, 1fr)" : "1fr",
                gap: 18,
                alignItems: "start",
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.product_name}
                  width="92"
                  height="92"
                  loading="lazy"
                  style={{
                    width: 92,
                    height: 92,
                    objectFit: "cover",
                    background: "#f7f4ef",
                  }}
                />
              ) : null}

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ maxWidth: 760, textAlign: "left" }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        lineHeight: 1.3,
                        color: "#111",
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                    >
                      {item.product_name}
                    </h2>

                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "#6b665f",
                        lineHeight: 1.7,
                        textAlign: "left",
                      }}
                    >
                      {item.color} • {item.size} • {item.qty} pcs
                    </p>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#8a847b",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    Produk {index + 1}
                  </div>
                </div>

                <div
                  className="order-review-form-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "220px minmax(0, 1fr)",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#333",
                        textAlign: "left",
                      }}
                    >
                      Rating
                    </label>

                    {renderStars(index, item.rating)}
                  </div>

                  <div style={{ textAlign: "left" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#333",
                        textAlign: "left",
                      }}
                    >
                      Ulasan
                    </label>

                    <textarea
                      rows={4}
                      value={item.comment}
                      onChange={(e) =>
                        updateReview(index, "comment", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: 120,
                        lineHeight: 1.7,
                        textAlign: "left",
                      }}
                      placeholder="Tulis pengalaman kamu dengan produk ini, misalnya bahan, ukuran, kenyamanan, atau kualitas jahitan."
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section
        style={{
          paddingTop: 6,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 760, textAlign: "left" }}>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: 20,
                color: "#111",
                textAlign: "left",
              }}
            >
              Simpan ulasan pesanan
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#6b665f",
                lineHeight: 1.7,
                textAlign: "left",
              }}
            >
              Pastikan rating dan ulasan sudah sesuai sebelum disimpan.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={buttonSecondary}
            >
              Kembali
            </button>

            <button
              type="button"
              onClick={submitReview}
              disabled={saving || reviews.length === 0}
              style={{
                ...buttonPrimary,
                opacity: saving || reviews.length === 0 ? 0.7 : 1,
                cursor: saving || reviews.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Ulasan"}
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .order-review-item-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          textarea,
          button {
            font-size: 16px !important;
          }
        }

        @media (max-width: 640px) {
          .order-review-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default OrderReviewPage;
