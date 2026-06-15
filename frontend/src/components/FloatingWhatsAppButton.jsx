import { useMemo, useState } from "react";

const WHATSAPP_NUMBER = "628986943427";
const WHATSAPP_MESSAGE =
  "Halo, saya mau tanya tentang produk di SR Fashion Style dan ingin melakukan konfirmasi pesanan saya.";

function FloatingWhatsAppButton() {
  const [open, setOpen] = useState(false);

  const waLink = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      WHATSAPP_MESSAGE
    )}`;
  }, []);

  return (
    <div className="wa-widget">
      <div className={`wa-card ${open ? "is-open" : ""}`}>
        <div className="wa-card-header">
          <div className="wa-brand">
            <div className="wa-brand-icon-wrap">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
                alt="WhatsApp"
                className="wa-brand-icon"
              />
            </div>
            <div>
              <h4>SR Fashion Style</h4>
              <p>
                Customer Support <span className="wa-dot" /> Online
              </p>
            </div>
          </div>

          <button
            type="button"
            className="wa-popup-close"
            onClick={() => setOpen(false)}
            aria-label="Tutup popup WhatsApp"
          >
            &times;
          </button>
        </div>

        <div className="wa-card-body">
          <div className="wa-message-bubble">
            Halo 👋 Ada yang bisa kami bantu? Hubungi kami untuk tanya produk
            atau konfirmasi pesanan Anda.
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-popup-btn"
          >
            <span className="wa-popup-btn-icon">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
                alt=""
              />
            </span>
            Chat via WhatsApp
          </a>

          <p className="wa-caption">
            Respon cepat untuk pertanyaan produk dan konfirmasi order.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="wa-float"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Hubungi via WhatsApp"
      >
        <span className="wa-pulse"></span>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
          alt=""
          className="wa-icon"
        />
      </button>
    </div>
  );
}

export default FloatingWhatsAppButton;