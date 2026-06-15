import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function ProfileReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const fetchReviews = async () => {
      try {
        if (alive) {
          setLoading(true);
          setMessage("");
        }

        const res = await api.get("/my-reviews");
        const data = res.data?.reviews || [];

        if (!alive) return;
        setReviews(data);
      } catch (err) {
        if (!alive) return;

        console.error("MY REVIEWS ERROR:", err);

        const status = err.response?.status;
        const apiMessage = err.response?.data?.message;

        if (status === 401) {
          setMessage("Sesi login kamu sudah habis. Silakan login kembali.");
        } else if (status === 403) {
          setMessage("Kamu tidak memiliki akses ke data ulasan.");
        } else {
          setMessage(apiMessage || "Gagal memuat ulasan kamu.");
        }

        setReviews([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchReviews();

    return () => {
      alive = false;
    };
  }, []);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("id-ID") : "-";

  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
    return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
  };

  const wrapperStyle = {
    colorScheme: "light",
    background: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  };

  const cardStyle = {
    padding: "16px 18px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
  };

  const linkButtonStyle = {
    border: "none",
    padding: 0,
    background: "none",
    color: "#0f766e",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  };

  return (
    <div className="profile-reviews-wrap" style={wrapperStyle}>
      <style>{`
        .profile-reviews-wrap,
        .profile-reviews-wrap * {
          color-scheme: light;
        }

        .profile-reviews-wrap button {
          appearance: none;
          -webkit-appearance: none;
          background-color: transparent;
        }

        .profile-reviews-wrap .review-muted {
          color: #6b7280 !important;
        }

        .profile-reviews-wrap .review-title {
          color: #111827 !important;
        }

        .profile-reviews-wrap .review-body {
          color: #374151 !important;
        }

        .profile-reviews-wrap .review-date {
          color: #9ca3af !important;
        }

        .profile-reviews-wrap .review-order {
          color: #78716c !important;
        }

        .profile-reviews-wrap .review-link {
          color: #0f766e !important;
        }

        .profile-reviews-wrap .review-link:hover {
          color: #115e59 !important;
        }

        .profile-reviews-wrap .review-link:focus-visible {
          outline: 2px solid rgba(15, 118, 110, 0.35);
          outline-offset: 3px;
          border-radius: 6px;
        }

        @media (prefers-color-scheme: dark) {
          .profile-reviews-wrap {
            color-scheme: light;
          }
        }
      `}</style>

      <h1
        style={{
          marginTop: 0,
          marginBottom: 10,
          fontSize: 20,
          color: "#111827",
          textAlign: "left",
        }}
      >
        Ulasan Saya
      </h1>

      <p
        className="review-muted"
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 14,
          textAlign: "left",
        }}
      >
        Lihat semua ulasan produk yang pernah kamu kirim dari pesanan yang sudah selesai.
      </p>

      {loading ? (
        <p
          className="review-muted"
          style={{ margin: 0, fontSize: 14 }}
        >
          Memuat ulasan...
        </p>
      ) : message ? (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 14,
            border: "1px dashed #d6d3d1",
            background: "#fafaf9",
          }}
        >
          <p
            className="review-muted"
            style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}
          >
            Kamu belum memiliki ulasan. Setelah pesanan selesai, kamu bisa menulis
            ulasan di halaman detail pesanan.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {reviews.map((rev) => (
            <div key={rev.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p
                    className="review-title"
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {rev.product?.name || rev.product_name || "Produk"}
                  </p>

                  <p
                    className="review-order"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                    }}
                  >
                    Pesanan: {rev.order?.order_code || rev.order_code || "-"}
                  </p>
                </div>

                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <p
                    style={{
                      margin: 0,
                      color: "#f59e0b",
                      fontWeight: 700,
                      letterSpacing: 1,
                      fontSize: 15,
                    }}
                  >
                    {renderStars(rev.rating)}
                  </p>

                  <p
                    className="review-date"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                    }}
                  >
                    {formatDate(rev.created_at)}
                  </p>
                </div>
              </div>

              <p
                className="review-body"
                style={{
                  margin: "10px 0 0",
                  fontSize: 14,
                  lineHeight: 1.7,
                  textAlign: "left",
                }}
              >
                {rev.comment || "Tidak ada komentar tambahan."}
              </p>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {(rev.order?.id || rev.order_id) && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/order-success/${rev.order?.id || rev.order_id}`)
                    }
                    style={linkButtonStyle}
                    className="review-link"
                  >
                    Lihat pesanan
                  </button>
                )}

                {(rev.product?.id || rev.product_id) && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/product/${rev.product?.id || rev.product_id}`)
                    }
                    style={linkButtonStyle}
                    className="review-link"
                  >
                    Lihat produk
                  </button>
                )}

                {(rev.order?.id || rev.order_id) && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/order-review/${rev.order?.id || rev.order_id}`)
                    }
                    style={linkButtonStyle}
                    className="review-link"
                  >
                    Edit ulasan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfileReviews;