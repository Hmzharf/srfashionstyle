import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

function PosTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const navigate = useNavigate();

  const fmt = (v) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(v || 0));

  const fmtDate = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("id-ID");
  };

  const fmtShortDate = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const loadData = async () => {
    setLoading(true);
    setMsg("");
    try {
      const [shiftRes, txRes] = await Promise.all([
        api.get("/pos/shifts/active"),
        api.get("/pos/transactions"),
      ]);
      setActiveShift(shiftRes.data.data || null);
      setTransactions(txRes.data.data || []);
    } catch (e) {
      setMsg(e.response?.data?.message || "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefund = async (tx) => {
    setMsg("");
    if (!activeShift?.id) {
      setMsg("Tidak ada shift aktif. Buka shift dulu.");
      return;
    }
    if (!window.confirm(`Refund transaksi ${tx.transaction_code}?`)) return;

    try {
      const payload = {
        pos_shift_id: activeShift.id,
        cashier_staff_id: activeShift.cashier_staff_id,
        restock_items: true,
      };
      const res = await api.post(`/pos/transactions/${tx.id}/refund`, payload);
      setMsg(res.data.message || "Refund berhasil.");
      await loadData();
    } catch (e) {
      setMsg(e.response?.data?.message || "Refund gagal.");
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      if (isNaN(txDate)) return false;

      const txTime = txDate.getTime();
      let fromPass = true;
      let toPass = true;

      if (dateFrom) {
        const fromDate = new Date(`${dateFrom}T00:00:00`);
        fromPass = txTime >= fromDate.getTime();
      }

      if (dateTo) {
        const toDate = new Date(`${dateTo}T23:59:59`);
        toPass = txTime <= toDate.getTime();
      }

      return fromPass && toPass;
    });
  }, [transactions, dateFrom, dateTo]);

  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + Number(tx.grand_total || 0),
      0
    );
  }, [filteredTransactions]);

  const activePeriodLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      return `${fmtShortDate(dateFrom)} - ${fmtShortDate(dateTo)}`;
    }
    if (dateFrom && !dateTo) {
      return `${fmtShortDate(dateFrom)} - Sekarang`;
    }
    if (!dateFrom && dateTo) {
      return `Sampai ${fmtShortDate(dateTo)}`;
    }

    if (!filteredTransactions.length) return "Semua periode";

    const validDates = filteredTransactions
      .map((tx) => new Date(tx.created_at))
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);

    if (!validDates.length) return "Semua periode";

    return `${validDates[0].toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} - ${validDates[validDates.length - 1].toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [dateFrom, dateTo, filteredTransactions]);

  const handleResetFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f3ef",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 16,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e5e0d8",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        {/* HEADER + FILTER KECIL */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#1a1714",
              }}
            >
              Transaksi POS
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#6b6560",
              }}
            >
              Lihat seluruh transaksi POS dan proses refund.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {/* Filter kecil di bar atas */}
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 999,
                border: "1px solid #e5e0d8",
                background: "#fcfaf7",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#6b6560",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Periode
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "4px 6px",
                  borderRadius: 999,
                  border: "1px solid #ddd6cf",
                  background: "#ffffff",
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "#6b6560" }}>s.d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "4px 6px",
                  borderRadius: 999,
                  border: "1px solid #ddd6cf",
                  background: "#ffffff",
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleResetFilter}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "none",
                  background: "#fff5f5",
                  color: "#b91c1c",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Reset
              </button>
            </div>

            {/* Badge periode aktif */}
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #e5e0d8",
                background: "#ffffff",
                fontSize: 11,
                color: "#5b544d",
                whiteSpace: "nowrap",
              }}
            >
              {activePeriodLabel}
            </div>

            <button
              type="button"
              onClick={loadData}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #ded9d2",
                background: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/pos")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #ded9d2",
                background: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Kembali ke POS
            </button>
          </div>
        </div>

        {/* KARTU RINGKASAN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              border: "1px solid #ece6de",
              borderRadius: 14,
              padding: 14,
              background: "#fcfaf7",
            }}
          >
            <div style={{ fontSize: 12, color: "#8a7f74", marginBottom: 6 }}>
              Total revenue POS
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1714" }}>
              {fmt(totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: "#6b6560", marginTop: 6 }}>
              Mengikuti transaksi pada periode terpilih.
            </div>
          </div>

          <div
            style={{
              border: "1px solid #ece6de",
              borderRadius: 14,
              padding: 14,
              background: "#fcfaf7",
            }}
          >
            <div style={{ fontSize: 12, color: "#8a7f74", marginBottom: 6 }}>
              Jumlah transaksi
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1714" }}>
              {filteredTransactions.length}
            </div>
            <div style={{ fontSize: 12, color: "#6b6560", marginTop: 6 }}>
              Total data transaksi yang tampil di tabel.
            </div>
          </div>
        </div>

        {activeShift ? (
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 999,
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#15803d",
              }}
            />
            Shift aktif: {activeShift.shift_code} · Kasir:{" "}
            {activeShift.cashier_staff?.name || "-"}
          </div>
        ) : (
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 999,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            Tidak ada shift aktif. Refund membutuhkan shift terbuka.
          </div>
        )}

        {msg && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fefce8",
              border: "1px solid #facc15",
              fontSize: 12,
              color: "#854d0e",
            }}
          >
            {msg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 24, fontSize: 13 }}>Memuat...</div>
        ) : filteredTransactions.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              fontSize: 13,
              color: "#999",
            }}
          >
            Tidak ada transaksi pada periode tersebut.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #eee7df",
              borderRadius: 14,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 920,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9f5f0",
                    borderBottom: "1px solid #e5e0d8",
                  }}
                >
                  <th style={{ padding: 10, textAlign: "left" }}>Kode</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Tanggal</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Kasir</th>
                  <th style={{ padding: 10, textAlign: "right" }}>Total</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Metode</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Status</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Catatan</th>
                  <th style={{ padding: 10, textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isRefund =
                    tx.status === "refunded" ||
                    String(tx.transaction_code || "").startsWith("REF-") ||
                    (tx.notes && String(tx.notes).startsWith("REFUND_OF:"));

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: "1px solid #f1ece5",
                        background: isRefund ? "#fff7f7" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: 10, fontWeight: 600 }}>
                        {tx.transaction_code}
                      </td>
                      <td style={{ padding: 10 }}>{fmtDate(tx.created_at)}</td>
                      <td style={{ padding: 10 }}>
                        {tx.cashier_staff?.name || "-"}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          textAlign: "right",
                          fontWeight: 700,
                          color:
                            Number(tx.grand_total) < 0 ? "#b91c1c" : "#0f766e",
                        }}
                      >
                        {fmt(tx.grand_total)}
                      </td>
                      <td style={{ padding: 10, textTransform: "uppercase" }}>
                        {tx.payment_method || "-"}
                      </td>
                      <td style={{ padding: 10 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isRefund ? "#fef2f2" : "#ecfdf5",
                            color: isRefund ? "#b91c1c" : "#15803d",
                            border: `1px solid ${
                              isRefund ? "#fecaca" : "#bbf7d0"
                            }`,
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: 10, color: "#6b6560" }}>
                        {tx.notes || "-"}
                      </td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        {isRefund ? (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                            }}
                          >
                            Sudah refund
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRefund(tx)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PosTransactionsPage;