import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-16 px-4">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
            À propos de Reviewsvisor
          </h1>
          
          <div className="text-foreground/90 leading-relaxed space-y-6 text-lg">
            <p>
              Reviewsvisor est une plateforme d'analyse intelligente des avis clients.
            </p>
            
            <p>
              Un outil, une centralisation pour votre établissement qui transforme vos retours en conception.
            </p>
            
            <p>
              Notre technologie transforme vos avis clients en insights précis pour vous aider à améliorer l'expérience, augmenter votre note en ligne et optimiser vos services au sein de votre établissement, vos avis deviennent maintenant une source de croissance.
            </p>
            
            <p>
              Restaurants, hôtels, commerces : prenez les meilleures décisions grâce à vos propres données.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default APropos;
