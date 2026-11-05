import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProductSection from "@/components/ProductSection";
import PreorderStepsSection from "@/components/PreorderStepsSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
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

  // On mobile, skip the hero and jump straight to the Meet XUMI section
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const product = document.getElementById("product");
    if (product) {
      product.scrollIntoView({ behavior: "instant" });
    }
  }, []);

  return (
    <div className="min-h-screen scroll-smooth">
      <Navbar />
      <HeroSection />
      <ProductSection />
      <FeaturesSection />
      <PreorderStepsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
