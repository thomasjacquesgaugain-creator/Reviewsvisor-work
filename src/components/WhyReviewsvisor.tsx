import { useTranslation } from "react-i18next";

export function WhyReviewsvisor() {
  const { t } = useTranslation();
  
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
      <div className="w-[98%] lg:w-[96%] rounded-[40px] bg-[#2555FF] text-white px-8 py-12 lg:px-16 lg:py-16 shadow-xl mx-auto transition-all duration-300">
        <h2 className="text-2xl lg:text-3xl font-bold mb-10 text-center">
          {t("whySection.title")}
        </h2>

        <div className="grid gap-10 lg:grid-cols-4">
          {/* ⚡ Analyse éclair */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">⚡</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whySection.feature1Title")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whySection.feature1Desc")}
            </p>
          </div>

          {/* 🎯 Actionnable immédiatement */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🎯</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whySection.feature2Title")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whySection.feature2Desc")}
            </p>
          </div>

          {/* 🧠 Analyse Ultra-Précise */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🧠</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whySection.feature3Title")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whySection.feature3Desc")}
            </p>
          </div>

          {/* 📈 Croissance Mesurable */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none w-8 text-center">
                📈
              </span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whySection.feature4Title")}
              </h3>
            </div>

            <p className="text-sm lg:text-base leading-tight">
              {t("whySection.feature4Desc")}
            </p>
            <ul className="mt-2 text-sm lg:text-base leading-tight list-disc list-inside space-y-0.5">
              <li>
                ✅ {t("whySection.stat1")}
              </li>
              <li>
                💵 {t("whySection.stat2")}
              </li>
              <li>
                ⭐ {t("whySection.stat3")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
