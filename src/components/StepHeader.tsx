interface StepHeaderProps {
  currentStep: 1 | 2;
}

export function StepHeader({ currentStep }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {/* Step 1 */}
      <span 
        className={`text-sm ${
          currentStep === 1 
            ? 'text-[#2F4FF7] font-semibold' 
            : 'text-[#96A0B5]'
        }`}
      >
        1. Abonnement
      </span>

      {/* Separator */}
      <span className="text-[#BCC3CF]">›</span>

      {/* Step 2 */}
      <span 
        className={`text-sm ${
          currentStep === 2 
            ? 'text-[#2F4FF7] font-semibold' 
            : 'text-[#96A0B5]'
        }`}
      >
        2. Créer un compte
      </span>
    </div>
  );
}
