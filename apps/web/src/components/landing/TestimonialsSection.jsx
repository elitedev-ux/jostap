import { Star } from "lucide-react";
import { testimonials } from "./landingData";

export default function TestimonialsSection() {
  return (
    <section className="landing-section landing-section--muted landing-section--no-bottom-border">
      <div className="landing-section__inner">
        <div className="landing-section-heading">
          <h2>Trusted by professionals worldwide</h2>
        </div>

        <div className="landing-testimonials">
          {testimonials.map((testimonial) => (
            <article className="landing-testimonial-card" key={testimonial.name}>
              <div className="landing-testimonial-card__stars">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    fill="#F59E0B"
                    color="#F59E0B"
                  />
                ))}
              </div>
              <p>"{testimonial.body}"</p>
              <div className="landing-testimonial-card__person">
                <div>{testimonial.avatar}</div>
                <div>
                  <p>{testimonial.name}</p>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
