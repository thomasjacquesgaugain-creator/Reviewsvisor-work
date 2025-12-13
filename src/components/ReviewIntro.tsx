import { useEffect, useMemo, useState } from "react";
import logoHeader from "@/assets/reviewsvisor-logo-header.png";

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

const DURATION_MS = 2000;

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
          animation: rv-intro-fadeout 0.25s ease-out ${DURATION_MS - 300}ms forwards;
        }

        .rv-intro-logo-wrapper {
          position: relative;
          z-index: 2;
          animation: rv-logo-pop 0.2s ease-out 150ms forwards;
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
          animation: rv-bubble-fly 1.8s ease-out var(--delay) forwards;
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
          .rv-intro-logo-wrapper img {
            height: 50px;
          }
          .rv-intro-logo-wrapper span {
            font-size: 28px;
          }
        }
      `}</style>

      <div className="rv-intro-logo-wrapper">
        <div className="flex items-center justify-center">
          <img 
            src={logoHeader} 
            alt="Reviewsvisor Logo" 
            className="h-[90px] w-auto -mr-2 translate-y-[5px]"
            style={{ filter: 'brightness(0) saturate(100%) invert(38%) sepia(89%) saturate(2475%) hue-rotate(214deg) brightness(101%) contrast(101%)' }}
          />
          <span className="text-[#2F6BFF] text-[48px] font-bold leading-none">
            Reviewsvisor
          </span>
        </div>
      </div>
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
