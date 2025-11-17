import logoReviewsvisor from "@/assets/logo-reviewsvisor.png";

const Fonctionnalites = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-0 px-4">
        <section className="py-5 pb-0">
          <div className="relative z-1">
            <div className="max-w-[800px] mx-auto">
              <h1 className="apropos-title">
                Fonctionnalités de 
                <span className="apropos-brand">Reviewsvisor</span>
                <img src={logoReviewsvisor} alt="Logo Reviewsvisor" className="apropos-logo" />
              </h1>
              
              <div className="text-foreground/90 leading-relaxed space-y-6 text-lg mb-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    1. <span className="text-green">Vision globale de votre réputation</span>
                  </h2>
                  <p>
                    Une vue d'ensemble simple et précise pour comprendre immédiatement <span className="text-green">ce que vos clients pensent de vous</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    2. <span className="text-green">Analyse intelligente des avis</span>
                  </h2>
                  <p>
                    L'IA lit chaque avis et en extrait ce qui compte : <span className="text-green">sentiments, mots-clés, points forts et points faibles</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    3. <span className="text-green">Points d'amélioration prioritaires</span>
                  </h2>
                  <p>
                    Nous mettons en avant <span className="text-green">ce qui pénalise réellement votre note</span>, pour vous guider vers des actions concrètes.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    4. Historique de votre évolution
                  </h2>
                  <p>
                    Suivez l'<span className="text-green">évolution de votre réputation</span> au fil du temps : progrès, <span className="text-green">tendances, pics d'activité</span>, périodes sensibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    5. Centralisation multi-plateforme
                  </h2>
                  <p>
                    <span className="text-green">Tous vos avis regroupés en un seul endroit</span>, automatiquement : <span className="text-green">Google, Facebook, TripAdvisor, TheFork…</span>
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    6. Rapports faciles à comprendre
                  </h2>
                  <p>
                    Un <span className="text-green">résumé clair</span>, envoyé automatiquement, pour vous aider à <span className="text-green">prendre les bonnes décisions rapidement</span>.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">
                    7. <span className="text-green">Conseils personnalisés</span>
                  </h2>
                  <p>
                    Des <span className="text-green">recommandations adaptées à votre établissement</span> pour améliorer l'expérience client et votre note.
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
