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
  const [animate, setAnimate] = useState(false);

  // Generate random directions and styles for each bubble
  const bubbles = useMemo(() => {
    return reviewTexts.map((text, i) => {
      const angle = (i / reviewTexts.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 400 + Math.random() * 300;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rotation = (Math.random() - 0.5) * 30;
      const scale = 0.7 + Math.random() * 0.4;
      const delay = Math.random() * 0.15;
      const stars = Math.random() > 0.3 ? 5 : 4;

      return { text, x, y, rotation, scale, delay, stars };
    });
  }, []);

  useEffect(() => {
    // Start scatter animation immediately
    const animateTimer = setTimeout(() => setAnimate(true), 30);

    // Remove completely after 3 seconds
    const hideTimer = setTimeout(() => setVisible(false), 3000);

    return () => {
      clearTimeout(animateTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden bg-white"
      style={{
        opacity: animate ? 0 : 1,
        transition: "opacity 0.5s ease-out 2s",
      }}
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
            transform: animate
              ? `translate(${bubble.x}px, ${bubble.y}px) rotate(${bubble.rotation}deg) scale(${bubble.scale * 0.5})`
              : `translate(0, 0) rotate(0deg) scale(${bubble.scale})`,
            opacity: animate ? 0 : 1,
            transition: `all 1s cubic-bezier(0.25, 0.1, 0.25, 1)`,
            transitionDelay: `${bubble.delay}s`,
          }}
        >
          <span className="text-yellow-400 mr-1">{getStars(bubble.stars)}</span>
          <span className="text-gray-700 font-medium">{bubble.text}</span>
        </div>
      ))}

      {/* Center logo */}
      <div
        className="absolute z-10 text-center"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.8)",
          transition: "all 0.6s ease-out 0.3s",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
      </div>
    </div>
  );
};
