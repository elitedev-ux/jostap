import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does a JOSTAP NFC card work?",
    answer:
      "Tap the card on a supported phone and your digital profile opens instantly. You can also share the same profile with your QR code or direct link.",
  },
  {
    question: "Can I order a card for someone else?",
    answer:
      "Yes. During checkout, use the card name for the card you are creating. That name is used for the card slug, even if the profile belongs to someone else.",
  },
  {
    question: "What happens after payment?",
    answer:
      "You receive an order confirmation with your order ID. Send that ID on WhatsApp so the team can match your payment, card type, and delivery details.",
  },
  {
    question: "Can I update my profile after printing?",
    answer:
      "Yes. The card points to your live JOSTAP profile, so you can update links, phone numbers, portfolio items, and booking details without reprinting.",
  },
];

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
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
