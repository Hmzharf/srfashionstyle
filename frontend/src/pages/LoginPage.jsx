import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout, { authFieldStyle, authLabelStyle } from "../components/AuthLayout";

function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const redirectByRole = (user) => {
    if (user.role === "admin" || user.role === "owner") {
      navigate("/admin");
      return;
    }

    if (user.role === "cashier") {
      navigate("/pos/shifts");
      return;
    }

    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/login", form);

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        setMessage("Response login tidak valid.");
        return;
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      window.dispatchEvent(new Event("authUpdated"));

      redirectByRole(user);
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setMessage(firstError || "Login gagal.");
      } else {
        setMessage(err.response?.data?.message || "Login gagal.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke akun"
      description="Masukkan email dan password untuk melanjutkan ke akun kamu."
      cardMaxWidth={460}
    >
      {message && (
        <div
          style={{
            marginBottom: 16,
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

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={authLabelStyle}>Email</label>
          <input
            type="email"
            name="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
            style={authFieldStyle}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <label style={{ ...authLabelStyle, marginBottom: 0 }}>
              Password
            </label>

            <Link
              to="/forgot-password"
              style={{
                fontSize: 13,
                color: "#8b6b4a",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Lupa password?
            </Link>
          </div>

          <input
            type="password"
            name="password"
            placeholder="Masukkan password"
            value={form.password}
            onChange={handleChange}
            style={authFieldStyle}
            autoComplete="current-password"
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
          {loading ? "Memproses..." : "Masuk"}
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
        Belum punya akun?{" "}
        <Link
          to="/register"
          style={{
            color: "#8b6b4a",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Daftar sekarang
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;