import { ChevronDown } from "lucide-react";
import { faqs } from "./landingData";

export default function FaqSection() {
  return (
    <section className="landing-section landing-section--faq">
      <div className="landing-section__inner">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">FAQ</span>
          <h2>Frequently asked questions</h2>
          <p>Everything buyers usually ask before ordering their JOSTAP card.</p>
        </div>

        <div className="landing-faq-list">
          {faqs.map((faq, index) => (
            <details className="landing-faq-item" key={faq.question} open={index === 0}>
              <summary>
                <span>{faq.question}</span>
                <ChevronDown size={17} />
              </summary>
              {faq.answer.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
