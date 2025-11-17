const Fonctionnalites = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-8 px-4">
        <section className="py-5">
          <div className="relative z-1">
            <div className="max-w-[900px] mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">
                ⭐ Fonctionnalités de <span className="text-blue-600" translate="no">Reviewsvisor</span>
              </h1>
              
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    1. Vision globale de votre réputation
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    Une vue d'ensemble simple et précise pour comprendre immédiatement ce que vos clients pensent de vous.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    2. Analyse intelligente des avis
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    L'IA lit chaque avis et en extrait ce qui compte : sentiments, mots-clés, points forts et points faibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    3. Points d'amélioration prioritaires
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    Nous mettons en avant ce qui pénalise réellement votre note, pour vous guider vers des actions concrètes.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    4. Historique de votre évolution
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    Suivez l'évolution de votre réputation au fil du temps : progrès, tendances, pics d'activité, périodes sensibles.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    5. Centralisation multi-plateforme
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    Tous vos avis regroupés en un seul endroit, automatiquement : Google, Facebook, TripAdvisor, TheFork…
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    6. Rapports faciles à comprendre
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
                    Un résumé clair, envoyé automatiquement, pour vous aider à prendre les bonnes décisions rapidement.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    7. Conseils personnalisés
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-lg">
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
