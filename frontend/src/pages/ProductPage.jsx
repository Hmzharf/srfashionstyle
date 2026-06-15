import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [activeTab, setActiveTab] = useState("product");
  const [currentProductId, setCurrentProductId] = useState(null);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const [productForm, setProductForm] = useState({
    id: null,
    category_id: "",
    name: "",
    description: "",
    base_price: "",
    is_active: true,
  });

  const [productImages, setProductImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);

  const variantInitialForm = {
    product_id: "",
    sku: "",
    color: "",
    size: "",
    price: "",
    is_active: true,
  };

  const inventoryInitialForm = {
    product_variant_id: "",
    stock_on_hand: "",
    stock_reserved: "",
    min_stock_alert: "",
  };

  const [variantForm, setVariantForm] = useState(variantInitialForm);
  const [variantErrors, setVariantErrors] = useState({});
  const [variantMessage, setVariantMessage] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantPageLoading, setVariantPageLoading] = useState(false);
  const [variantEditId, setVariantEditId] = useState(null);
  const [variantSearch, setVariantSearch] = useState("");

  const [inventoryForm, setInventoryForm] = useState(inventoryInitialForm);
  const [inventoryErrors, setInventoryErrors] = useState({});
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryPageLoading, setInventoryPageLoading] = useState(false);
  const [inventoryEditId, setInventoryEditId] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState("");

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

  const extractRows = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const getVariantName = (variant, productName) => {
    const attrs = [variant?.color, variant?.size].filter(Boolean).join(" / ");
    return attrs ? `${productName} - ${attrs}` : productName;
  };

  const getInventoryByVariantId = (variantId) => {
    return inventories.find(
      (item) => Number(item.product_variant_id) === Number(variantId)
    );
  };

  const productVariantRows = useMemo(() => {
    const rows = [];

    products.forEach((product) => {
      const productVariants = variants.filter(
        (variant) => Number(variant.product_id) === Number(product.id)
      );

      if (productVariants.length === 0) {
        rows.push({
          rowId: `product-${product.id}`,
          product,
          variant: null,
          inventory: null,
          sku: "-",
          photo: product.featured_image || "",
          name: product.name || "-",
          stock: 0,
          price: product.base_price || 0,
          categoryName: product.category?.name || "-",
          isActive: Boolean(product.is_active),
        });
      } else {
        productVariants.forEach((variant) => {
          const inventory = getInventoryByVariantId(variant.id);
          rows.push({
            rowId: `variant-${variant.id}`,
            product,
            variant,
            inventory,
            sku: variant.sku || "-",
            photo: product.featured_image || "",
            name: getVariantName(variant, product.name || "-"),
            stock: Number(
              inventory?.stock_available ?? inventory?.stock_on_hand ?? 0
            ),
            price: variant.price || product.base_price || 0,
            categoryName: product.category?.name || "-",
            isActive: Boolean(variant.is_active),
          });
        });
      }
    });

    return rows;
  }, [products, variants, inventories]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = productVariantRows.filter((row) => {
      const passCategory = filterCategory
        ? String(row.product?.category_id) === String(filterCategory)
        : true;

      const searchTarget = [
        row.sku,
        row.name,
        row.categoryName,
        row.product?.name,
        row.variant?.color,
        row.variant?.size,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const passSearch = keyword ? searchTarget.includes(keyword) : true;
      return passCategory && passSearch;
    });

    return result;
  }, [productVariantRows, search, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage]);

  const pageInfo = useMemo(() => {
    const total = filteredRows.length;
    const from = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, total);
    return { from, to, total };
  }, [filteredRows, currentPage]);

  const currentVariants = useMemo(() => {
    if (!currentProductId) return [];
    return variants.filter(
      (item) => Number(item.product_id) === Number(currentProductId)
    );
  }, [variants, currentProductId]);

  const currentInventories = useMemo(() => {
    if (!currentProductId) return [];
    return inventories.filter(
      (item) =>
        Number(item.variant?.product_id || item.variant?.product?.id) ===
        Number(currentProductId)
    );
  }, [inventories, currentProductId]);

  const inventorySummary = useMemo(() => {
    const totalItems = currentInventories.length;
    const totalOnHand = currentInventories.reduce(
      (sum, item) => sum + Number(item.stock_on_hand || 0),
      0
    );
    const totalAvailable = currentInventories.reduce(
      (sum, item) => sum + Number(item.stock_available || 0),
      0
    );
    const lowStockCount = currentInventories.filter(
      (item) =>
        Number(item.stock_available || 0) <= Number(item.min_stock_alert || 0)
    ).length;

    return { totalItems, totalOnHand, totalAvailable, lowStockCount };
  }, [currentInventories]);

  const filteredVariants = useMemo(() => {
    const keyword = variantSearch.trim().toLowerCase();
    if (!keyword) return currentVariants;

    return currentVariants.filter((item) => {
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
  }, [currentVariants, variantSearch]);

  const filteredInventories = useMemo(() => {
    const keyword = inventorySearch.trim().toLowerCase();
    if (!keyword) return currentInventories;

    return currentInventories.filter((item) => {
      const v = item.variant;
      const values = [
        item.id,
        v?.product?.name,
        v?.sku,
        v?.color,
        v?.size,
        item.stock_on_hand,
        item.stock_reserved,
        item.stock_available,
        item.min_stock_alert,
      ]
        .filter((val) => val !== null && val !== undefined)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [currentInventories, inventorySearch]);

  useEffect(() => {
    fetchAllMasterData();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory]);

  const fetchAllMasterData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [productsRes, categoriesRes, variantsRes, inventoriesRes] =
        await Promise.all([
          api.get("/products"),
          api.get("/categories"),
          api.get("/product-variants"),
          api.get("/inventories"),
        ]);

      setProducts(
        Array.isArray(productsRes.data)
          ? productsRes.data
          : productsRes.data?.data || []
      );
      setCategories(
        Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.data || []
      );
      setVariants(extractRows(variantsRes.data));
      setInventories(extractRows(inventoriesRes.data));
    } catch (err) {
      console.error("FETCH ALL ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("FETCH PRODUCTS ERROR:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("FETCH CATEGORIES ERROR:", err);
    }
  };

  const fetchVariants = async () => {
    try {
      const res = await api.get("/product-variants");
      setVariants(extractRows(res.data));
    } catch (err) {
      console.error("FETCH VARIANTS ERROR:", err);
    }
  };

  const fetchInventories = async () => {
    try {
      const res = await api.get("/inventories");
      setInventories(extractRows(res.data));
    } catch (err) {
      console.error("FETCH INVENTORIES ERROR:", err);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchVariants(),
      fetchInventories(),
    ]);
  };

  const resetProductForm = () => {
    setProductForm({
      id: null,
      category_id: "",
      name: "",
      description: "",
      base_price: "",
      is_active: true,
    });
    setProductImages([]);
    setExistingImages([]);
    setDeleteImageIds([]);
  };

  const resetVariantForm = () => {
    setVariantForm(variantInitialForm);
    setVariantEditId(null);
    setVariantErrors({});
  };

  const resetInventoryForm = () => {
    setInventoryForm(inventoryInitialForm);
    setInventoryEditId(null);
    setInventoryErrors({});
  };

  const openCreateModal = () => {
    setFormMode("create");
    resetProductForm();
    resetVariantForm();
    resetInventoryForm();
    setCurrentProductId(null);
    setActiveTab("product");
    setVariantMessage("");
    setInventoryMessage("");
    setCategoryMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormMode("edit");
    setCurrentProductId(product.id);
    setProductForm({
      id: product.id,
      category_id: product.category_id || "",
      name: product.name || "",
      description: product.description || "",
      base_price: product.base_price || "",
      is_active: Boolean(product.is_active),
    });
    setExistingImages(product.images || []);
    setDeleteImageIds([]);
    setProductImages([]);
    resetVariantForm();
    resetInventoryForm();
    setVariantMessage("");
    setInventoryMessage("");
    setCategoryMessage("");
    setActiveTab("product");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab("product");
    setCurrentProductId(null);
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("category_id", productForm.category_id);
      formData.append("name", productForm.name);
      formData.append("description", productForm.description || "");
      formData.append("base_price", productForm.base_price || 0);
      formData.append("is_active", productForm.is_active ? 1 : 0);

      productImages.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });

      deleteImageIds.forEach((id, index) => {
        formData.append(`delete_image_ids[${index}]`, id);
      });

      if (formMode === "edit" && productForm.id) {
        formData.append("_method", "PUT");

        await api.post(`/products/${productForm.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMessage("Produk berhasil diupdate.");
        setCurrentProductId(productForm.id);
      } else {
        const res = await api.post("/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const created = res.data?.data || res.data;
        setMessage("Produk berhasil ditambahkan.");

        if (created?.id) {
          setCurrentProductId(created.id);
          setProductForm((prev) => ({ ...prev, id: created.id }));
          setFormMode("edit");
        }
      }

      setProductImages([]);
      setDeleteImageIds([]);
      await refreshAllData();
    } catch (err) {
      console.error("SAVE PRODUCT ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal menyimpan produk.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Yakin ingin menghapus produk ini?");
    if (!confirmed) return;

    try {
      await api.delete(`/products/${id}`);
      setMessage("Produk berhasil dihapus.");
      await refreshAllData();
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal menghapus produk.");
    }
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();

    if (!currentProductId) {
      setVariantMessage("Simpan produk dulu sebelum menambah varian.");
      return;
    }

    setVariantErrors({});
    setVariantMessage("");
    setVariantLoading(true);

    const payload = {
      product_id: Number(currentProductId),
      sku: variantForm.sku,
      color: variantForm.color || null,
      size: variantForm.size || null,
      price: Number(variantForm.price || 0),
      is_active: variantForm.is_active,
    };

    try {
      if (variantEditId) {
        await api.put(`/product-variants/${variantEditId}`, payload);
        setVariantMessage("Varian produk berhasil diupdate");
      } else {
        await api.post("/product-variants", payload);
        setVariantMessage("Varian produk berhasil ditambahkan");
        resetVariantForm();
      }

      await refreshAllData();
    } catch (err) {
      console.error("SAVE VARIANT ERROR", err.response?.data || err);
      if (err.response?.status === 422) {
        setVariantErrors(err.response.data.errors || {});
        setVariantMessage(err.response.data.message || "Validasi gagal");
      } else {
        setVariantMessage(
          err.response?.data?.message ||
            "Terjadi kesalahan saat menyimpan varian"
        );
      }
    } finally {
      setVariantLoading(false);
    }
  };

  const handleVariantEdit = (item) => {
    setVariantEditId(item.id);
    setVariantMessage("");
    setVariantErrors({});
    setVariantForm({
      product_id: item.product_id ?? currentProductId,
      sku: item.sku ?? "",
      color: item.color ?? "",
      size: item.size ?? "",
      price: item.price ?? "",
      is_active: !!item.is_active,
    });
  };

  const handleVariantDelete = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus varian ini?");
    if (!ok) return;

    try {
      await api.delete(`/product-variants/${id}`);
      setVariantMessage("Varian produk berhasil dihapus");
      if (variantEditId === id) resetVariantForm();
      await refreshAllData();
    } catch (err) {
      console.error("DELETE VARIANT ERROR:", err);
      setVariantMessage(err.response?.data?.message || "Gagal menghapus varian");
    }
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();

    if (!currentProductId) {
      setInventoryMessage("Simpan produk dulu sebelum menambah inventory.");
      return;
    }

    setInventoryErrors({});
    setInventoryMessage("");
    setInventoryLoading(true);

    const payload = {
      product_variant_id: Number(inventoryForm.product_variant_id),
      stock_on_hand: Number(inventoryForm.stock_on_hand || 0),
      stock_reserved:
        inventoryForm.stock_reserved === ""
          ? 0
          : Number(inventoryForm.stock_reserved),
      min_stock_alert:
        inventoryForm.min_stock_alert === ""
          ? 0
          : Number(inventoryForm.min_stock_alert),
    };

    try {
      if (inventoryEditId) {
        await api.put(`/inventories/${inventoryEditId}`, payload);
        setInventoryMessage("Inventory berhasil diupdate");
      } else {
        await api.post("/inventories", payload);
        setInventoryMessage("Inventory berhasil ditambahkan");
      }

      resetInventoryForm();
      await refreshAllData();
    } catch (err) {
      console.error("SAVE INVENTORY ERROR", err.response?.data || err);
      if (err.response?.status === 422) {
        setInventoryErrors(err.response.data.errors || {});
        setInventoryMessage(err.response.data.message || "Validasi gagal");
      } else {
        setInventoryMessage(
          err.response?.data?.message ||
            "Terjadi kesalahan saat menyimpan inventory"
        );
      }
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleInventoryEdit = (item) => {
    setInventoryEditId(item.id);
    setInventoryErrors({});
    setInventoryMessage("");
    setInventoryForm({
      product_variant_id: item.product_variant_id ?? "",
      stock_on_hand: item.stock_on_hand ?? "",
      stock_reserved: item.stock_reserved ?? "",
      min_stock_alert: item.min_stock_alert ?? "",
    });
  };

  const handleInventoryDelete = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus inventory ini?");
    if (!ok) return;

    try {
      await api.delete(`/inventories/${id}`);
      setInventoryMessage("Inventory berhasil dihapus");
      if (inventoryEditId === id) {
        resetInventoryForm();
      }
      await refreshAllData();
    } catch (err) {
      console.error("DELETE INVENTORY ERROR", err.response?.data || err);
      setInventoryMessage(
        err.response?.data?.message || "Gagal menghapus inventory"
      );
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setCategoryLoading(true);
    setCategoryMessage("");
    try {
      await api.post("/categories", {
        name: categoryName.trim(),
        is_active: true,
      });
      setCategoryName("");
      setCategoryMessage("Kategori berhasil ditambahkan");
      await refreshAllData();
    } catch (err) {
      console.error("Gagal tambah kategori", err.response?.data || err.message);
      setCategoryMessage(
        err.response?.data?.message || "Gagal menambahkan kategori"
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: isMobile ? 16 : 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  };

  const softCardStyle = {
    background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
    border: "1px solid #e5e7eb",
    borderRadius: isMobile ? 14 : 18,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
  };

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    padding: "11px 13px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
  };

  const tabButtonStyle = (tab) => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: activeTab === tab ? "1px solid #2563eb" : "1px solid #e5e7eb",
    background: activeTab === tab ? "#eff6ff" : "#ffffff",
    color: activeTab === tab ? "#2563eb" : "#475569",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flex: isMobile ? "0 0 auto" : "unset",
    boxShadow:
      activeTab === tab ? "0 8px 20px rgba(37, 99, 235, 0.12)" : "none",
  });

  const statusPill = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: active ? "#ecfdf5" : "#fef2f2",
    color: active ? "#15803d" : "#b91c1c",
    border: `1px solid ${active ? "#bbf7d0" : "#fecaca"}`,
  });

  const renderField = (label, child) => (
    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {child}
    </div>
  );

  const renderNotice = (text, tone = "neutral") => {
    if (!text) return null;
    const styles = {
      neutral: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#334155",
      },
      success: {
        background: "#ecfdf5",
        border: "1px solid #bbf7d0",
        color: "#166534",
      },
      error: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
      },
    };
    return (
      <div
        style={{
          ...styles[tone],
          padding: "12px 14px",
          borderRadius: 12,
          fontSize: 13,
        }}
      >
        {text}
      </div>
    );
  };

  const renderTableWrap = (children) => (
    <div
      style={{
        overflowX: "auto",
        width: "100%",
        maxWidth: "100%",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#fff",
      }}
    >
      {children}
    </div>
  );

  const renderPagination = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 14,
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Menampilkan {pageInfo.from}-{pageInfo.to} dari {pageInfo.total} data
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              ...ghostButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            Sebelumnya
          </button>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: 13,
              fontWeight: 700,
              color: "#334155",
            }}
          >
            {currentPage}/{totalPages}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...ghostButtonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Berikutnya
          </button>
        </div>
      </div>
    );
  };

  const renderProductTab = () => (
    <form onSubmit={handleProductFormSubmit} style={{ display: "grid", gap: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14,
        }}
      >
        {renderField(
          "Kategori",
          <select
            name="category_id"
            value={productForm.category_id}
            onChange={handleProductFormChange}
            required
            style={inputStyle}
          >
            <option value="">Pilih Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}

        {renderField(
          "Harga dasar",
          <input
            type="number"
            name="base_price"
            value={productForm.base_price}
            onChange={handleProductFormChange}
            required
            style={inputStyle}
            placeholder="0"
          />
        )}
      </div>

      {renderField(
        "Nama produk",
        <input
          type="text"
          name="name"
          value={productForm.name}
          onChange={handleProductFormChange}
          required
          style={inputStyle}
          placeholder="Masukkan nama produk"
        />
      )}

      {renderField(
        "Deskripsi",
        <textarea
          name="description"
          value={productForm.description}
          onChange={handleProductFormChange}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder="Deskripsi singkat produk"
        />
      )}

      {renderField(
        "Foto produk",
        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setProductImages(Array.from(e.target.files || []))}
            style={inputStyle}
          />

          <div style={{ fontSize: 12, color: "#64748b" }}>
            Bisa upload JPG, JPEG, PNG, WEBP, GIF, dan bisa lebih dari satu file.
          </div>

          {existingImages.filter((img) => !deleteImageIds.includes(img.id)).length >
            0 && (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Foto tersimpan
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {existingImages
                  .filter((img) => !deleteImageIds.includes(img.id))
                  .map((img) => (
                    <div
                      key={img.id}
                      style={{
                        width: 88,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 12,
                          overflow: "hidden",
                          border: "1px solid #e5e7eb",
                          background: "#f8fafc",
                        }}
                      >
                        <img
                          src={img.image_url}
                          alt={img.file_name || "Product"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteImageIds((prev) =>
                            prev.includes(img.id)
                              ? prev.filter((id) => id !== img.id)
                              : [...prev, img.id]
                          )
                        }
                        style={{
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {productImages.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Preview upload baru
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {productImages.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      width: 88,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        wordBreak: "break-word",
                      }}
                    >
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
          fontSize: 13,
          color: "#334155",
          width: "fit-content",
        }}
      >
        <input
          type="checkbox"
          name="is_active"
          checked={productForm.is_active}
          onChange={handleProductFormChange}
        />
        Produk aktif
      </label>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={closeModal} style={ghostButtonStyle}>
          Tutup
        </button>
        <button type="submit" style={primaryButtonStyle}>
          {formMode === "edit" ? "Simpan Perubahan" : "Simpan Produk"}
        </button>
      </div>
    </form>
  );

  const renderVariantTab = () => (
    <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
      {!currentProductId &&
        renderNotice(
          "Simpan data produk dulu supaya varian bisa ditambahkan.",
          "neutral"
        )}

      {variantMessage &&
        renderNotice(
          variantMessage,
          Object.keys(variantErrors).length ? "error" : "success"
        )}

      <div style={{ ...softCardStyle, padding: isMobile ? 14 : 18 }}>
        <form onSubmit={handleVariantSubmit} style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "1fr 1fr"
                : "1.2fr 1fr 1fr",
              gap: 12,
            }}
          >
            {renderField(
              "SKU",
              <input
                type="text"
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                style={inputStyle}
                placeholder="Contoh: DRS-BLK-M-001"
              />
            )}

            {renderField(
              "Warna",
              <input
                type="text"
                value={variantForm.color}
                onChange={(e) =>
                  setVariantForm((prev) => ({ ...prev, color: e.target.value }))
                }
                style={inputStyle}
                placeholder="Hitam"
              />
            )}

            {renderField(
              "Ukuran",
              <input
                type="text"
                value={variantForm.size}
                onChange={(e) =>
                  setVariantForm((prev) => ({ ...prev, size: e.target.value }))
                }
                style={inputStyle}
                placeholder="M"
              />
            )}
          </div>

          {renderField(
            "Harga varian",
            <input
              type="number"
              value={variantForm.price}
              onChange={(e) =>
                setVariantForm((prev) => ({ ...prev, price: e.target.value }))
              }
              style={inputStyle}
              placeholder="0"
            />
          )}

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontSize: 13,
              color: "#334155",
              width: "fit-content",
            }}
          >
            <input
              type="checkbox"
              checked={variantForm.is_active}
              onChange={(e) =>
                setVariantForm((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
            />
            Varian aktif
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Cari SKU / warna / ukuran"
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: isMobile ? "100%" : 280 }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {variantEditId && (
                <button type="button" onClick={resetVariantForm} style={ghostButtonStyle}>
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={variantLoading}
                style={{
                  ...secondaryButtonStyle,
                  background: variantLoading ? "#94a3b8" : "#0f766e",
                }}
              >
                {variantLoading
                  ? "Menyimpan..."
                  : variantEditId
                  ? "Update Varian"
                  : "Simpan Varian"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {renderTableWrap(
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {["ID", "SKU", "Warna", "Ukuran", "Harga", "Status", "Aksi"].map(
                (head) => (
                  <th key={head} style={headCellStyle}>
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {variantPageLoading ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  Memuat varian...
                </td>
              </tr>
            ) : filteredVariants.length === 0 ? (
              <tr>
                <td colSpan={7} style={emptyCellStyle}>
                  Belum ada varian untuk produk ini.
                </td>
              </tr>
            ) : (
              filteredVariants.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>{item.sku || "-"}</td>
                  <td style={cellStyle}>{item.color || "-"}</td>
                  <td style={cellStyle}>{item.size || "-"}</td>
                  <td style={cellStyle}>{formatPrice(item.price)}</td>
                  <td style={cellStyle}>
                    <span style={statusPill(item.is_active)}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleVariantEdit(item)}
                        style={editBtnStyle}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVariantDelete(item.id)}
                        style={deleteBtnStyle}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
      {!currentProductId &&
        renderNotice(
          "Simpan data produk dulu supaya inventory bisa ditambahkan.",
          "neutral"
        )}

      {inventoryMessage &&
        renderNotice(
          inventoryMessage,
          Object.keys(inventoryErrors).length ? "error" : "success"
        )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : isTablet
            ? "repeat(2, minmax(0, 1fr)) repeat(4, minmax(0, 1fr))"
            : "repeat(6, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {[
          ["Total Inventory", inventorySummary.totalItems],
          ["Stock On Hand", inventorySummary.totalOnHand],
          ["Stock Available", inventorySummary.totalAvailable],
          ["Low Stock", inventorySummary.lowStockCount],
        ].map(([label, value], idx) => (
          <div
            key={label}
            style={{
              ...cardStyle,
              padding: 14,
              background: idx === 3 ? "#fff7ed" : "#fff",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
              {label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: idx === 3 ? "#9a3412" : "#0f172a",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...softCardStyle, padding: isMobile ? 14 : 18 }}>
        <form onSubmit={handleInventorySubmit} style={{ display: "grid", gap: 14 }}>
          {renderField(
            "Varian produk",
            <select
              value={inventoryForm.product_variant_id}
              onChange={(e) =>
                setInventoryForm((prev) => ({
                  ...prev,
                  product_variant_id: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="">Pilih varian produk</option>
              {currentVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.product?.name || "-"} - {v.color || "-"} {v.size || "-"} - SKU{" "}
                  {v.sku || "-"}
                </option>
              ))}
            </select>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "1fr 1fr 1fr"
                : "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {renderField(
              "Stock On Hand",
              <input
                type="number"
                value={inventoryForm.stock_on_hand}
                onChange={(e) =>
                  setInventoryForm((prev) => ({
                    ...prev,
                    stock_on_hand: e.target.value,
                  }))
                }
                style={inputStyle}
                placeholder="0"
              />
            )}

            {renderField(
              "Stock Reserved",
              <input
                type="number"
                value={inventoryForm.stock_reserved}
                onChange={(e) =>
                  setInventoryForm((prev) => ({
                    ...prev,
                    stock_reserved: e.target.value,
                  }))
                }
                style={inputStyle}
                placeholder="0"
              />
            )}

            {renderField(
              "Min Stock Alert",
              <input
                type="number"
                value={inventoryForm.min_stock_alert}
                onChange={(e) =>
                  setInventoryForm((prev) => ({
                    ...prev,
                    min_stock_alert: e.target.value,
                  }))
                }
                style={inputStyle}
                placeholder="0"
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Cari produk / SKU / warna / ukuran"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: isMobile ? "100%" : 280 }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {inventoryEditId && (
                <button
                  type="button"
                  onClick={resetInventoryForm}
                  style={ghostButtonStyle}
                >
                  Batal
                </button>
              )}

              <button
                type="submit"
                disabled={inventoryLoading}
                style={{
                  ...primaryButtonStyle,
                  background: inventoryLoading ? "#94a3b8" : "#2563eb",
                }}
              >
                {inventoryLoading
                  ? "Menyimpan..."
                  : inventoryEditId
                  ? "Update Inventory"
                  : "Simpan Inventory"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div>
        {renderTableWrap(
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 860,
            }}
          >
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["ID", "Varian", "On Hand", "Reserved", "Available", "Min Alert", "Aksi"].map(
                  (head) => (
                    <th key={head} style={headCellStyle}>
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {inventoryPageLoading ? (
                <tr>
                  <td colSpan={7} style={emptyCellStyle}>
                    Memuat data inventory...
                  </td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyCellStyle}>
                    Belum ada data inventory untuk produk ini.
                  </td>
                </tr>
              ) : (
                filteredInventories.map((item) => {
                  const isLowStock =
                    Number(item.stock_available) <= Number(item.min_stock_alert);

                  return (
                    <tr key={item.id}>
                      <td style={cellStyle}>{item.id}</td>
                      <td style={cellStyle}>
                        {item.variant?.product?.name || "-"} -{" "}
                        {item.variant?.color || "-"} {item.variant?.size || "-"} - SKU{" "}
                        {item.variant?.sku || "-"}
                      </td>
                      <td style={cellStyle}>{item.stock_on_hand}</td>
                      <td style={cellStyle}>{item.stock_reserved}</td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            ...statusPill(!isLowStock),
                            background: isLowStock ? "#fff7ed" : "#ecfdf5",
                            color: isLowStock ? "#c2410c" : "#15803d",
                            border: `1px solid ${isLowStock ? "#fdba74" : "#bbf7d0"}`,
                          }}
                        >
                          {item.stock_available}
                        </span>
                      </td>
                      <td style={cellStyle}>{item.min_stock_alert}</td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleInventoryEdit(item)}
                            style={editBtnStyle}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInventoryDelete(item.id)}
                            style={deleteBtnStyle}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCategoryTab = () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 620, minWidth: 0 }}>
      {categoryMessage && renderNotice(categoryMessage, "success")}

      <div style={{ ...softCardStyle, padding: isMobile ? 14 : 18 }}>
        <form onSubmit={handleCategorySubmit} style={{ display: "grid", gap: 14 }}>
          {renderField(
            "Nama kategori baru",
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              style={inputStyle}
              placeholder="Contoh: Dress, Hijab, Outer"
            />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Kategori yang ditambahkan di sini langsung muncul di dropdown tab Produk.
            </div>

            <button type="submit" disabled={categoryLoading} style={secondaryButtonStyle}>
              {categoryLoading ? "Menyimpan..." : "Tambah Kategori"}
            </button>
          </div>
        </form>
      </div>

      {renderTableWrap(
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {["ID", "Nama", "Slug", "Status"].map((head) => (
                <th key={head} style={headCellStyle}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.id}>
                <td style={cellStyle}>{item.id}</td>
                <td style={cellStyle}>{item.name}</td>
                <td style={cellStyle}>{item.slug || "-"}</td>
                <td style={cellStyle}>
                  <span style={statusPill(item.is_active)}>
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderActiveTabContent = () => {
    if (activeTab === "product") return renderProductTab();
    if (activeTab === "variant") return renderVariantTab();
    if (activeTab === "inventory") return renderInventoryTab();
    if (activeTab === "category") return renderCategoryTab();
    return null;
  };

  return (
    <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
      <div
        style={{
          ...cardStyle,
          padding: isMobile ? 16 : 22,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 24 : 30,
                textAlign: "left",
                color: "#0f172a",
              }}
            >
              Manajemen Produk
            </h1>
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
              Daftar produk menampilkan semua varian agar SKU dan stok langsung terlihat.
            </p>
          </div>

          <button type="button" onClick={openCreateModal} style={primaryButtonStyle}>
            + Tambah Produk
          </button>
        </div>
      </div>

      {message && renderNotice(message, "success")}

      <section style={{ ...cardStyle, padding: isMobile ? 14 : 20, minWidth: 0 }}>
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
            <h2 style={{ margin: 0, fontSize: 20, textAlign: "left", color: "#0f172a" }}>
              Daftar Produk
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                textAlign: "left",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Isi tabel: SKU, foto, nama produk/varian, stock, harga, kategori. Jika satu
              produk punya banyak varian, semua varian akan tampil.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ ...inputStyle, width: isMobile ? "100%" : 180 }}
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Cari SKU / nama / kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: isMobile ? "100%" : 240 }}
            />
          </div>
        </div>

        {renderTableWrap(
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {["SKU", "Foto", "Nama", "Stock", "Harga", "Kategori", "Status", "Aksi"].map(
                  (head) => (
                    <th key={head} style={headCellStyle}>
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={emptyCellStyle}>
                    Memuat produk...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={emptyCellStyle}>
                    Tidak ada data produk.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.rowId}>
                    <td style={{ ...cellStyle, textAlign: "left" }}>{row.sku}</td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>
                      {row.photo ? (
                        <img
                          src={row.photo}
                          alt={row.name}
                          style={{
                            width: 52,
                            height: 52,
                            objectFit: "cover",
                            borderRadius: 14,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: "#f1f5f9",
                            border: "1px solid #e5e7eb",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 10,
                            color: "#94a3b8",
                          }}
                        >
                          No Img
                        </div>
                      )}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>{row.name}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          ...statusPill(row.stock > 0),
                          background: row.stock > 0 ? "#ecfdf5" : "#fff7ed",
                          color: row.stock > 0 ? "#15803d" : "#c2410c",
                          border: `1px solid ${row.stock > 0 ? "#bbf7d0" : "#fdba74"}`,
                        }}
                      >
                        {row.stock}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>
                      {formatPrice(row.price)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>{row.categoryName}</td>
                    <td style={{ ...cellStyle, textAlign: "left" }}>
                      <span style={statusPill(row.isActive)}>
                        {row.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(row.product)}
                          style={editBtnStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.product.id)}
                          style={deleteBtnStyle}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {renderPagination()}
      </section>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "center",
            padding: isMobile ? 0 : 24,
            zIndex: 999,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: isTablet ? "100%" : 1120,
              height: isMobile ? "100dvh" : "auto",
              maxHeight: isMobile ? "100dvh" : "92vh",
              overflowY: "auto",
              overflowX: "hidden",
              background: "#fff",
              borderRadius: isMobile ? 0 : 24,
              boxShadow: isMobile ? "none" : "0 28px 80px rgba(15, 23, 42, 0.28)",
              border: isMobile ? "none" : "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                padding: isMobile ? 16 : 22,
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                position: "sticky",
                top: 0,
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(8px)",
                zIndex: 3,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "left",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0f766e",
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    marginBottom: 10,
                  }}
                >
                  {formMode === "edit" ? "Mode Edit" : "Mode Tambah"}
                </div>

                <h2 style={{ margin: 0, fontSize: 22, textAlign: "left", color: "#0f172a" }}>
                  {formMode === "edit" ? "Edit Produk" : "Tambah Produk"}
                </h2>

                <p
                  style={{
                    margin: "8px 0 0",
                    textAlign: "left",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  Kelola data produk, varian, inventory, dan kategori dari satu popup.
                </p>
              </div>

              <button type="button" onClick={closeModal} style={modalCloseButtonStyle}>
                ×
              </button>
            </div>

            <div style={{ padding: isMobile ? 16 : 22, display: "grid", gap: 18, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: isMobile ? "nowrap" : "wrap",
                  overflowX: isMobile ? "auto" : "visible",
                  paddingBottom: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("product")}
                  style={tabButtonStyle("product")}
                >
                  Produk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("variant")}
                  style={tabButtonStyle("variant")}
                >
                  Varian
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("inventory")}
                  style={tabButtonStyle("inventory")}
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("category")}
                  style={tabButtonStyle("category")}
                >
                  Kategori
                </button>
              </div>

              <div style={{ ...cardStyle, padding: isMobile ? 14 : 18, minWidth: 0 }}>
                {renderActiveTabContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const headCellStyle = {
  padding: "12px 14px",
  textAlign: "left",
  fontSize: 12,
  color: "#64748b",
  borderBottom: "1px solid #e5e7eb",
};

const cellStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "top",
};

const emptyCellStyle = {
  padding: 18,
  textAlign: "center",
  color: "#64748b",
  fontSize: 13,
};

const primaryButtonStyle = {
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
};

const secondaryButtonStyle = {
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "#0f766e",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(15, 118, 110, 0.18)",
};

const ghostButtonStyle = {
  padding: "11px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalCloseButtonStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 20,
  flexShrink: 0,
};

const editBtnStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

const deleteBtnStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 12,
};

export default ProductPage;