import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="landing-cta">
      <div>
        <h2>Ready to make every tap count?</h2>
        <p>Join thousands of professionals who have switched to digital.</p>
        <div className="landing-actions">
          <a
            className="landing-button landing-button--primary"
            href="/checkout?plan=professional&billing=monthly"
          >
            Start Free Trial <ArrowRight size={16} />
          </a>
          <a className="landing-button landing-button--outline" href="/contact">
            Talk to Sales
          </a>
        </div>
        <p>14-day free trial · Cancel anytime · No setup fees</p>
      </div>
    </section>
  );
}
