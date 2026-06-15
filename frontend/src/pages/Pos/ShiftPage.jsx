import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function ShiftPage() {
  const [staffList, setStaffList] = useState([]);
  const [activeCashier, setActiveCashier] = useState(null);

  const [activeShift, setActiveShift] = useState(null);

  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");

  const [shiftMessage, setShiftMessage] = useState("");
  const [loadingShift, setLoadingShift] = useState(false);

  const [closeSummary, setCloseSummary] = useState(null);

  const [shiftHistory, setShiftHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const savedCashier = localStorage.getItem("pos_active_cashier");
    if (savedCashier) {
      try {
        setActiveCashier(JSON.parse(savedCashier));
      } catch {
        localStorage.removeItem("pos_active_cashier");
      }
    }

    loadCashiers();
    loadActiveShift();
    loadShiftHistory();
  }, []);

  const loadCashiers = async () => {
    try {
      const res = await api.get("/pos/cashier-staff");
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error("LOAD CASHIERS ERROR:", err);
    }
  };

  const loadActiveShift = async () => {
    try {
      const res = await api.get("/pos/shifts/active");
      setActiveShift(res.data.data || null);
    } catch (err) {
      console.error("ACTIVE SHIFT ERROR:", err);
    }
  };

  const loadShiftHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/pos/shifts");
      const raw = res.data.data;
      const items = raw?.data || raw || [];
      setShiftHistory(items);
    } catch (err) {
      console.error("SHIFT HISTORY ERROR:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectCashier = (e) => {
    const selectedId = Number(e.target.value);
    const found = staffList.find((item) => item.id === selectedId) || null;
    setActiveCashier(found);

    if (found) {
      localStorage.setItem("pos_active_cashier", JSON.stringify(found));
    } else {
      localStorage.removeItem("pos_active_cashier");
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
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("id-ID");
  };

  const handleOpenShift = async () => {
    setShiftMessage("");
    setCloseSummary(null);

    if (!activeCashier) {
      setShiftMessage("Pilih kasir aktif terlebih dahulu.");
      return;
    }

    if (!openingCash) {
      setShiftMessage("Saldo awal wajib diisi.");
      return;
    }

    setLoadingShift(true);

    try {
      const res = await api.post("/pos/shifts/open", {
        cashier_staff_id: activeCashier.id,
        opening_cash: Number(openingCash),
      });

      setActiveShift(res.data.data);
      setShiftMessage(res.data.message || "Shift berhasil dibuka.");
      setOpeningCash("");
      loadShiftHistory();

      // Setelah buka shift, langsung kembali ke halaman POS
      navigate("/pos");
    } catch (err) {
      console.error("OPEN SHIFT ERROR:", err);
      setShiftMessage(err.response?.data?.message || "Gagal membuka shift.");
    } finally {
      setLoadingShift(false);
    }
  };

  const handleCloseShift = async () => {
    setShiftMessage("");
    setCloseSummary(null);

    if (!activeShift?.id) {
      setShiftMessage("Tidak ada shift aktif.");
      return;
    }

    if (!closingCash) {
      setShiftMessage("Saldo akhir wajib diisi.");
      return;
    }

    setLoadingShift(true);

    try {
      const res = await api.post("/pos/shifts/close", {
        shift_id: activeShift.id,
        closing_cash: Number(closingCash),
      });

      setShiftMessage(res.data.message || "Shift berhasil ditutup.");
      const summary = res.data.data || null;
      setCloseSummary(summary);

      setActiveShift(null);
      setClosingCash("");
      loadShiftHistory();
    } catch (err) {
      console.error("CLOSE SHIFT ERROR:", err);
      setShiftMessage(err.response?.data?.message || "Gagal menutup shift.");
    } finally {
      setLoadingShift(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "transparent",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 24,
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
        }}
      >
        {/* Panel kiri: buka/tutup shift */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e2ddd6",
            borderRadius: 16,
            padding: 20,
            height: "fit-content",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Buka / Tutup Shift</h2>

          {shiftMessage && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#fff3f0",
                color: "#9f2d20",
                border: "1px solid #f0c8c2",
                fontSize: 14,
              }}
            >
              {shiftMessage}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <select
              value={activeCashier?.id || ""}
              onChange={handleSelectCashier}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #d8d2ca",
              }}
            >
              <option value="">Pilih kasir aktif</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.code})
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Saldo awal kas"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #d8d2ca",
              }}
            />

            <button
              onClick={handleOpenShift}
              disabled={loadingShift || !!activeShift}
              style={{
                padding: "12px 16px",
                border: "none",
                borderRadius: 10,
                background: activeShift ? "#999" : "#0f766e",
                color: "#fff",
                fontWeight: 700,
                cursor: activeShift ? "not-allowed" : "pointer",
              }}
            >
              {loadingShift ? "Memproses..." : "Buka Shift"}
            </button>

            {activeShift && (
              <div
                style={{
                  marginTop: 6,
                  padding: 14,
                  borderRadius: 12,
                  background: "#eef7f5",
                  border: "1px solid #c8e3dc",
                  fontSize: 14,
                }}
              >
                <div>
                  <strong>Shift:</strong> {activeShift.shift_code}
                </div>
                <div>
                  <strong>Kasir:</strong>{" "}
                  {activeShift.cashier_staff?.name || "-"}
                </div>
                <div>
                  <strong>Dibuka:</strong>{" "}
                  {formatDateTime(activeShift.opened_at)}
                </div>
                <div>
                  <strong>Saldo awal:</strong>{" "}
                  {formatPrice(activeShift.opening_cash)}
                </div>
                <div>
                  <strong>Status:</strong> {activeShift.status}
                </div>
              </div>
            )}

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #ece7df",
                margin: "8px 0",
              }}
            />

            <input
              type="number"
              placeholder="Saldo akhir kas (fisik)"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #d8d2ca",
              }}
            />

            <button
              onClick={handleCloseShift}
              disabled={loadingShift || !activeShift}
              style={{
                padding: "12px 16px",
                border: "none",
                borderRadius: 10,
                background: !activeShift ? "#999" : "#9f2d20",
                color: "#fff",
                fontWeight: 700,
                cursor: !activeShift ? "not-allowed" : "pointer",
              }}
            >
              {loadingShift ? "Memproses..." : "Tutup Shift"}
            </button>
          </div>

          {closeSummary && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                background: "#f7f4ff",
                border: "1px solid #d7cff5",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Ringkasan Shift Ditutup
              </div>
              <div>
                <strong>Shift:</strong>{" "}
                {closeSummary.shift?.shift_code || "-"}
              </div>
              <div>
                <strong>Kasir:</strong>{" "}
                {closeSummary.shift?.cashier_staff?.name || "-"}
              </div>
              <div>
                <strong>Total transaksi:</strong>{" "}
                {closeSummary.total_transaksi ?? 0}
              </div>
              <div>
                <strong>Total revenue:</strong>{" "}
                {formatPrice(closeSummary.total_revenue || 0)}
              </div>
              <div>
                <strong>Total cash in:</strong>{" "}
                {formatPrice(closeSummary.total_cash_in || 0)}
              </div>
              <div>
                <strong>Total non cash:</strong>{" "}
                {formatPrice(closeSummary.total_non_cash || 0)}
              </div>
              <hr
                style={{
                  border: 0,
                  borderTop: "1px solid #e0daf5",
                  margin: "8px 0",
                }}
              />
              <div>
                <strong>Saldo awal:</strong>{" "}
                {formatPrice(closeSummary.opening_cash || 0)}
              </div>
              <div>
                <strong>Cash seharusnya:</strong>{" "}
                {formatPrice(
                  (closeSummary.opening_cash || 0) +
                    (closeSummary.total_cash_in || 0)
                )}
              </div>
              <div>
                <strong>Cash fisik:</strong>{" "}
                {formatPrice(closeSummary.closing_cash || 0)}
              </div>
              <div>
                <strong>Selisih:</strong>{" "}
                {formatPrice(closeSummary.cash_difference || 0)}{" "}
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    marginLeft: 6,
                    fontSize: 11,
                    background:
                      closeSummary.selisih_status === "Sesuai"
                        ? "#dcfce7"
                        : closeSummary.cash_difference > 0
                        ? "#fee2e2"
                        : "#fef9c3",
                    color:
                      closeSummary.selisih_status === "Sesuai"
                        ? "#166534"
                        : closeSummary.cash_difference > 0
                        ? "#991b1b"
                        : "#854d0e",
                  }}
                >
                  {closeSummary.selisih_status}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Panel kanan: history singkat shift */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e2ddd6",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Riwayat Shift Saya</h2>

          {loadingHistory ? (
            <div style={{ color: "#777", fontSize: 13 }}>
              Memuat riwayat shift...
            </div>
          ) : shiftHistory.length === 0 ? (
            <div style={{ color: "#777", fontSize: 13 }}>
              Belum ada riwayat shift.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              {shiftHistory.map((shift) => (
                <div
                  key={shift.id}
                  style={{
                    border: "1px solid #ece7df",
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 13,
                    background:
                      shift.status === "open" ? "#eef7f5" : "#faf5ff",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {shift.shift_code}{" "}
                    <span
                      style={{
                        marginLeft: 6,
                        padding: "2px 6px",
                        borderRadius: 6,
                        fontSize: 11,
                        background:
                          shift.status === "open" ? "#dcfce7" : "#fee2e2",
                        color:
                          shift.status === "open" ? "#166534" : "#991b1b",
                      }}
                    >
                      {shift.status}
                    </span>
                  </div>
                  <div>
                    Kasir: {shift.cashier_staff?.name || "-"}
                  </div>
                  <div>
                    Dibuka: {formatDateTime(shift.opened_at)}
                  </div>
                  <div>
                    Ditutup: {formatDateTime(shift.closed_at)}
                  </div>
                  <div>
                    Opening: {formatPrice(shift.opening_cash || 0)}
                  </div>
                  <div>
                    Closing: {formatPrice(shift.closing_cash || 0)}
                  </div>
                  {typeof shift.total_transactions !== "undefined" && (
                    <div>
                      Transaksi: {shift.total_transactions} | Revenue:{" "}
                      {formatPrice(shift.total_revenue || 0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ShiftPage;