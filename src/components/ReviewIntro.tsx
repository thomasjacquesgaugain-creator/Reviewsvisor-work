import { useState, useEffect } from "react";

const reviews = [
  { text: "Excellent outil pour gérer mes avis !", author: "Clara" },
  { text: "Simple, rapide et efficace.", author: "Julien" },
  { text: "Interface super moderne !", author: "Marc" },
];

export const ReviewIntro = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 7 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 7000);

    // Hide completely after 8 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden transition-opacity duration-1000 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(210 20% 8%), hsl(200 30% 10%))",
      }}
    >
      {reviews.map((review, index) => (
        <div
          key={index}
          className="absolute text-white text-center text-xl md:text-2xl font-medium px-6"
          style={{
            animation: `slideInReview 7s infinite`,
            animationDelay: `${index * 2}s`,
            opacity: 0,
          }}
        >
          <div className="mb-2 text-yellow-400">⭐⭐⭐⭐⭐</div>
          <div className="text-white/90">"{review.text}"</div>
          <div className="mt-2 text-white/60 text-base">– {review.author}</div>
        </div>
      ))}

      <style>{`
        @keyframes slideInReview {
          0% { 
            transform: scale(0.9) translateY(30px); 
            opacity: 0; 
          }
          10%, 30% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
          40%, 100% { 
            transform: scale(1.1) translateY(-30px); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};
