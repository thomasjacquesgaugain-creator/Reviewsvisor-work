import { useEffect, useMemo, useState } from "react";

const REVIEWS = [
  "⭐⭐⭐⭐⭐ Excellent service !",
  "⭐⭐⭐⭐⭐ Je recommande Reviewsvisor !",
  "⭐⭐⭐⭐ Interface fluide et moderne.",
  "⭐⭐⭐⭐⭐ Outil très pro et rapide.",
  "⭐⭐⭐⭐⭐ Mes avis ont explosé en 1 mois.",
  "⭐⭐⭐⭐⭐ Simple à installer, ultra efficace.",
  "⭐⭐⭐⭐ Boost énorme sur Google.",
  "⭐⭐⭐⭐⭐ Mes clients laissent enfin des avis.",
  "⭐⭐⭐⭐⭐ Parfait pour les petits commerces.",
  "⭐⭐⭐⭐⭐ UX propre et rassurante.",
  "⭐⭐⭐⭐⭐ On a gagné en e-réputation.",
  "⭐⭐⭐⭐⭐ Indispensable pour gérer les avis.",
];

type Bubble = {
  text: string;
  tx: number;
  ty: number;
  delay: number;
};

const DURATION_MS = 3000;

export const ReviewIntro = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const bubbles: Bubble[] = useMemo(() => {
    const distance = 450;
    return REVIEWS.map((text, index) => {
      const angle = (index / REVIEWS.length) * Math.PI * 2;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const delay = Math.random() * 150;
      return { text, tx, ty, delay };
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="rv-intro-overlay">
      <style>{`
        .rv-intro-overlay {
          position: fixed;
          inset: 0;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          z-index: 9999;
          pointer-events: none;
          animation: rv-intro-fadeout 0.4s ease-out ${DURATION_MS - 400}ms forwards;
        }

        .rv-intro-logo {
          position: relative;
          z-index: 2;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
          font-weight: 700;
          font-size: 2rem;
          color: #111827;
          animation: rv-logo-pop 0.25s ease-out 200ms forwards;
          opacity: 0;
          transform: scale(0.9);
        }

        .rv-intro-bubble {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.04);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(15, 23, 42, 0.08);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
          font-size: 0.85rem;
          color: #111827;
          white-space: nowrap;
          opacity: 0;
          animation: rv-bubble-fly 2.6s ease-out var(--delay) forwards;
        }

        @keyframes rv-bubble-fly {
          0% {
            transform: translate(-50%, -50%) scale(0.7);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.1);
            opacity: 0;
          }
        }

        @keyframes rv-logo-pop {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rv-intro-fadeout {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .rv-intro-bubble {
            font-size: 0.7rem;
          }
          .rv-intro-logo {
            font-size: 1.6rem;
          }
        }
      `}</style>

      <div className="rv-intro-logo">Reviewsvisor</div>
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="rv-intro-bubble"
          style={{
            "--tx": `${b.tx}px`,
            "--ty": `${b.ty}px`,
            "--delay": `${b.delay}ms`,
          } as React.CSSProperties}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
};
