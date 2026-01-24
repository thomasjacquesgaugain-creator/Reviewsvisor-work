import { CreditCard, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepHeaderProps {
  currentStep: 1 | 2;
}

export function StepHeader({ currentStep }: StepHeaderProps) {
  const { t } = useTranslation();
  // currentStep === 1 = Abonnement (étape actuelle)
  // currentStep === 2 = Créer un compte (étape actuelle)
  const isSubscriptionActive = currentStep === 1;
  const isCreateAccountActive = currentStep === 2;

  return (
    <div className="flex items-center justify-center gap-6 mb-4">
      {/* Step 1: Créer un compte (à gauche) */}
      <div className="flex items-center gap-3 flex-nowrap">
        <div
          className={`${
            isCreateAccountActive ? 'bg-[#2F4FF7] text-white' : 'bg-transparent text-foreground'
          } rounded-full flex items-center justify-center border ${
            isCreateAccountActive ? 'border-[#2F4FF7]' : 'border-[#E3E8F2]'
          } h-8 w-8 md:h-10 md:w-10 flex-shrink-0`}
        >
          <User className={`${isCreateAccountActive ? 'text-white' : 'text-[#96A0B5]'} h-4 w-4 md:h-5 md:w-5`} />
        </div>
        <span className={`text-sm md:text-base whitespace-nowrap ${isCreateAccountActive ? 'text-[#2F4FF7] font-semibold' : 'text-[#96A0B5]'}`}>
          {t("step.createAccount")}
        </span>
      </div>

      {/* Separator line */}
      <div className="h-px w-10 md:w-14 bg-border flex-shrink-0" />

      {/* Step 2: Abonnement (à droite) */}
      <div className="flex items-center gap-3 flex-nowrap">
        <div
          className={`${
            isSubscriptionActive ? 'bg-[#2F4FF7] text-white' : 'bg-transparent text-foreground'
          } rounded-full flex items-center justify-center border ${
            isSubscriptionActive ? 'border-[#2F4FF7]' : 'border-[#E3E8F2]'
          } h-8 w-8 md:h-10 md:w-10 flex-shrink-0`}
        >
          <CreditCard className={`${isSubscriptionActive ? 'text-white' : 'text-[#96A0B5]'} h-4 w-4 md:h-5 md:w-5`} />
        </div>
        <span className={`text-sm md:text-base whitespace-nowrap ${isSubscriptionActive ? 'text-[#2F4FF7] font-semibold' : 'text-[#96A0B5]'}`}>
          {t("step.subscription")}
        </span>
      </div>
    </div>
  );
}

