import { PricingSection } from "@/components/PricingSection";
import { StepHeader } from "@/components/StepHeader";
import BackArrow from "@/components/BackArrow";
import { useAuth } from "@/contexts/AuthProvider";

const Abonnement = () => {
  const { user, loading } = useAuth();
  const isCreator = user?.email === "thomas.jacquesgaugain@gmail.com";

  return (
    <div className="bg-background relative">
      {/* Afficher BackArrow seulement si l'utilisateur n'est pas connecté ou n'est pas le créateur */}
      {!loading && !isCreator && <BackArrow />}

      <div className="container mx-auto px-4 pt-8">
        <StepHeader currentStep={1} />
      </div>
      <PricingSection />
    </div>
  );
};

export default Abonnement;
