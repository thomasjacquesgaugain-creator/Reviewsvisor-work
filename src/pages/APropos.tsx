import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-16 px-4">
        <div className="max-w-[800px] mx-auto">
          <h1 className="apropos-title">
            À propos de 
            <span className="apropos-brand">Reviewsvisor</span>
            <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
          </h1>
          
          <div className="text-foreground/90 leading-relaxed space-y-6 text-lg">
            <p className="intro-line">
              <span className="text-blue">Reviewsvisor</span>
              <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="rv-inline-logo" />
              est une plateforme d'analyse intelligente des avis clients.
            </p>
            
            <p>
              <span className="text-green">Un outil, une centralisation</span> pour votre établissement qui transforme <span className="text-green">vos retours en conception</span>.
            </p>
            
            <p>
              Notre technologie transforme vos avis clients en insights précis pour vous aider à améliorer l'expérience, augmenter votre note en ligne et optimiser vos services au sein de votre établissement, <span className="text-green">vos avis deviennent maintenant une source de croissance</span>.
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
