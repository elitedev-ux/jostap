import { stats } from "./landingData";

export default function StatsBar() {
  return (
    <section className="landing-stats-bar">
      <div className="landing-stats-bar__grid">
        {stats.map((item) => (
          <div className="landing-stats-bar__item" key={item.label}>
            <p>{item.value}</p>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
