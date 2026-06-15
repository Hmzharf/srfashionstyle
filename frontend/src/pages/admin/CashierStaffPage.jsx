import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";

function CashierStaffPage() {
  const [summary, setSummary] = useState({
    total_staff: 0,
    active_staff: 0,
    inactive_staff: 0,
    open_shift_count: 0,
    closed_shift_count: 0,
    total_transactions: 0,
    total_revenue: 0,
  });

  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffShifts, setStaffShifts] = useState([]);
  const [staffTransactions, setStaffTransactions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formLoading, setFormLoading] = useState(false);

  const initialForm = {
    id: null,
    name: "",
    code: "",
    is_active: true,
    notes: "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setMessage("");

      const summaryRes = await api.get("/admin/cashier-staff/summary");
      setSummary(summaryRes.data?.data || {});

      await fetchStaffs();
    } catch (err) {
      console.error("FETCH CASHIER STAFF ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil data kasir.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffs = async () => {
    try {
      setPageLoading(true);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterActive !== "") params.is_active = filterActive;

      const res = await api.get("/admin/cashier-staff", { params });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setStaffs(rows);
    } catch (err) {
      console.error("FETCH STAFFS ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal memuat daftar kasir.");
      setStaffs([]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaffs();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, filterActive]);

  const fetchStaffDetail = async (staffId) => {
    try {
      setDetailLoading(true);

      const [detailRes, shiftsRes, trxRes] = await Promise.all([
        api.get(`/admin/cashier-staff/${staffId}`),
        api.get(`/admin/cashier-staff/${staffId}/shifts`),
        api.get(`/admin/cashier-staff/${staffId}/transactions`),
      ]);

      setSelectedStaff(detailRes.data?.data || null);
      setStaffShifts(
        Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []
      );
      setStaffTransactions(
        Array.isArray(trxRes.data?.data) ? trxRes.data.data : []
      );
    } catch (err) {
      console.error("FETCH STAFF DETAIL ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal mengambil detail kasir.");
      setSelectedStaff(null);
      setStaffShifts([]);
      setStaffTransactions([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormMode("create");
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setFormMode("edit");
    setForm({
      id: staff.id,
      name: staff.name || "",
      code: staff.code || "",
      is_active: !!staff.is_active,
      notes: staff.notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setMessage("");

      const payload = {
        name: form.name,
        code: form.code,
        is_active: form.is_active,
        notes: form.notes || null,
      };

      if (formMode === "create") {
        await api.post("/admin/cashier-staff", payload);
        setMessage("Karyawan kasir berhasil ditambahkan.");
      } else {
        await api.put(`/admin/cashier-staff/${form.id}`, payload);
        setMessage("Karyawan kasir berhasil diperbarui.");
      }

      closeModal();
      await fetchAll();

      if (selectedStaff?.id === form.id) {
        await fetchStaffDetail(form.id);
      }
    } catch (err) {
      console.error("SAVE CASHIER STAFF ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal menyimpan data kasir.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (staff) => {
    const ok = window.confirm(`Hapus kasir ${staff.name}?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/cashier-staff/${staff.id}`);
      setMessage("Karyawan kasir berhasil dihapus.");

      if (selectedStaff?.id === staff.id) {
        setSelectedStaff(null);
        setStaffShifts([]);
        setStaffTransactions([]);
      }

      await fetchAll();
    } catch (err) {
      console.error("DELETE CASHIER STAFF ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal menghapus kasir.");
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID");
  };

  const cards = useMemo(
    () => [
      { label: "Total Staff", value: summary.total_staff || 0 },
      { label: "Staff Aktif", value: summary.active_staff || 0 },
      { label: "Shift Buka", value: summary.open_shift_count || 0 },
      { label: "Total Transaksi", value: summary.total_transactions || 0 },
      { label: "Total Revenue", value: formatPrice(summary.total_revenue || 0) },
    ],
    [summary]
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={heroStyle}>
        <div>
          <h1 style={titleStyle}>Manajemen Kasir</h1>
          <p style={subStyle}>
            Admin dapat menambah karyawan kasir, melihat shift, transaksi, dan revenue per kasir.
          </p>
        </div>

        <button type="button" onClick={openCreateModal} style={primaryButtonStyle}>
          Tambah Kasir
        </button>
      </div>

      {message ? <div style={noticeStyle}>{message}</div> : null}

      <div style={summaryGridStyle}>
        {cards.map((card) => (
          <div key={card.label} style={summaryCardStyle}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Daftar Karyawan Kasir</h2>
            <p style={subStyle}>Kelola kasir aktif, histori shift, dan performa penjualan.</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Cari nama / kode / catatan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, minWidth: 240 }}
            />

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              style={{ ...inputStyle, minWidth: 170 }}
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Kode</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Shift</th>
                <th style={thStyle}>Transaksi</th>
                <th style={thStyle}>Revenue</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading || pageLoading ? (
                <tr>
                  <td colSpan={7} style={emptyCellStyle}>
                    Memuat data kasir...
                  </td>
                </tr>
              ) : staffs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyCellStyle}>
                    Belum ada data kasir.
                  </td>
                </tr>
              ) : (
                staffs.map((staff) => (
                  <tr key={staff.id}>
                    <td style={tdStyle}>{staff.name}</td>
                    <td style={tdStyle}>{staff.code}</td>
                    <td style={tdStyle}>
                      <span style={statusPillStyle(staff.is_active)}>
                        {staff.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {staff.shifts_count} total / {staff.open_shifts_count} buka
                    </td>
                    <td style={tdStyle}>{staff.transactions_count}</td>
                    <td style={tdStyle}>{formatPrice(staff.total_revenue)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => fetchStaffDetail(staff.id)}
                          style={ghostButtonStyle}
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          style={editButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(staff)}
                          style={deleteButtonStyle}
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
        </div>
      </div>

      {detailLoading || selectedStaff ? (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Detail Kasir</h2>
              <p style={subStyle}>
                Lihat ringkasan shift, transaksi, dan revenue kasir yang dipilih.
              </p>
            </div>
          </div>

          {detailLoading ? (
            <div style={emptyBlockStyle}>Memuat detail kasir...</div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={detailHeaderCardStyle}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>
                    {selectedStaff.name}
                  </h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                    Kode: {selectedStaff.code} • Status:{" "}
                    {selectedStaff.is_active ? "Aktif" : "Nonaktif"}
                  </p>
                  <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
                    Catatan: {selectedStaff.notes || "-"}
                  </p>
                </div>

                <div style={detailMetricsWrapStyle}>
                  <div style={miniMetricStyle}>
                    <div style={miniMetricLabelStyle}>Total Shift</div>
                    <div style={miniMetricValueStyle}>{selectedStaff.shifts_count}</div>
                  </div>
                  <div style={miniMetricStyle}>
                    <div style={miniMetricLabelStyle}>Shift Buka</div>
                    <div style={miniMetricValueStyle}>
                      {selectedStaff.open_shifts_count}
                    </div>
                  </div>
                  <div style={miniMetricStyle}>
                    <div style={miniMetricLabelStyle}>Transaksi</div>
                    <div style={miniMetricValueStyle}>
                      {selectedStaff.transactions_count}
                    </div>
                  </div>
                  <div style={miniMetricStyle}>
                    <div style={miniMetricLabelStyle}>Revenue</div>
                    <div style={miniMetricValueStyle}>
                      {formatPrice(selectedStaff.total_revenue)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={detailGridStyle}>
                <div style={panelInnerStyle}>
                  <h3 style={innerTitleStyle}>Riwayat Shift</h3>

                  <div style={tableWrapStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Kode Shift</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Buka</th>
                          <th style={thStyle}>Tutup</th>
                          <th style={thStyle}>Transaksi</th>
                          <th style={thStyle}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffShifts.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={emptyCellStyle}>
                              Belum ada data shift.
                            </td>
                          </tr>
                        ) : (
                          staffShifts.map((shift) => (
                            <tr key={shift.id}>
                              <td style={tdStyle}>{shift.shift_code}</td>
                              <td style={tdStyle}>
                                <span style={statusPillStyle(shift.status === "open")}>
                                  {shift.status}
                                </span>
                              </td>
                              <td style={tdStyle}>{formatDateTime(shift.opened_at)}</td>
                              <td style={tdStyle}>{formatDateTime(shift.closed_at)}</td>
                              <td style={tdStyle}>{shift.transactions_count}</td>
                              <td style={tdStyle}>
                                {formatPrice(shift.shift_revenue)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={panelInnerStyle}>
                  <h3 style={innerTitleStyle}>Transaksi Kasir</h3>

                  <div style={tableWrapStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Kode</th>
                          <th style={thStyle}>Metode</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={emptyCellStyle}>
                              Belum ada data transaksi.
                            </td>
                          </tr>
                        ) : (
                          staffTransactions.slice(0, 10).map((trx) => (
                            <tr key={trx.id}>
                              <td style={tdStyle}>{trx.transaction_code}</td>
                              <td style={tdStyle}>{trx.payment_method || "-"}</td>
                              <td style={tdStyle}>{trx.status || "-"}</td>
                              <td style={tdStyle}>
                                {formatPrice(trx.grand_total)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={compactEmptyDetailStyle}>
          <h2 style={sectionTitleStyle}>Detail Kasir</h2>
          <p style={{ ...subStyle, marginTop: 8 }}>
            Pilih tombol <strong>Detail</strong> pada salah satu kasir untuk melihat shift dan transaksi.
          </p>
        </div>
      )}

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                  {formMode === "create" ? "Tambah Kasir" : "Edit Kasir"}
                </h2>
                <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
                  Isi data karyawan kasir untuk operasional POS.
                </p>
              </div>

              <button type="button" onClick={closeModal} style={closeBtnStyle}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div style={formGridStyle}>
                <div>
                  <label style={labelStyle}>Nama Kasir</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    placeholder="Masukkan nama kasir"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Kode Kasir</label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    placeholder="Contoh: KSR-01"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Catatan</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Catatan tambahan"
                />
              </div>

              <label style={checkboxWrapStyle}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Kasir aktif
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
                  Batal
                </button>
                <button type="submit" disabled={formLoading} style={primaryButtonStyle}>
                  {formLoading
                    ? "Menyimpan..."
                    : formMode === "create"
                    ? "Simpan Kasir"
                    : "Update Kasir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  padding: 24,
  borderRadius: 20,
  background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
};

const panelStyle = {
  padding: 20,
  borderRadius: 20,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
};

const panelInnerStyle = {
  padding: 16,
  borderRadius: 18,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  minWidth: 0,
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: 30,
  color: "#0f172a",
  textAlign: "left",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 22,
  color: "#0f172a",
  textAlign: "left",
};

const innerTitleStyle = {
  margin: "0 0 14px",
  fontSize: 18,
  color: "#0f172a",
  textAlign: "left",
};

const subStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.7,
  textAlign: "left",
};

const noticeStyle = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 14,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const summaryCardStyle = {
  padding: 18,
  borderRadius: 18,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
};

const detailHeaderCardStyle = {
  padding: 18,
  borderRadius: 18,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid #e5e7eb",
  display: "grid",
  gap: 18,
};

const detailMetricsWrapStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const miniMetricStyle = {
  padding: 14,
  borderRadius: 14,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
};

const miniMetricLabelStyle = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 6,
};

const miniMetricValueStyle = {
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  alignItems: "start",
};

const tableWrapStyle = {
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 620,
};

const thStyle = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  color: "#64748b",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const tdStyle = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 13,
  color: "#334155",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};

const emptyCellStyle = {
  padding: 20,
  textAlign: "center",
  color: "#64748b",
  fontSize: 14,
};

const emptyBlockStyle = {
  padding: 24,
  borderRadius: 16,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  background: "#f8fafc",
  fontSize: 14,
};

const compactEmptyDetailStyle = {
  padding: 18,
  borderRadius: 18,
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.03)",
};

const inputStyle = {
  width: "100%",
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
  textAlign: "left",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const checkboxWrapStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  color: "#334155",
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

const ghostButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const editButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 999,
};

const modalCardStyle = {
  width: "min(760px, 100%)",
  background: "#ffffff",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 28px 80px rgba(15, 23, 42, 0.22)",
  overflow: "hidden",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: 20,
  borderBottom: "1px solid #e5e7eb",
};

const closeBtnStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  color: "#334155",
  flexShrink: 0,
};

const statusPillStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  background: active ? "#ecfdf5" : "#fef2f2",
  color: active ? "#15803d" : "#b91c1c",
  border: active ? "1px solid #bbf7d0" : "1px solid #fecaca",
});

export default CashierStaffPage;