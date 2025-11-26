// ✅ Section "Pourquoi Reviewsvisor fonctionne ?" 
// Design centré + largeur max + texte original complet

export function WhyReviewsvisor() {
  return (
    <section className="w-full flex justify-center px-4 py-12 lg:py-16">
      <div className="w-full max-w-5xl rounded-[40px] bg-[#2555FF] text-white px-6 py-10 lg:px-10 lg:py-12 shadow-xl">
        <h2 className="text-2xl lg:text-3xl font-bold mb-8">
          💡 Pourquoi Reviewsvisor fonctionne ?
        </h2>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Analyse éclair */}
          <div>
            <h3 className="font-semibold text-lg mb-2">⚡ Analyse éclair</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor transforme vos avis en insights en quelques secondes,
              vous permettant de prendre des décisions rapides et fiables.
            </p>
          </div>

          {/* Actionnable immédiatement */}
          <div>
            <h3 className="font-semibold text-lg mb-2">🎯 Actionnable immédiatement</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor ne se contente pas d'identifier des problèmes… il propose
              des solutions. Des priorités claires. Des résultats mesurables.
            </p>
          </div>

          {/* Analyse Ultra-Précise */}
          <div>
            <h3 className="font-semibold text-lg mb-2">🧠 Analyse Ultra-Précise</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              L'IA détecte émotions, problèmes récurrents et opportunités d'amélioration
              avec une précision exceptionnelle. Elle met en lumière les signaux faibles
              et ce qui compte réellement pour vos clients.
            </p>
          </div>

          {/* Croissance Mesurable */}
          <div>
            <h3 className="font-semibold text-lg mb-2">📈 Croissance Mesurable</h3>
            <p className="text-sm lg:text-base leading-relaxed">
              Reviewsvisor vous aide à augmenter votre note en ligne, attirer davantage
              de clients et améliorer vos revenus.
            </p>
            <ul className="mt-3 text-sm lg:text-base leading-relaxed list-disc list-inside space-y-1">
              <li>
                ✅ voient jusqu'à <strong>+25 %</strong> d'avis positifs,
              </li>
              <li>
                🏷️ génèrent en moyenne <strong>+10 % à +20 %</strong> de chiffre d'affaires,
              </li>
              <li>
                ⭐ gagnent <strong>+0,5 à +1 point</strong> de note en quelques semaines.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
