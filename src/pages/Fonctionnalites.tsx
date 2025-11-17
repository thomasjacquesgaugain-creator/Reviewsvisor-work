import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";

const Fonctionnalites = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-0 px-4">
        <section className="py-5 pb-0">
          <div className="relative z-1">
            <div className="max-w-[800px] mx-auto">
              <h1 className="apropos-title">
                ⭐️ Fonctionnalités de 
                <span className="apropos-brand">Reviewsvisor</span>
                <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
              </h1>
              
              <div className="text-foreground/90 leading-relaxed space-y-6 text-lg mb-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    1. Vision globale de votre réputation
                  </h2>
                  <p>
                    Une vue d'ensemble simple et précise pour comprendre immédiatement ce que vos clients pensent de vous.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    2. Analyse intelligente des avis
                  </h2>
                  <p>
                    L'IA lit chaque avis et en extrait ce qui compte : sentiments, mots-clés, points forts et points faibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    3. Points d'amélioration prioritaires
                  </h2>
                  <p>
                    Nous mettons en avant ce qui pénalise réellement votre note, pour vous guider vers des actions concrètes.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    4. Historique de votre évolution
                  </h2>
                  <p>
                    Suivez l'évolution de votre réputation au fil du temps : progrès, tendances, pics d'activité, périodes sensibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    5. Centralisation multi-plateforme
                  </h2>
                  <p>
                    Tous vos avis regroupés en un seul endroit, automatiquement : Google, Facebook, TripAdvisor, TheFork…
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    6. Rapports faciles à comprendre
                  </h2>
                  <p>
                    Un résumé clair, envoyé automatiquement, pour vous aider à prendre les bonnes décisions rapidement.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    7. Conseils personnalisés
                  </h2>
                  <p>
                    Des recommandations adaptées à votre établissement pour améliorer l'expérience client et votre note.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Fonctionnalites;
