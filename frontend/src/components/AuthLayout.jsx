import React from "react";

export const authFieldStyle = {
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

export const authLabelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#5b5248",
  textAlign: "left",
};

export const authPrimaryButtonStyle = (disabled) => ({
  padding: "14px 18px",
  border: "none",
  borderRadius: 14,
  background: disabled ? "#b9afa3" : "#8b6b4a",
  color: "#fff",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 15,
  boxShadow: "0 10px 24px rgba(139, 107, 74, 0.18)",
});

export const authLinkStyle = {
  color: "#8b6b4a",
  fontWeight: 700,
  textDecoration: "none",
};

function AuthLayout({
  title,
  subtitle,
  children,
  maxWidth = 460,
  showBrand = true,
}) {
  return (
    <div
      className="auth-page-wrap"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #f8f4ee 0%, #f4efe7 48%, #f7f3ec 100%)",
        fontFamily: "Inter, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 20,
        colorScheme: "light",
      }}
    >
      <style>{`
        .auth-page-wrap,
        .auth-page-wrap * {
          color-scheme: light;
        }

        .auth-page-wrap input,
        .auth-page-wrap textarea,
        .auth-page-wrap select {
          background: #fffdfa !important;
          color: #2b2620 !important;
          caret-color: #2b2620 !important;
          opacity: 1 !important;
        }

        .auth-page-wrap input::placeholder {
          color: #a39a90 !important;
        }

        .auth-page-wrap input:-webkit-autofill,
        .auth-page-wrap input:-webkit-autofill:hover,
        .auth-page-wrap input:-webkit-autofill:focus {
          -webkit-text-fill-color: #2b2620 !important;
          caret-color: #2b2620 !important;
          -webkit-box-shadow: 0 0 0 1000px #fffdfa inset !important;
          box-shadow: 0 0 0 1000px #fffdfa inset !important;
          border: 1px solid #d8d2ca !important;
          transition: background-color 99999s ease-in-out 0s;
        }

        .auth-page-wrap input:focus {
          border-color: #b8a898 !important;
          box-shadow: 0 0 0 3px rgba(184, 168, 152, 0.18) !important;
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 24px !important;
            border-radius: 22px !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "rgba(214, 196, 176, 0.26)",
          filter: "blur(32px)",
          top: -70,
          left: -70,
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(235, 224, 210, 0.55)",
          filter: "blur(26px)",
          bottom: -40,
          right: -30,
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.52), transparent 18%), radial-gradient(circle at 82% 76%, rgba(255,255,255,0.38), transparent 16%)",
        }}
      />

      <div
        className="auth-card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth,
          padding: 34,
          borderRadius: 28,
          background: "rgba(255, 252, 248, 0.90)",
          border: "1px solid #e5ddd2",
          boxShadow: "0 24px 70px rgba(88, 72, 60, 0.10)",
          backdropFilter: "blur(10px)",
        }}
      >
        {(showBrand || title || subtitle) && (
          <div style={{ marginBottom: 22, textAlign: "left" }}>
            {showBrand && (
              <div
                style={{
                  display: "inline-block",
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "#f1e9df",
                  border: "1px solid #e1d7cb",
                  color: "#7a6857",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                SRFashionStyle
              </div>
            )}

            {title && (
              <h1
                style={{
                  margin: showBrand ? "16px 0 8px" : "0 0 8px",
                  fontSize: 30,
                  lineHeight: 1.15,
                  color: "#2b2620",
                  fontWeight: 800,
                }}
              >
                {title}
              </h1>
            )}

            {subtitle && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#7a7066",
                  maxWidth: 400,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default AuthLayout;