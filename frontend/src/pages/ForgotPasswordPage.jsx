import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess("");

    try {
      const res = await api.post("/forgot-password", { email });
      setSuccess(
        res.data?.message ||
          "Jika email terdaftar, link reset password telah dikirim."
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Gagal mengirim permintaan reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lupa password"
      description="Masukkan email akun kamu untuk menerima link reset password."
      cardMaxWidth={460}
    >
      <div aria-live="polite" style={{ marginBottom: message || success ? 16 : 0 }}>
        {message && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff4f1",
              color: "#9f2d20",
              border: "1px solid #f1c9c2",
              fontSize: 14,
              marginBottom: success ? 12 : 0,
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
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
            autoComplete="email"
            required
          />
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px dashed #ddd3c8",
            background: "#f8f4ee",
            color: "#8a8177",
            fontSize: 13,
          }}
        >
          Area verifikasi robot / Turnstile / reCAPTCHA.
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 18px",
            border: "none",
            borderRadius: 14,
            background: loading ? "#b9afa3" : "#8b6b4a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
            boxShadow: "0 10px 24px rgba(139, 107, 74, 0.18)",
          }}
        >
          {loading ? "Mengirim..." : "Kirim Link Reset"}
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
        Sudah ingat password?{" "}
        <Link
          to="/login"
          style={{
            color: "#8b6b4a",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Kembali ke login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;