import { useEffect, useState } from "react";
import api from "../../lib/axios";

function AdminPromotionMediaPage() {

  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [placement, setPlacement] = useState("hero_desktop");

  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadMedia = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setErrorMsg("");

      const res = await api.get("/admin/promotion-media");
      const data = res.data;

      setMediaList(Array.isArray(data) ? data : []);
      return true;
    } catch (e) {
      setMediaList([]);
      setErrorMsg(e.response?.data?.message || e.message || "Gagal memuat media promosi.");
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setPlacement("hero_desktop");

    const fileInput = document.getElementById("promotion-media-file-input");
    if (fileInput) fileInput.value = "";
  };

  const getPlacementLabel = (value) => {
    if (value === "hero_desktop") return "Hero Desktop";
    if (value === "hero_mobile") return "Hero Mobile";
    if (value === "promo") return "Promo Banner";
    return "-";
  };

  const getActiveLabel = (value) => {
    if (value === "hero_desktop") return "Aktif: Hero Desktop";
    if (value === "hero_mobile") return "Aktif: Hero Mobile";
    if (value === "promo") return "Aktif: Promo Banner";
    return "Belum aktif";
  };

  const getImageUrl = (item) => {
    return item?.image_url || item?.full_image_url || null;
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMsg("");
      setErrorMsg("Pilih file gambar terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("placement", placement);
    if (title.trim()) formData.append("title", title.trim());

    try {
      setUploading(true);
      setMsg("");
      setErrorMsg("");

      const res = await api.post("/admin/promotion-media", formData);
      const data = res.data;

      const refreshed = await loadMedia({ silent: true });

      setMsg(
        refreshed
          ? data?.message || "Upload berhasil."
          : "Upload berhasil, tetapi daftar media gagal dimuat ulang."
      );

      resetForm();
    } catch (e) {
      setMsg("");
      const errData = e.response?.data;
      setErrorMsg(
        errData?.message ||
          errData?.errors?.image?.[0] ||
          errData?.errors?.placement?.[0] ||
          "Upload gagal."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id, type) => {
    try {
      setProcessingId(id);
      setMsg("");
      setErrorMsg("");

      const formData = new FormData();
      formData.append("type", type);

      const res = await api.post(`/admin/promotion-media/${id}/activate`, formData);
      const data = res.data;

      const refreshed = await loadMedia({ silent: true });

      setMsg(
        refreshed
          ? data?.message || "Media promosi berhasil diatur."
          : "Status aktif berhasil diubah, tetapi daftar media gagal dimuat ulang."
      );
    } catch (e) {
      setMsg("");
      const errData = e.response?.data;
      setErrorMsg(
        errData?.message ||
          errData?.errors?.type?.[0] ||
          "Gagal mengatur media aktif."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Yakin ingin menghapus media ini?");
    if (!confirmed) return;

    try {
      setProcessingId(id);
      setMsg("");
      setErrorMsg("");

      const res = await api.delete(`/admin/promotion-media/${id}`);
      const data = res.data;

      const refreshed = await loadMedia({ silent: true });

      setMsg(
        refreshed
          ? data?.message || "Media berhasil dihapus."
          : "Media berhasil dihapus, tetapi daftar media gagal dimuat ulang."
      );
    } catch (e) {
      setMsg("");
      const errData = e.response?.data;
      setErrorMsg(
        errData?.message || "Gagal menghapus media."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const cardBorder = (activeFor) =>
    activeFor ? "1px solid #0f766e" : "1px solid #e5e7eb";

  const statusBadgeStyle = (activeFor) => {
    if (activeFor === "hero_mobile") {
      return {
        background: "#ecfdf5",
        border: "1px solid #bbf7d0",
        color: "#166534",
      };
    }

    if (activeFor === "hero_desktop") {
      return {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1d4ed8",
      };
    }

    if (activeFor === "promo") {
      return {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
      };
    }

    return {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      color: "#64748b",
    };
  };

  const actionButtonStyle = {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
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
            Media Promosi Homepage
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Kelola gambar untuk slot hero desktop, hero mobile, dan promo banner di homepage.
          </p>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: 16,
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Upload Media Baru
          </h2>

          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: 12,
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            <div><strong>Hero Desktop</strong> = gambar utama homepage versi desktop.</div>
            <div><strong>Hero Mobile</strong> = gambar utama homepage versi mobile.</div>
            <div><strong>Promo Banner</strong> = banner promosi section bawah homepage.</div>
          </div>

          <form
            onSubmit={handleUpload}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.2fr 1.2fr auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                Slot homepage
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              >
                <option value="hero_desktop">Hero Desktop</option>
                <option value="hero_mobile">Hero Mobile</option>
                <option value="promo">Promo Banner</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                Nama / Judul
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Hero Desktop New Arrival"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                File gambar
              </label>
              <input
                id="promotion-media-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={!file || uploading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid #0f766e",
                  background: uploading ? "#14b8a6" : "#0f766e",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !file || uploading ? "default" : "pointer",
                  opacity: !file || uploading ? 0.75 : 1,
                }}
              >
                {uploading ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </form>

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Rekomendasi ukuran: Hero Desktop 1400x1200, Hero Mobile 1200x1600, Promo Banner 1400x600.
          </p>
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
              whiteSpace: "pre-wrap",
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
          <div
            style={{
              marginBottom: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Daftar Media
            </h2>

            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Total: <strong style={{ color: "#0f172a" }}>{mediaList.length}</strong> file
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20, fontSize: 13, color: "#6b7280" }}>
              Memuat media...
            </div>
          ) : mediaList.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: "#9ca3af" }}>
              Belum ada media promosi. Upload gambar terlebih dahulu.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {mediaList.map((item) => {
                const imageUrl = getImageUrl(item);
                const isBusy = processingId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 14,
                      border: cardBorder(item.active_for),
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
                        paddingTop: "60%",
                        background: "#e5e7eb",
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title || "Media promosi"}
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
                            textAlign: "center",
                            padding: 12,
                          }}
                        >
                          Gambar tidak tersedia
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0f172a",
                          width: "100%",
                        }}
                      >
                        {item.title || `Media #${item.id}`}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          width: "100%",
                        }}
                      >
                        Slot upload: <strong>{getPlacementLabel(item.placement)}</strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            color: "#6b7280",
                            fontSize: 10,
                          }}
                        >
                          ID: {item.id}
                        </span>

                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 999,
                            fontSize: 10,
                            ...statusBadgeStyle(item.active_for),
                          }}
                        >
                          {getActiveLabel(item.active_for)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 4,
                          width: "100%",
                        }}
                      >
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleActivate(item.id, "hero_mobile")}
                          style={{
                            ...actionButtonStyle,
                            border: "1px solid #0f766e",
                            background: "#ecfdf5",
                            color: "#166534",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          Hero Mobile
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleActivate(item.id, "hero_desktop")}
                          style={{
                            ...actionButtonStyle,
                            border: "1px solid #1d4ed8",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          Hero Desktop
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleActivate(item.id, "promo")}
                          style={{
                            ...actionButtonStyle,
                            border: "1px solid #b91c1c",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          Promo
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(item.id)}
                          style={{
                            ...actionButtonStyle,
                            border: "1px solid #dc2626",
                            background: "#fff",
                            color: "#dc2626",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          {isBusy ? "Proses..." : "Hapus"}
                        </button>
                      </div>
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

export default AdminPromotionMediaPage;