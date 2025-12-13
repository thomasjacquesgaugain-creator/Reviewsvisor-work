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
  const [logoReady, setLogoReady] = useState(false);
  const [scatterStart, setScatterStart] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Generate random directions and styles for each bubble
  const bubbles = useMemo(() => {
    return reviewTexts.map((text, i) => {
      // Distribute bubbles in a circle around center
      const angle = (i / reviewTexts.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      
      // Initial position: close to center but not overlapping logo
      const initialDistance = 80 + Math.random() * 60;
      const initialX = Math.cos(angle) * initialDistance;
      const initialY = Math.sin(angle) * initialDistance;
      
      // Final position: far outside screen
      const finalDistance = 600 + Math.random() * 400;
      const finalX = Math.cos(angle) * finalDistance;
      const finalY = Math.sin(angle) * finalDistance;
      
      const rotation = (Math.random() - 0.5) * 20;
      const scale = 0.8 + Math.random() * 0.3;
      const delay = Math.random() * 0.15;
      const stars = Math.random() > 0.2 ? 5 : 4;

      return { text, initialX, initialY, finalX, finalY, rotation, scale, delay, stars };
    });
  }, []);

  useEffect(() => {
    // Logo appears immediately with slight animation
    const logoTimer = setTimeout(() => setLogoReady(true), 50);

    // Start scatter animation shortly after
    const scatterTimer = setTimeout(() => setScatterStart(true), 150);

    // Fade out everything at ~2.7s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2700);

    // Remove completely at 3s
    const hideTimer = setTimeout(() => setVisible(false), 3000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(scatterTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden bg-white transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Center logo - visible from start */}
      <div
        className="absolute z-10 text-center"
        style={{
          opacity: logoReady ? 1 : 0,
          transform: logoReady ? "scale(1)" : "scale(0.9)",
          transition: "opacity 0.25s ease-out, transform 0.25s ease-out",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
      </div>

      {/* Review bubbles - start around logo, scatter outward */}
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
            transition: `all 2.5s cubic-bezier(0.22, 0.61, 0.36, 1)`,
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
