import { useTranslation, Trans } from "react-i18next";

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
          💡 {t("whyWorks.title")}
        </h2>

        <div className="grid gap-10 lg:grid-cols-4">
          {/* ⚡ Analyse éclair */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">⚡</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whyWorks.lightningAnalysis")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whyWorks.lightningAnalysisDesc")}
            </p>
          </div>

          {/* 🎯 Actionnable immédiatement */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🎯</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whyWorks.immediatelyActionable")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whyWorks.immediatelyActionableDesc")}
            </p>
          </div>

          {/* 🧠 Analyse Ultra-Précise */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none">🧠</span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whyWorks.ultraPreciseAnalysis")}
              </h3>
            </div>
            <p className="text-sm lg:text-base leading-relaxed flex-1">
              {t("whyWorks.ultraPreciseAnalysisDesc")}
            </p>
          </div>

          {/* 📈 Croissance Mesurable */}
          <div className="flex flex-col h-full justify-start">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl lg:text-3xl leading-none w-8 text-center">
                📈
              </span>
              <h3 className="font-semibold text-lg lg:text-xl">
                {t("whyWorks.measurableGrowth")}
              </h3>
            </div>

            <p className="text-sm lg:text-base leading-tight">
              {t("whyWorks.measurableGrowthDesc")}
            </p>
            <ul className="mt-2 text-sm lg:text-base leading-tight list-disc list-inside space-y-0.5">
              <li>
                ✅ <Trans i18nKey="whyWorks.growthStat1" components={{ strong: <strong /> }} />
              </li>
              <li>
                💵 <Trans i18nKey="whyWorks.growthStat2" components={{ strong: <strong /> }} />
              </li>
              <li>
                ⭐ <Trans i18nKey="whyWorks.growthStat3" components={{ strong: <strong /> }} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
