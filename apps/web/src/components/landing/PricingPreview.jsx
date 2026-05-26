import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { plans } from "./landingData";

const billingOptions = ["monthly", "yearly"];

const planSlugs = {
  Starter: "starter",
  Professional: "professional",
  "Business Suite": "business",
};

export default function PricingPreview() {
  const [billing, setBilling] = useState("monthly");

  return (
    <section className="landing-section landing-section--contained">
      <div className="landing-section-heading">
        <h2>Simple, transparent pricing</h2>
        <p>Start free, scale as you grow. No hidden fees.</p>

        <div className="landing-billing-toggle" role="group" aria-label="Billing period">
          {billingOptions.map((option) => (
            <button
              className={billing === option ? "is-active" : undefined}
              key={option}
              onClick={() => setBilling(option)}
              type="button"
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
              {option === "yearly" && <span>-20%</span>}
            </button>
          ))}
        </div>
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
              <span>${plan.price[billing]}</span>
              <span>/mo</span>
            </div>
            <p className="landing-plan-card__desc">{plan.desc}</p>

            <a
              className="landing-plan-card__cta"
              href={`/checkout?plan=${planSlugs[plan.name]}&billing=${billing}`}
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
