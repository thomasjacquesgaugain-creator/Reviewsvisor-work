import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";

const APropos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-0 px-4">
        <section className="py-5 pb-0">
          <div className="relative z-1">
            <div className="max-w-[800px] mx-auto">
              <h1 className="apropos-title">
                À propos de 
                <span className="apropos-brand">Reviewsvisor</span>
                <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
              </h1>
              
              <div className="text-foreground/90 leading-relaxed space-y-3 text-lg mb-2">
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
                  Restaurants, hôtels, commerces : <span className="text-green">prenez les meilleures décisions grâce à vos propres données</span>.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-3 text-foreground">Notre mission</h2>
                
                <p>
                  Chez <span className="text-blue">Reviewsvisor</span>, notre objectif est simple : aider chaque établissement à comprendre ce que ressentent réellement ses clients. Nous croyons que chaque <span className="text-green">avis contient une opportunité d'évolution</span>, et que les données bien analysées peuvent devenir un véritable <span className="text-green">moteur de croissance</span>.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-3 text-foreground">Pourquoi nous avons créé <span className="text-blue">Reviewsvisor</span></h2>
                
                <p>
                  Les restaurateurs, hôteliers et commerçants reçoivent chaque jour des avis, mais ont rarement le temps de les analyser en profondeur. Les plateformes sont nombreuses, les commentaires s'accumulent, et il devient difficile d'identifier rapidement ce qui fonctionne… ou ce qui doit être amélioré.
                </p>

                <p>
                  C'est pour résoudre ce problème que <span className="text-blue">Reviewsvisor</span> a été conçu :<br />
                  👉 Un outil simple,<br />
                  👉 Une analyse intelligente,<br />
                  👉 Une vision claire,<br />
                  👉 Et des actions concrètes.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-3 text-foreground">Notre technologie</h2>
                
                <p>
                  <span className="text-blue">Reviewsvisor</span> utilise un modèle d'analyse avancé capable de comprendre le ton, l'émotion et les sujets importants dans chaque commentaire. L'outil identifie automatiquement les tendances, détecte les points forts récurrents et met en avant les axes d'amélioration prioritaires.
                </p>

                <p>
                  Plus qu'un simple tableau de bord, <span className="text-blue">Reviewsvisor</span> est un véritable <span className="text-green">assistant d'amélioration continue</span> pour votre établissement.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-3 text-foreground">Une plateforme pensée pour vous</h2>
                
                <p>
                  Que vous soyez un restaurant, un hôtel ou un commerce, <span className="text-blue">Reviewsvisor</span> s'adapte à votre quotidien. Notre interface a été conçue pour être intuitive, rapide et efficace, même pour les utilisateurs les moins technophiles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default APropos;
