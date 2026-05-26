import socialMockup from "../../assets/JOSTAP Design (3).png";
import { steps } from "./landingData";

export default function HowItWorksSection() {
  return (
    <section className="landing-section landing-section--muted">
      <div className="landing-section__inner">
        <div className="landing-section-heading">
          <h2>Up and running in minutes</h2>
          <p>Three steps from unboxing to sharing.</p>
        </div>

        <div className="landing-steps__mockup">
          <img
            src={socialMockup}
            alt="JOSTAP mobile profile and NFC card mockup"
          />
        </div>

        <div className="landing-steps">
          {steps.map((step) => (
            <article className="landing-step-card" key={step.step}>
              <span>{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
