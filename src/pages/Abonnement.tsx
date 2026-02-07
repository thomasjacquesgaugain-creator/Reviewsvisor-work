import { PricingSection } from "@/components/PricingSection";
import { StepHeader } from "@/components/StepHeader";
import BackArrow from "@/components/BackArrow";

const Abonnement = () => {
  return (
    <div className="bg-background relative">
      <BackArrow />

      <div className="container mx-auto px-4 pt-8">
        <StepHeader currentStep={1} />
      </div>
      <PricingSection />
    </div>
  );
};

export default Abonnement;
