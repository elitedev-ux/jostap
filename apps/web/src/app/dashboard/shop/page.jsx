import { Bell, CreditCard, QrCode, ShoppingBag, Sparkles, Wifi } from "lucide-react";
import "./shop.css";

const products = [
  {
    title: "Premium NFC Cards",
    copy: "Order branded JOSTAP cards for yourself or your team.",
    icon: CreditCard,
  },
  {
    title: "QR Accessories",
    copy: "Stickers, table stands, and printed touchpoints for easy sharing.",
    icon: QrCode,
  },
  {
    title: "Smart Tap Add-ons",
    copy: "Tools and upgrades built around faster in-person networking.",
    icon: Wifi,
  },
];

export default function ShopPage() {
  return (
    <div className="shop-coming-soon">
      <section className="shop-coming-soon__hero">
        <div className="shop-coming-soon__content">
          <span className="shop-coming-soon__eyebrow">
            <ShoppingBag size={15} />
            JOSTAP Shop
          </span>

          <h1>Smart card essentials are on the way.</h1>
          <p>
            The shop will bring NFC cards, QR accessories, replacement cards,
            and premium profile add-ons into one simple checkout experience.
          </p>

          <div className="shop-coming-soon__actions">
            <button type="button" disabled>
              <Bell size={16} />
              Coming Soon
            </button>
            <span>Launch updates will appear in your dashboard.</span>
          </div>
        </div>

        <div className="shop-coming-soon__showcase" aria-hidden="true">
          <div className="shop-card-stack">
            <div className="shop-card-stack__card shop-card-stack__card--back" />
            <div className="shop-card-stack__card shop-card-stack__card--front">
              <div className="shop-card-stack__brand">
                <Sparkles size={15} />
                JOSTAP
              </div>
              <div className="shop-card-stack__chip" />
              <div className="shop-card-stack__lines">
                <span />
                <span />
              </div>
              <div className="shop-card-stack__tap">
                <Wifi size={18} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-coming-soon__grid" aria-label="Upcoming shop categories">
        {products.map(({ title, copy, icon: Icon }) => (
          <article className="shop-coming-soon__tile" key={title}>
            <span>
              <Icon size={18} />
            </span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
