import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function InventoryPage() {
  const initialForm = {
    product_variant_id: "",
    stock_on_hand: "",
    stock_reserved: "",
    min_stock_alert: "",
  };

  const [inventories, setInventories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const extractRows = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchInventories = async () => {
    try {
      const res = await api.get("/inventories");
      setInventories(extractRows(res.data));
    } catch (err) {
      console.error("FETCH INVENTORIES ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data inventory");
    }
  };

  const fetchVariants = async () => {
    try {
      const res = await api.get("/product-variants");
      setVariants(extractRows(res.data));
    } catch (err) {
      console.error("FETCH VARIANTS ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data varian produk");
    }
  };

  const loadInitialData = async () => {
    setPageLoading(true);
    setMessage("");

    try {
      await Promise.all([fetchInventories(), fetchVariants()]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredInventories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return inventories;

    return inventories.filter((item) => {
      const values = [
        item.id,
        item.variant?.product?.name,
        item.variant?.sku,
        item.variant?.color,
        item.variant?.size,
        item.stock_on_hand,
        item.stock_reserved,
        item.stock_available,
        item.min_stock_alert,
      ]
        .filter((v) => v !== null && v !== undefined)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [inventories, search]);

  const summary = useMemo(() => {
    const totalItems = inventories.length;
    const totalOnHand = inventories.reduce((sum, item) => sum + Number(item.stock_on_hand || 0), 0);
    const totalAvailable = inventories.reduce((sum, item) => sum + Number(item.stock_available || 0), 0);
    const lowStockCount = inventories.filter(
      (item) => Number(item.stock_available || 0) <= Number(item.min_stock_alert || 0)
    ).length;

    return {
      totalItems,
      totalOnHand,
      totalAvailable,
      lowStockCount,
    };
  }, [inventories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage("");
    setLoading(true);

    const payload = {
      product_variant_id: Number(form.product_variant_id),
      stock_on_hand: Number(form.stock_on_hand),
      stock_reserved: form.stock_reserved === "" ? 0 : Number(form.stock_reserved),
      min_stock_alert: form.min_stock_alert === "" ? 0 : Number(form.min_stock_alert),
    };

    try {
      if (editId) {
        await api.put(`/inventories/${editId}`, payload);
        setMessage("Inventory berhasil diupdate");
      } else {
        await api.post("/inventories", payload);
        setMessage("Inventory berhasil ditambahkan");
      }

      resetForm();
      await fetchInventories();
    } catch (err) {
      console.error("SAVE INVENTORY ERROR:", err);

      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setMessage(err.response.data.message || "Validasi gagal");
      } else if (err.response?.status === 401) {
        setMessage("Session login tidak aktif. Silakan login ulang.");
      } else if (err.response?.status === 403) {
        setMessage("Kamu tidak punya akses untuk mengubah inventory.");
      } else {
        setMessage(err.response?.data?.message || "Terjadi kesalahan saat menyimpan inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setErrors({});
    setMessage("");

    setForm({
      product_variant_id: item.product_variant_id || "",
      stock_on_hand: item.stock_on_hand ?? "",
      stock_reserved: item.stock_reserved ?? "",
      min_stock_alert: item.min_stock_alert ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus inventory ini?");
    if (!ok) return;

    try {
      await api.delete(`/inventories/${id}`);
      setMessage("Inventory berhasil dihapus");

      if (editId === id) {
        resetForm();
      }

      await fetchInventories();
    } catch (err) {
      console.error("DELETE INVENTORY ERROR:", err);

      if (err.response?.status === 401) {
        setMessage("Session login tidak aktif. Silakan login ulang.");
      } else if (err.response?.status === 403) {
        setMessage("Kamu tidak punya akses untuk menghapus inventory.");
      } else {
        setMessage(err.response?.data?.message || "Gagal menghapus inventory");
      }
    }
  };

  const findVariantLabel = (variant) => {
    if (!variant) return "-";
    const productName = variant.product?.name || "";
    const color = variant.color || "";
    const size = variant.size || "";
    const sku = variant.sku || "";
    const parts = [productName, color, size].filter(Boolean).join(" / ");
    return `${parts || "-"} (SKU: ${sku || "-"})`;
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e4ddd4",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 10px 26px rgba(0,0,0,0.04)",
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d8d2ca",
    boxSizing: "border-box",
    fontSize: 14,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#4d4d4d",
  };

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "32px auto",
        padding: "0 16px",
        fontFamily: "Inter, sans-serif",
        color: "#222",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <p style={{ margin: "0 0 6px", color: "#0f766e", fontWeight: 700, fontSize: 13 }}>
          Admin Panel
        </p>
        <h2 style={{ margin: 0, fontSize: 30 }}>Manajemen Inventory</h2>
        <p style={{ margin: "8px 0 0", color: "#666" }}>
          Kelola stok fisik, stok reserved, stok tersedia, dan batas minimum alert.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Varian Inventory</div>
          <div style={summaryValueStyle}>{summary.totalItems}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Stock On Hand</div>
          <div style={summaryValueStyle}>{summary.totalOnHand}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Total Stock Available</div>
          <div style={summaryValueStyle}>{summary.totalAvailable}</div>
        </div>
        <div style={{ ...summaryCardStyle, background: "#fff8e6", border: "1px solid #f0d080" }}>
          <div style={summaryLabelStyle}>Low Stock Alert</div>
          <div style={{ ...summaryValueStyle, color: "#92640a" }}>{summary.lowStockCount}</div>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px 16px",
            borderRadius: 12,
            background: Object.keys(errors).length ? "#fff3f0" : "#eef7f5",
            border: `1px solid ${Object.keys(errors).length ? "#f0c8c2" : "#c8e3dc"}`,
            color: Object.keys(errors).length ? "#9f2d20" : "#245c52",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 22 }}>
        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 22 }}>
              {editId ? "Edit Inventory" : "Tambah Inventory"}
            </h3>
            <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
              Satu varian produk hanya boleh memiliki satu data inventory.
            </p>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Varian Produk (SKU)</label>
              <select
                name="product_variant_id"
                value={form.product_variant_id}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Pilih varian produk</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product?.name || "-"} - {v.color || "-"} / {v.size || "-"} (SKU: {v.sku || "-"})
                  </option>
                ))}
              </select>
              {errors.product_variant_id && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>
                  {errors.product_variant_id[0]}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Stock On Hand</label>
              <input
                type="number"
                name="stock_on_hand"
                value={form.stock_on_hand}
                onChange={handleChange}
                style={inputStyle}
                placeholder="0"
              />
              {errors.stock_on_hand && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>
                  {errors.stock_on_hand[0]}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Stock Reserved</label>
              <input
                type="number"
                name="stock_reserved"
                value={form.stock_reserved}
                onChange={handleChange}
                style={inputStyle}
                placeholder="0"
              />
              {errors.stock_reserved && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>
                  {errors.stock_reserved[0]}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Minimum Stock Alert</label>
              <input
                type="number"
                name="min_stock_alert"
                value={form.min_stock_alert}
                onChange={handleChange}
                style={inputStyle}
                placeholder="0"
              />
              {errors.min_stock_alert && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>
                  {errors.min_stock_alert[0]}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: 12,
                  background: loading ? "#aaa" : "#0f766e",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Menyimpan..." : editId ? "Update Inventory" : "Simpan Inventory"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    border: "1px solid #d8d2ca",
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </form>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 22 }}>Daftar Inventory</h3>
              <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
                Monitoring stok seluruh varian produk.
              </p>
            </div>

            <input
              type="text"
              placeholder="Cari produk / SKU / warna / ukuran"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 280,
                maxWidth: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #d8d2ca",
              }}
            />
          </div>

          {pageLoading ? (
            <div style={{ color: "#666" }}>Memuat data...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr style={{ background: "#f7f3ed" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Varian</th>
                    <th style={thStyle}>On Hand</th>
                    <th style={thStyle}>Reserved</th>
                    <th style={thStyle}>Available</th>
                    <th style={thStyle}>Min Alert</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventories.length > 0 ? (
                    filteredInventories.map((item) => {
                      const isLowStock =
                        Number(item.stock_available) <= Number(item.min_stock_alert);

                      return (
                        <tr key={item.id}>
                          <td style={tdStyle}>{item.id}</td>
                          <td style={tdStyle}>{findVariantLabel(item.variant)}</td>
                          <td style={tdStyle}>{item.stock_on_hand}</td>
                          <td style={tdStyle}>{item.stock_reserved}</td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                background: isLowStock ? "#fff3f0" : "#eef7f5",
                                color: isLowStock ? "#9f2d20" : "#245c52",
                                border: `1px solid ${isLowStock ? "#f0c8c2" : "#c8e3dc"}`,
                              }}
                            >
                              {item.stock_available}
                            </span>
                          </td>
                          <td style={tdStyle}>{item.min_stock_alert}</td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleEdit(item)} style={actionEditStyle}>
                                Edit
                              </button>
                              <button onClick={() => handleDelete(item.id)} style={actionDeleteStyle}>
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: 18, textAlign: "center", color: "#666" }}>
                        Belum ada data inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const summaryCardStyle = {
  background: "#fff",
  border: "1px solid #e4ddd4",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 8px 20px rgba(0,0,0,0.03)",
};

const summaryLabelStyle = {
  fontSize: 13,
  color: "#666",
  marginBottom: 8,
  fontWeight: 700,
};

const summaryValueStyle = {
  fontSize: 28,
  fontWeight: 800,
  color: "#222",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1px solid #e5ddd3",
  fontSize: 13,
};

const tdStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #eee6dc",
  fontSize: 14,
  verticalAlign: "top",
};

const actionEditStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #d8d2ca",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const actionDeleteStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #f0c8c2",
  background: "#fff3f0",
  color: "#9f2d20",
  cursor: "pointer",
  fontWeight: 600,
};

export default InventoryPage;