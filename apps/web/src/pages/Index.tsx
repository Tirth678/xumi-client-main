import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProductSection from "@/components/ProductSection";
import PreorderStepsSection from "@/components/PreorderStepsSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    document.title = "XUMI - Your personal tiny desk partner | RoboCraft";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "XUMI is your personal tiny desk partner from RoboCraft: 40+ expressions, five moods, focus mode, a clock and little games. Pre-orders are open now."
      );
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen scroll-smooth">
      <Navbar />
      {!isMobile && <HeroSection />}
      <ProductSection />
      <FeaturesSection />
      <PreorderStepsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
