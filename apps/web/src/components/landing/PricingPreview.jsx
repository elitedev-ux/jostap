import { Check, ChevronRight } from "lucide-react";
import { plans } from "./landingData";

export default function PricingPreview() {
  return (
    <section className="landing-section landing-section--contained">
      <div className="landing-section-heading">
        <h2>JOSTAP pricing</h2>
        <p>Start free, then order an NFC card when you are ready.</p>
      </div>

      <div className="landing-pricing-grid">
        {plans.map((plan) => (
          <article
            className={`landing-plan-card${plan.highlight ? " landing-plan-card--highlight" : ""}`}
            key={plan.name}
          >
            {plan.badge && <span className="landing-plan-card__badge">{plan.badge}</span>}

            <p className="landing-plan-card__name">{plan.name}</p>
            <div className="landing-plan-card__price">
              <span>{plan.price}</span>
              {plan.note && <span>{plan.note}</span>}
            </div>
            <p className="landing-plan-card__desc">{plan.desc}</p>

            <a
              className="landing-plan-card__cta"
              href={plan.href}
            >
              {plan.cta}
            </a>

            <div className="landing-plan-card__features">
              {plan.features.map((feature) => (
                <div key={feature}>
                  <Check size={14} color="#2563EB" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="landing-pricing-link">
        <a href="/pricing">
          Compare all features <ChevronRight size={14} />
        </a>
      </div>
    </section>
  );
}
