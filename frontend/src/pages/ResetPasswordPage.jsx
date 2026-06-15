import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const emailFromQuery = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [form, setForm] = useState({
    email: emailFromQuery,
    password: "",
    password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #d8d2ca",
    background: "#fffdfa",
    color: "#2b2620",
    fontSize: 14,
    lineHeight: 1.5,
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    colorScheme: "light",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#5b5248",
    textAlign: "left",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess("");

    try {
      await api.post("/reset-password", {
        token,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setSuccess("Password berhasil direset. Mengarahkan ke halaman login...");
      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setMessage(firstError || "Reset password gagal.");
      } else {
        setMessage(err.response?.data?.message || "Reset password gagal.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Buat password baru"
      description="Masukkan email dan password baru untuk menyelesaikan reset password akun kamu."
      cardMaxWidth={500}
    >
      <div aria-live="polite" style={{ marginBottom: !token || message || success ? 16 : 0 }}>
        {!token && (
          <div
            style={{
              marginBottom: message || success ? 12 : 0,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff4f1",
              color: "#9f2d20",
              border: "1px solid #f1c9c2",
              fontSize: 14,
            }}
          >
            Token reset password tidak ditemukan atau tidak valid.
          </div>
        )}

        {message && (
          <div
            style={{
              marginBottom: success ? 12 : 0,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff4f1",
              color: "#9f2d20",
              border: "1px solid #f1c9c2",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "#f3f0ea",
              color: "#6f5a46",
              border: "1px solid #e4d8cb",
              fontSize: 14,
            }}
          >
            {success}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            name="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Password baru</label>
          <input
            type="password"
            name="password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Konfirmasi password baru</label>
          <input
            type="password"
            name="password_confirmation"
            placeholder="Ulangi password baru"
            value={form.password_confirmation}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          style={{
            padding: "14px 18px",
            border: "none",
            borderRadius: 14,
            background: loading || !token ? "#b9afa3" : "#8b6b4a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading || !token ? "not-allowed" : "pointer",
            fontSize: 15,
            boxShadow: "0 10px 24px rgba(139, 107, 74, 0.18)",
          }}
        >
          {loading ? "Memproses..." : "Simpan Password Baru"}
        </button>
      </form>

      <p
        style={{
          marginTop: 18,
          color: "#7a7066",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        Kembali ke{" "}
        <Link
          to="/login"
          style={{
            color: "#8b6b4a",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          halaman login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPasswordPage;