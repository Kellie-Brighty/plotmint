import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import ComparisonTable from "../components/ComparisonTable";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";

const LandingPage = () => {
  useEffect(() => {
    // Set page title
    document.title = "PlotMint - Decentralized Storytelling Platform";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col w-full">
        <Hero />
        <Features />
        <HowItWorks />
        <ComparisonTable />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
