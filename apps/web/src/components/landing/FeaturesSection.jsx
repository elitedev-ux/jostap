import {
  BarChart3,
  Globe,
  Share2,
  Smartphone,
  Users,
  Wifi,
} from "lucide-react";
import { features } from "./landingData";

const featureIcons = {
  smartphone: Smartphone,
  barChart: BarChart3,
  share: Share2,
  globe: Globe,
  users: Users,
  wifi: Wifi,
};

export default function FeaturesSection() {
  return (
    <section className="landing-section landing-section--contained" id="features">
      <div className="landing-section-heading">
        <span className="landing-eyebrow">Platform Features</span>
        <h2>Everything you need to network smarter</h2>
        <p>
          Built for professionals who understand that first impressions extend
          beyond the room.
        </p>
      </div>

      <div className="landing-feature-grid">
        {features.map((feature) => {
          const Icon = featureIcons[feature.icon];

          return (
            <article className="landing-feature-card" key={feature.title}>
              <div className="landing-feature-card__icon">
                <Icon size={20} color="#2563EB" />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
