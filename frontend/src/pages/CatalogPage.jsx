import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/axios";

function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [maxPrice, setMaxPrice] = useState(1000000);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchTerm(q);
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get("/catalog-products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("CATALOG ERROR:", err);
      setMessage("Gagal mengambil katalog produk.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getActiveVariants = (product) => {
    return (product.variants || []).filter(
      (v) => Number(v.is_active) === 1 || v.is_active === true
    );
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const handleCatalogSearchChange = (value) => {
    setSearchTerm(value);

    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams);
  };

  const handleCardClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleCategoryClickOnCard = (e, categoryName) => {
    e.stopPropagation();
    if (!categoryName) return;
    setSelectedCategory(categoryName);
  };

  const categories = useMemo(() => {
    return [
      "all",
      ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
    ];
  }, [products]);

  const sizes = useMemo(() => {
    return [
      "all",
      ...new Set(
        products.flatMap((product) =>
          getActiveVariants(product)
            .map((variant) => variant.size)
            .filter(Boolean)
        )
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const keyword = searchTerm.trim().toLowerCase();

    result = result.filter((product) => {
      const activeVariants = getActiveVariants(product);

      const minPrice = Number(product.min_price ?? product.base_price ?? 0);
      const maxPriceValue = Number(product.max_price ?? product.base_price ?? 0);
      const effectivePrice = maxPriceValue > 0 ? maxPriceValue : minPrice;

      const searchableText = [
        product.name,
        product.description,
        product.category?.name,
        ...activeVariants.map((v) => v.size),
        ...activeVariants.map((v) => v.color),
        String(minPrice),
        String(maxPriceValue),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = keyword === "" || searchableText.includes(keyword);
      const matchCategory =
        selectedCategory === "all" ||
        product.category?.name === selectedCategory;
      const matchSize =
        selectedSize === "all" ||
        activeVariants.some((v) => v.size === selectedSize);
      const matchPrice = effectivePrice >= 0 && effectivePrice <= maxPrice;

      return matchSearch && matchCategory && matchSize && matchPrice;
    });

    result.sort((a, b) => {
      const minPriceA = Number(a.min_price ?? a.base_price ?? 0);
      const minPriceB = Number(b.min_price ?? b.base_price ?? 0);
      const popularA = Number(a.online_sold_count ?? 0);
      const popularB = Number(b.online_sold_count ?? 0);
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      const ratingA = Number(a.average_rating ?? 0);
      const ratingB = Number(b.average_rating ?? 0);

      switch (sortBy) {
        case "popular":
          return popularB - popularA;
        case "rating":
          return ratingB - ratingA;
        case "price-high":
          return minPriceB - minPriceA;
        case "price-low":
          return minPriceA - minPriceB;
        case "latest":
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [products, searchTerm, selectedCategory, selectedSize, sortBy, maxPrice]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSize("all");
    setSortBy("latest");
    setMaxPrice(1000000);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    setSearchParams(nextParams);
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
        className="catalog-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
          gap: 32,
          alignItems: "start",
          maxWidth: 1156,
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        <aside
          className="catalog-sidebar"
          style={{
            position: "sticky",
            top: 74,
            alignSelf: "start",
            minHeight: "calc(100vh - 74px)",
            padding: "28px 0 32px 0",
            overflowY: "auto",
            overflowX: "hidden",
            borderRight: "1px solid #e4ddd4",
          }}
        >
          <div style={{ paddingRight: 20 }}>
            <div style={{ marginBottom: 24, textAlign: "left" }}>
              <p style={sectionTitleStyle}>Kategori</p>
              <div style={{ display: "grid", gap: 8 }}>
                {categories.map((category) => {
                  const active = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className="filter-choice"
                      style={{
                        ...choiceButtonStyle,
                        background: active ? "#0f766e" : "transparent",
                        color: active ? "#fff" : "#2d2d2d",
                        borderColor: active ? "#0f766e" : "transparent",
                      }}
                    >
                      {category === "all" ? "Semua Kategori" : category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 24, textAlign: "left" }}>
              <p style={sectionTitleStyle}>Ukuran</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {sizes.map((size) => {
                  const active = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className="filter-pill"
                      style={{
                        ...pillStyle,
                        background: active ? "#111111" : "#f3eee7",
                        color: active ? "#ffffff" : "#333333",
                        border: active
                          ? "1px solid #111111"
                          : "1px solid #e0d9cf",
                      }}
                    >
                      {size === "all" ? "Semua Ukuran" : size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 24, textAlign: "left" }}>
              <p style={sectionTitleStyle}>Urutkan</p>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["latest", "Terbaru"],
                  ["popular", "Terpopuler"],
                  ["rating", "Rating Tertinggi"],
                  ["price-low", "Harga Terendah"],
                  ["price-high", "Harga Tertinggi"],
                ].map(([value, label]) => {
                  const active = sortBy === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSortBy(value)}
                      className="filter-choice"
                      style={{
                        ...choiceButtonStyle,
                        background: active ? "#111111" : "transparent",
                        color: active ? "#fff" : "#2d2d2d",
                        borderColor: active ? "#111111" : "transparent",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 28, textAlign: "left" }}>
              <p style={sectionTitleStyle}>Harga Maksimum</p>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#0f766e",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#6b665f",
                }}
              >
                <span>Rp0</span>
                <span>{formatPrice(maxPrice)}</span>
              </div>
            </div>

            <button
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "1px solid #d9d3cb",
                background: "#f5f2ec",
                color: "#111",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Reset Semua
            </button>
          </div>
        </aside>

        <section
          className="catalog-content"
          style={{
            minWidth: 0,
            paddingTop: 28,
          }}
        >
          {message && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                borderRadius: 12,
                background: "#e7f5f3",
                color: "#11423d",
                border: "1px solid #bddad5",
                textAlign: "left",
              }}
            >
              {message}
            </div>
          )}

          <div
            className="catalog-toolbar"
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "nowrap",
            }}
          >
            <div
              className="catalog-search-wrap"
              style={{
                flex: "0 0 280px",
                width: 280,
                minWidth: 280,
                maxWidth: 280,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #d8d2ca",
                  background: "#fcfbf8",
                  borderRadius: 10,
                  padding: "0 12px",
                  height: 40,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b6b6b"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20L17 17" />
                </svg>

                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => handleCatalogSearchChange(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: "#111111",
                  }}
                />
              </div>
            </div>

            <div
              className="catalog-sort-wrap"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
                flexWrap: "nowrap",
                flex: 1,
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setSortBy("popular")}
                className="sort-chip"
                style={{
                  ...sortChipStyle,
                  ...(sortBy === "popular" ? activeSortChipStyle : {}),
                }}
              >
                Terpopuler
              </button>

              <button
                type="button"
                onClick={() => setSortBy("rating")}
                className="sort-chip"
                style={{
                  ...sortChipStyle,
                  ...(sortBy === "rating" ? activeSortChipStyle : {}),
                }}
              >
                Rating
              </button>

              <button
                type="button"
                onClick={() => setSortBy("latest")}
                className="sort-chip"
                style={{
                  ...sortChipStyle,
                  ...(sortBy === "latest" ? activeSortChipStyle : {}),
                }}
              >
                Terbaru
              </button>

              <button
                type="button"
                onClick={() => setSortBy("price-high")}
                className="sort-chip"
                style={{
                  ...sortChipStyle,
                  ...(sortBy === "price-high" ? activeSortChipStyle : {}),
                }}
              >
                Harga Tertinggi
              </button>

              <button
                type="button"
                onClick={() => setSortBy("price-low")}
                className="sort-chip"
                style={{
                  ...sortChipStyle,
                  ...(sortBy === "price-low" ? activeSortChipStyle : {}),
                }}
              >
                Harga Terendah
              </button>
            </div>
          </div>

          {loading ? (
            <div
              className="catalog-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    background: "#fff",
                    border: "1px solid #e3ddd5",
                    borderRadius: 18,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ aspectRatio: "1 / 1", background: "#ece7df" }} />
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        height: 16,
                        width: "70%",
                        background: "#ece7df",
                        borderRadius: 10,
                        marginBottom: 10,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: "50%",
                        background: "#f0ebe4",
                        borderRadius: 999,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: "40%",
                        background: "#f0ebe4",
                        borderRadius: 999,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: "35%",
                        background: "#f0ebe4",
                        borderRadius: 999,
                        marginBottom: 12,
                      }}
                    />
                    <div
                      style={{
                        height: 18,
                        width: "55%",
                        background: "#ece7df",
                        borderRadius: 10,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2ddd6",
                borderRadius: 18,
                padding: 28,
                textAlign: "left",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                Produk tidak ditemukan
              </h3>
              <p style={{ margin: 0, color: "#666" }}>
                Coba ubah pencarian atau pilihan kategori, ukuran, dan harga.
              </p>
            </div>
          ) : (
            <div
              className="catalog-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {filteredProducts.map((product) => {
                const rating = Number(product.average_rating ?? product.reviews_avg_rating ?? 0).toFixed(1);
                const reviewsCount = Number(product.reviews_count ?? 0);
                const soldCount = Number(product.online_sold_count ?? 0);

                const minPrice = Number(product.min_price ?? product.base_price ?? 0);
                const maxPriceValue = Number(product.max_price ?? product.base_price ?? 0);

                const priceLabel =
                  maxPriceValue > minPrice
                    ? `${formatPrice(minPrice)} - ${formatPrice(maxPriceValue)}`
                    : formatPrice(minPrice);

                return (
                  <article
                    key={product.id}
                    onClick={() => handleCardClick(product.id)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e3ddd5",
                      borderRadius: 18,
                      overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    className="catalog-card"
                  >
                    <div
                      style={{
                        aspectRatio: "1 / 1",
                        background: "#f3efe8",
                        overflow: "hidden",
                      }}
                    >
                      {product.featured_image ? (
                        <img
                          src={product.featured_image}
                          alt={product.name}
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
                            color: "#7b746a",
                            fontWeight: 600,
                          }}
                        >
                          Gambar Produk
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 16,
                        display: "grid",
                        gap: 8,
                        textAlign: "left",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          lineHeight: 1.45,
                          color: "#111111",
                          minHeight: 46,
                          textAlign: "left",
                        }}
                      >
                        {product.name}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          fontSize: 13,
                          textAlign: "left",
                        }}
                      >
                        <span style={{ color: "#f59e0b" }}>★</span>
                        <span style={{ color: "#555555", fontWeight: 600 }}>
                          {rating}
                        </span>
                        <span style={{ color: "#7a746b", fontWeight: 500 }}>
                          ({reviewsCount} ulasan)
                        </span>
                        <span style={{ color: "#7a746b", fontWeight: 500 }}>
                          • {soldCount} terjual
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) =>
                          handleCategoryClickOnCard(e, product.category?.name)
                        }
                        style={{
                          width: "fit-content",
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          color: "#0f766e",
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {product.category?.name || "Tanpa Kategori"}
                      </button>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#111111",
                          textAlign: "left",
                        }}
                      >
                        {priceLabel}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .filter-choice:hover,
        .filter-pill:hover,
        .sort-chip:hover {
          background: #e9f5f3 !important;
          color: #0f766e !important;
          border-color: #b9ddd7 !important;
        }

        .catalog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(0,0,0,0.08) !important;
        }

        @media (max-width: 1023px) {
          .catalog-shell {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .catalog-sidebar {
            position: static !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border-right: none !important;
            padding: 20px 0 0 !important;
          }

          .catalog-content {
            padding-top: 8px !important;
          }
        }

        @media (max-width: 768px) {
          .catalog-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
            flex-wrap: nowrap !important;
          }

          .catalog-search-wrap {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            flex: none !important;
          }

          .catalog-sort-wrap {
            width: 100% !important;
            flex: none !important;
            justify-content: flex-start !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
        }

        @media (max-width: 640px) {
          .catalog-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .catalog-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const sectionTitleStyle = {
  margin: "0 0 10px",
  fontSize: 13,
  fontWeight: 700,
  color: "#4b4b4b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
};

const choiceButtonStyle = {
  width: "100%",
  textAlign: "left",
  padding: "11px 14px",
  borderRadius: 12,
  border: "1px solid transparent",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const pillStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "left",
};

const sortChipStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd5ca",
  background: "#f6f1ea",
  color: "#333",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
};

const activeSortChipStyle = {
  background: "#111111",
  color: "#ffffff",
  border: "1px solid #111111",
};

export default CatalogPage;