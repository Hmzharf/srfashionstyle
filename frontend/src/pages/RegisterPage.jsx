import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      const res = await api.post("/register", form);

      const token = res.data?.token;
      const user = res.data?.user;

      if (token) {
        localStorage.setItem("auth_token", token);
      }

      if (user) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }

      window.dispatchEvent(new Event("authUpdated"));

      navigate("/verify-email-otp", {
        state: {
          email: form.email,
        },
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setMessage(firstError || "Register gagal.");
      } else {
        setMessage(err.response?.data?.message || "Register gagal.");
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <AuthLayout
      title="Buat akun baru"
      description="Lengkapi data berikut untuk membuat akun customer baru."
      cardMaxWidth={520}
    >
      <div aria-live="polite" style={{ marginBottom: message ? 16 : 0 }}>
        {message && (
          <div
            style={{
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
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={labelStyle}>Nama lengkap</label>
          <input
            type="text"
            name="name"
            placeholder="Masukkan nama lengkap"
            value={form.name}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="name"
            required
          />
        </div>

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
          <label style={labelStyle}>Nomor telepon</label>
          <input
            type="tel"
            name="phone"
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="tel"
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
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
          <label style={labelStyle}>Konfirmasi password</label>
          <input
            type="password"
            name="password_confirmation"
            placeholder="Ulangi password"
            value={form.password_confirmation}
            onChange={handleChange}
            style={fieldStyle}
            autoComplete="new-password"
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
            marginTop: 4,
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
          {loading ? "Memproses..." : "Daftar"}
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
        Sudah punya akun?{" "}
        <Link
          to="/login"
          style={{
            color: "#8b6b4a",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;