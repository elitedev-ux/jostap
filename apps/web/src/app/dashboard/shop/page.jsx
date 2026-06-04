import { Bell, MessageSquareText, QrCode, ShoppingBag, Sparkles, Tags, Watch, Wifi } from "lucide-react";
import "./shop.css";

const products = [
  {
    title: "NFC Wristbands",
    copy: "Tap-to-share wristbands for events, teams, creators, and high-movement networking moments.",
    icon: Watch,
  },
  {
    title: "Smart NFC Wristbands",
    copy: "Advanced wristbands built for richer interactions, campaigns, and premium brand activations.",
    icon: Wifi,
  },
  {
    title: "Review / Feedback Tags",
    copy: "Simple tap points that help customers leave reviews, feedback, and follow-up details faster.",
    icon: MessageSquareText,
  },
  {
    title: "NFC Table Stands",
    copy: "Countertop sharing for restaurants, salons, events, offices, and front-desk experiences.",
    icon: QrCode,
  },
  {
    title: "Additional NFC Solutions",
    copy: "More smart tags, branded touchpoints, and custom NFC tools for growing businesses.",
    icon: Tags,
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

          <h1>More NFC products are coming soon.</h1>
          <p>
            JOSTAP is expanding beyond NFC cards with wearable, tabletop,
            review, and custom NFC solutions designed for everyday business moments.
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

      <section className="shop-coming-soon__grid" aria-label="Upcoming shop products">
        {products.map(({ title, copy, icon: Icon }) => (
          <article className="shop-coming-soon__tile" key={title}>
            <div className="shop-coming-soon__tile-top">
              <span>
                <Icon size={18} />
              </span>
              <strong>Coming Soon</strong>
            </div>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
