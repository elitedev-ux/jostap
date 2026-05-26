import logo from "../assets/jostap logo.png3.png";

export default function Footer() {
  const groups = {
    Product: [
      ["Features", "/#features"],
      ["Pricing", "/pricing"],
      ["Templates", "/templates"],
    ],
    Company: [
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Contact", "/contact"],
    ],
    Support: [
      ["FAQ", "/faq"],
      ["Help Center", "/help"],
      ["Status", "/status"],
    ],
    Legal: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Cookies", "/cookies"],
    ],
  };

  return (
    <footer
      style={{
        backgroundColor: "#fff",
        borderTop: "1px solid #E5E7EB",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "56px clamp(18px,5vw,64px) 32px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="site-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 48,
          }}
        >
          <div>
            <a
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <img
                src={logo}
                alt="JOSTAP"
                style={{
                  display: "block",
                  height: 40,
                  width: 100,
                  objectFit: "contain",
                  objectPosition: "left center",
                }}
              />
            </a>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 1.65,
                maxWidth: 200,
              }}
            >
              The modern way to share your professional identity. One tap —
              unlimited impressions.
            </p>
          </div>
          {Object.entries(groups).map(([group, links]) => (
            <div key={group}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {group}
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {links.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    style={{
                      fontSize: 13,
                      color: "#6B7280",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#111827")}
                    onMouseLeave={(e) => (e.target.style.color = "#6B7280")}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            © {new Date().getFullYear()} JOSTAP NFC. All rights reserved.
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#6B7280",
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "inline-block",
              }}
            />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
