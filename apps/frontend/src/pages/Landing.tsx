import { useEffect } from "react";
import { BentoGrid } from "../components/landing/BentoGrid";
import { FinalCta } from "../components/landing/FinalCta";
import { HowItWorks } from "../components/landing/HowItWorks";
import { LandingHero } from "../components/landing/LandingHero";
import { ProductPreviewSection } from "../components/landing/ProductPreviewSection";
import { ProblemSolution } from "../components/landing/ProblemSolution";
import { Testimonials } from "../components/landing/Testimonials";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ArewaPay",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Invoice and payment management for African SMEs — clients, multi-currency invoices, payment tracking, and reporting.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "NGN",
  },
};

export function Landing() {
  useEffect(() => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(jsonLd);
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  return (
    <>
      <LandingHero />
      <ProblemSolution />
      <BentoGrid />
      <ProductPreviewSection />
      <HowItWorks />
      <Testimonials />
      <FinalCta />
    </>
  );
}
