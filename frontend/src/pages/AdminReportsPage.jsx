import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      date_from: startOfMonth.toISOString().slice(0, 10),
      date_to: now.toISOString().slice(0, 10),
    };
  });

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

  const calculateDateRange = (periodKey) => {
    const now = new Date();

    if (periodKey === "last_7_days") {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      return {
        date_from: past.toISOString().slice(0, 10),
        date_to: now.toISOString().slice(0, 10),
      };
    }

    if (periodKey === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        date_from: firstDayLastMonth.toISOString().slice(0, 10),
        date_to: lastDayLastMonth.toISOString().slice(0, 10),
      };
    }

    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      date_from: firstDayThisMonth.toISOString().slice(0, 10),
      date_to: now.toISOString().slice(0, 10),
    };
  };

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchReport(dateRange);
  }, [dateRange]);

  const fetchReport = async (range) => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get("/admin/reports", {
        params: {
          date_from: range.date_from,
          date_to: range.date_to,
        },
      });
      setReport(res.data || null);
    } catch (err) {
      console.error("GET REPORT ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  };

  const downloadBlobFile = async ({ type }) => {
    try {
      setMessage("");

      if (type === "excel") setLoadingExcel(true);
      if (type === "pdf") setLoadingPdf(true);

      const url =
        type === "pdf"
          ? "/reports/all/export/pdf"
          : "/reports/all/export/excel";

      const response = await api.get(url, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename =
        type === "pdf"
          ? "laporan-semua-data.pdf"
          : "laporan-semua-data.xlsx";

      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      const blob = new Blob([response.data], {
        type:
          type === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("EXPORT REPORT ERROR:", error);
      setMessage("Gagal export laporan.");
    } finally {
      if (type === "excel") setLoadingExcel(false);
      if (type === "pdf") setLoadingPdf(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatNumber = (value) =>
    new Intl.NumberFormat("id-ID").format(Number(value || 0));

  const cardStyle = {
    background: "#ffffff",
    borderRadius: isMobile ? 16 : 20,
    padding: isMobile ? 16 : 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
    minWidth: 0,
  };

  const heroCardStyle = {
    ...cardStyle,
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
  };

  const inputStyle = {
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 13,
    background: "#fff",
    color: "#334155",
    outline: "none",
    minWidth: 0,
  };

  const softButtonStyle = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #d1fae5",
    background: "#ecfdf5",
    color: "#0f766e",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const exportButtonStyle = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
  };

  const primaryExportButtonStyle = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  const headCellStyle = {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  };

  const cellStyle = {
    padding: "12px 14px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 13,
    color: "#334155",
    verticalAlign: "top",
    textAlign: "left",
  };

  const metricCards = useMemo(() => {
    const summary = report?.summary || {};

    const totalRevenue = Number(summary.total_revenue ?? summary.total_sales ?? 0);
    const totalOnlineOrders = Number(summary.total_orders ?? 0);
    const totalPosTransactions = Number(summary.total_pos_transactions ?? 0);
    const totalCombinedOrders = totalOnlineOrders + totalPosTransactions;
    const totalItemsSold = Number(summary.total_items_sold ?? 0);
    const averageOrderValue = Number(summary.average_order_value ?? 0);

    return [
      {
        label: "Total Penjualan",
        value: formatPrice(totalRevenue),
        accent: "blue",
      },
      {
        label: "Total Order",
        value: formatNumber(totalCombinedOrders),
        accent: "purple",
      },
      {
        label: "Produk Terjual",
        value: formatNumber(totalItemsSold),
        accent: "teal",
      },
      {
        label: "Rata-rata Order",
        value: formatPrice(averageOrderValue),
        accent: "green",
      },
    ];
  }, [report]);

  const renderMetricCard = (item) => {
    const colorMap = {
      blue: {
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        border: "1px solid #bfdbfe",
        value: "#1d4ed8",
      },
      purple: {
        background: "linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%)",
        border: "1px solid #ddd6fe",
        value: "#6d28d9",
      },
      teal: {
        background: "linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)",
        border: "1px solid #99f6e4",
        value: "#0f766e",
      },
      green: {
        background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
        border: "1px solid #bbf7d0",
        value: "#15803d",
      },
    };

    const theme = colorMap[item.accent] || colorMap.blue;

    return (
      <div
        key={item.label}
        style={{
          ...cardStyle,
          background: theme.background,
          border: theme.border,
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#6b7280",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: isMobile ? 22 : 28,
            fontWeight: 800,
            color: theme.value,
            wordBreak: "break-word",
          }}
        >
          {item.value}
        </p>
      </div>
    );
  };

  if (loading) {
    return <div style={{ ...cardStyle, maxWidth: 420, margin: "40px auto" }}>Memuat laporan...</div>;
  }

  if (message && !report) {
    return (
      <div
        style={{
          ...cardStyle,
          maxWidth: 520,
          margin: "40px auto",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
        }}
      >
        {message}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
      <section style={heroCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 30, textAlign: "left", color: "#0f172a" }}>
              Monitoring Laporan
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <select
              value={period}
              onChange={(e) => {
                const value = e.target.value;
                setPeriod(value);
                setDateRange(calculateDateRange(value));
              }}
              style={{ ...inputStyle, width: isMobile ? "100%" : 170 }}
            >
              <option value="this_month">Bulan ini</option>
              <option value="last_month">Bulan lalu</option>
              <option value="last_7_days">7 hari terakhir</option>
            </select>

            <button type="button" onClick={() => fetchReport(dateRange)} style={softButtonStyle}>
              Refresh Laporan
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#64748b",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              padding: "8px 12px",
            }}
          >
            Periode: {dateRange.date_from} s/d {dateRange.date_to}
          </span>
        </div>
      </section>

      <section
        style={{
          ...cardStyle,
          display: "grid",
          gap: 16,
          background: "linear-gradient(180deg, #f8fffd 0%, #ffffff 100%)",
          border: "1px solid #cceee7",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#0f172a", textAlign: "left" }}>
              Unduh Laporan Sistem
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>
              Unduh seluruh data sistem dalam format Excel multi-sheet atau PDF lengkap.
              Bagian ini menggunakan export semua data, tidak hanya order.
            </p>
          </div>

          {message && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 13,
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid #dbeafe",
              background: "#f8fbff",
              display: "grid",
              gap: 14,
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "#0f172a", textAlign: "left" }}>
                Export Excel
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                Cocok untuk analisis data, filter manual, dan arsip spreadsheet.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadBlobFile({ type: "excel" })}
              disabled={loadingExcel}
              style={{
                ...primaryExportButtonStyle,
                opacity: loadingExcel ? 0.7 : 1,
                cursor: loadingExcel ? "not-allowed" : "pointer",
              }}
            >
              {loadingExcel ? "Mengunduh Excel..." : "Unduh Excel Semua Data"}
            </button>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "grid",
              gap: 14,
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 17, color: "#0f172a", textAlign: "left" }}>
                Export PDF
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                Cocok untuk dicetak, dibagikan, atau dijadikan dokumen laporan final.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadBlobFile({ type: "pdf" })}
              disabled={loadingPdf}
              style={{
                ...exportButtonStyle,
                padding: "12px 16px",
                opacity: loadingPdf ? 0.7 : 1,
                cursor: loadingPdf ? "not-allowed" : "pointer",
              }}
            >
              {loadingPdf ? "Mengunduh PDF..." : "Unduh PDF Semua Data"}
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {metricCards.map(renderMetricCard)}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 16,
          minWidth: 0,
        }}
      >
        <div style={cardStyle}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, textAlign: "left", color: "#0f172a" }}>Top Produk</h2>
          </div>

          {!report?.top_products?.length ? (
            <div style={{ padding: 14, borderRadius: 12, border: "1px dashed #d1d5db", color: "#9ca3af", fontSize: 13 }}>
              Belum ada data produk terlaris.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {report.top_products.map((item, index) => (
                <div
                  key={item.product_variant_id || `${item.product_name}-${index}`}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#111827" }}>
                        {item.product_name || "-"}
                      </p>
                      <p style={{ margin: "0 0 4px", color: "#6b7280" }}>
                        SKU: {item.sku || "-"}
                      </p>
                      <p style={{ margin: 0, color: "#4b5563" }}>
                        Qty Terjual: {formatNumber(item.total_qty || item.qty_total || 0)}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: isMobile ? "left" : "right" }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#111827" }}>
                      {formatPrice(item.total_sales || item.revenue_total || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, textAlign: "left", color: "#0f172a" }}>
              Ringkasan Shift
            </h2>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {(report?.last_shifts || []).length === 0 ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "1px dashed #d1d5db",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                Belum ada data shift.
              </div>
            ) : (
              report.last_shifts.map((shift, index) => (
                <div
                  key={shift.shift_code || index}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "grid",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "#0f172a", fontWeight: 800 }}>{shift.shift_code || "-"}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        Kasir: {shift.cashier_name || "-"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#0f172a", fontWeight: 800 }}>
                        {formatPrice(shift.revenue_pos || 0)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>Revenue POS</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Dibuka</div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {shift.opened_at ? new Date(shift.opened_at).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Ditutup</div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {shift.closed_at ? new Date(shift.closed_at).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: "#fff7ed",
                      border: "1px solid #fdba74",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#9a3412", fontWeight: 700 }}>Selisih Kas</span>
                    <span style={{ color: "#9a3412", fontWeight: 800 }}>
                      {formatPrice(shift.cash_difference || 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: isMobile ? "14px 16px" : "16px 18px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Detail Transaksi</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
            Ringkasan transaksi berdasarkan order pada periode laporan.
          </p>
        </div>

        {!report?.transactions?.length ? (
          <div style={{ padding: 18, color: "#64748b", fontSize: 13 }}>Belum ada transaksi pada periode ini.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr>
                  {["No Order", "Pelanggan", "Tanggal", "Status", "Pembayaran", "Total"].map((head) => (
                    <th key={head} style={headCellStyle}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((trx, index) => (
                  <tr key={`${trx.id ?? trx.order_code ?? "trx"}-${index}`}>
                    <td style={{ ...cellStyle, fontWeight: 700, color: "#0f172a" }}>{trx.order_code || "-"}</td>
                    <td style={cellStyle}>
                      <div>{trx.customer_name || "-"}</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>{trx.email || "-"}</div>
                    </td>
                    <td style={cellStyle}>
                      {trx.created_at ? new Date(trx.created_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td style={{ ...cellStyle, textTransform: "capitalize" }}>{trx.status || "-"}</td>
                    <td style={{ ...cellStyle, textTransform: "capitalize" }}>{trx.payment_status || "-"}</td>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>
                      {formatPrice(trx.grand_total || trx.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminReportsPage;