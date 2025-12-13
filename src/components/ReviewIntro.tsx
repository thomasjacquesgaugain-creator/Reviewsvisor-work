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
  const [fadeOut, setFadeOut] = useState(false);

  // Generate random directions and styles for each bubble
  const bubbles = useMemo(() => {
    return reviewTexts.map((text, i) => {
      const angle = (i / reviewTexts.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      
      const initialDistance = 90 + Math.random() * 70;
      const initialX = Math.cos(angle) * initialDistance;
      const initialY = Math.sin(angle) * initialDistance;
      
      const finalDistance = 650 + Math.random() * 450;
      const finalX = Math.cos(angle) * finalDistance;
      const finalY = Math.sin(angle) * finalDistance;
      
      const rotation = (Math.random() - 0.5) * 20;
      const scale = 0.8 + Math.random() * 0.3;
      const delay = Math.random() * 0.1;
      const stars = Math.random() > 0.2 ? 5 : 4;

      return { text, initialX, initialY, finalX, finalY, rotation, scale, delay, stars };
    });
  }, []);

  useEffect(() => {
    // Start scatter at 0.1s
    const scatterTimer = setTimeout(() => setScatterStart(true), 100);
    // Fade-out global at 2.7s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2700);
    // Remove at 3s
    const hideTimer = setTimeout(() => setVisible(false), 3000);

    return () => {
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
      {/* CSS keyframes for precise timing control */}
      <style>{`
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        .intro-logo {
          opacity: 0;
          animation: logoFadeIn 0.25s ease-out forwards;
          animation-delay: 2.3s;
        }
        @keyframes reviewScatter {
          0% { opacity: 1; }
          85% { opacity: 0.3; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Center logo - always in DOM, CSS animation starts at 2.3s */}
      <div className="absolute z-10 text-center intro-logo">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
      </div>

      {/* Review bubbles - visible until ~2.4s with slower fade */}
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
            // 2.4s duration so reviews stay visible until ~2.5s
            transition: `transform 2.8s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 2.4s ease-in`,
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
