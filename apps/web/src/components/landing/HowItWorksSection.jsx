import websiteMockup from "../../assets/website design (1).png";
import { steps } from "./landingData";

export default function HowItWorksSection() {
  return (
    <section className="landing-section landing-section--muted">
      <div className="landing-section__inner landing-how">
        <div className="landing-how__content">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">How it works</span>
            <h2>Up and running in minutes</h2>
            <p>Order your card, build your profile, and start sharing it everywhere your business goes.</p>
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

        <div className="landing-how__mockup">
          <img
            src={websiteMockup}
            alt="JOSTAP website profile design mockup"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
