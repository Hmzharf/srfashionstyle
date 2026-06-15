import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function HomePage() {
  const container = {
    width: "min(1156px, calc(100% - 48px))",
    margin: "0 auto",
  };

  const primaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    padding: "0 22px",
    borderRadius: 999,
    background: "#0f766e",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  };

  const secondaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    padding: "0 22px",
    borderRadius: 999,
    background: "transparent",
    color: "#3b342d",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    border: "1px solid #cfc5b8",
  };

  const [bestProducts, setBestProducts] = useState([]);
  const [isBestLoading, setIsBestLoading] = useState(true);
  const [homepageMedia, setHomepageMedia] = useState({
    hero_desktop: null,
    hero_mobile: null,
    promo: null,
  });

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  useEffect(() => {
    let ignore = false;

    const fetchBestProducts = async () => {
      try {
        setIsBestLoading(true);
        const res = await fetch(
          "http://127.0.0.1:8000/api/store/best-products?limit=8"
        );
        const data = await res.json();

        if (!ignore) {
          setBestProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          setBestProducts([]);
        }
      } finally {
        if (!ignore) {
          setIsBestLoading(false);
        }
      }
    };

    const fetchHomepageMedia = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/store/homepage-media");
        const data = await res.json();

        if (!ignore) {
          setHomepageMedia({
            hero_desktop: data?.hero_desktop || null,
            hero_mobile: data?.hero_mobile || null,
            promo: data?.promo || null,
          });
        }
      } catch (error) {
        if (!ignore) {
          setHomepageMedia({
            hero_desktop: null,
            hero_mobile: null,
            promo: null,
          });
        }
      }
    };

    fetchBestProducts();
    fetchHomepageMedia();

    return () => {
      ignore = true;
    };
  }, []);

  const heroDesktopImage = homepageMedia.hero_desktop?.image_url || "";
  const heroMobileImage =
    homepageMedia.hero_mobile?.image_url ||
    homepageMedia.hero_desktop?.image_url ||
    "";
  const promoBannerImage = homepageMedia.promo?.image_url || "";

  return (
    <div>
      <section
        className="hero-section"
        style={{
          position: "relative",
          width: "100%",
          background: "linear-gradient(180deg, #f6f1e8 0%, #efe6d8 100%)",
          overflow: "hidden",
        }}
      >
        {heroMobileImage ? (
          <div
            className="hero-mobile-bg"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
                url("${heroMobileImage}")
              `,
            }}
          />
        ) : null}

        <div style={container} className="hero-container">
          <div
            className="hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 32,
              alignItems: "center",
              minHeight: 560,
              padding: "32px 0 0",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              className="hero-copy"
              style={{
                padding: "32px 0 56px",
                textAlign: "left",
                justifySelf: "start",
              }}
            >
              <p
                className="hero-eyebrow"
                style={{
                  margin: "0 0 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#0f766e",
                  textAlign: "left",
                }}
              >
                New Collection 2026
              </p>

              <h1
                className="hero-title"
                style={{
                  margin: 0,
                  fontSize: "clamp(2rem, 3vw, 3.6rem)",
                  lineHeight: 1.1,
                  fontWeight: 800,
                  color: "#231e18",
                  textAlign: "left",
                  maxWidth: 520,
                }}
              >
                Tampil lebih
                <br />
                rapi, hangat,
                <br />
                dan elegan.
              </h1>

              <p
                className="hero-desc"
                style={{
                  margin: "20px 0 0",
                  maxWidth: 540,
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "#665d53",
                  textAlign: "left",
                }}
              >
                Kami menghadirkan fashion yang simpel dipakai setiap hari,
                nyaman dilihat, dan mudah dipadukan untuk gaya yang modern
                tanpa terasa berlebihan.
              </p>

              <div
                className="hero-actions"
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 28,
                  justifyContent: "flex-start",
                }}
              >
                <Link to="/catalog" style={primaryBtn}>
                  Belanja Sekarang
                </Link>
                <Link
                  to="/catalog"
                  style={secondaryBtn}
                  className="hero-secondary-btn"
                >
                  Lihat Katalog
                </Link>
              </div>
            </div>

            <div
              className="hero-image-wrap"
              style={{
                minHeight: 560,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "32px 0 48px",
                boxSizing: "border-box",
              }}
            >
              {heroDesktopImage ? (
                <img
                  src={heroDesktopImage}
                  alt={homepageMedia.hero_desktop?.title || "Hero banner"}
                  width="900"
                  height="1200"
                  loading="eager"
                  style={{
                    width: "100%",
                    maxWidth: 440,
                    height: 520,
                    objectFit: "cover",
                    objectPosition: "top",
                    borderRadius: 28,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    maxWidth: 440,
                    height: 520,
                    borderRadius: 28,
                    background: "#e7dfd3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7a6f63",
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  Belum ada gambar hero desktop yang di-upload admin
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          background: "#ffffff",
          padding: "80px 0",
        }}
      >
        <div style={container}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 44,
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#0f766e",
              }}
            >
              Kategori
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 2.5vw, 2.6rem)",
                fontWeight: 800,
                color: "#231e18",
                lineHeight: 1.2,
              }}
            >
              Jelajahi koleksi kami
            </h2>
          </div>

          <div className="category-visual-grid">
            <Link
              to="/catalog?category=kemeja"
              className="category-visual-card"
              style={{
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                display: "block",
                aspectRatio: "3 / 4",
                background: "#e9e2d8",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900&h=1200&fit=crop"
                alt="Kategori kemeja"
                width="600"
                height="800"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 500ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.02) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Kemeja
                </p>
              </div>
            </Link>

            <Link
              to="/catalog?category=kaos"
              className="category-visual-card"
              style={{
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                display: "block",
                aspectRatio: "3 / 4",
                background: "#e9e2d8",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1200&fit=crop"
                alt="Kategori kaos"
                width="600"
                height="800"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 500ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.02) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Kaos
                </p>
              </div>
            </Link>

            <Link
              to="/catalog?category=celana"
              className="category-visual-card"
              style={{
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                display: "block",
                aspectRatio: "3 / 4",
                background: "#e9e2d8",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&h=1200&fit=crop"
                alt="Kategori celana"
                width="600"
                height="800"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 500ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.02) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Celana
                </p>
              </div>
            </Link>

            <Link
              to="/catalog?category=jaket"
              className="category-visual-card"
              style={{
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                display: "block",
                aspectRatio: "3 / 4",
                background: "#e9e2d8",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&h=1200&fit=crop"
                alt="Kategori jaket"
                width="600"
                height="800"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 500ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.02) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Jaket
                </p>
              </div>
            </Link>

            <Link
              to="/catalog?category=aksesoris"
              className="category-visual-card"
              style={{
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                display: "block",
                aspectRatio: "3 / 4",
                background: "#e9e2d8",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&h=1200&fit=crop"
                alt="Kategori aksesoris"
                width="600"
                height="800"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "transform 500ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.02) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Aksesoris
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          background: "linear-gradient(180deg, #f6f1e8 0%, #efe6d8 100%)",
          padding: "84px 0",
        }}
      >
        <div style={container}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 44,
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#0f766e",
              }}
            >
              Best Products
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.8rem, 2.5vw, 2.6rem)",
                fontWeight: 800,
                color: "#231e18",
                lineHeight: 1.2,
              }}
            >
              Produk Terbaik
            </h2>
          </div>

          {isBestLoading ? (
            <div className="best-product-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <div
                    style={{
                      aspectRatio: "3 / 4",
                      borderRadius: 20,
                      background: "#ece6dc",
                      marginBottom: 14,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: "32%",
                      borderRadius: 999,
                      background: "#ece6dc",
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      height: 18,
                      width: "70%",
                      borderRadius: 999,
                      background: "#ece6dc",
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      height: 18,
                      width: "42%",
                      borderRadius: 999,
                      background: "#ece6dc",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="best-product-grid">
              {bestProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="best-product-card"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 20,
                      background: "#efe7db",
                      marginBottom: 16,
                      aspectRatio: "3 / 4",
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        width="600"
                        height="800"
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transition: "transform 500ms ease",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#e8dfd2",
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        height: 30,
                        padding: "0 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.92)",
                        color: "#2f4c43",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {product.badge || "Terlaris"}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#8a7b6a",
                      marginBottom: 8,
                    }}
                  >
                    {product.category}
                  </div>

                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: 18,
                      lineHeight: 1.35,
                      fontWeight: 800,
                      color: "#231e18",
                    }}
                  >
                    {product.name}
                  </h3>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#0f766e",
                    }}
                  >
                    {formatPrice(product.price)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          width: "100%",
          background: "#ffffff",
          padding: "28px 0 92px",
        }}
      >
        <div style={container}>
          <div
            className="promo-banner"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 28,
              background: "#1f1a16",
              color: "#fffaf3",
              minHeight: 340,
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
            }}
          >
            <div
              className="promo-banner-content"
              style={{
                position: "relative",
                zIndex: 2,
                padding: "42px 38px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                className="promo-banner-eyebrow"
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#d9c7aa",
                  marginBottom: 14,
                }}
              >
                Promo Koleksi
              </div>

              <h2
                className="promo-banner-title"
                style={{
                  margin: "0 0 14px",
                  fontSize: "clamp(1.8rem, 2.4vw, 2.8rem)",
                  lineHeight: 1.12,
                  fontWeight: 800,
                  maxWidth: 460,
                  color: "#fffaf3",
                }}
              >
                Temukan pilihan fashion yang elegan untuk tampilan harianmu
              </h2>

              <p
                className="promo-banner-desc"
                style={{
                  margin: 0,
                  maxWidth: 470,
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "rgba(255,250,243,0.78)",
                }}
              >
                Koleksi terbaru dengan nuansa modern, ringan dipakai, dan mudah
                dipadukan untuk berbagai aktivitas setiap hari.
              </p>

              <div
                className="promo-banner-actions"
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 26,
                }}
              >
                <Link
                  to="/catalog"
                  style={{
                    ...primaryBtn,
                    background: "#ffffff",
                    color: "#1f1a16",
                  }}
                >
                  Belanja Sekarang
                </Link>

                <Link
                  to="/catalog"
                  style={{
                    ...secondaryBtn,
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "#fffaf3",
                    background: "transparent",
                  }}
                >
                  Lihat Katalog
                </Link>
              </div>
            </div>

            <div
              className="promo-banner-image"
              style={{
                position: "relative",
                minHeight: 340,
                background: "#2a241f",
              }}
            >
              {promoBannerImage ? (
                <img
                  src={promoBannerImage}
                  alt={homepageMedia.promo?.title || "Promo koleksi fashion"}
                  width="1400"
                  height="1200"
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
                    color: "rgba(255,250,243,0.72)",
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  Belum ada banner promo yang di-upload admin
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to left, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.08) 32%, rgba(31,26,22,0.00) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .category-visual-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .category-visual-card:hover img {
          transform: scale(1.05);
        }

        .best-product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }

        .best-product-card:hover img {
          transform: scale(1.05);
        }

        .hero-mobile-bg {
          display: none;
        }

        @media (max-width: 1023px) {
          .hero-section {
            min-height: 520px;
          }

          .hero-mobile-bg {
            display: block;
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            z-index: 0;
          }

          .hero-grid {
            grid-template-columns: 1fr !important;
            min-height: 520px !important;
            padding: 40px 0 !important;
          }

          .hero-copy {
            position: relative;
            z-index: 2;
            width: min(1156px, calc(100% - 48px));
            margin: 0 auto;
            padding: 32px 0 !important;
          }

          .hero-eyebrow {
            color: ${heroMobileImage ? "#d7f7ef" : "#0f766e"} !important;
          }

          .hero-title,
          .hero-desc {
            color: ${heroMobileImage ? "#fffaf3" : "#231e18"} !important;
          }

          .hero-secondary-btn {
            color: ${heroMobileImage ? "#fffaf3" : "#3b342d"} !important;
            border: ${
              heroMobileImage
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid #cfc5b8"
            } !important;
            background: ${
              heroMobileImage
                ? "rgba(255,255,255,0.06)"
                : "transparent"
            } !important;
          }

          .hero-image-wrap {
            display: none !important;
          }

          .category-visual-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .best-product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .promo-banner {
            grid-template-columns: 1fr !important;
          }

          .promo-banner-image {
            min-height: 280px !important;
            order: -1;
          }

          .promo-banner-content {
            align-items: center;
            text-align: center;
            padding: 36px 24px !important;
          }

          .promo-banner-eyebrow,
          .promo-banner-title,
          .promo-banner-desc {
            text-align: center !important;
            margin-left: auto;
            margin-right: auto;
          }

          .promo-banner-title,
          .promo-banner-desc {
            max-width: 640px !important;
          }

          .promo-banner-actions {
            justify-content: center;
            align-items: center;
          }
        }

        @media (max-width: 767px) {
          .hero-section {
            min-height: 460px;
          }

          .hero-grid {
            min-height: 460px !important;
            padding: 28px 0 !important;
          }

          .hero-copy {
            width: calc(100% - 32px);
          }

          .category-visual-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .best-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 18px !important;
          }

          .promo-banner-content {
            padding: 28px 20px !important;
          }

          .promo-banner-actions {
            width: 100%;
          }

          .promo-banner-image {
            min-height: 240px !important;
          }
        }

        @media (max-width: 520px) {
          .hero-section {
            min-height: 420px;
          }

          .hero-grid {
            min-height: 420px !important;
          }

          .category-visual-grid {
            gap: 12px !important;
          }
        }

        .promo-banner-image img {
          transition: transform 700ms ease;
        }

        .promo-banner:hover .promo-banner-image img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
}

export default HomePage;