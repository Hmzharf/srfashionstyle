import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [uiAlert, setUiAlert] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsMessage, setReviewsMessage] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobileView = viewportWidth < 992;

  useEffect(() => {
    if (!uiAlert.open) return undefined;

    const timer = window.setTimeout(() => {
      setUiAlert((prev) => ({ ...prev, open: false }));
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [uiAlert.open, uiAlert.message]);

  const cleanAlertMessage = (value) => {
    const fallback = "Terjadi kendala. Silakan coba lagi.";
    const safeValue = String(value || fallback)
      .replace(/https?:\/\/localhost(:\d+)?\S*/gi, "")
      .replace(/localhost(:\d+)?/gi, "")
      .replace(/127\.0\.0\.1(:\d+)?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return safeValue || fallback;
  };

  const showUiAlert = (value, type = "info") => {
    setUiAlert({
      open: true,
      message: cleanAlertMessage(value),
      type,
    });
  };

  const closeUiAlert = () => {
    setUiAlert((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    setSelectedImageIndex(0);
    fetchProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await api.get(`/catalog-products/${id}`);
      const data = res.data;
      setProduct(data);
      setSelectedImageIndex(0);

      const variants = (data?.variants || []).filter(
        (v) => Number(v.is_active) === 1 || v.is_active === true
      );

      if (variants.length > 0) {
        const first = variants[0];
        setSelectedColor(first.color || "");
        setSelectedSize(first.size || "");
      } else {
        setSelectedColor("");
        setSelectedSize("");
      }

      await fetchRelatedProducts(data);
      await fetchProductReviews(data.id);
    } catch (err) {
      console.error("PRODUCT DETAIL ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil detail produk.");
      setProduct(null);
      setRelatedProducts([]);
      setProductReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      const categoryId =
        currentProduct?.category_id || currentProduct?.category?.id || "";

      const params = {};
      if (categoryId) {
        params.category_id = categoryId;
      }

      const res = await api.get("/catalog-products", { params });
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      const filtered = items
        .filter((item) => String(item.id) !== String(currentProduct.id))
        .slice(0, 4);

      setRelatedProducts(filtered);
    } catch (err) {
      console.error("RELATED PRODUCTS ERROR:", err);
      setRelatedProducts([]);
    }
  };

  const fetchProductReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      setReviewsMessage("");

      const res = await api.get(`/products/${productId}/reviews`);
      const data = Array.isArray(res.data?.reviews) ? res.data.reviews : [];

      setProductReviews(data);
    } catch (err) {
      console.error("PRODUCT REVIEWS ERROR:", err);
      setProductReviews([]);
      setReviewsMessage(
        err.response?.data?.message || "Gagal memuat ulasan produk."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatReviewDate = (value) =>
    value ? new Date(value).toLocaleDateString("id-ID") : "-";

  const renderStars = (rating) => {
    const safe = Math.max(0, Math.min(5, Number(rating || 0)));
    return `${"★".repeat(safe)}${"☆".repeat(5 - safe)}`;
  };

  const activeVariants = useMemo(
    () =>
      (product?.variants || []).filter(
        (v) => Number(v.is_active) === 1 || v.is_active === true
      ),
    [product]
  );

  const availableColors = useMemo(
    () =>
      [...new Set(activeVariants.map((v) => v.color).filter(Boolean))],
    [activeVariants]
  );

  const availableSizes = useMemo(
    () =>
      activeVariants
        .filter((v) => {
          if (!selectedColor) return true;
          return v.color === selectedColor;
        })
        .map((v) => v.size)
        .filter(Boolean)
        .filter((value, index, arr) => arr.indexOf(value) === index),
    [activeVariants, selectedColor]
  );

  const selectedVariant = useMemo(
    () =>
      activeVariants.find((variant) => {
        const colorMatch = selectedColor ? variant.color === selectedColor : true;
        const sizeMatch = selectedSize ? variant.size === selectedSize : true;
        return colorMatch && sizeMatch;
      }) || null,
    [activeVariants, selectedColor, selectedSize]
  );

  const displayPrice = useMemo(() => {
    if (selectedVariant?.price) return Number(selectedVariant.price);
    if (!product) return 0;

    const minPrice = Number(product.min_price ?? product.base_price ?? 0);
    const maxPrice = Number(product.max_price ?? product.base_price ?? 0);

    return maxPrice > minPrice ? null : minPrice;
  }, [selectedVariant, product]);

  const priceLabel = useMemo(() => {
    if (!product) return "-";

    if (displayPrice !== null) {
      return formatPrice(displayPrice);
    }

    const minPrice = Number(product.min_price ?? product.base_price ?? 0);
    const maxPrice = Number(product.max_price ?? product.base_price ?? 0);

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }, [displayPrice, product]);

  const reviewsCount = Number(
    product?.reviews_count ?? productReviews.length ?? 0
  );
  const averageRating = Number(product?.average_rating ?? 0).toFixed(1);
  const stockAvailable = Number(
    selectedVariant?.inventory?.stock_available ?? 0
  );

  const productImages = useMemo(() => {
    const gallery = Array.isArray(product?.images) ? product.images : [];

    const mapped = gallery
      .map((img) => img.image_url || img.file_url || img.url || "")
      .filter(Boolean);

    if (mapped.length > 0) return mapped;
    if (product?.featured_image) return [product.featured_image];
    return [];
  }, [product]);

  const activeImage = productImages[selectedImageIndex] || productImages[0] || "";

  const goToPrevImage = () => {
    if (productImages.length <= 1) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    if (productImages.length <= 1) return;
    setSelectedImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;

    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNextImage();
    } else if (distance < -minSwipeDistance) {
      goToPrevImage();
    }
  };

  const buildCartItem = () => ({
    product_id: product.id,
    product_variant_id: selectedVariant.id,
    name: product.name,
    featured_image: activeImage || product.featured_image || "",
    price: Number(selectedVariant.price ?? product.base_price ?? 0),
    color: selectedVariant.color || "",
    size: selectedVariant.size || "",
    sku: selectedVariant.sku || "",
    qty,
  });

  const validatePurchase = () => {
    if (!selectedVariant) {
      showUiAlert("Pilih varian produk terlebih dahulu.", "warning");
      return false;
    }

    if (stockAvailable <= 0) {
      showUiAlert("Stok varian ini habis.", "warning");
      return false;
    }

    if (qty > stockAvailable) {
      showUiAlert("Jumlah melebihi stok tersedia.", "warning");
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!validatePurchase()) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = cart.findIndex(
      (item) => item.product_variant_id === selectedVariant.id
    );

    if (existingIndex >= 0) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push(buildCartItem());
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    showUiAlert("Produk berhasil ditambahkan ke keranjang.", "success");
  };

  const handleBuyNow = () => {
    if (!validatePurchase()) return;

    const cart = [buildCartItem()];
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div style={pageWrapStyle}>
        <div style={containerStyle}>
          <div style={{ padding: "48px 0", color: "#5f5a52" }}>
            Memuat detail produk...
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={pageWrapStyle}>
        <div style={containerStyle}>
          <div
            style={{
              padding: "40px 0 64px",
              borderTop: "1px solid #e6dfd4",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 28, color: "#161616" }}>
              Produk tidak ditemukan
            </h2>
            <p style={{ margin: "12px 0 0", color: "#6b655d", lineHeight: 1.8 }}>
              {message || "Produk yang kamu cari tidak tersedia."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapStyle}>
      {uiAlert.open && (
        <div style={alertOverlayStyle}>
          <div
            role="status"
            aria-live="polite"
            style={{
              ...alertBoxStyle,
              borderColor:
                uiAlert.type === "success"
                  ? "#c9b894"
                  : uiAlert.type === "warning"
                  ? "#d8c7a0"
                  : "#d7cfc4",
            }}
          >
            <div
              style={{
                ...alertIconStyle,
                background:
                  uiAlert.type === "success"
                    ? "#171717"
                    : uiAlert.type === "warning"
                    ? "#c6922f"
                    : "#6b655d",
              }}
            >
              {uiAlert.type === "success" ? "✓" : "!"}
            </div>

            <div style={{ minWidth: 0 }}>
              <p style={alertTitleStyle}>
                {uiAlert.type === "success" ? "Berhasil" : "Perhatian"}
              </p>
              <p style={alertMessageStyle}>{uiAlert.message}</p>
            </div>

            <button
              type="button"
              onClick={closeUiAlert}
              aria-label="Tutup notifikasi"
              style={alertCloseButtonStyle}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={containerStyle}>
        <div
          className="product-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 430px)",
            gap: 52,
            alignItems: "start",
            padding: "36px 0 72px",
          }}
        >
          <section style={{ display: "grid", gap: 14 }}>
            <div
              onMouseEnter={() => setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: "relative",
                borderRadius: 28,
                overflow: "hidden",
                background: "#efeae2",
                border: "1px solid #e2dbd1",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1.08",
                    objectFit: "cover",
                    display: "block",
                    WebkitUserDrag: "none",
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: "1 / 1.08",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#756f67",
                    fontWeight: 700,
                  }}
                >
                  Gambar Produk
                </div>
              )}

              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevImage}
                    aria-label="Foto sebelumnya"
                    style={{
                      ...galleryArrowLeftStyle,
                      opacity: isMobileView || isImageHovered ? 1 : 0,
                      pointerEvents:
                        isMobileView || isImageHovered ? "auto" : "none",
                    }}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={goToNextImage}
                    aria-label="Foto berikutnya"
                    style={{
                      ...galleryArrowRightStyle,
                      opacity: isMobileView || isImageHovered ? 1 : 0,
                      pointerEvents:
                        isMobileView || isImageHovered ? "auto" : "none",
                    }}
                  >
                    ›
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(17,17,17,0.36)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {productImages.map((_, index) => (
                      <span
                        key={index}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background:
                            index === selectedImageIndex
                              ? "#ffffff"
                              : "rgba(255,255,255,0.45)",
                          display: "block",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {productImages.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 4,
                  WebkitOverflowScrolling: "touch",
                  scrollSnapType: "x mandatory",
                }}
              >
                {productImages.map((img, index) => {
                  const active = selectedImageIndex === index;

                  return (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        flex: "0 0 auto",
                        padding: 0,
                        width: 84,
                        height: 84,
                        borderRadius: 18,
                        overflow: "hidden",
                        border: active
                          ? "2px solid #171717"
                          : "1px solid #ddd4c8",
                        background: "#fff",
                        cursor: "pointer",
                        boxShadow: active
                          ? "0 8px 20px rgba(23, 23, 23, 0.12)"
                          : "none",
                        scrollSnapAlign: "start",
                      }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div
              style={{
                padding: 0,
                background: "transparent",
                display: "grid",
                gap: 22,
                textAlign: "left",
              }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "#6b655d",
                  }}
                >
                  {product.category?.name || "Tanpa Kategori"}
                </p>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.12,
                    color: "#111111",
                    fontWeight: 800,
                    textAlign: "left",
                  }}
                >
                  {product.name}
                </h1>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                    fontSize: 14,
                    color: "#625c54",
                  }}
                >
                  <span style={{ color: "#c6922f" }}>★</span>
                  <span style={{ fontWeight: 700 }}>{averageRating}</span>
                  <span>
                    {reviewsCount} ulasan •{" "}
                    {Number(product.online_sold_count ?? 0)} terjual
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#111111",
                    letterSpacing: "-0.02em",
                    textAlign: "left",
                  }}
                >
                  {priceLabel}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 20,
                  paddingTop: 20,
                  borderTop: "1px solid #ded6cb",
                }}
              >
                {availableColors.length > 0 && (
                  <div>
                    <p style={labelStyle}>Warna</p>
                    <div style={optionWrapStyle}>
                      {availableColors.map((color) => {
                        const active = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setSelectedSize("");
                            }}
                            style={{
                              ...optionPillStyle,
                              background: active ? "#151515" : "#f8f6f1",
                              color: active ? "#ffffff" : "#2f2a25",
                              border: active
                                ? "1px solid #151515"
                                : "1px solid #d8d0c5",
                            }}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div>
                    <p style={labelStyle}>Ukuran</p>
                    <div style={optionWrapStyle}>
                      {availableSizes.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            style={{
                              ...optionPillStyle,
                              background: active ? "#151515" : "#f8f6f1",
                              color: active ? "#ffffff" : "#2f2a25",
                              border: active
                                ? "1px solid #151515"
                                : "1px solid #d8d0c5",
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p style={labelStyle}>Jumlah</p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 14,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      style={qtyButtonStyle}
                    >
                      -
                    </button>

                    <span
                      style={{
                        minWidth: 20,
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#171717",
                        textAlign: "left",
                      }}
                    >
                      {qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => setQty((prev) => prev + 1)}
                      style={qtyButtonStyle}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <p style={labelStyle}>Stok</p>
                  <p
                    style={{
                      margin: 0,
                      color: "#635d55",
                      fontSize: 14,
                      lineHeight: 1.7,
                      textAlign: "left",
                    }}
                  >
                    {selectedVariant
                      ? `${stockAvailable} tersedia`
                      : "Pilih varian terlebih dahulu"}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  paddingTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={handleBuyNow}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    background: "#171717",
                    color: "#ffffff",
                    padding: "15px 20px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  Beli Sekarang
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    border: "1px solid #d7cfc4",
                    borderRadius: 999,
                    background: "#f8f6f1",
                    color: "#161616",
                    padding: "15px 20px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          </section>
        </div>

        <section
          style={{
            paddingBottom: 76,
            borderTop: "1px solid #e0d8cd",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 28,
              borderBottom: "1px solid #e0d8cd",
              paddingTop: 18,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === "description"
                    ? "2px solid #171717"
                    : "2px solid transparent",
                color: activeTab === "description" ? "#171717" : "#6c665e",
                padding: "0 0 14px",
                fontSize: 14,
                fontWeight: activeTab === "description" ? 800 : 600,
                cursor: "pointer",
              }}
            >
              Deskripsi
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === "reviews"
                    ? "2px solid #171717"
                    : "2px solid transparent",
                color: activeTab === "reviews" ? "#171717" : "#6c665e",
                padding: "0 0 14px",
                fontSize: 14,
                fontWeight: activeTab === "reviews" ? 800 : 600,
                cursor: "pointer",
              }}
            >
              Ulasan
            </button>
          </div>

          <div style={{ paddingTop: 26 }}>
            {activeTab === "description" && (
              <div>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 760,
                    color: "#4e4942",
                    fontSize: 15,
                    lineHeight: 1.95,
                    whiteSpace: "pre-line",
                    textAlign: "left",
                  }}
                >
                  {product.description ||
                    "Produk fashion berkualitas tinggi dari SR Fashion Style. Dibuat dari bahan premium dengan jahitan rapi dan presisi. Cocok untuk berbagai kesempatan formal maupun kasual."}
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ color: "#c6922f", fontSize: 18 }}>★</span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 18,
                        color: "#171717",
                      }}
                    >
                      {averageRating}
                    </span>
                    <span style={{ color: "#6b655d", fontSize: 14 }}>
                      dari {reviewsCount} ulasan
                    </span>
                  </div>
                </div>

                {reviewsLoading ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#6b655d",
                      fontSize: 15,
                      lineHeight: 1.85,
                      textAlign: "left",
                    }}
                  >
                    Memuat ulasan produk...
                  </p>
                ) : reviewsMessage ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#9a2420",
                      fontSize: 15,
                      lineHeight: 1.85,
                      textAlign: "left",
                    }}
                  >
                    {reviewsMessage}
                  </p>
                ) : productReviews.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#6b655d",
                      fontSize: 15,
                      lineHeight: 1.85,
                      textAlign: "left",
                    }}
                  >
                    Belum ada ulasan untuk produk ini.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 18 }}>
                    {productReviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          paddingBottom: 18,
                          borderBottom: "1px solid #e6dfd4",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#171717",
                                textAlign: "left",
                              }}
                            >
                              {review.user?.name || "Pelanggan"}
                            </p>

                            <p
                              style={{
                                margin: "4px 0 0",
                                color: "#c6922f",
                                fontSize: 14,
                                letterSpacing: 1,
                                textAlign: "left",
                              }}
                            >
                              {renderStars(review.rating)}
                            </p>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              color: "#8a847b",
                              fontSize: 12,
                              textAlign: "left",
                            }}
                          >
                            {formatReviewDate(review.created_at)}
                          </p>
                        </div>

                        <p
                          style={{
                            margin: "10px 0 0",
                            color: "#4e4942",
                            fontSize: 14,
                            lineHeight: 1.9,
                            textAlign: "left",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {review.comment || "Tidak ada komentar tambahan."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section
            style={{
              paddingBottom: 84,
              borderTop: "1px solid #e0d8cd",
            }}
          >
            <div
              style={{
                paddingTop: 28,
                display: "grid",
                gap: 22,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                    color: "#151515",
                    fontWeight: 800,
                    textAlign: "left",
                  }}
                >
                  Produk Terkait
                </h2>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#6b655d",
                    fontSize: 14,
                    lineHeight: 1.7,
                    textAlign: "left",
                  }}
                >
                  Produk serupa dari kategori yang sama.
                </p>
              </div>

              <div className="related-grid" style={relatedGridStyle}>
                {relatedProducts.map((item) => {
                  const relatedPrice = Number(
                    item.min_price ?? item.base_price ?? 0
                  );

                  return (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 22,
                          overflow: "hidden",
                          background: "#efeae2",
                          border: "1px solid #e2dbd1",
                        }}
                      >
                        {item.featured_image ? (
                          <img
                            src={item.featured_image}
                            alt={item.name}
                            style={{
                              width: "100%",
                              aspectRatio: "1 / 1.12",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              aspectRatio: "1 / 1.12",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#756f67",
                              fontWeight: 700,
                            }}
                          >
                            Produk
                          </div>
                        )}
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "#6b655d",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            fontWeight: 700,
                            textAlign: "left",
                          }}
                        >
                          {item.category?.name ||
                            product.category?.name ||
                            "Produk"}
                        </p>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: 17,
                            lineHeight: 1.45,
                            color: "#151515",
                            fontWeight: 700,
                            textAlign: "left",
                          }}
                        >
                          {item.name}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            color: "#1d1d1d",
                            fontSize: 15,
                            fontWeight: 800,
                            textAlign: "left",
                          }}
                        >
                          {formatPrice(relatedPrice)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }

          .related-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .related-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const pageWrapStyle = {
  width: "100%",
  minHeight: "100vh",
  background: "#f8f6f1",
};

