import { PricingSection } from "@/components/PricingSection";
import { StepHeader } from "@/components/StepHeader";

const Abonnement = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-8">
        <StepHeader currentStep={1} />
      </div>
      <PricingSection />
    </div>
  );
};

export default Abonnement;
