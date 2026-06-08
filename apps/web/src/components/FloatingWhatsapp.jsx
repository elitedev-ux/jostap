import { SiWhatsapp } from "react-icons/si";
import "./FloatingWhatsapp.css";

const WHATSAPP_URL = "https://wa.me/2348066613437?text=Hi,%20I%27m%20interested%20in%20JOSTAP.";

export default function FloatingWhatsapp() {
  return (
    <a
      className="floating-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with JOSTAP on WhatsApp"
    >
      <span className="floating-whatsapp__icon" aria-hidden="true">
        <SiWhatsapp size={24} />
      </span>
      <span className="floating-whatsapp__label">Chat with us</span>
    </a>
  );
}
