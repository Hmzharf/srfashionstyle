import { useEffect, useState } from "react";
import api from "../../lib/axios";

function ProfileOverview() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/me");
        const user = res.data.user || res.data;

        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "",
          postal_code: user.postal_code || "",
        });
      } catch (err) {
        console.error("Gagal memuat profil", err);
        setMessage("Gagal memuat data profil.");
        setMessageType("error");
      } finally {
        setFetching(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.put("/me/profile", form);
      const updatedUser = res.data.user || res.data;

      const currentAuthUser =
        JSON.parse(localStorage.getItem("auth_user") || "null") || {};

      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          ...currentAuthUser,
          ...updatedUser,
        })
      );

      setMessage("Profil berhasil diperbarui.");
      setMessageType("success");
    } catch (err) {
      console.error("Gagal update profil", err);
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const firstError = Object.values(apiErrors)[0]?.[0];
        setMessage(firstError || "Gagal memperbarui profil.");
      } else {
        setMessage(err.response?.data?.message || "Gagal memperbarui profil.");
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage("");

    try {
      await api.put("/me/password", passwordForm);

      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });

      setMessage("Password berhasil diperbarui.");
      setMessageType("success");
    } catch (err) {
      console.error("Gagal update password", err);
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const firstError = Object.values(apiErrors)[0]?.[0];
        setMessage(firstError || "Gagal memperbarui password.");
      } else {
        setMessage(err.response?.data?.message || "Gagal memperbarui password.");
      }
      setMessageType("error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d6d3d1",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    lineHeight: 1.5,
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    colorScheme: "light",
    boxShadow: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    textAlign: "left",
  };

  const sectionCardStyle = {
    background: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
  };

  if (fetching) {
    return (
      <div style={sectionCardStyle}>
        <p style={{ margin: 0, color: "#6b7280" }}>Memuat profil...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <style>{`
        .profile-overview-wrap input,
        .profile-overview-wrap textarea,
        .profile-overview-wrap select {
          background: #ffffff !important;
          color: #111827 !important;
          caret-color: #111827 !important;
          opacity: 1 !important;
        }

        .profile-overview-wrap input::placeholder,
        .profile-overview-wrap textarea::placeholder {
          color: #9ca3af !important;
        }

        .profile-overview-wrap input:-webkit-autofill,
        .profile-overview-wrap input:-webkit-autofill:hover,
        .profile-overview-wrap input:-webkit-autofill:focus,
        .profile-overview-wrap textarea:-webkit-autofill,
        .profile-overview-wrap textarea:-webkit-autofill:hover,
        .profile-overview-wrap textarea:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827 !important;
          caret-color: #111827 !important;
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          transition: background-color 99999s ease-in-out 0s;
          border: 1px solid #d6d3d1 !important;
        }

        .profile-overview-wrap input:focus,
        .profile-overview-wrap textarea:focus {
          border-color: #0f766e !important;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12) !important;
        }

        @media (prefers-color-scheme: dark) {
          .profile-overview-wrap {
            color-scheme: light;
          }
        }
      `}</style>

      <div className="profile-overview-wrap" style={sectionCardStyle}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 20,
            color: "#111827",
            textAlign: "left",
          }}
        >
          Profil & Alamat
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            fontSize: 14,
            color: "#6b7280",
            textAlign: "left",
          }}
        >
          Data ini akan digunakan untuk informasi akun dan pengiriman pesanan.
        </p>

        {message && (
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              borderRadius: 12,
              border:
                messageType === "success"
                  ? "1px solid #c8e3dc"
                  : "1px solid #fecaca",
              background:
                messageType === "success" ? "#eef7f5" : "#fef2f2",
              color: messageType === "success" ? "#14532d" : "#b91c1c",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 14, maxWidth: 640 }}
        >
          <div>
            <label style={labelStyle}>Nama lengkap</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Nomor telepon</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Alamat lengkap</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={4}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>Kota</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Kode pos</label>
              <input
                type="text"
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#9ca3af" : "#0f766e",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              width: "fit-content",
            }}
          >
            {loading ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </form>
      </div>

      <div className="profile-overview-wrap" style={sectionCardStyle}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 8,
            fontSize: 18,
            color: "#111827",
            textAlign: "left",
          }}
        >
          Reset Password
        </h2>

        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            fontSize: 14,
            color: "#6b7280",
            textAlign: "left",
          }}
        >
          Gunakan password yang kuat dan jangan dibagikan ke orang lain.
        </p>

        <form
          onSubmit={handlePasswordSubmit}
          style={{ display: "grid", gap: 14, maxWidth: 640 }}
        >
          <div>
            <label style={labelStyle}>Password saat ini</label>
            <input
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Password baru</label>
            <input
              type="password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Konfirmasi password baru</label>
            <input
              type="password"
              name="new_password_confirmation"
              value={passwordForm.new_password_confirmation}
              onChange={handlePasswordChange}
              style={fieldStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              marginTop: 6,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: passwordLoading ? "#e5e7eb" : "#111827",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: passwordLoading ? "not-allowed" : "pointer",
              width: "fit-content",
            }}
          >
            {passwordLoading ? "Menyimpan..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileOverview;