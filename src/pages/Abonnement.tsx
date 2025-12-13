import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PricingSection } from "@/components/PricingSection";
import { StepHeader } from "@/components/StepHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Abonnement = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Flèche de retour */}
      <div className="absolute top-4 left-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/" className="inline-block">
                <ArrowLeft className="h-6 w-6 text-primary hover:text-primary/80 cursor-pointer transition-colors" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Retour à l'accueil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="container mx-auto px-4 pt-8">
        <StepHeader currentStep={1} />
      </div>
      <PricingSection />
    </div>
  );
};

export default Abonnement;
