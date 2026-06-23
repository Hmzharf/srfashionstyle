import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";

function FeaturedProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");

  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const loadProducts = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setErrorMsg("");

      const res = await api.get("/admin/featured-products");
      setProducts(Array.isArray(res.data) ? res.data : []);
      return true;
    } catch (e) {
      setProducts([]);
      setErrorMsg(
        e.response?.data?.message || e.message || "Gagal memuat data produk."
      );
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggle = async (product) => {
    const nextFeatured = !product.is_featured;

    try {
      setProcessingId(product.id);
      setMsg("");
      setErrorMsg("");

      const res = await api.post(`/admin/featured-products/${product.id}/toggle`, {
        featured: nextFeatured,
      });

      await loadProducts({ silent: true });
      setMsg(res.data?.message || "Status produk berhasil diperbarui.");
    } catch (e) {
      setMsg("");
      setErrorMsg(
        e.response?.data?.message || "Gagal memperbarui status produk."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const featuredCount = useMemo(
    () => products.filter((p) => p.is_featured).length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      String(p.name || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const getProductImage = (product) => {
    if (product.featured_image_url) return product.featured_image_url;
    const firstImage = Array.isArray(product.images) ? product.images[0] : null;
    return firstImage?.image_url || null;
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Best Product Homepage
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Pilih produk yang akan ditampilkan di section "Produk Terbaik" pada
            homepage. Produk yang dipilih akan langsung tampil untuk pengunjung.
          </p>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 13, color: "#475569" }}>
            Produk dipilih:{" "}
            <strong style={{ color: "#0f766e", fontSize: 15 }}>
              {featuredCount}
            </strong>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            style={{
              flex: "1 1 220px",
              maxWidth: 320,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              boxSizing: "border-box",
              background: "#fff",
              color: "#0f172a",
            }}
          />
        </div>

        {msg && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 10,
              background: "#ecfdf5",
              border: "1px solid #86efac",
              fontSize: 12,
              color: "#166534",
            }}
          >
            {msg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 12,
              color: "#b91c1c",
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          {loading ? (
            <div style={{ padding: 20, fontSize: 13, color: "#6b7280" }}>
              Memuat produk...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "#9ca3af" }}>
              {products.length === 0
                ? "Belum ada produk. Tambahkan produk terlebih dahulu di menu Produk."
                : "Produk tidak ditemukan."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {filteredProducts.map((product) => {
                const imageUrl = getProductImage(product);
                const isBusy = processingId === product.id;
                const isFeatured = !!product.is_featured;

                return (
                  <div
                    key={product.id}
                    style={{
                      borderRadius: 14,
                      border: isFeatured
                        ? "1px solid #0f766e"
                        : "1px solid #e5e7eb",
                      background: "#f8fafc",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "100%",
                        background: "#e5e7eb",
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          Tanpa gambar
                        </div>
                      )}

                      {isFeatured && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            padding: "3px 9px",
                            borderRadius: 999,
                            background: "#0f766e",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          Di Homepage
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {product.category?.name || "-"}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.4,
                        }}
                      >
                        {product.name}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f766e",
                        }}
                      >
                        {formatPrice(product.base_price)}
                      </div>

                      {!product.is_active && (
                        <div style={{ fontSize: 11, color: "#b91c1c" }}>
                          Nonaktif — tidak tampil walau dipilih
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggle(product)}
                        style={{
                          marginTop: "auto",
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 999,
                          border: isFeatured
                            ? "1px solid #dc2626"
                            : "1px solid #0f766e",
                          background: isFeatured ? "#fff" : "#0f766e",
                          color: isFeatured ? "#dc2626" : "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isBusy ? "default" : "pointer",
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        {isBusy
                          ? "Proses..."
                          : isFeatured
                          ? "Hapus dari Homepage"
                          : "Tampilkan di Homepage"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeaturedProductPage;
