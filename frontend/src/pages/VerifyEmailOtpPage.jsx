import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import AuthLayout from "../components/AuthLayout";

function VerifyEmailOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (!emailFromState) {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.email) setEmail(parsed.email);
        } catch {}
      }
    }
  }, [emailFromState]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = useMemo(() => otp.join(""), [otp]);
  const isOtpComplete = code.length === 6;

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#5b5248",
    textAlign: "left",
  };

  const helperTextStyle = {
    marginTop: 6,
    fontSize: 12,
    color: "#8a8177",
    lineHeight: 1.5,
  };

  const otpBoxStyle = {
    width: "100%",
    height: 58,
    borderRadius: 14,
    border: "1px solid #d8d2ca",
    background: "#fffdfa",
    color: "#2b2620",
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "light",
    transition: "all 180ms ease",
  };

  const maskEmail = (value) => {
    if (!value || !value.includes("@")) return value || "Email tidak ditemukan";
    const [name, domain] = value.split("@");
    if (name.length <= 2) return `${name[0] || ""}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  };

  const focusInput = (index) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select?.();
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[index] = cleanValue;
    setOtp(next);

    if (cleanValue && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
        return;
      }

      if (index > 0) {
        focusInput(index - 1);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    }

    if (e.key === "ArrowRight" && index < 5) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    e.preventDefault();

    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });

    setOtp(next);

    const focusIndex = Math.min(pasted.length, 5);
    focusInput(focusIndex);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess("");

    try {
      if (code.length !== 6) {
        setMessage("Masukkan 6 digit kode OTP dengan lengkap.");
        setLoading(false);
        return;
      }

      const res = await api.post("/email-verification/verify-otp", { code });

      const updatedUser = res.data?.user;

      if (updatedUser) {
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      } else {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.email_verified_at = new Date().toISOString();
            parsed.requires_email_verification = false;
            localStorage.setItem("auth_user", JSON.stringify(parsed));
          } catch {}
        }
      }

      window.dispatchEvent(new Event("authUpdated"));

      setSuccess("Email berhasil diverifikasi. Mengarahkan ke profil...");
      setTimeout(() => {
        navigate("/profile");
      }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || "Verifikasi OTP gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    setSuccess("");

    try {
      await api.post("/email-verification/resend-otp");
      setSuccess("OTP baru berhasil dikirim ke email.");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      focusInput(0);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verifikasi email"
      description="Masukkan 6 digit kode OTP yang dikirim ke email kamu."
      cardMaxWidth={520}
    >
      <div
        style={{
          marginBottom: 18,
          padding: "14px 16px",
          borderRadius: 14,
          background: "#f6f0e8",
          border: "1px solid #e7ddd1",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#8a8177",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Email tujuan
        </div>
        <div
          style={{
            color: "#2b2620",
            fontSize: 15,
            fontWeight: 700,
            wordBreak: "break-word",
          }}
        >
          {maskEmail(email)}
        </div>
      </div>

      <div aria-live="polite" style={{ marginBottom: message || success ? 16 : 0 }}>
        {message && (
          <div
            role="alert"
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
            role="status"
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

      <form onSubmit={handleSubmit}>
        <label htmlFor="otp-0" style={labelStyle}>
          Kode OTP
        </label>

        <div style={helperTextStyle}>
          Ketik 6 digit kode, atau tempel sekaligus dari email.
        </div>

        <div
          className="verify-otp-grid"
          role="group"
          aria-label="Input kode OTP 6 digit"
          onPaste={handlePaste}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 10,
            marginTop: 12,
            marginBottom: 18,
          }}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              style={otpBoxStyle}
              aria-label={`Digit OTP ke-${index + 1}`}
            />
          ))}
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: "14px 16px",
            borderRadius: 14,
            background: "#f8f4ee",
            border: "1px solid #e7ddd1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#5b5248",
                marginBottom: 3,
              }}
            >
              Status kode
            </div>
            <div
              style={{
                fontSize: 13,
                color: isOtpComplete ? "#6f5a46" : "#8a8177",
              }}
            >
              {isOtpComplete
                ? "Kode OTP sudah lengkap dan siap diverifikasi."
                : `Masih kurang ${6 - code.length} digit.`}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOtp(["", "", "", "", "", ""]);
              setMessage("");
              setSuccess("");
              focusInput(0);
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#8b6b4a",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              fontSize: 14,
            }}
          >
            Reset kode
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !isOtpComplete}
          style={{
            width: "100%",
            padding: "14px 18px",
            border: "none",
            borderRadius: 14,
            background: loading || !isOtpComplete ? "#b9afa3" : "#8b6b4a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading || !isOtpComplete ? "not-allowed" : "pointer",
            fontSize: 15,
            boxShadow: "0 10px 24px rgba(139, 107, 74, 0.18)",
          }}
        >
          {loading ? "Memverifikasi..." : "Verifikasi OTP"}
        </button>
      </form>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || countdown > 0}
          style={{
            border: "none",
            background: "transparent",
            color: countdown > 0 ? "#b9afa3" : "#8b6b4a",
            fontWeight: 700,
            cursor: resending || countdown > 0 ? "not-allowed" : "pointer",
            padding: 0,
            fontSize: 14,
          }}
        >
          {resending
            ? "Mengirim..."
            : countdown > 0
            ? `Kirim ulang dalam ${countdown} dtk`
            : "Kirim ulang OTP"}
        </button>

        <span style={{ color: "#c4b7a8" }}>•</span>

        <Link
          to="/login"
          style={{
            color: "#7a7066",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Kembali ke login
        </Link>
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailOtpPage;