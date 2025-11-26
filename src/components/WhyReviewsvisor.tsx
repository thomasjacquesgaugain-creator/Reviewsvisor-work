// ✅ Bloc bleu élargi visuellement (presque plein écran)
// ✅ Espacement réduit uniquement pour le texte "Croissance Mesurable"

export function WhyReviewsvisor() {
  return (
    <section
      className="
        w-full flex justify-center 
        px-0 sm:px-0 md:px-0
        pb-12 lg:pb-14 
        pt-0 lg:pt-0 
        -mt-10 lg:-mt-12
      "
    >
      {/* 💙 Bloc bleu élargi : largeur maximale */}
      <div className="w-[98%] lg:w-[96%] rounded-[40px] bg-[#2555FF] text-white px-8 py-12 lg:px-16 lg:py-16 shadow-xl mx-auto transition-all duration-300">
        <h2 className="text-2xl lg:text-3xl font-bold mb-10 text-center">
          💡 Pourquoi Reviewsvisor fonctionne ?
        </h2>

        <div className="grid gap-10 lg:grid-cols-4">
          {/* ⚡ Analyse éclair */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">⚡</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                Analyse éclair
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              Reviewsvisor transforme vos avis en insights en quelques secondes,
              vous permettant de prendre des décisions rapides et fiables.  
              Grâce à une synthèse claire et visuelle, vous identifiez instantanément
              les tendances et priorités d'action qui comptent pour votre établissement.
            </p>
          </div>

          {/* 🎯 Actionnable immédiatement */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🎯</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                Actionnable immédiatement
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              Reviewsvisor ne se contente pas d'identifier des problèmes… il
              propose des solutions concrètes et hiérarchisées.  
              Chaque recommandation est liée à un impact mesurable sur la satisfaction client,
              vous aidant à agir vite et efficacement.
            </p>
          </div>

          {/* 🧠 Analyse Ultra-Précise */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🧠</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                Analyse Ultra-Précise
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              L'IA détecte émotions, problèmes récurrents et opportunités
              d'amélioration avec une précision exceptionnelle.  
              Elle mesure la tonalité de chaque avis, repère les signaux faibles
              et met en évidence les leviers concrets de fidélisation client.
            </p>
          </div>

          {/* 📈 Croissance Mesurable */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none w-8 text-center">
                📈
              </span>
              <h3 className="font-semibold text-lg lg:text-xl">
                Croissance Mesurable
              </h3>
            </div>

            {/* 🧩 Espacement compact uniquement ici */}
            <p className="text-sm lg:text-base leading-tight">
              Reviewsvisor vous aide à augmenter votre note en ligne, attirer
              davantage de clients et améliorer vos revenus.
            </p>
            <ul className="mt-2 text-sm lg:text-base leading-tight list-disc list-inside space-y-0.5">
              <li>
                ✅ voient jusqu'à <strong>+25 %</strong> d'avis positifs,
              </li>
              <li>
                💵 génèrent en moyenne <strong>+10 % à +20 %</strong> de chiffre
                d'affaires,
              </li>
              <li>
                ⭐ gagnent <strong>+0,5 à +1 point</strong> de note en quelques
                semaines.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
