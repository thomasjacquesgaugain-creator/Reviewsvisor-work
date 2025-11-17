import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";
import { TrendingUp } from "lucide-react";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-16 px-4">
        <section className="apropos-section">
          <div className="apropos-content">
            <div className="max-w-[800px] mx-auto">
              <h1 className="apropos-title">
                À propos de 
                <span className="apropos-brand">Reviewsvisor</span>
                <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
              </h1>
              
              <div className="text-foreground/90 leading-relaxed space-y-6 text-lg">
                <p className="intro-line">
                  <span className="text-blue">Reviewsvisor</span> est une plateforme d'analyse intelligente des avis clients.
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
          </div>
          
          <div className="apropos-bars">
            <div className="apropos-bar bar-green"></div>
            <div className="apropos-bar bar-pink"></div>
            <div className="apropos-bar bar-blue"></div>
            <div className="apropos-bar bar-violet"></div>
          </div>
          
          {/* Flèche rouge à gauche */}
          <div className="trading-arrow">
            <TrendingUp className="text-red-500" size={56} strokeWidth={3} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default APropos;