const containerStyle = {
  width: "min(1156px, calc(100% - 48px))",
  margin: "0 auto",
};

const labelStyle = {
  margin: "0 0 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "#575149",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "left",
};

const optionWrapStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-start",
};

const optionPillStyle = {
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const qtyButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid #d7cfc4",
  background: "#f8f6f1",
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 700,
  color: "#161616",
};

const relatedGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 24,
};

const galleryArrowBaseStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 42,
  height: 42,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.55)",
  background: "rgba(17,17,17,0.45)",
  color: "#fff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  backdropFilter: "blur(4px)",
  fontSize: 24,
  lineHeight: 1,
  zIndex: 2,
  transition: "opacity 0.25s ease",
};

const galleryArrowLeftStyle = {
  ...galleryArrowBaseStyle,
  left: 12,
};

const galleryArrowRightStyle = {
  ...galleryArrowBaseStyle,
  right: 12,
};

const alertOverlayStyle = {
  position: "fixed",
  top: 18,
  left: 0,
  right: 0,
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  padding: "0 18px",
  pointerEvents: "none",
};

const alertBoxStyle = {
  width: "min(460px, 100%)",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 32px",
  alignItems: "center",
  gap: 12,
  padding: "14px 14px",
  borderRadius: 22,
  border: "1px solid #d7cfc4",
  background: "rgba(248, 246, 241, 0.96)",
  boxShadow: "0 18px 48px rgba(23, 23, 23, 0.16)",
  backdropFilter: "blur(10px)",
  pointerEvents: "auto",
};

const alertIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  color: "#ffffff",
  fontSize: 17,
  fontWeight: 800,
};

const alertTitleStyle = {
  margin: 0,
  color: "#171717",
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.25,
  textAlign: "left",
};

const alertMessageStyle = {
  margin: "3px 0 0",
  color: "#5f5a52",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.45,
  textAlign: "left",
};

const alertCloseButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid #ddd4c8",
  background: "#ffffff",
  color: "#171717",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
  display: "grid",
  placeItems: "center",
};

export default ProductDetailPage;