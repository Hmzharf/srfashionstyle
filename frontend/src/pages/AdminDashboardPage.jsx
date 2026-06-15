import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [posSummary, setPosSummary] = useState(null);
  const [posMessage, setPosMessage] = useState("");
  const [posLoading, setPosLoading] = useState(false);

  const [topProducts, setTopProducts] = useState([]);
  const [topProductsMessage, setTopProductsMessage] = useState("");
  const [topProductsLoading, setTopProductsLoading] = useState(false);

  const [period, setPeriod] = useState("this_month");
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
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAll = async () => {
    await Promise.all([
      fetchSummary(dateRange),
      fetchPosSummary(dateRange),
      fetchTopProducts(dateRange),
    ]);
  };

  const fetchSummary = async (range) => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.get("/orders-summary", {
        params: {
          date_from: range.date_from,
          date_to: range.date_to,
        },
      });
      setSummary(res.data);
    } catch (err) {
      console.error("SUMMARY ERROR:", err);
      setMessage(err.response?.data?.message || "Gagal memuat dashboard admin.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosSummary = async (range) => {
    try {
      setPosLoading(true);
      setPosMessage("");
      const res = await api.get("/admin/pos-summary", {
        params: {
          date_from: range.date_from,
          date_to: range.date_to,
        },
      });
      setPosSummary(res.data);
    } catch (err) {
      console.error("POS SUMMARY ERROR:", err);
      setPosMessage(err.response?.data?.message || "Gagal memuat ringkasan POS.");
    } finally {
      setPosLoading(false);
    }
  };

  const fetchTopProducts = async (range) => {
    try {
      setTopProductsLoading(true);
      setTopProductsMessage("");
      const res = await api.get("/admin/top-products", {
        params: {
          date_from: range.date_from,
          date_to: range.date_to,
        },
      });
      setTopProducts(res.data || []);
    } catch (err) {
      console.error("TOP PRODUCTS ERROR:", err);
      setTopProductsMessage(
        err.response?.data?.message || "Gagal memuat produk terlaris."
      );
    } finally {
      setTopProductsLoading(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID");
  };

const dashboardCards = useMemo(
  () => [
    {
      label: "Total Order Online",
      value: summary?.total_orders ?? 0,
      accent: "blue",
    },
    {
      label: "Total Transaksi POS",
      value: posSummary?.pos_totals?.transactions_count ?? 0,
      accent: "orange",
    },
    {
      label: "Revenue Online",
      value: formatPrice(summary?.total_revenue ?? 0),
      accent: "green",
    },
    {
      label: "Revenue POS",
      value: formatPrice(posSummary?.pos_totals?.revenue_pos ?? 0),
      accent: "orange",
    },
  ],
  [summary, posSummary]
);

const shellStyle = {
  display: "grid",
  gap: 20,
  minWidth: 0,
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: isMobile ? 16 : 18,
  padding: isMobile ? 16 : 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  minWidth: 0,
};

const heroCardStyle = {
  ...cardStyle,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  fontSize: 13,
  fontWeight: 500,
  background: "#fff",
  color: "#334155",
  outline: "none",
  minWidth: 0,
};

const softButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #dbeafe",
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};

const sectionSubtextStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.5,
};

const renderNoticeCard = (text, tone = "neutral") => {
  const tones = {
    neutral: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      color: "#334155",
    },
    error: {
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#b91c1c",
    },
  };

  return (
    <div
      style={{
        ...cardStyle,
        ...tones[tone],
        maxWidth: 520,
        margin: "40px auto",
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      {text}
    </div>
  );
};

const renderMetricCard = (item) => {
  const colorMap = {
    blue: {
      background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
      border: "1px solid #dbeafe",
      value: "#1d4ed8",
      soft: "#eff6ff",
    },
    green: {
      background: "linear-gradient(180deg, #f7fcf9 0%, #ffffff 100%)",
      border: "1px solid #d1fae5",
      value: "#15803d",
      soft: "#ecfdf5",
    },
    orange: {
      background: "linear-gradient(180deg, #fffaf5 0%, #ffffff 100%)",
      border: "1px solid #fed7aa",
      value: "#c2410c",
      soft: "#fff7ed",
    },
    purple: {
      background: "linear-gradient(180deg, #faf7ff 0%, #ffffff 100%)",
      border: "1px solid #e9d5ff",
      value: "#7c3aed",
      soft: "#f5f3ff",
    },
  };

  const accent = colorMap[item.accent] || colorMap.blue;

  return (
    <div
      key={item.label}
      style={{
        ...cardStyle,
        background: accent.background,
        border: accent.border,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          color: "#64748b",
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {item.label}
      </p>

      <p
        style={{
          margin: "0 0 8px",
          fontSize: isMobile ? 24 : 28,
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          wordBreak: "break-word",
        }}
      >
        {item.value}
      </p>

      {item.note ? (
        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {item.note}
        </p>
      ) : null}
    </div>
  );
};

const normalizeDailySeries = (rawSeries = []) => {
  if (!Array.isArray(rawSeries) || rawSeries.length === 0) {
    return {
      labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
      values: [],
    };
  }

  return {
    labels: rawSeries.map((item, index) => item?.week || item?.label || `Minggu ${index + 1}`),
    values: rawSeries.map((item) => Number(item?.total ?? item?.value ?? 0)),
  };
};

const onlineSeries = normalizeDailySeries(summary?.daily_orders);
const posSeries = normalizeDailySeries(posSummary?.daily_transactions);

const trendLabels =
  onlineSeries.labels?.length > 0 ? onlineSeries.labels : posSeries.labels;

const trendData = {
  labels: trendLabels,
  online:
    onlineSeries.values?.length > 0
      ? onlineSeries.values
      : new Array(trendLabels.length).fill(0),
  pos:
    posSeries.values?.length > 0
      ? posSeries.values
      : new Array(trendLabels.length).fill(0),
};

const renderBarChart = ({
  title,
  subtitle,
  data,
  labels,
  color = "#2563eb",
  soft = "#dbeafe",
  yTitle = "Jumlah",
}) => {
  const chartHeight = 260;
  const yAxisWidth = 42;
  const xAxisHeight = 34;
  const topPad = 18;
  const bottomPad = 8;

  const maxValue = Math.max(...data, 1);
  const roundedMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const ticks = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax].map(
    (v) => Math.round(v)
  );

  const usableHeight = chartHeight - xAxisHeight - topPad - bottomPad;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          {title}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{subtitle}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${yAxisWidth}px 1fr`,
          gap: 10,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            height: chartHeight,
          }}
        >
          {ticks
            .slice()
            .reverse()
            .map((tick, index) => {
              const stepCount = ticks.length - 1;
              const top = (index / stepCount) * usableHeight + topPad;

              return (
                <div
                  key={`${title}-tick-${tick}-${index}`}
                  style={{
                    position: "absolute",
                    top,
                    right: 0,
                    transform: "translateY(-50%)",
                    fontSize: 11,
                    color: "#94a3b8",
                    lineHeight: 1,
                  }}
                >
                  {tick}
                </div>
              );
            })}
        </div>

        <div
          style={{
            position: "relative",
            height: chartHeight,
          }}
        >
          {ticks.map((tick, index) => {
            const y =
              topPad + usableHeight - (tick / roundedMax) * usableHeight;

            return (
              <div
                key={`${title}-grid-${tick}-${index}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: y,
                  borderTop: "1px dashed #e2e8f0",
                }}
              />
            );
          })}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
              gap: 10,
              alignItems: "end",
              paddingTop: topPad,
              paddingBottom: xAxisHeight,
            }}
          >
            {data.map((value, index) => {
              const barHeight = Math.max(16, (value / roundedMax) * usableHeight);

              return (
                <div
                  key={`${title}-bar-${labels[index]}-${index}`}
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "end",
                    justifyContent: "center",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 42,
                      display: "grid",
                      justifyItems: "center",
                      alignItems: "end",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </span>

                    <div
                      title={`${labels[index]}: ${value}`}
                      style={{
                        width: "100%",
                        height: barHeight,
                        borderRadius: "12px 12px 6px 6px",
                        background: `linear-gradient(180deg, ${soft} 0%, ${color} 100%)`,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
              gap: 10,
              paddingTop: 8,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            {labels.map((label, index) => (
              <div
                key={`${title}-label-${label}-${index}`}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#64748b",
                  lineHeight: 1.2,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
      </div>
    </div>
  );
};

if (loading) {
  return renderNoticeCard("Memuat dashboard...");
}

if (message) {
  return renderNoticeCard(message, "error");
}

if (!summary) {
  return renderNoticeCard("Tidak ada data ringkasan dashboard.");
}

const revenueTotal =
  (summary?.total_revenue ?? 0) + (posSummary?.pos_totals?.revenue_pos ?? 0);

const onlinePercent =
  revenueTotal > 0 ? ((summary?.total_revenue ?? 0) / revenueTotal) * 100 : 0;

const posPercent =
  revenueTotal > 0 ? ((posSummary?.pos_totals?.revenue_pos ?? 0) / revenueTotal) * 100 : 0;

return (
  <div style={shellStyle}>
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
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 24 : 30,
              textAlign: "left",
              color: "#0f172a",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard Penjualan
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

          <button onClick={fetchAll} style={softButtonStyle}>
            Refresh Dashboard
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
        <span style={badgeStyle}>
          Periode: {dateRange.date_from} s/d {dateRange.date_to}
        </span>
        <span style={badgeStyle}>
          Update terakhir: {formatDate(summary.generated_at || new Date())}
        </span>
      </div>
    </section>

<section
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  }}
>
  {dashboardCards.map(renderMetricCard)}
</section>

<section style={cardStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
      flexWrap: "wrap",
      textAlign: "left",
    }}
  >
    <div>
      <h2 style={sectionTitleStyle}>Tren Aktivitas</h2>
    </div>
    <span style={badgeStyle}>Data per minggu</span>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isTablet ? "1fr" : "repeat(2, minmax(0, 1fr))",
      gap: 16,
      alignItems: "start",
    }}
  >
    {renderBarChart({
      title: "Order Online",
      subtitle: "Jumlah order masuk per minggu",
      data: trendData.online,
      labels: trendData.labels,
      color: "#2563eb",
      soft: "#bfdbfe",
      yTitle: "Jumlah Order",
    })}

    {renderBarChart({
      title: "Transaksi POS",
      subtitle: "Jumlah transaksi kasir per minggu",
      data: trendData.pos,
      labels: trendData.labels,
      color: "#ea580c",
      soft: "#fdba74",
      yTitle: "Jumlah Transaksi",
    })}
  </div>
</section>

<section
  style={{
    display: "grid",
    gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 0.92fr) minmax(0, 1.08fr)",
    gap: 16,
    minWidth: 0,
    alignItems: "start",
  }}
>
  <div
    style={{
      ...cardStyle,
      alignSelf: "start",
      display: "grid",
      gap: 14,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
        textAlign: "left",
      }}
    >
      <div>
        <h2 style={sectionTitleStyle}>Shift Aktif</h2>
      </div>

      {posSummary?.period && (
        <span style={badgeStyle}>
          {posSummary.period.date_from} s/d {posSummary.period.date_to}
        </span>
      )}
    </div>

    {posLoading ? (
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        Memuat ringkasan POS...
      </p>
    ) : posMessage ? (
      <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>
        {posMessage}
      </p>
    ) : posSummary?.active_shift ? (
      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          display: "grid",
          gap: 12,
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
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              {posSummary.active_shift.shift_code || "-"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              Kasir: {posSummary.active_shift.cashier_name || "-"}
            </p>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#166534",
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: 999,
              padding: "5px 9px",
              lineHeight: 1,
            }}
          >
            Shift aktif
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>
              Dibuka
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {posSummary.active_shift.opened_at
                ? new Date(posSummary.active_shift.opened_at).toLocaleString("id-ID")
                : "-"}
            </p>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>
              Ditutup
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {posSummary.active_shift.closed_at
                ? new Date(posSummary.active_shift.closed_at).toLocaleString("id-ID")
                : "Masih aktif"}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>
              Revenue POS
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
              {formatPrice(posSummary.active_shift.revenue_pos || 0)}
            </p>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background:
                (posSummary.active_shift.cash_difference || 0) === 0 ? "#f0fdf4" : "#fff7ed",
              border:
                (posSummary.active_shift.cash_difference || 0) === 0
                  ? "1px solid #bbf7d0"
                  : "1px solid #fdba74",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>
              Selisih Kas
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color:
                  (posSummary.active_shift.cash_difference || 0) === 0
                    ? "#166534"
                    : "#9a3412",
              }}
            >
              {formatPrice(posSummary.active_shift.cash_difference || 0)}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          border: "1px dashed #cbd5e1",
          background: "#f8fafc",
          color: "#64748b",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Belum ada shift aktif.
      </div>
    )}
  </div>

  <div
    style={{
      ...cardStyle,
      alignSelf: "start",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
        flexWrap: "wrap",
        textAlign: "left",
      }}
    >
      <div>
        <h2 style={sectionTitleStyle}>Produk Terlaris</h2>
      </div>
    </div>

    {topProductsLoading ? (
      <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
        Memuat produk terlaris...
      </p>
    ) : topProductsMessage ? (
      <p style={{ fontSize: 13, color: "#b91c1c", margin: 0 }}>
        {topProductsMessage}
      </p>
    ) : topProducts.length > 0 ? (
      <div style={{ display: "grid", gap: 12 }}>
        {topProducts.map((prod, index) => (
          <div
            key={prod.product_variant_id || prod.sku || index}
            style={{
              padding: 14,
              borderRadius: 16,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background:
                    index === 0
                      ? "#dbeafe"
                      : index === 1
                      ? "#e0f2fe"
                      : "#f1f5f9",
                  color:
                    index === 0
                      ? "#1d4ed8"
                      : index === 1
                      ? "#0369a1"
                      : "#475569",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                #{index + 1}
              </div>

              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 600,
                    color: "#0f172a",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {prod.product_name || "-"}
                </p>

                {prod.sku && (
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    SKU: {prod.sku}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 999,
                      padding: "4px 8px",
                      fontWeight: 600,
                    }}
                  >
                    POS: {prod.qty_pos || 0}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 999,
                      padding: "4px 8px",
                      fontWeight: 600,
                    }}
                  >
                    Online: {prod.qty_online || 0}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: isMobile ? "left" : "right",
                minWidth: isMobile ? "100%" : 120,
                paddingTop: isMobile ? 6 : 0,
                borderTop: isMobile ? "1px solid #f1f5f9" : "none",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                Total Terjual
              </p>
              <p
                style={{
                  margin: "0 0 6px",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: 16,
                  lineHeight: 1.3,
                }}
              >
                {prod.qty_total || 0}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {formatPrice(prod.revenue_total || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          border: "1px dashed #cbd5e1",
          background: "#f8fafc",
          color: "#64748b",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Belum ada data produk terlaris untuk periode ini.
      </div>
    )}
  </div>
</section>

    <section style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={sectionTitleStyle}>Order Terbaru</h2>
          <p style={sectionSubtextStyle}>
            Daftar pesanan online terbaru yang masuk
          </p>
        </div>

        <button onClick={() => fetchSummary(dateRange)} style={softButtonStyle}>
          Refresh Order Online
        </button>
      </div>

      {summary.recent_orders?.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px dashed #cbd5e1",
            background: "#f8fafc",
            color: "#64748b",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Belum ada pesanan terbaru.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {summary.recent_orders?.map((order) => {
            const statusColor =
              order.status === "completed"
                ? {
                    color: "#166534",
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                  }
                : order.status === "pending"
                ? {
                    color: "#9a3412",
                    background: "#ffedd5",
                    border: "1px solid #fdba74",
                  }
                : order.status === "cancelled"
                ? {
                    color: "#991b1b",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                  }
                : {
                    color: "#334155",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                  };

            return (
              <div
                key={order.id}
                style={{
                  padding: isMobile ? "14px" : "15px 16px",
                  borderRadius: 16,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 6,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: "#0f172a",
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      {order.order_code || "-"}
                    </p>

                    <span
                      style={{
                        ...statusColor,
                        borderRadius: 999,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        lineHeight: 1,
                      }}
                    >
                      {order.status || "-"}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "0 0 4px",
                      color: "#334155",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {order.customer_name || "Pelanggan"}{" "}
                    {order.email ? `· ${order.email}` : ""}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: isMobile ? "left" : "right",
                    minWidth: isMobile ? "100%" : 140,
                    paddingTop: isMobile ? 8 : 0,
                    borderTop: isMobile ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Total Belanja
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: 15,
                      lineHeight: 1.4,
                    }}
                  >
                    {formatPrice(order.grand_total || 0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div>
);
}

export default AdminDashboardPage;
