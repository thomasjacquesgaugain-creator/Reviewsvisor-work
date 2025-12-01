import { StepHeader } from "@/components/StepHeader";

const Abonnement = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-8">
        <StepHeader currentStep={1} />
      </div>
      
      <section className="flex flex-col items-center justify-center py-10 px-4">
        <h2 className="text-3xl font-bold mb-4 text-center text-foreground">
          Abonnement Pro — 14 jours gratuits
        </h2>
        <p className="text-muted-foreground mb-8 text-center max-w-2xl">
          Profitez de 14 jours gratuits, puis 179,88 € / an (soit 14,99 € / mois facturés annuellement).
        </p>

        <div className="w-full max-w-[600px]">
          <iframe
            src="https://buy.stripe.com/5kQbJ1dqp0uD6cwb2GgjC03"
            className="w-full rounded-xl shadow-lg"
            style={{ 
              border: 'none', 
              height: '750px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
            allow="payment"
            title="Paiement Stripe"
          />
        </div>
      </section>
    </div>
  );
};

export default Abonnement;
