import logo from "../assets/jostap logo.png3.png";
import "./Footer.css";

export default function Footer() {
  const groups = {
    Product: [
      ["Shop", "/shop"],
      ["Pricing", "/pricing"],
    ],
    Company: [
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Contact", "/contact"],
    ],
    Support: [
      ["FAQ", "/faq"],
      ["Help Center", "/help"],
    ],
    Legal: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Cookies", "/cookies"],
    ],
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer-grid">
          <div>
            <a href="/" className="site-footer__brand">
              <img src={logo} alt="JOSTAP" loading="lazy" decoding="async" />
            </a>
            <p className="site-footer__summary">
              The modern way to share your professional identity. One tap,
              unlimited impressions.
            </p>
          </div>

          {Object.entries(groups).map(([group, links]) => (
            <div key={group}>
              <p className="site-footer__heading">{group}</p>
              <div className="site-footer__links">
                {links.map(([label, href]) => (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="site-footer__bottom">
          <p>(c) {new Date().getFullYear()} JOSTAP NFC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
