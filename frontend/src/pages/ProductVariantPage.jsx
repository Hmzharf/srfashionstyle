import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function ProductVariantPage() {
  const initialForm = {
    product_id: "",
    sku: "",
    color: "",
    size: "",
    price: "",
    is_active: true,
  };

  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
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

  const fetchVariants = async () => {
    try {
      const res = await api.get("/product-variants");
      setVariants(extractRows(res.data));
    } catch (err) {
      console.error("FETCH VARIANTS ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data varian");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(extractRows(res.data));
    } catch (err) {
      console.error("FETCH PRODUCTS ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data produk");
    }
  };

  const loadInitialData = async () => {
    setPageLoading(true);
    setMessage("");

    try {
      await Promise.all([fetchVariants(), fetchProducts()]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredVariants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return variants;

    return variants.filter((item) => {
      const values = [
        item.id,
        item.product?.name,
        item.sku,
        item.color,
        item.size,
        item.price,
        item.is_active ? "aktif" : "nonaktif",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [variants, search]);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      product_id: Number(form.product_id),
      sku: form.sku,
      color: form.color || null,
      size: form.size || null,
      price: Number(form.price),
      is_active: form.is_active,
    };

    try {
      if (editId) {
        await api.put(`/product-variants/${editId}`, payload);
        setMessage("Varian produk berhasil diupdate");
      } else {
        await api.post("/product-variants", payload);
        setMessage("Varian produk berhasil ditambahkan");
      }

      resetForm();
      await fetchVariants();
    } catch (err) {
      console.error("SAVE VARIANT ERROR:", err);

      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setMessage(err.response.data.message || "Validasi gagal");
      } else if (err.response?.status === 401) {
        setMessage("Session login tidak aktif. Silakan login ulang.");
      } else {
        setMessage(err.response?.data?.message || "Terjadi kesalahan saat menyimpan varian");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setMessage("");
    setErrors({});

    setForm({
      product_id: item.product_id || "",
      sku: item.sku || "",
      color: item.color || "",
      size: item.size || "",
      price: item.price || "",
      is_active: !!item.is_active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus varian ini?");
    if (!ok) return;

    try {
      await api.delete(`/product-variants/${id}`);
      setMessage("Varian produk berhasil dihapus");

      if (editId === id) {
        resetForm();
      }

      await fetchVariants();
    } catch (err) {
      console.error("DELETE VARIANT ERROR:", err);

      if (err.response?.status === 401) {
        setMessage("Session login tidak aktif. Silakan login ulang.");
      } else {
        setMessage(err.response?.data?.message || "Gagal menghapus varian");
      }
    }
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
        <h2 style={{ margin: 0, fontSize: 30 }}>Manajemen Varian Produk</h2>
        <p style={{ margin: "8px 0 0", color: "#666" }}>
          Kelola SKU, warna, ukuran, harga, dan status aktif setiap varian produk.
        </p>
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
              {editId ? "Edit Varian Produk" : "Tambah Varian Produk"}
            </h3>
            <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
              Isi data varian sesuai produk induknya.
            </p>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Produk</label>
              <select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">Pilih produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>{errors.product_id[0]}</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Contoh: DRS-BLK-M-001"
              />
              {errors.sku && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>{errors.sku[0]}</p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Warna</label>
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Contoh: Hitam"
                />
              </div>

              <div>
                <label style={labelStyle}>Ukuran</label>
                <input
                  type="text"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Contoh: M"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Harga</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                style={inputStyle}
                placeholder="0"
              />
              {errors.price && (
                <p style={{ color: "red", fontSize: 12, marginTop: 6 }}>{errors.price[0]}</p>
              )}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 600,
                color: "#444",
                padding: "12px 14px",
                border: "1px solid #e7e0d8",
                borderRadius: 12,
                background: "#faf8f4",
              }}
            >
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Varian aktif
            </label>

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
                {loading ? "Menyimpan..." : editId ? "Update Varian" : "Simpan Varian"}
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
              <h3 style={{ margin: 0, fontSize: 22 }}>Daftar Varian Produk</h3>
              <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
                Cari dan kelola seluruh varian yang sudah dibuat.
              </p>
            </div>

            <input
              type="text"
              placeholder="Cari SKU / produk / warna / ukuran"
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#f7f3ed" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Produk</th>
                    <th style={thStyle}>SKU</th>
                    <th style={thStyle}>Warna</th>
                    <th style={thStyle}>Ukuran</th>
                    <th style={thStyle}>Harga</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.length > 0 ? (
                    filteredVariants.map((item) => (
                      <tr key={item.id}>
                        <td style={tdStyle}>{item.id}</td>
                        <td style={tdStyle}>{item.product?.name || "-"}</td>
                        <td style={tdStyle}>{item.sku || "-"}</td>
                        <td style={tdStyle}>{item.color || "-"}</td>
                        <td style={tdStyle}>{item.size || "-"}</td>
                        <td style={tdStyle}>{formatPrice(item.price)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              background: item.is_active ? "#eef7f5" : "#f5f1ee",
                              color: item.is_active ? "#245c52" : "#7b6f66",
                              border: `1px solid ${item.is_active ? "#c8e3dc" : "#ddd4cc"}`,
                            }}
                          >
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleEdit(item)}
                              style={actionEditStyle}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={actionDeleteStyle}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ padding: 18, textAlign: "center", color: "#666" }}>
                        Belum ada varian produk.
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

export default ProductVariantPage;