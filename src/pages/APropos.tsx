import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-16 px-4">
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
          
          <svg className="apropos-arrow" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>
            <path
              d="M 0 180 Q 100 160, 200 100 T 380 40"
              stroke="#ef4444"
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        </section>
      </main>
    </div>
  );
};

export default APropos;
