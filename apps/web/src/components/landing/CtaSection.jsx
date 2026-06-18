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
            href="/checkout?plan=jostap_nfc&billing=one_time"
          >
            Order JOSTAP Card <ArrowRight size={16} />
          </a>
          <a className="landing-button landing-button--outline" href="/contact">
            Talk to Sales
          </a>
        </div>
        <p>Secure Paystack checkout. Premium access included. No setup fees.</p>
      </div>
    </section>
  );
}
