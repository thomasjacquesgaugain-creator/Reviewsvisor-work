import { useState, useEffect, useMemo } from "react";

const reviewTexts = [
  "Excellent service !",
  "Je recommande !",
  "Interface fluide",
  "Outil très pro",
  "Gain de temps !",
  "Simple et efficace",
  "Le meilleur !",
  "Ça marche !",
  "Très satisfait",
  "Top qualité",
  "Rapide",
  "Moderne",
  "Intuitif",
  "Efficace",
  "5 étoiles !",
  "Parfait",
  "Génial",
  "Super app",
  "Bravo !",
  "Incroyable",
  "Impressionnant",
  "Je valide",
  "Pratique",
  "Facile",
];

const getStars = (count: number) => "⭐".repeat(count);

export const ReviewIntro = () => {
  const [visible, setVisible] = useState(true);
  const [scatterStart, setScatterStart] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Generate random directions and styles for each bubble
  const bubbles = useMemo(() => {
    return reviewTexts.map((text, i) => {
      const angle = (i / reviewTexts.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 500 + Math.random() * 400;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rotation = (Math.random() - 0.5) * 25;
      const scale = 0.75 + Math.random() * 0.35;
      const delay = Math.random() * 0.2;
      const stars = Math.random() > 0.25 ? 5 : 4;

      return { text, x, y, rotation, scale, delay, stars };
    });
  }, []);

  useEffect(() => {
    // Phase 1: Start scatter animation immediately
    const scatterTimer = setTimeout(() => setScatterStart(true), 50);

    // Phase 2: Show logo after reviews have mostly left (~2.3s)
    const logoTimer = setTimeout(() => setShowLogo(true), 2300);

    // Fade out the entire intro at ~2.8s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2800);

    // Remove completely at 3.3s
    const hideTimer = setTimeout(() => setVisible(false), 3300);

    return () => {
      clearTimeout(scatterTimer);
      clearTimeout(logoTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Review bubbles */}
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          className="absolute px-3 py-2 rounded-xl shadow-lg text-center whitespace-nowrap"
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            fontSize: `${11 + bubble.scale * 3}px`,
            transform: scatterStart
              ? `translate(${bubble.x}px, ${bubble.y}px) rotate(${bubble.rotation}deg) scale(${bubble.scale * 0.4})`
              : `translate(0, 0) rotate(0deg) scale(${bubble.scale})`,
            opacity: scatterStart ? 0 : 1,
            transition: `all 2.2s cubic-bezier(0.25, 0.1, 0.25, 1)`,
            transitionDelay: `${bubble.delay}s`,
          }}
        >
          <span className="text-yellow-400 mr-1">{getStars(bubble.stars)}</span>
          <span className="text-gray-700 font-medium">{bubble.text}</span>
        </div>
      ))}

      {/* Center logo - appears after reviews scatter */}
      <div
        className="absolute z-10 text-center"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? "scale(1)" : "scale(0.85)",
          transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
      </div>
    </div>
  );
};
