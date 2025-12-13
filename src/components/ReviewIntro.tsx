import { useState, useEffect } from "react";

const reviews = [
  { text: "Excellent service !", stars: 5 },
  { text: "Je recommande Reviewsvisor !", stars: 5 },
  { text: "Interface fluide et moderne.", stars: 4 },
  { text: "Outil très pro et rapide.", stars: 5 },
  { text: "Gain de temps incroyable !", stars: 5 },
  { text: "Simple et efficace.", stars: 4 },
  { text: "Le meilleur du marché !", stars: 5 },
  { text: "Enfin un outil qui marche.", stars: 5 },
];

const getRandomDirection = (index: number) => {
  const angles = [
    { x: -280, y: -200 },  // top-left
    { x: 280, y: -200 },   // top-right
    { x: -350, y: 0 },     // left
    { x: 350, y: 0 },      // right
    { x: -250, y: 200 },   // bottom-left
    { x: 250, y: 200 },    // bottom-right
    { x: 0, y: -280 },     // top
    { x: 0, y: 280 },      // bottom
  ];
  return angles[index % angles.length];
};

const getStars = (count: number) => {
  return "⭐".repeat(count);
};

export const ReviewIntro = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Start scatter animation immediately
    const animateTimer = setTimeout(() => {
      setAnimate(true);
    }, 50);

    // Start fade out after 3 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // Hide completely after 3.5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => {
      clearTimeout(animateTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, #0b0e13 0%, #050709 100%)",
      }}
    >
      {/* Ambient glow effect */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Review bubbles */}
      {reviews.map((review, index) => {
        const direction = getRandomDirection(index);
        const delay = index * 0.08;

        return (
          <div
            key={index}
            className="absolute px-4 py-3 rounded-2xl shadow-2xl max-w-[260px] text-center"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              transform: animate 
                ? `translate(${direction.x}px, ${direction.y}px) scale(0.6)` 
                : "translate(0, 0) scale(1)",
              opacity: animate ? 0 : 1,
              transition: `all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
              transitionDelay: `${delay}s`,
            }}
          >
            <div className="text-yellow-400 text-sm mb-1">
              {getStars(review.stars)}
            </div>
            <div className="text-white/90 text-sm font-medium">
              "{review.text}"
            </div>
          </div>
        );
      })}

      {/* Center logo/brand text */}
      <div 
        className={`absolute z-10 text-center transition-all duration-700 ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        style={{ transitionDelay: "0.5s" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Reviews<span className="text-primary">visor</span>
        </h1>
        <p className="text-white/60 mt-2 text-sm">
          Analysez vos avis en un clin d'œil
        </p>
      </div>
    </div>
  );
};
