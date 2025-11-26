// Section "Pourquoi Reviewsvisor fonctionne ?"
// Version avec largeur max et contenu centré même en plein écran

export function WhyReviewsvisor() {
  return (
    <section className="w-full flex justify-center px-4 py-12 lg:py-16">
      {/* Le conteneur bleu est limité en largeur et centré */}
      <div className="w-full max-w-5xl rounded-[40px] bg-[#2555FF] text-white px-6 py-10 lg:px-10 lg:py-12 shadow-xl">
        <h2 className="text-2xl lg:text-3xl font-bold mb-8">
          💡 Pourquoi Reviewsvisor fonctionne ?
        </h2>

        <div className="grid gap-8 lg:grid-cols-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">⚡ Analyse éclair</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor transforme vos avis en insights en quelques secondes,
              vous permettant de prendre des décisions rapides et fiables.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🎯 Actionnable immédiatement</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor ne se contente pas d'identifier des problèmes… il propose
              des solutions. Des priorités claires. Des résultats mesurables.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🧠 Analyse Ultra-Précise</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              L'IA détecte émotions, problèmes récurrents et opportunités d'amélioration
              avec une précision exceptionnelle. Elle met en lumière les signaux faibles
              et ce qui compte vraiment pour vos clients.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">📈 Croissance Mesurable</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor vous aide à augmenter votre note en ligne, attirer davantage
              de clients et améliorer vos revenus.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
