import Footer from "../Footer";
import Navbar from "../Navbar";
import CtaSection from "./CtaSection";
import FeaturesSection from "./FeaturesSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import PricingPreview from "./PricingPreview";
import StatsBar from "./StatsBar";
import TestimonialsSection from "./TestimonialsSection";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingPreview />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
