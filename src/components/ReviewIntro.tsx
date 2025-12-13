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
      const angle = (i / reviewTexts.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      
      // Initial position: close to center around logo
      const initialDistance = 90 + Math.random() * 70;
      const initialX = Math.cos(angle) * initialDistance;
      const initialY = Math.sin(angle) * initialDistance;
      
      // Final position: far outside screen
      const finalDistance = 650 + Math.random() * 450;
      const finalX = Math.cos(angle) * finalDistance;
      const finalY = Math.sin(angle) * finalDistance;
      
      const rotation = (Math.random() - 0.5) * 20;
      const scale = 0.8 + Math.random() * 0.3;
      const delay = Math.random() * 0.12;
      const stars = Math.random() > 0.2 ? 5 : 4;

      return { text, initialX, initialY, finalX, finalY, rotation, scale, delay, stars };
    });
  }, []);

  useEffect(() => {
    // Start scatter animation almost immediately
    const scatterTimer = setTimeout(() => setScatterStart(true), 100);

    // Logo appears late at 2.4s as quick signature
    const logoTimer = setTimeout(() => setShowLogo(true), 2400);

    // Start fade out at 2.8s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2800);

    // Remove completely at 3s
    const hideTimer = setTimeout(() => setVisible(false), 3000);

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
      className={`fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden bg-white transition-opacity duration-200 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Center logo - appears briefly at 2.4s, visible ~0.4s */}
      <div
        className="absolute z-10 text-center"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? "scale(1)" : "scale(0.92)",
          transition: "opacity 0.15s ease-out, transform 0.15s ease-out",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
      </div>

      {/* Review bubbles - 3s dispersion */}
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          className="absolute px-3 py-2 rounded-xl shadow-lg text-center whitespace-nowrap pointer-events-none"
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            fontSize: `${11 + bubble.scale * 3}px`,
            transform: scatterStart
              ? `translate(${bubble.finalX}px, ${bubble.finalY}px) rotate(${bubble.rotation}deg) scale(${bubble.scale * 0.5})`
              : `translate(${bubble.initialX}px, ${bubble.initialY}px) rotate(0deg) scale(${bubble.scale})`,
            opacity: scatterStart ? 0 : 1,
            transition: `all 3s cubic-bezier(0.25, 0.1, 0.25, 1)`,
            transitionDelay: `${bubble.delay}s`,
          }}
        >
          <span className="text-yellow-400 mr-1">{getStars(bubble.stars)}</span>
          <span className="text-gray-700 font-medium">{bubble.text}</span>
        </div>
      ))}
    </div>
  );
};
